import { ethers } from 'ethers';

// ZetaChain Athens Testnet contract configuration
export const PANIC_POD_SWAP_ADDRESS = '0x3Dacd9EF40B405eDFa9C4FBaA7c846DE40bc3c66';
export const ZETACHAIN_ATHENS_RPC = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';

// Contract ABI - only view functions needed for estimation
export const PANIC_POD_SWAP_ABI = [
  'function estimateEvacuation(address inputToken, uint256 inputAmount) external view returns (uint256 btcAmount, uint256 gasFee, uint256 netAmount)',
  'function getZBTC() external view returns (address)'
];

// ZRC20 token addresses on ZetaChain Athens Testnet
// TODO: Replace with actual ZRC20 token addresses once available
export const ZRC20_ADDRESSES = {
  'ETH_SEPOLIA': '0x0000000000000000000000000000000000000000', // Placeholder - update with real address
  'ETH_BASE': '0x0000000000000000000000000000000000000000',    // Placeholder - update with real address
  'ETH_LINEA': '0x0000000000000000000000000000000000000000',   // Placeholder - update with real address
};

export interface SwapEstimation {
  btcAmount: bigint;
  gasFee: bigint;
  netAmount: bigint;
}

/**
 * Estimate the BTC output from swapping an EVM token via ZetaChain
 * @param inputTokenAddress - The ZRC20 token address (e.g., ZRC20_ADDRESSES.ETH_SEPOLIA)
 * @param inputAmount - The amount to swap (in wei/smallest unit)
 * @returns SwapEstimation object or null if estimation fails
 */
export async function estimateSwapToBTC(
  inputTokenAddress: string,
  inputAmount: bigint
): Promise<SwapEstimation | null> {
  try {
    // Check for placeholder addresses
    if (inputTokenAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('ZRC20 token address is placeholder - estimation unavailable');
      return null;
    }

    const provider = new ethers.JsonRpcProvider(ZETACHAIN_ATHENS_RPC);
    const contract = new ethers.Contract(
      PANIC_POD_SWAP_ADDRESS,
      PANIC_POD_SWAP_ABI,
      provider
    );

    const result = await contract.estimateEvacuation(inputTokenAddress, inputAmount);

    return {
      btcAmount: result.btcAmount,
      gasFee: result.gasFee,
      netAmount: result.netAmount
    };
  } catch (error) {
    console.error('Error estimating swap to BTC:', error);
    return null;
  }
}

/**
 * Get the ZRC20-BTC token address from the contract
 * @returns The ZRC20-BTC address or null if unavailable
 */
export async function getZBTCAddress(): Promise<string | null> {
  try {
    const provider = new ethers.JsonRpcProvider(ZETACHAIN_ATHENS_RPC);
    const contract = new ethers.Contract(
      PANIC_POD_SWAP_ADDRESS,
      PANIC_POD_SWAP_ABI,
      provider
    );

    const zbtcAddress = await contract.getZBTC();
    return zbtcAddress;
  } catch (error) {
    console.error('Error getting ZBTC address:', error);
    return null;
  }
}

/**
 * Get the appropriate ZRC20 token address for a given chain
 * @param chain - The chain name ('sepolia', 'base', 'linea')
 * @returns The ZRC20 token address or null if unknown chain
 */
export function getZRC20AddressForChain(chain: string): string | null {
  const chainKey = `ETH_${chain.toUpperCase()}` as keyof typeof ZRC20_ADDRESSES;
  return ZRC20_ADDRESSES[chainKey] || null;
}
