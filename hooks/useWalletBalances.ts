import { useState, useEffect, useCallback } from 'react';
import { fetchAllBalances } from '@/lib/balanceService';
import { WalletBalances } from '@/types';

interface UseWalletBalancesReturn extends WalletBalances {
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWalletBalances(
  btcAddress: string | null,
  evmAddress: string | null
): UseWalletBalancesReturn {
  const [balances, setBalances] = useState<WalletBalances>({
    btc: 0,
    eth: {
      sepolia: 0,
      base: 0,
      linea: 0,
      total: 0,
    },
    zeta: {
      native: 0,
      zrc20: [],
      total: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    // Don't fetch if both addresses are null
    if (!btcAddress && !evmAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useWalletBalances] Fetching balances for:', { btcAddress, evmAddress });
      const result = await fetchAllBalances(btcAddress, evmAddress);
      console.log('[useWalletBalances] Balance result:', result);
      setBalances(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balances';
      setError(errorMessage);
      console.error('Error in useWalletBalances:', err);
    } finally {
      setIsLoading(false);
    }
  }, [btcAddress, evmAddress]);

  // Fetch on mount and when addresses change
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Removed auto-refresh interval - balances now only refresh on manual request

  return {
    ...balances,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}
