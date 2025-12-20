'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { usePrices } from '@/hooks/usePrices';
import { Navbar } from '@/components/layout/Navbar';
import { AssetCard } from '@/components/dashboard/AssetCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Asset, PriceData, TriggerCondition } from '@/types';
import { ParsedTrigger } from '@/lib/qwenService';

export default function Dashboard() {
  const router = useRouter();
  const {
    isFullyConnected,
    strategy,
    setStrategy,
    setEvmWallet,
    setBtcWallet,
    btcAddress: storeBtcAddress,
    evmAddress: storeEvmAddress,
    setBalances,
    setPrices,
  } = useStore();

  const evmWallet = useEvmWallet();
  const btcWallet = useBitcoinWallet();

  // Fetch real balances and prices
  const walletBalances = useWalletBalances(btcWallet.address, evmWallet.address);
  const pricesData = usePrices();

  // Sync wallet states to store
  useEffect(() => {
    if (evmWallet.address) {
      setEvmWallet(evmWallet.address, evmWallet.chainId);
    }
  }, [evmWallet.address, evmWallet.chainId, setEvmWallet]);

  useEffect(() => {
    if (btcWallet.address) {
      setBtcWallet(btcWallet.address);
    }
  }, [btcWallet.address, setBtcWallet]);

  // Sync balances to store - use specific values as dependencies to avoid infinite loop
  useEffect(() => {
    if (!walletBalances.isLoading && !walletBalances.error) {
      const { isLoading, error, refetch, ...balances } = walletBalances;
      setBalances(balances);
    }
  }, [
    walletBalances.isLoading,
    walletBalances.error,
    walletBalances.btc,
    walletBalances.eth.total,
    walletBalances.zeta.total,
    setBalances,
  ]);

  // Sync prices to store - use specific values as dependencies to avoid infinite loop
  useEffect(() => {
    if (!pricesData.isLoading && !pricesData.error) {
      const { isLoading, error, ...prices } = pricesData;
      setPrices(prices);
    }
  }, [
    pricesData.isLoading,
    pricesData.error,
    pricesData.bitcoin,
    pricesData.ethereum,
    pricesData.zetachain,
    setPrices,
  ]);

  // Compute assets from balances and prices
  const assets = useMemo((): Asset[] => {
    if (walletBalances.isLoading || pricesData.isLoading || !pricesData.bitcoin) {
      return [];
    }

    const getTokenPrice = (symbol: string, prices: PriceData): number => {
      if (symbol.includes('ETH')) return prices.ethereum;
      if (symbol.includes('BTC')) return prices.bitcoin;
      // For USDC/USDT, assume $1
      return 1;
    };

    return [
      {
        chain: 'btc' as const,
        symbol: 'BTC',
        balance: walletBalances.btc,
        price: pricesData.bitcoin,
        usdValue: walletBalances.btc * pricesData.bitcoin,
      },
      {
        chain: 'eth' as const,
        symbol: 'ETH',
        balance: walletBalances.eth.total,
        price: pricesData.ethereum,
        usdValue: walletBalances.eth.total * pricesData.ethereum,
        breakdown: [
          {
            chainName: 'Ethereum Sepolia',
            balance: walletBalances.eth.sepolia,
            usdValue: walletBalances.eth.sepolia * pricesData.ethereum,
          },
          {
            chainName: 'Base Sepolia',
            balance: walletBalances.eth.base,
            usdValue: walletBalances.eth.base * pricesData.ethereum,
          },
          {
            chainName: 'Linea Sepolia',
            balance: walletBalances.eth.linea,
            usdValue: walletBalances.eth.linea * pricesData.ethereum,
          },
        ],
      },
      {
        chain: 'zeta' as const,
        symbol: 'ZETA',
        balance: walletBalances.zeta.total,
        price: pricesData.zetachain,
        usdValue: walletBalances.zeta.total * pricesData.zetachain,
        breakdown: [
          {
            chainName: 'Native ZETA',
            balance: walletBalances.zeta.native,
            usdValue: walletBalances.zeta.native * pricesData.zetachain,
          },
          ...walletBalances.zeta.zrc20.map((token) => ({
            chainName: `ZRC20 ${token.symbol}`,
            balance: token.balance,
            usdValue: token.balance * getTokenPrice(token.symbol, pricesData),
          })),
        ],
      },
    ];
  }, [walletBalances, pricesData]);

  // Calculate total value
  const totalValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.usdValue, 0);
  }, [assets]);

  // Accordion state for expandable cards
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [showAIParse, setShowAIParse] = useState(false);
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTrigger | null>(null);

  // Form state
  const [btcAddress, setBtcAddress] = useState('');
  const [evmAddress, setEvmAddress] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isFullyConnected) {
      router.push('/');
    }
  }, [isFullyConnected, router]);

  if (!isFullyConnected) {
    return null;
  }

  const handleParseAI = async () => {
    if (!aiPrompt.trim()) {
      setErrors({ aiPrompt: 'Please enter a trigger description' });
      return;
    }

    setIsParsingAI(true);
    setErrors({});
    setParsedResult(null);

    try {
      const response = await fetch('/api/parse-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: aiPrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse trigger');
      }

      const result: ParsedTrigger = await response.json();
      setParsedResult(result);
      setShowAIParse(true);
    } catch (error) {
      console.error('Error parsing AI trigger:', error);
      setErrors({
        aiPrompt: error instanceof Error ? error.message : 'Failed to parse trigger. Please try again.',
      });
    } finally {
      setIsParsingAI(false);
    }
  };

  const handleSaveStrategy = () => {
    // Validate
    const newErrors: { [key: string]: string } = {};
    if (!btcAddress.trim()) {
      newErrors.btcAddress = 'BTC address is required';
    }

    if (!parsedResult) {
      newErrors.aiPrompt = 'Please parse your trigger conditions first';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convert ParsedTrigger conditions to TriggerCondition[]
    const triggers: TriggerCondition[] = parsedResult!.conditions.map((condition) => ({
      asset: condition.asset,
      operator: condition.operator === 'eq' ? 'lt' : condition.operator, // Convert 'eq' to 'lt' for compatibility
      value: condition.value,
    }));

    // Save strategy
    setStrategy({
      safeAddresses: {
        btc: btcAddress,
        evm: evmAddress || undefined,
      },
      triggers,
      triggerLogic: parsedResult!.logic,
    });

    setIsStrategyModalOpen(false);
    setShowAIParse(false);
    setParsedResult(null);
    setBtcAddress('');
    setEvmAddress('');
    setAiPrompt('');
    setErrors({});
  };

  const handlePanic = () => {
    if (!strategy) {
      alert('Please configure your strategy first');
      return;
    }
    router.push('/execute');
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Total value banner */}
        <div className="mb-12">
          <div className="glass-panel p-8 rounded-lg border-l-4 border-l-safe scan-effect">
            <p className="text-sm text-pod-muted font-mono uppercase tracking-wider mb-2">
              Total Portfolio Value
            </p>
            <p className="text-5xl font-display font-black text-safe text-glow">
              ${totalValue.toLocaleString()}
            </p>
            {strategy && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-safe/20 border border-safe/50 rounded-full">
                <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                <span className="text-xs font-mono text-safe uppercase">Strategy Configured</span>
              </div>
            )}
          </div>
        </div>

        {/* Assets grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-pod-text uppercase tracking-wider">
              Asset Overview
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => walletBalances.refetch()}
              disabled={walletBalances.isLoading}
            >
              {walletBalances.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Balances
                </>
              )}
            </Button>
          </div>

          {/* Loading state */}
          {(walletBalances.isLoading || pricesData.isLoading) && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-safe/30 border-t-safe rounded-full animate-spin mb-4" />
              <p className="text-pod-muted font-mono">Loading balances...</p>
            </div>
          )}

          {/* Error state */}
          {(walletBalances.error || pricesData.error) && (
            <div className="glass-panel p-6 rounded-lg border-l-4 border-l-danger">
              <p className="text-danger font-mono mb-2">
                Error: {walletBalances.error || pricesData.error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => walletBalances.refetch()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Assets grid */}
          {!walletBalances.isLoading && !pricesData.isLoading && assets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.chain}
                  asset={asset}
                  expanded={expandedCard === asset.chain}
                  onToggle={() => setExpandedCard(expandedCard === asset.chain ? null : asset.chain)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!walletBalances.isLoading && !pricesData.isLoading && assets.length === 0 && (
            <div className="text-center py-12 glass-panel rounded-lg">
              <p className="text-pod-muted font-mono">
                No assets found. Make sure both wallets are connected.
              </p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass-panel p-8 rounded-lg">
          <h2 className="text-2xl font-display font-bold mb-6 text-pod-text uppercase tracking-wider">
            Emergency Controls
          </h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsStrategyModalOpen(true)}
              className="flex-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Configure Strategy
            </Button>
            <Button
              variant="danger"
              size="xl"
              glow
              onClick={handlePanic}
              className="flex-1 relative group overflow-hidden"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              PANIC
            </Button>
          </div>
        </div>
      </main>

      {/* Strategy Configuration Modal */}
      <Modal
        isOpen={isStrategyModalOpen}
        onClose={() => {
          setIsStrategyModalOpen(false);
          setShowAIParse(false);
          setErrors({});
        }}
        title="Configure Evacuation Strategy"
      >
        <div className="space-y-6">
          {/* Safe addresses */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-pod-text">
              Safe Addresses
            </h3>
            <Input
              label="BTC Safe Address"
              placeholder="bc1q..."
              value={btcAddress}
              onChange={(e) => setBtcAddress(e.target.value)}
              error={errors.btcAddress}
              required
            />
            <Input
              label="EVM Safe Address"
              placeholder="Default: Convert to USDC and store in ZetaChain"
              value={evmAddress}
              onChange={(e) => setEvmAddress(e.target.value)}
            />
          </div>

          {/* AI Strategy */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-pod-text">
              AI-Powered Trigger
            </h3>
            <Textarea
              label="Describe Your Panic Trigger"
              placeholder="e.g., 'If ETH drops below $2000 or BTC drops below $40000'"
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              error={errors.aiPrompt}
            />
            <Button
              variant="outline"
              size="md"
              onClick={handleParseAI}
              disabled={isParsingAI}
            >
              {isParsingAI ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Parse with AI
                </>
              )}
            </Button>
          </div>

          {/* AI Parse Results */}
          {showAIParse && parsedResult && (
            <div className="space-y-4 p-6 glass-panel rounded-lg border border-safe/50">
              <h3 className="text-lg font-display font-bold text-safe">
                Parsed Strategy
              </h3>

              <div>
                <p className="text-sm text-pod-muted font-mono mb-2">
                  Trigger Conditions ({parsedResult.logic}):
                </p>
                <ul className="space-y-2">
                  {parsedResult.conditions.map((condition, index) => (
                    <li key={index} className="flex items-center gap-2 text-pod-text font-mono">
                      <span className="text-warning">▸</span>
                      {condition.asset} {condition.operator === 'lt' ? '<' : condition.operator === 'gt' ? '>' : '='} ${condition.value.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm text-pod-muted font-mono mb-2">Execution Plan:</p>
                <ul className="space-y-2">
                  <li className="text-pod-text font-mono text-sm">
                    <span className="text-warning font-bold">BTC:</span> {parsedResult.executionPlan.btc}
                  </li>
                  <li className="text-pod-text font-mono text-sm">
                    <span className="text-blue-400 font-bold">ETH:</span> {parsedResult.executionPlan.eth}
                  </li>
                  <li className="text-pod-text font-mono text-sm">
                    <span className="text-purple-400 font-bold">ZETA:</span> {parsedResult.executionPlan.zeta}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-pod-border">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setIsStrategyModalOpen(false);
                setShowAIParse(false);
                setErrors({});
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="safe"
              size="md"
              onClick={handleSaveStrategy}
              className="flex-1"
            >
              Confirm & Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
