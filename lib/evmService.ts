import { ethers } from 'ethers';
import { WindowWithEthereum } from '@/types/wallet';

export interface EvmTransferResult {
  txHash: string;
  explorerUrl: string;
}

// Chain configurations
const CHAIN_CONFIG: Record<number, { name: string; explorer: string; rpc: string }> = {
  1: { name: 'Ethereum Mainnet', explorer: 'https://etherscan.io', rpc: 'https://eth.llamarpc.com' },
  11155111: { name: 'Sepolia', explorer: 'https://sepolia.etherscan.io', rpc: 'https://rpc.sepolia.org' },
  84532: { name: 'Base Sepolia', explorer: 'https://sepolia.basescan.org', rpc: 'https://sepolia.base.org' },
  59141: { name: 'Linea Sepolia', explorer: 'https://sepolia.lineascan.build', rpc: 'https://rpc.sepolia.linea.build' },
  7001: { name: 'ZetaChain Athens', explorer: 'https://athens.explorer.zetachain.com', rpc: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public' },
};

// Get Ethereum provider
function getProvider(): ethers.Eip1193Provider | null {
  if (typeof window === 'undefined') return null;
  const ethWindow = window as WindowWithEthereum;
  return ethWindow.ethereum as ethers.Eip1193Provider || null;
}

// Get current chain ID
export async function getCurrentChainId(): Promise<number | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const chainIdHex = await (provider as { request: (args: { method: string }) => Promise<string> }).request({ method: 'eth_chainId' });
    return parseInt(chainIdHex, 16);
  } catch {
    return null;
  }
}

// Get connected address
export async function getConnectedAddress(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const accounts = await (provider as { request: (args: { method: string }) => Promise<string[]> }).request({ method: 'eth_accounts' });
    return accounts?.[0] || null;
  } catch {
    return null;
  }
}

// Switch network
export async function switchNetwork(chainId: number): Promise<boolean> {
  const provider = getProvider();
  if (!provider) return false;

  const chainIdHex = '0x' + chainId.toString(16);

  try {
    await (provider as { request: (args: { method: string; params: unknown[] }) => Promise<unknown> }).request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (error) {
    // Chain not added, try to add it
    const config = CHAIN_CONFIG[chainId];
    if (config) {
      try {
        await (provider as { request: (args: { method: string; params: unknown[] }) => Promise<unknown> }).request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chainIdHex,
            chainName: config.name,
            rpcUrls: [config.rpc],
            blockExplorerUrls: [config.explorer],
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

// Send ETH transfer
export async function sendEthTransfer(
  toAddress: string,
  amountEth: number,
  chainId?: number
): Promise<EvmTransferResult> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('MetaMask not found');
  }

  if (!ethers.isAddress(toAddress)) {
    throw new Error('Invalid Ethereum address');
  }

  if (amountEth <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  // Switch network if needed
  if (chainId) {
    const currentChain = await getCurrentChainId();
    if (currentChain !== chainId) {
      const switched = await switchNetwork(chainId);
      if (!switched) {
        throw new Error(`Failed to switch to chain ${chainId}`);
      }
    }
  }

  try {
    const accounts = await (provider as { request: (args: { method: string }) => Promise<string[]> }).request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts connected');
    }

    const fromAddress = accounts[0];
    const amountWei = ethers.parseEther(amountEth.toString());

    const txHash = await (provider as { request: (args: { method: string; params: unknown[] }) => Promise<string> }).request({
      method: 'eth_sendTransaction',
      params: [{
        from: fromAddress,
        to: toAddress,
        value: '0x' + amountWei.toString(16),
      }],
    });

    const currentChainId = chainId || await getCurrentChainId() || 1;
    const config = CHAIN_CONFIG[currentChainId] || CHAIN_CONFIG[1];
    const explorerUrl = `${config.explorer}/tx/${txHash}`;

    return { txHash, explorerUrl };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User rejected') || 
          error.message.includes('denied') ||
          error.message.includes('cancelled')) {
        throw new Error('Transaction cancelled by user');
      }
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      }
      throw error;
    }
    throw new Error('Failed to send transaction');
  }
}

// Get ETH balance for an address on a specific chain
export async function getEthBalance(
  address: string,
  chainId: number
): Promise<number> {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(`Unknown chain ID: ${chainId}`);
  }

  try {
    const rpcProvider = new ethers.JsonRpcProvider(config.rpc);
    const balance = await rpcProvider.getBalance(address);
    return parseFloat(ethers.formatEther(balance));
  } catch {
    return 0;
  }
}

// Estimate gas for ETH transfer
export async function estimateGas(
  toAddress: string,
  amountEth: number
): Promise<{ gasLimit: bigint; gasPrice: bigint; totalGasEth: number }> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('MetaMask not found');
  }

  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const fromAddress = await signer.getAddress();

    const amountWei = ethers.parseEther(amountEth.toString());

    const gasLimit = await ethersProvider.estimateGas({
      from: fromAddress,
      to: toAddress,
      value: amountWei,
    });

    const feeData = await ethersProvider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);

    const totalGasWei = gasLimit * gasPrice;
    const totalGasEth = parseFloat(ethers.formatEther(totalGasWei));

    return { gasLimit, gasPrice, totalGasEth };
  } catch {
    // Return default estimates
    return {
      gasLimit: BigInt(21000),
      gasPrice: BigInt(0),
      totalGasEth: 0,
    };
  }
}

// Wait for transaction confirmation
export async function waitForConfirmation(
  txHash: string,
  confirmations: number = 1
): Promise<{ success: boolean; blockNumber?: number }> {
  const provider = getProvider();
  if (!provider) {
    return { success: false };
  }

  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const receipt = await ethersProvider.waitForTransaction(txHash, confirmations);
    
    return {
      success: receipt?.status === 1,
      blockNumber: receipt?.blockNumber,
    };
  } catch {
    return { success: false };
  }
}
