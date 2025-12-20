'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
  const { isFullyConnected, setEvmWallet, setBtcWallet } = useStore();

  const evmWallet = useEvmWallet();
  const btcWallet = useBitcoinWallet();

  // Sync EVM wallet state to store
  useEffect(() => {
    // Only sync if hook has real values OR if explicitly disconnecting (was connected, now null)
    if (evmWallet.address !== undefined) {
      setEvmWallet(evmWallet.address, evmWallet.chainId);
    }
  }, [evmWallet.address, evmWallet.chainId, setEvmWallet]);

  // Sync BTC wallet state to store
  useEffect(() => {
    if (btcWallet.address !== undefined) {
      setBtcWallet(btcWallet.address);
    }
  }, [btcWallet.address, setBtcWallet]);

  // Redirect when both wallets connected
  useEffect(() => {
    if (isFullyConnected) {
      router.push('/dashboard');
    }
  }, [isFullyConnected, router]);

  const handleConnectEvm = () => {
    evmWallet.connect();
  };

  const handleConnectBtc = () => {
    btcWallet.connect();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-danger/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-safe/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Hex grid overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-24 h-24 hex-border border-2 border-safe/30" />
        <div className="absolute top-1/3 right-20 w-32 h-32 hex-border border-2 border-danger/30" />
        <div className="absolute bottom-20 left-1/4 w-20 h-20 hex-border border-2 border-warning/30" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Logo/Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full">
          <div className="w-3 h-3 bg-danger rounded-full animate-pulse-danger" />
          <span className="font-display text-sm font-bold uppercase tracking-widest text-pod-text">
            Emergency Evacuation System
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-6xl md:text-8xl font-display font-black mb-6 leading-tight">
          <span className="text-pod-text">One Click,</span>
          <br />
          <span className="text-safe text-glow">All Chains,</span>
          <br />
          <span className="text-danger text-glow">Safe Exit</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-pod-muted mb-12 max-w-3xl mx-auto font-mono leading-relaxed">
          Powered by{' '}
          <span className="text-safe font-semibold">ZetaChain</span>
          {' '}— evacuate your{' '}
          <span className="text-warning">BTC</span>,{' '}
          <span className="text-warning">ETH</span>, and{' '}
          <span className="text-warning">ZETA</span>
          {' '}assets simultaneously when market crashes
        </p>

        {/* Wallet Connection */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* EVM Wallet Button */}
            <Button
              variant={evmWallet.isConnected ? 'outline' : 'safe'}
              size="lg"
              glow={!evmWallet.isConnected}
              onClick={handleConnectEvm}
              disabled={evmWallet.isConnecting}
              className="min-w-[200px]"
            >
              {evmWallet.isConnecting ? (
                <span className="animate-pulse">Connecting...</span>
              ) : evmWallet.isConnected ? (
                <>
                  <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                  <span className="font-mono text-sm">
                    {evmWallet.address?.slice(0, 6)}...{evmWallet.address?.slice(-4)}
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Connect EVM Wallet
                </>
              )}
            </Button>

            {/* Bitcoin Wallet Button */}
            <Button
              variant={btcWallet.isConnected ? 'outline' : 'warning'}
              size="lg"
              glow={!btcWallet.isConnected}
              onClick={handleConnectBtc}
              disabled={btcWallet.isConnecting}
              className="min-w-[200px]"
            >
              {btcWallet.isConnecting ? (
                <span className="animate-pulse">Connecting...</span>
              ) : btcWallet.isConnected ? (
                <>
                  <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                  <span className="font-mono text-sm">
                    {btcWallet.address?.slice(0, 6)}...{btcWallet.address?.slice(-4)}
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z" />
                  </svg>
                  Connect Bitcoin Wallet
                </>
              )}
            </Button>
          </div>

          {/* Connection Status */}
          <div className="flex flex-col items-center gap-2">
            {(evmWallet.error || btcWallet.error) && (
              <p className="text-sm text-danger font-mono">
                {evmWallet.error || btcWallet.error}
              </p>
            )}
            <p className="text-sm text-pod-muted font-mono">
              {evmWallet.isConnected && btcWallet.isConnected
                ? 'Both wallets connected! Redirecting...'
                : evmWallet.isConnected || btcWallet.isConnected
                ? 'Connect both wallets to continue'
                : 'MetaMask (EVM) + Xverse (Bitcoin Signet)'}
            </p>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div className="glass-panel p-6 rounded-lg border-l-4 border-l-safe">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-display text-lg font-bold mb-2 text-safe">
              Instant Execution
            </h3>
            <p className="text-sm text-pod-muted">
              Execute cross-chain transfers in seconds with parallel processing
            </p>
          </div>

          <div className="glass-panel p-6 rounded-lg border-l-4 border-l-warning">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-display text-lg font-bold mb-2 text-warning">
              Multi-Chain
            </h3>
            <p className="text-sm text-pod-muted">
              Bitcoin, Ethereum, and ZetaChain - all chains unified
            </p>
          </div>

          <div className="glass-panel p-6 rounded-lg border-l-4 border-l-danger">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-display text-lg font-bold mb-2 text-danger">
              AI-Powered
            </h3>
            <p className="text-sm text-pod-muted">
              Configure custom triggers with natural language instructions
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
