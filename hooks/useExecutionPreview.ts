import { useMemo } from 'react';
import {
  StrategyMode,
  PanicStrategy,
  WalletBalances,
  PriceData,
  ExecutionPreviewItem,
  DUST_THRESHOLD_USD
} from '@/types';
import { isDustAmount, calculateMaxSendAmount } from '@/lib/gasEstimation';
import { estimateSwapToBTC, getZRC20AddressForChain } from '@/lib/zetachainService';
import { ethers } from 'ethers';

/**
 * Hook to generate an execution preview based on mode, strategy, and balances
 * @param mode - The execution mode ('escape' or 'haven')
 * @param strategy - The panic strategy configuration
 * @param balances - Current wallet balances
 * @param prices - Current price data
 * @returns Array of ExecutionPreviewItems describing what will happen
 */
export function useExecutionPreview(
  mode: StrategyMode | null,
  strategy: PanicStrategy | null,
  balances: WalletBalances | null,
  prices: PriceData | null
): ExecutionPreviewItem[] {
  return useMemo(() => {
    if (!mode || !strategy || !balances || !prices) {
      return [];
    }

    const config = mode === 'escape' ? strategy.escapeConfig : strategy.havenConfig;
    if (!config) {
      return [];
    }

    const previewItems: ExecutionPreviewItem[] = [];

    // 1. BTC handling - always transfer to safe address
    if (balances.btc > 0) {
      const btcUsdValue = balances.btc * prices.bitcoin;
      const maxSendable = calculateMaxSendAmount(balances.btc, 'btc');

      previewItems.push({
        chain: 'Bitcoin',
        asset: 'BTC',
        balance: balances.btc,
        usdValue: btcUsdValue,
        action: 'transfer',
        destination: config.btcAddress,
        estimatedReceive: maxSendable,
        warning: maxSendable <= 0 ? 'Insufficient balance for fees' : undefined
      });
    }

    // 2. ETH handling - depends on mode
    const ethChains = [
      { name: 'Sepolia', key: 'sepolia' as const },
      { name: 'Base Sepolia', key: 'base' as const },
      { name: 'Linea Sepolia', key: 'linea' as const }
    ];

    for (const { name, key } of ethChains) {
      const balance = balances.eth[key];
      const usdValue = balance * prices.ethereum;

      if (balance === 0) {
        // Skip chains with no balance
        previewItems.push({
          chain: name,
          asset: 'ETH',
          balance,
          usdValue,
          action: 'skip',
          destination: '',
          skipReason: 'No balance'
        });
        continue;
      }

      if (mode === 'escape') {
        // Escape mode: Direct transfer if evmAddress configured
        if (config.evmAddress) {
          const maxSendable = calculateMaxSendAmount(balance, 'eth');
          previewItems.push({
            chain: name,
            asset: 'ETH',
            balance,
            usdValue,
            action: 'transfer',
            destination: config.evmAddress,
            estimatedReceive: maxSendable,
            warning: maxSendable <= 0 ? 'Insufficient balance for gas' : undefined
          });
        } else {
          previewItems.push({
            chain: name,
            asset: 'ETH',
            balance,
            usdValue,
            action: 'skip',
            destination: '',
            skipReason: 'No EVM address configured'
          });
        }
      } else {
        // Haven mode: Check dust threshold
        if (isDustAmount(usdValue, DUST_THRESHOLD_USD)) {
          // Below $50 threshold
          if (config.evmAddress) {
            const maxSendable = calculateMaxSendAmount(balance, 'eth');
            previewItems.push({
              chain: name,
              asset: 'ETH',
              balance,
              usdValue,
              action: 'transfer',
              destination: config.evmAddress,
              estimatedReceive: maxSendable,
              warning: `Below $${DUST_THRESHOLD_USD} threshold - transferring to fallback address`
            });
          } else {
            previewItems.push({
              chain: name,
              asset: 'ETH',
              balance,
              usdValue,
              action: 'skip',
              destination: '',
              skipReason: `Dust amount (below $${DUST_THRESHOLD_USD})`,
              warning: 'Consider adding an EVM fallback address'
            });
          }
        } else {
          // Above $50 threshold - plan swap via ZetaChain
          // Note: Actual estimation is async, so we'll mark it for estimation
          // The component will need to handle this asynchronously
          previewItems.push({
            chain: name,
            asset: 'ETH',
            balance,
            usdValue,
            action: 'swap',
            destination: 'BTC via ZetaChain',
            // estimatedReceive will be populated by component
          });
        }
      }
    }

    // 3. ZETA assets - always skip (no action required)
    if (balances.zeta.total > 0) {
      previewItems.push({
        chain: 'ZetaChain',
        asset: 'ZETA',
        balance: balances.zeta.total,
        usdValue: balances.zeta.total * prices.zetachain,
        action: 'skip',
        destination: '',
        skipReason: 'Native ZETA and ZRC20 tokens remain on ZetaChain'
      });
    }

    return previewItems;
  }, [mode, strategy, balances, prices]);
}

/**
 * Helper function to fetch swap estimations for preview items
 * This is called separately from the hook because it's async
 * @param previewItems - The preview items from useExecutionPreview
 * @returns Promise of updated preview items with swap estimations
 */
export async function enrichPreviewWithEstimations(
  previewItems: ExecutionPreviewItem[]
): Promise<ExecutionPreviewItem[]> {
  const enrichedItems = await Promise.all(
    previewItems.map(async (item) => {
      if (item.action !== 'swap') {
        return item;
      }

      // Get ZRC20 address for this chain
      const chainKey = item.chain.split(' ')[0].toLowerCase(); // 'Sepolia' from 'Sepolia'
      const zrc20Address = getZRC20AddressForChain(chainKey);

      if (!zrc20Address) {
        return {
          ...item,
          warning: 'Estimation unavailable - ZRC20 address not configured'
        };
      }

      // Convert balance to wei
      const amountInWei = ethers.parseEther(item.balance.toString());

      // Get estimation
      const estimation = await estimateSwapToBTC(zrc20Address, amountInWei);

      if (!estimation) {
        return {
          ...item,
          warning: 'Estimation unavailable - RPC error or placeholder address'
        };
      }

      // Convert from sats to BTC
      const btcAmount = Number(estimation.netAmount) / 100000000;

      return {
        ...item,
        estimatedReceive: btcAmount
      };
    })
  );

  return enrichedItems;
}
