import { useState, useEffect } from 'react';
import { fetchPrices } from '@/lib/priceService';
import { PriceData } from '@/types';

const POLL_INTERVAL = 60000; // 60 seconds

interface UsePricesReturn extends PriceData {
  isLoading: boolean;
  error: string | null;
}

export function usePrices(): UsePricesReturn {
  const [prices, setPrices] = useState<PriceData>({
    bitcoin: 0,
    ethereum: 0,
    zetachain: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrices = async () => {
    try {
      const result = await fetchPrices();
      setPrices(result);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(errorMessage);
      console.error('Error in usePrices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    loadPrices();
  }, []);

  // Set up polling interval
  useEffect(() => {
    const interval = setInterval(() => {
      loadPrices();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    ...prices,
    isLoading,
    error,
  };
}
