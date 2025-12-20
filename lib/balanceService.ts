import { JsonRpcProvider, Contract, formatEther } from 'ethers';
import { ETHEREUM_SEPOLIA, BASE_SEPOLIA, LINEA_SEPOLIA, ZETACHAIN_TESTNET } from '@/config/chains';

// ERC20 ABI - just the balanceOf function
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// ZRC20 token addresses on ZetaChain Athens Testnet
// These are placeholder addresses - will need to be updated with actual testnet addresses
const ZRC20_TOKENS = {
  'ETH.ETH': '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf', // Placeholder
  'BTC.BTC': '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb', // Placeholder
  // Add more tokens as needed
};

/**
 * Fetch Bitcoin Signet balance using mempool.space API
 */
export async function fetchBitcoinBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`https://mempool.space/signet/api/address/${address}`);
    if (!response.ok) {
      console.error('Failed to fetch Bitcoin balance:', response.statusText);
      return 0;
    }

    const data = await response.json();
    // Calculate balance: funded - spent (in satoshis)
    const balanceSats = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum);
    // Convert satoshis to BTC
    return balanceSats / 100000000;
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error);
    return 0;
  }
}

/**
 * Fetch ETH balance on an EVM chain
 */
export async function fetchEvmBalance(address: string, rpcUrl: string): Promise<number> {
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    const balanceInEth = parseFloat(formatEther(balance));
    console.log(`[Balance Service] ${rpcUrl}: ${balanceInEth} ETH for ${address.substring(0, 10)}...`);
    return balanceInEth;
  } catch (error) {
    console.error(`[Balance Service] Error fetching EVM balance from ${rpcUrl}:`, error);
    console.error(`[Balance Service] Address: ${address}`);
    return 0;
  }
}

/**
 * Fetch ZRC20 token balance
 */
export async function fetchZRC20Balance(
  address: string,
  tokenAddress: string,
  rpcUrl: string
): Promise<number> {
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();

    // Convert from token units to decimal
    return parseFloat(formatEther(balance)) * Math.pow(10, 18 - decimals);
  } catch (error) {
    console.error(`Error fetching ZRC20 balance from ${tokenAddress}:`, error);
    return 0;
  }
}

/**
 * Fetch all balances across all supported chains
 */
export async function fetchAllBalances(
  btcAddress: string | null,
  evmAddress: string | null
): Promise<{
  btc: number;
  eth: {
    sepolia: number;
    base: number;
    linea: number;
    total: number;
  };
  zeta: {
    native: number;
    zrc20: Array<{ symbol: string; balance: number; address: string }>;
    total: number;
  };
}> {
  // Initialize with zeros
  const result = {
    btc: 0,
    eth: {
      sepolia: 0,
      base: 0,
      linea: 0,
      total: 0,
    },
    zeta: {
      native: 0,
      zrc20: [] as Array<{ symbol: string; balance: number; address: string }>,
      total: 0,
    },
  };

  // Only fetch if addresses are provided
  if (!btcAddress && !evmAddress) {
    return result;
  }

  try {
    // Fetch all balances in parallel
    const promises: Promise<void>[] = [];

    // BTC Balance
    if (btcAddress) {
      promises.push(
        fetchBitcoinBalance(btcAddress).then(balance => {
          result.btc = balance;
        })
      );
    }

    // EVM Balances
    if (evmAddress) {
      // Ethereum Sepolia
      promises.push(
        fetchEvmBalance(evmAddress, ETHEREUM_SEPOLIA.rpcUrl).then(balance => {
          result.eth.sepolia = balance;
        })
      );

      // Base Sepolia
      promises.push(
        fetchEvmBalance(evmAddress, BASE_SEPOLIA.rpcUrl).then(balance => {
          result.eth.base = balance;
        })
      );

      // Linea Sepolia
      promises.push(
        fetchEvmBalance(evmAddress, LINEA_SEPOLIA.rpcUrl).then(balance => {
          result.eth.linea = balance;
        })
      );

      // ZetaChain native ZETA
      promises.push(
        fetchEvmBalance(evmAddress, ZETACHAIN_TESTNET.rpcUrl).then(balance => {
          result.zeta.native = balance;
        })
      );

      // ZRC20 tokens
      Object.entries(ZRC20_TOKENS).forEach(([symbol, tokenAddress]) => {
        promises.push(
          fetchZRC20Balance(evmAddress, tokenAddress, ZETACHAIN_TESTNET.rpcUrl).then(balance => {
            if (balance > 0) {
              result.zeta.zrc20.push({ symbol, balance, address: tokenAddress });
            }
          })
        );
      });
    }

    // Wait for all fetches to complete
    await Promise.all(promises);

    // Calculate totals
    result.eth.total = result.eth.sepolia + result.eth.base + result.eth.linea;
    result.zeta.total = result.zeta.native + result.zeta.zrc20.reduce((sum, token) => sum + token.balance, 0);

  } catch (error) {
    console.error('Error fetching balances:', error);
  }

  return result;
}
