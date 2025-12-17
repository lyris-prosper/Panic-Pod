'use client';

import { useState, useEffect, useCallback } from 'react';
import { UseEvmWallet, WindowWithEthereum } from '@/types/wallet';
import { CHAIN_ID_MAP } from '@/config/chains';

export function useEvmWallet(): UseEvmWallet {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get ethereum provider
  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return (window as WindowWithEthereum).ethereum;
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountsArray = accounts as string[];
    if (accountsArray.length === 0) {
      setAddress(null);
      setIsConnected(false);
      setError('Please connect to MetaMask');
    } else {
      setAddress(accountsArray[0]);
      setIsConnected(true);
      setError(null);
    }
  }, []);

  // Handle chain changes
  const handleChainChanged = useCallback((chainIdHex: unknown) => {
    const newChainId = parseInt(chainIdHex as string, 16);
    setChainId(newChainId);
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    const provider = getProvider();

    if (!provider) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request accounts
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);

        // Get current chain ID
        const currentChainId = await provider.request({
          method: 'eth_chainId',
        }) as string;
        setChainId(parseInt(currentChainId, 16));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [getProvider]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetChainId: number) => {
    const provider = getProvider();

    if (!provider) {
      setError('MetaMask is not installed');
      return;
    }

    const chainConfig = CHAIN_ID_MAP[targetChainId];
    if (!chainConfig) {
      setError(`Unsupported chain ID: ${targetChainId}`);
      return;
    }

    setError(null);

    try {
      // Try to switch to the network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainIdHex }],
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      const error = switchError as { code?: number };
      if (error.code === 4902) {
        try {
          // Add the network to MetaMask
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainConfig.chainIdHex,
                chainName: chainConfig.name,
                nativeCurrency: chainConfig.nativeCurrency,
                rpcUrls: [chainConfig.rpcUrl],
                blockExplorerUrls: [chainConfig.blockExplorer],
              },
            ],
          });
        } catch (addError) {
          const errorMessage = addError instanceof Error ? addError.message : 'Failed to add network';
          setError(errorMessage);
        }
      } else {
        const errorMessage = switchError instanceof Error ? switchError.message : 'Failed to switch network';
        setError(errorMessage);
      }
    }
  }, [getProvider]);

  // Set up event listeners
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    // Listen to account changes
    provider.on('accountsChanged', handleAccountsChanged);

    // Listen to chain changes
    provider.on('chainChanged', handleChainChanged);

    // Cleanup
    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [getProvider, handleAccountsChanged, handleChainChanged]);

  // Check if already connected on mount
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const checkConnection = async () => {
      try {
        const accounts = await provider.request({
          method: 'eth_accounts',
        }) as string[];

        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);

          const currentChainId = await provider.request({
            method: 'eth_chainId',
          }) as string;
          setChainId(parseInt(currentChainId, 16));
        }
      } catch (err) {
        console.error('Failed to check wallet connection:', err);
      }
    };

    checkConnection();
  }, [getProvider]);

  return {
    address,
    chainId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
  };
}
