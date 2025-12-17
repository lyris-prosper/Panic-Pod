'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet';
import { Button } from '@/components/ui/Button';
import { SUPPORTED_EVM_CHAINS, CHAIN_ID_MAP } from '@/config/chains';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { evmAddress, evmChainId, btcAddress, clearWallets } = useStore();
  const evmWallet = useEvmWallet();
  const btcWallet = useBitcoinWallet();
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  const handleDisconnect = async () => {
    evmWallet.disconnect();
    await btcWallet.disconnect();
    clearWallets();
    router.push('/');
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getCurrentNetworkName = () => {
    if (!evmChainId) return 'Unknown';
    const chain = CHAIN_ID_MAP[evmChainId];
    return chain?.name || `Chain ${evmChainId}`;
  };

  const handleNetworkSwitch = async (chainId: number) => {
    await evmWallet.switchNetwork(chainId);
    setShowNetworkDropdown(false);
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
          <div className="flex items-center gap-3">
            {/* EVM Address with Network Switcher */}
            {evmAddress && (
              <div className="relative">
                <button
                  onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                  className="px-3 py-2 glass-panel rounded-lg border border-safe/30 hover:border-safe/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                    <span className="text-xs font-mono text-pod-muted">{getCurrentNetworkName()}</span>
                    <span className="text-sm font-mono text-pod-text">
                      {truncateAddress(evmAddress)}
                    </span>
                    <svg className="w-3 h-3 text-pod-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Network Dropdown */}
                {showNetworkDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 glass-panel rounded-lg border border-pod-border shadow-lg z-50">
                    <div className="p-2">
                      <p className="text-xs text-pod-muted font-mono px-2 py-1 uppercase">Switch Network</p>
                      {SUPPORTED_EVM_CHAINS.map((chain) => (
                        <button
                          key={chain.chainId}
                          onClick={() => handleNetworkSwitch(chain.chainId)}
                          className={`w-full text-left px-3 py-2 rounded text-sm font-mono transition-colors ${
                            evmChainId === chain.chainId
                              ? 'bg-safe/20 text-safe'
                              : 'text-pod-text hover:bg-pod-border/50'
                          }`}
                        >
                          {chain.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BTC Address */}
            {btcAddress && (
              <div className="px-3 py-2 glass-panel rounded-lg border border-warning/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-pod-muted">Signet</span>
                  <span className="text-sm font-mono text-pod-text">
                    {truncateAddress(btcAddress)}
                  </span>
                </div>
              </div>
            )}

            {/* Disconnect Button */}
            {(evmAddress || btcAddress) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
