import { DUST_THRESHOLD_USD } from '@/types';

// Gas buffer constants
export const EVM_GAS_BUFFER = 0.005; // Reserve 0.005 ETH for gas (enough for ~2-3 transactions)
export const BTC_FEE_SATS = 50000;   // Reserve 50000 sats (~0.0005 BTC) for mining fee
                                      // Increased to handle larger transactions with multiple UTXOs

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

/**
 * Check if a balance is at or below the reserved fee amount (post-transfer residual)
 * These amounts cannot be transferred and should display as 0 after evacuation
 * @param balance - The balance to check
 * @param chain - The blockchain type ('btc' or 'eth')
 * @returns True if the balance is only the fee reserve (should show as 0)
 */
export function isResidualBalance(
  balance: number,
  chain: 'btc' | 'eth'
): boolean {
  if (chain === 'btc') {
    const feeInBtc = BTC_FEE_SATS / 100000000;
    // Consider balance as residual if it's at or below the fee reserve
    return balance <= feeInBtc;
  } else {
    // Consider balance as residual if it's at or below the gas buffer
    return balance <= EVM_GAS_BUFFER;
  }
}

/**
 * Get the display balance - returns 0 if the balance is just residual fees
 * @param balance - The actual balance
 * @param chain - The blockchain type ('btc' or 'eth')
 * @returns The balance to display (0 if residual, actual otherwise)
 */
export function getDisplayBalance(
  balance: number,
  chain: 'btc' | 'eth'
): number {
  if (isResidualBalance(balance, chain)) {
    return 0;
  }
  return balance;
}
