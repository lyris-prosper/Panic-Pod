import { PriceData } from '@/types';

// Cache for price data
let priceCache: (PriceData & { timestamp: number }) | null = null;
const CACHE_DURATION = 60000; // 60 seconds

/**
 * Fetch cryptocurrency prices from CoinGecko API
 */
export async function fetchPrices(): Promise<PriceData> {
  // Return cached data if still valid
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
    const { timestamp, ...prices } = priceCache;
    return prices;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,zetachain&vs_currencies=usd'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.statusText}`);
    }

    const data = await response.json();

    const prices: PriceData = {
      bitcoin: data.bitcoin?.usd || 0,
      ethereum: data.ethereum?.usd || 0,
      zetachain: data.zetachain?.usd || 0,
    };

    // Update cache
    priceCache = {
      ...prices,
      timestamp: Date.now(),
    };

    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);

    // Return cached data if available, even if expired
    if (priceCache) {
      const { timestamp, ...prices } = priceCache;
      return prices;
    }

    // Return default prices as fallback
    return {
      bitcoin: 0,
      ethereum: 0,
      zetachain: 0,
    };
  }
}
