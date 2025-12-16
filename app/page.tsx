'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
  const { isConnected, connectWallet } = useStore();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  const handleConnect = () => {
    connectWallet();
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
          <span className="text-warning">Solana</span>
          {' '}assets simultaneously when market crashes
        </p>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-6">
          <Button
            variant="safe"
            size="xl"
            glow
            onClick={handleConnect}
            className="group"
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Connect Wallet
          </Button>

          <p className="text-sm text-pod-muted font-mono">
            Supports OKX Wallet (BTC, EVM, Solana)
          </p>
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
              Bitcoin, Ethereum, and Solana - all chains in one operation
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
