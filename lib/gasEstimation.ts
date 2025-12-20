import { DUST_THRESHOLD_USD } from '@/types';

// Gas buffer constants
export const EVM_GAS_BUFFER = 0.005; // Reserve 0.005 ETH for gas (enough for ~2-3 transactions)
export const BTC_FEE_SATS = 10000;   // Reserve 10000 sats for mining fee

/**
 * Calculate the maximum sendable amount after reserving gas/fees
 * @param balance - The total balance
 * @param chain - The blockchain type ('btc' or 'eth')
 * @returns The maximum amount that can be sent
 */
export function calculateMaxSendAmount(
  balance: number,
  chain: 'btc' | 'eth'
): number {
  if (chain === 'btc') {
    const feeInBtc = BTC_FEE_SATS / 100000000;
    return Math.max(0, balance - feeInBtc);
  } else {
    return Math.max(0, balance - EVM_GAS_BUFFER);
  }
}

/**
 * Check if the balance is sufficient to cover gas fees
 * @param balance - The total balance
 * @param chain - The blockchain type ('btc' or 'eth')
 * @returns True if balance is insufficient for any transaction
 */
export function hasInsufficientGas(
  balance: number,
  chain: 'btc' | 'eth'
): boolean {
  if (chain === 'btc') {
    return balance < BTC_FEE_SATS / 100000000;
  } else {
    return balance < EVM_GAS_BUFFER;
  }
}

/**
 * Check if a USD value is below the dust threshold
 * @param usdValue - The USD value to check
 * @param threshold - The dust threshold (defaults to DUST_THRESHOLD_USD)
 * @returns True if the amount is considered dust
 */
export function isDustAmount(
  usdValue: number,
  threshold: number = DUST_THRESHOLD_USD
): boolean {
  return usdValue < threshold;
}
