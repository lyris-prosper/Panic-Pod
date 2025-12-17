'use client';

import { useState, useEffect, useCallback } from 'react';
import { UseBitcoinWallet, WindowWithBitcoin } from '@/types/wallet';

export function useBitcoinWallet(): UseBitcoinWallet {
  const [address, setAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get Bitcoin provider (Xverse injects as window.btc or window.XverseProviders)
  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const btcWindow = window as WindowWithBitcoin;
    // Try window.btc first (Wallet Standard), then XverseProviders
    return btcWindow.btc || btcWindow.XverseProviders?.BitcoinProvider || null;
  }, []);

  // Connect wallet using Wallet Standard request method
  const connect = useCallback(async () => {
    const provider = getProvider();

    if (!provider) {
      setError('Xverse wallet is not installed. Please install Xverse to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Try different methods that Xverse might support
      let response: unknown;
      let methodUsed = '';

      // Try wallet_connect first (newer Xverse versions)
      try {
        response = await provider.request('wallet_connect', {
          purposes: ['payment', 'ordinals'],
          message: 'Panic Pod would like to connect to your Bitcoin wallet',
        });
        methodUsed = 'wallet_connect';
      } catch {
        // Try getAccounts (alternative method)
        try {
          response = await provider.request('getAccounts', {
            purposes: ['payment', 'ordinals'],
          });
          methodUsed = 'getAccounts';
        } catch {
          // Try bitcoin_getAccounts
          response = await provider.request('bitcoin_getAccounts', {});
          methodUsed = 'bitcoin_getAccounts';
        }
      }

      console.log(`Xverse response (${methodUsed}):`, response);
      console.log('Full response structure:', JSON.stringify(response, null, 2));

      // Handle various response formats from Xverse
      let addresses: Array<{ address: string; publicKey: string; purpose?: string }> = [];

      if (response && typeof response === 'object') {
        const res = response as Record<string, unknown>;

        // Check for error in response
        if (res.error) {
          console.error('Xverse error response:', res.error);
          throw new Error((res.error as Record<string, string>).message || 'Wallet request failed');
        }

        // Xverse wallet_connect returns: { result: { addresses: [...] } }
        if (res.result && typeof res.result === 'object') {
          const result = res.result as Record<string, unknown>;
          console.log('Result object:', result);

          if (Array.isArray(result.addresses)) {
            console.log('Found addresses in result:', result.addresses);
            addresses = (result.addresses as Array<Record<string, unknown>>).map((addr) => ({
              address: (addr.address as string) || '',
              publicKey: (addr.publicKey as string) || '',
              purpose: (addr.purpose as string) || 'payment'
            }));
          }
        } else if (Array.isArray(res.addresses)) {
          addresses = (res.addresses as Array<Record<string, unknown>>).map((addr) => ({
            address: (addr.address as string) || '',
            publicKey: (addr.publicKey as string) || '',
            purpose: (addr.purpose as string) || 'payment'
          }));
        }
      } else if (Array.isArray(response)) {
        addresses = response.map((item) => {
          if (typeof item === 'string') {
            return { address: item, publicKey: '', purpose: 'payment' };
          }
          const addr = item as Record<string, unknown>;
          return {
            address: (addr.address as string) || '',
            publicKey: (addr.publicKey as string) || '',
            purpose: (addr.purpose as string) || 'payment'
          };
        });
      }

      console.log('Parsed addresses:', addresses);

      if (!addresses || addresses.length === 0) {
        setError('No Bitcoin addresses found. Please ensure you have a Bitcoin account in Xverse.');
        return;
      }

      // Find the payment address (preferred for transactions)
      const paymentAddress = addresses.find(
        (addr) => addr.purpose === 'payment'
      );

      const selectedAddress = paymentAddress || addresses[0];

      if (selectedAddress && selectedAddress.address) {
        console.log('Setting BTC wallet state:', {
          address: selectedAddress.address,
          publicKey: selectedAddress.publicKey,
        });
        setAddress(selectedAddress.address);
        setPublicKey(selectedAddress.publicKey || '');
        setIsConnected(true);
        setError(null);
        console.log('BTC wallet state set successfully');
      } else {
        console.error('Selected address is invalid:', selectedAddress);
        setError('Invalid address received from wallet');
      }
    } catch (err) {
      console.error('Xverse connect error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      console.log('Connect function completed, isConnecting set to false');
      setIsConnecting(false);
    }
  }, [getProvider]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setAddress(null);
    setPublicKey(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Check if Xverse is installed on mount
  useEffect(() => {
    const checkProvider = () => {
      const provider = getProvider();
      if (!provider && typeof window !== 'undefined') {
        // Give it a moment for the extension to inject
        const timeout = setTimeout(() => {
          const retryProvider = getProvider();
          if (!retryProvider) {
            // Don't show error by default, only when user tries to connect
          }
        }, 1000);

        return () => clearTimeout(timeout);
      }
    };

    checkProvider();
  }, [getProvider]);

  return {
    address,
    publicKey,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}
