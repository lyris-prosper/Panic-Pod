/**
 * Bitcoin transaction orchestration service
 * Handles Bitcoin Signet transactions via Xverse wallet
 */

import { WindowWithBitcoin } from '@/types/wallet';
import { TransactionResult } from './types';
import { BTC_FEE_SATS, calculateMaxSendAmount } from '../gasEstimation';

/**
 * Execute a Bitcoin transfer via Xverse wallet
 *
 * @param toAddress - Destination Bitcoin address
 * @param amountBtc - Amount to send in BTC
 * @returns TransactionResult with txHash or error
 */
export async function executeBtcTransfer(
  toAddress: string,
  amountBtc: number
): Promise<TransactionResult> {
  console.log('[BTC Transfer] Starting transfer...', {
    toAddress,
    amountBtc,
  });

  if (typeof window === 'undefined') {
    console.error('[BTC Transfer] Window not available (SSR)');
    return {
      success: false,
      error: 'Window not available',
    };
  }

  const btcWindow = window as WindowWithBitcoin;
  const provider = btcWindow.btc || btcWindow.XverseProviders?.BitcoinProvider;

  if (!provider) {
    console.error('[BTC Transfer] Xverse wallet not found');
    return {
      success: false,
      error: 'Xverse wallet not found. Please install Xverse.',
    };
  }

  // Validate Bitcoin address
  if (!isValidBitcoinAddress(toAddress)) {
    console.error('[BTC Transfer] Invalid address format:', toAddress);
    return {
      success: false,
      error: 'Invalid Bitcoin address format',
    };
  }

  // Calculate maximum sendable amount after fees
  const maxSendable = calculateMaxSendAmount(amountBtc, 'btc');
  console.log('[BTC Transfer] Max sendable after fees:', {
    originalBalance: amountBtc,
    feeReserve: BTC_FEE_SATS / 100000000,
    maxSendable,
  });

  if (maxSendable <= 0) {
    console.error('[BTC Transfer] Insufficient balance for fees');
    return {
      success: false,
      error: `Insufficient balance to cover fees. Need at least ${BTC_FEE_SATS / 100000000} BTC for fees.`,
    };
  }

  // Convert BTC to satoshis (1 BTC = 100,000,000 satoshis)
  const amountSats = Math.floor(maxSendable * 100_000_000);
  console.log('[BTC Transfer] Amount in satoshis:', amountSats);

  if (amountSats <= 0) {
    console.error('[BTC Transfer] Invalid satoshi amount');
    return {
      success: false,
      error: 'Invalid amount: must be greater than 0',
    };
  }

  try {
    console.log('[BTC Transfer] Requesting transfer from Xverse...');
    // Request transaction from Xverse using sendTransfer
    const response = await provider.request('sendTransfer', {
      recipients: [
        {
          address: toAddress,
          amount: amountSats,
        },
      ],
    });

    console.log('[BTC Transfer] Xverse response:', response);

    // Handle response
    if (response && typeof response === 'object') {
      const res = response as Record<string, unknown>;

      // Check for error
      if (res.error) {
        const errorObj = res.error as Record<string, string>;
        return {
          success: false,
          error: errorObj.message || 'Transaction rejected',
        };
      }

      // Extract txid from result
      if (res.result && typeof res.result === 'object') {
        const result = res.result as Record<string, unknown>;
        if (result.txid) {
          console.log('[BTC Transfer] ✅ Success! TX ID:', result.txid);
          return {
            success: true,
            txHash: result.txid as string,
          };
        }
      }

      // Direct txid in response
      if (res.txid) {
        console.log('[BTC Transfer] ✅ Success! TX ID:', res.txid);
        return {
          success: true,
          txHash: res.txid as string,
        };
      }
    }

    console.error('[BTC Transfer] No txid in response');
    return {
      success: false,
      error: 'No transaction ID returned from wallet',
    };
  } catch (error) {
    console.error('[BTC Transfer] ❌ Error:', error);
    if (error instanceof Error) {
      // User rejected the request
      if (
        error.message.includes('User rejected') ||
        error.message.includes('denied') ||
        error.message.includes('cancelled')
      ) {
        console.log('[BTC Transfer] User cancelled transaction');
        return {
          success: false,
          error: 'Transaction cancelled by user',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to send Bitcoin transaction',
    };
  }
}

/**
 * Validate Bitcoin address format
 * Supports mainnet and testnet addresses
 */
function isValidBitcoinAddress(address: string): boolean {
  if (!address) return false;

  // P2PKH (Legacy): starts with 1
  const p2pkh = /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/;

  // P2SH: starts with 3
  const p2sh = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;

  // Bech32 (Native SegWit): starts with bc1 (mainnet)
  // Bech32 character set: [a-z0-9] excluding 1, b, i, o
  const bech32 = /^bc1[ac-hj-np-z02-9]{25,90}$/;

  // Bech32m (Taproot): starts with bc1p (mainnet)
  const bech32m = /^bc1p[ac-hj-np-z02-9]{25,90}$/;

  // Testnet Bech32 addresses: starts with tb1 (Signet/Testnet)
  const testnetBech32 = /^tb1[ac-hj-np-z02-9]{25,90}$/;

  // Legacy testnet addresses
  const testnetLegacy = /^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

  return (
    p2pkh.test(address) ||
    p2sh.test(address) ||
    bech32.test(address) ||
    bech32m.test(address) ||
    testnetBech32.test(address) ||
    testnetLegacy.test(address)
  );
}
