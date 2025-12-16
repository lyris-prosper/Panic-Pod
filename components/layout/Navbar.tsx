'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { walletAddress, disconnectWallet } = useStore();

  const handleDisconnect = () => {
    disconnectWallet();
    router.push('/');
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="glass-panel border-b border-pod-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="relative">
              <div className="w-12 h-12 hex-border bg-gradient-to-br from-danger to-safe flex items-center justify-center">
                <span className="text-2xl font-display font-black text-white">P</span>
              </div>
              <div className="absolute inset-0 hex-border bg-gradient-to-br from-danger to-safe blur-lg opacity-50" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black text-pod-text">
                PANIC POD
              </h1>
              <p className="text-xs font-mono text-pod-muted uppercase tracking-wider">
                Emergency System
              </p>
            </div>
          </div>

          {/* Wallet info */}
          <div className="flex items-center gap-4">
            {walletAddress && (
              <>
                <div className="px-4 py-2 glass-panel rounded-lg border border-safe/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                    <span className="text-sm font-mono text-pod-text">
                      {truncateAddress(walletAddress)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
