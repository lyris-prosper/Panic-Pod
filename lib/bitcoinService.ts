import { WindowWithBitcoin } from '@/types/wallet';

export interface BitcoinTransferResult {
  txid: string;
  explorerUrl: string;
}

// Get Bitcoin provider
function getProvider() {
  if (typeof window === 'undefined') return null;
  const btcWindow = window as WindowWithBitcoin;
  return btcWindow.btc || btcWindow.XverseProviders?.BitcoinProvider || null;
}

// Validate Bitcoin address
export function isValidBitcoinAddress(address: string): boolean {
  if (!address) return false;
  
  // Mainnet addresses
  const p2pkh = /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const p2sh = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32 = /^bc1[a-zA-HJ-NP-Z0-9]{25,90}$/;
  const bech32m = /^bc1p[a-zA-HJ-NP-Z0-9]{25,90}$/;
  
  // Testnet addresses
  const testnet = /^(tb1|m|n|2)[a-km-zA-HJ-NP-Z1-9]{25,90}$/;
  
  return p2pkh.test(address) || 
         p2sh.test(address) || 
         bech32.test(address) || 
         bech32m.test(address) ||
         testnet.test(address);
}

// Convert BTC to satoshis
export function btcToSatoshis(btc: number): number {
  return Math.floor(btc * 100_000_000);
}

// Convert satoshis to BTC
export function satoshisToBtc(sats: number): number {
  return sats / 100_000_000;
}

// Get connected Bitcoin address
export async function getConnectedAddress(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const response = await provider.request('getAccounts', {
      purposes: ['payment'],
    });

    if (response && typeof response === 'object') {
      const res = response as Record<string, unknown>;
      
      if (res.result && typeof res.result === 'object') {
        const result = res.result as Record<string, unknown>;
        if (Array.isArray(result.addresses) && result.addresses.length > 0) {
          const addr = result.addresses[0] as Record<string, string>;
          return addr.address || null;
        }
      }
      
      if (Array.isArray(res.addresses) && res.addresses.length > 0) {
        const addr = res.addresses[0] as Record<string, string>;
        return addr.address || null;
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

// Send Bitcoin transaction
export async function sendBitcoin(
  toAddress: string,
  amountBtc: number
): Promise<BitcoinTransferResult> {
  const provider = getProvider();
  
  if (!provider) {
    throw new Error('Xverse wallet not found');
  }

  if (!isValidBitcoinAddress(toAddress)) {
    throw new Error('Invalid Bitcoin address');
  }

  const amountSats = btcToSatoshis(amountBtc);
  
  if (amountSats <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  // Minimum dust threshold (546 satoshis)
  if (amountSats < 546) {
    throw new Error('Amount below dust threshold (546 satoshis)');
  }

  try {
    const response = await provider.request('sendTransfer', {
      recipients: [
        {
          address: toAddress,
          amount: amountSats,
        },
      ],
    });

    let txid: string | null = null;

    if (response && typeof response === 'object') {
      const res = response as Record<string, unknown>;
      
      if (res.error) {
        const errorObj = res.error as Record<string, string>;
        throw new Error(errorObj.message || 'Transaction failed');
      }

      if (res.result && typeof res.result === 'object') {
        const result = res.result as Record<string, unknown>;
        txid = (result.txid as string) || null;
      }
      
      if (!txid && res.txid) {
        txid = res.txid as string;
      }
    }

    if (!txid) {
      throw new Error('No transaction ID returned');
    }

    // Determine if testnet or mainnet based on address
    const isTestnet = toAddress.startsWith('tb1') || 
                      toAddress.startsWith('m') || 
                      toAddress.startsWith('n') ||
                      toAddress.startsWith('2');
    
    const explorerUrl = isTestnet
      ? `https://mempool.space/testnet/tx/${txid}`
      : `https://mempool.space/tx/${txid}`;

    return { txid, explorerUrl };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User rejected') || 
          error.message.includes('denied') ||
          error.message.includes('cancelled')) {
        throw new Error('Transaction cancelled by user');
      }
      throw error;
    }
    throw new Error('Failed to send Bitcoin');
  }
}

// Get Bitcoin balance (requires wallet connection)
export async function getBitcoinBalance(): Promise<number | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const response = await provider.request('getBalance', {});
    
    if (response && typeof response === 'object') {
      const res = response as Record<string, unknown>;
      
      if (res.result && typeof res.result === 'object') {
        const result = res.result as Record<string, unknown>;
        if (typeof result.confirmed === 'number') {
          return satoshisToBtc(result.confirmed);
        }
      }
      
      if (typeof res.confirmed === 'number') {
        return satoshisToBtc(res.confirmed);
      }
    }
  } catch {
    // Balance query not supported
  }

  return null;
}
