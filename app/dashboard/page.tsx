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
import { Asset, PriceData, TriggerCondition, StrategyMode } from '@/types';
import { ParsedTrigger } from '@/lib/qwenService';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

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
  const [strategyMode, setStrategyMode] = useState<StrategyMode>('escape');
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
    // Clear errors
    setErrors({});

    if (strategyMode === 'escape') {
      // Validate BTC address
      if (!btcAddress.trim()) {
        setErrors({ btcAddress: 'BTC address is required' });
        return;
      }

      // Save escape config
      setStrategy({
        escapeConfig: {
          btcAddress: btcAddress.trim(),
          evmAddress: evmAddress.trim() || undefined,
        }
      });

      // Close and cleanup
      setIsStrategyModalOpen(false);
      resetModalState();

    } else {
      // Safe Haven mode
      // Validate AI prompt
      if (!aiPrompt.trim()) {
        setErrors({ aiPrompt: 'AI trigger description is required' });
        return;
      }

      // Validate parsed result exists
      if (!parsedResult) {
        setErrors({ aiPrompt: 'Please parse the trigger with AI first' });
        return;
      }

      // Validate BTC address
      if (!btcAddress.trim()) {
        setErrors({ btcAddress: 'BTC address is required' });
        return;
      }

      // Convert ParsedTrigger to TriggerCondition[]
      const triggers: TriggerCondition[] = parsedResult.conditions.map(c => ({
        asset: c.asset,
        operator: c.operator === 'eq' ? 'lt' : c.operator,
        value: c.value,
      }));

      // Save haven config
      setStrategy({
        havenConfig: {
          btcAddress: btcAddress.trim(),
          evmAddress: evmAddress.trim() || undefined,
          aiPrompt: aiPrompt.trim(),
          triggers,
          triggerLogic: parsedResult.logic,
        }
      });

      // Close and cleanup
      setIsStrategyModalOpen(false);
      resetModalState();
    }
  };

  const resetModalState = () => {
    setBtcAddress('');
    setEvmAddress('');
    setAiPrompt('');
    setParsedResult(null);
    setShowAIParse(false);
    setErrors({});
    setStrategyMode('escape'); // Reset to default
  };

  const handleSecurityEscape = () => {
    if (!strategy?.escapeConfig) {
      alert('Please configure Security Escape strategy first');
      return;
    }
    router.push('/execute?mode=escape');
  };

  const handleSafeHaven = () => {
    if (!strategy?.havenConfig) {
      alert('Please configure Safe Haven strategy first');
      return;
    }
    router.push('/execute?mode=haven');
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
            {/* Strategy Status Badges */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {strategy?.escapeConfig && (
                <span className="px-3 py-1 rounded-full text-xs font-display bg-danger/20 text-danger border border-danger/50">
                  🔒 Escape Ready
                </span>
              )}
              {strategy?.havenConfig && (
                <span className="px-3 py-1 rounded-full text-xs font-display bg-safe/20 text-safe border border-safe/50">
                  🛡️ Haven Ready
                </span>
              )}
              {!strategy?.escapeConfig && !strategy?.havenConfig && (
                <span className="px-3 py-1 rounded-full text-xs font-display bg-pod-muted/20 text-pod-muted border border-pod-muted/50">
                  No Strategy Configured
                </span>
              )}
            </div>
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
        <div className="glass-panel border-safe/20 p-6 sm:p-8">
          <h2 className="font-display text-xl sm:text-2xl text-pod-text mb-6">
            Emergency Controls
          </h2>

          {/* Configure Strategy Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsStrategyModalOpen(true)}
            className="w-full mb-4"
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

          {/* Dual PANIC Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Security Escape Button */}
            <Button
              variant="danger"
              size="xl"
              onClick={handleSecurityEscape}
              className="flex-1 h-24 sm:h-32 flex flex-col items-center justify-center gap-2 relative group glow"
              disabled={!strategy?.escapeConfig}
            >
              <span className="text-3xl sm:text-4xl">⚡</span>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">PANIC</div>
                <div className="text-xs sm:text-sm opacity-80">Security Escape</div>
              </div>
            </Button>

            {/* Safe Haven Button */}
            <Button
              variant="warning"
              size="xl"
              onClick={handleSafeHaven}
              className="flex-1 h-24 sm:h-32 flex flex-col items-center justify-center gap-2 relative group glow"
              disabled={!strategy?.havenConfig}
            >
              <span className="text-3xl sm:text-4xl">🛡️</span>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">PANIC</div>
                <div className="text-xs sm:text-sm opacity-80">Safe Haven</div>
              </div>
            </Button>
          </div>
        </div>
      </main>

      {/* Strategy Configuration Modal */}
      <Modal
        isOpen={isStrategyModalOpen}
        onClose={() => {
          setIsStrategyModalOpen(false);
          resetModalState();
        }}
        title="Configure Panic Strategy"
      >
        <div className="space-y-6">
          {/* Segmented Control */}
          <SegmentedControl
            options={[
              { value: 'escape', label: 'SECURITY ESCAPE', icon: '🔒' },
              { value: 'haven', label: 'SAFE HAVEN', icon: '🛡️' }
            ]}
            value={strategyMode}
            onChange={(mode) => setStrategyMode(mode as StrategyMode)}
          />

          {/* Security Escape Form */}
          {strategyMode === 'escape' && (
            <div className="space-y-4">
              <Input
                label="BTC Safe Address"
                placeholder="bc1q..."
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                error={errors.btcAddress}
                required
              />
              <Input
                label="EVM Safe Address (Optional)"
                placeholder="0x..."
                value={evmAddress}
                onChange={(e) => setEvmAddress(e.target.value)}
              />
            </div>
          )}

          {/* Safe Haven Form */}
          {strategyMode === 'haven' && (
            <div className="space-y-4">
              {/* AI Trigger Description */}
              <Textarea
                label="AI Trigger Description"
                placeholder="e.g., If ETH drops below $2000, convert everything to BTC."
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                error={errors.aiPrompt}
              />

              {/* Parse with AI Button */}
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

              {/* BTC Safe Address */}
              <div>
                <Input
                  label="BTC Safe Address"
                  placeholder="bc1q..."
                  value={btcAddress}
                  onChange={(e) => setBtcAddress(e.target.value)}
                  error={errors.btcAddress}
                  required
                />
                <p className="mt-2 text-xs text-warning flex items-start gap-2">
                  <span>⚠️</span>
                  <span>Consider using a different address than your hot wallet for better security</span>
                </p>
              </div>

              {/* EVM Safe Address */}
              <div>
                <Input
                  label="EVM Safe Address (Optional)"
                  placeholder="0x..."
                  value={evmAddress}
                  onChange={(e) => setEvmAddress(e.target.value)}
                />
                <p className="mt-2 text-xs text-cyan-400 flex items-start gap-2">
                  <span>ℹ️</span>
                  <span>Cross-Chain Protocol Active: Native ETH from connected chains will be swapped to BTC via ZetaChain and withdrawn to your BTC Safe Address. This EVM address is used as fallback for dust amounts (&lt;$50).</span>
                </p>
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
                resetModalState();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={strategyMode === 'escape' ? 'danger' : 'safe'}
              size="md"
              onClick={handleSaveStrategy}
              className={strategyMode === 'haven' ? 'glow' : ''}
            >
              {strategyMode === 'escape' ? 'Save Emergency Config' : 'Save Haven Strategy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
