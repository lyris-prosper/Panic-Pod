/**
 * ZetaChain Gateway integration service
 * Handles cross-chain swaps via ZetaChain Gateway
 */

import { ethers } from 'ethers';
import { WindowWithEthereum } from '@/types/wallet';
import { TransactionResult, GatewayDepositParams, ApprovalParams } from './types';
import { getCurrentChainId, switchNetwork } from '../evmService';
import { CHAIN_ID_MAP } from '@/config/chains';

// ZetaChain Gateway contract addresses (verified from zeta-chain/protocol-contracts-evm)
export const GATEWAY_ADDRESSES: Record<number, string> = {
  11155111: '0x0c487a766110c85d301d96e33579c5b317fa4995', // Ethereum Sepolia
  84532: '0x0c487a766110c85d301d96e33579c5b317fa4995', // Base Sepolia
};

// ZRC20 token addresses on ZetaChain Athens Testnet
export const ZRC20_ADDRESSES: Record<number, string> = {
  11155111: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0', // ETH.Sepolia (verified)
  84532: '0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD', // ETH.Base (TODO: Verify this address)
};

// PanicPodSwap contract address on ZetaChain Athens
export const PANIC_POD_SWAP_ADDRESS =
  '0x3Dacd9EF40B405eDFa9C4FBaA7c846DE40bc3c66';

// ERC20 ABI for approve function
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

// ZetaChain Gateway ABI for depositAndCall
const GATEWAY_ABI = [
  'function depositAndCall(address receiver, uint256 amount, address asset, bytes calldata message) external',
];

/**
 * Get MetaMask provider
 */
function getProvider(): ethers.BrowserProvider | null {
  if (typeof window === 'undefined') return null;
  const ethWindow = window as WindowWithEthereum;
  if (!ethWindow.ethereum) return null;
  return new ethers.BrowserProvider(ethWindow.ethereum as ethers.Eip1193Provider);
}

/**
 * Approve Gateway contract to spend ZRC20 tokens
 *
 * @param params - Approval parameters
 * @returns TransactionResult with txHash or error
 */
export async function approveGateway(
  params: ApprovalParams & { zrc20Address: string; gatewayAddress: string }
): Promise<TransactionResult> {
  const { chainId, amountEth, zrc20Address, gatewayAddress } = params;

  try {
    const provider = getProvider();
    if (!provider) {
      return {
        success: false,
        error: 'MetaMask not found',
      };
    }

    // Switch network if needed
    const currentChain = await getCurrentChainId();
    if (currentChain !== chainId) {
      const switched = await switchNetwork(chainId);
      if (!switched) {
        const chainName = CHAIN_ID_MAP[chainId]?.name || `Chain ${chainId}`;
        return {
          success: false,
          error: `Failed to switch to ${chainName}`,
        };
      }
      // Small delay after network switch
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Setup contract
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(zrc20Address, ERC20_ABI, signer);

    // Check allowance
    const userAddress = await signer.getAddress();
    const currentAllowance = await contract.allowance(
      userAddress,
      gatewayAddress
    );
    const amountWei = ethers.parseEther(amountEth.toString());

    if (currentAllowance >= amountWei) {
      return {
        success: true,
        txHash: '',
        error: 'Approval already sufficient',
      };
    }

    // Approve unlimited amount for better UX (no need to approve again)
    const maxUint256 = ethers.MaxUint256;
    const tx = await contract.approve(gatewayAddress, maxUint256);
    const receipt = await tx.wait();

    if (!receipt) {
      return {
        success: false,
        error: 'Transaction confirmation failed',
      };
    }

    return {
      success: receipt.status === 1,
      txHash: receipt.hash,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('User rejected') ||
        error.message.includes('denied') ||
        error.message.includes('cancelled')
      ) {
        return {
          success: false,
          error: 'Approval cancelled by user',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Approval failed',
    };
  }
}

/**
 * Deposit tokens to ZetaChain Gateway with BTC destination message
 *
 * @param params - Gateway deposit parameters
 * @returns TransactionResult with txHash or error
 */
export async function depositToGateway(
  params: GatewayDepositParams & { zrc20Address: string; gatewayAddress: string }
): Promise<TransactionResult> {
  const { chainId, amountEth, btcDestination, zrc20Address, gatewayAddress } =
    params;

  try {
    const provider = getProvider();
    if (!provider) {
      return {
        success: false,
        error: 'MetaMask not found',
      };
    }

    // Ensure correct network
    const currentChain = await getCurrentChainId();
    if (currentChain !== chainId) {
      const switched = await switchNetwork(chainId);
      if (!switched) {
        const chainName = CHAIN_ID_MAP[chainId]?.name || `Chain ${chainId}`;
        return {
          success: false,
          error: `Failed to switch to ${chainName}`,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Setup Gateway contract
    const signer = await provider.getSigner();
    const gateway = new ethers.Contract(gatewayAddress, GATEWAY_ABI, signer);

    // Encode message for PanicPodSwap
    // Message format: abi.encode(string btcDestination)
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const message = abiCoder.encode(['string'], [btcDestination]);

    // Convert amount to wei
    const amountWei = ethers.parseEther(amountEth.toString());

    // Call depositAndCall
    const tx = await gateway.depositAndCall(
      PANIC_POD_SWAP_ADDRESS, // receiver on ZetaChain
      amountWei, // amount
      zrc20Address, // asset (ZRC20 token)
      message // encoded BTC address
    );

    const receipt = await tx.wait();

    if (!receipt) {
      return {
        success: false,
        error: 'Transaction confirmation failed',
      };
    }

    return {
      success: receipt.status === 1,
      txHash: receipt.hash,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('User rejected') ||
        error.message.includes('denied') ||
        error.message.includes('cancelled')
      ) {
        return {
          success: false,
          error: 'Deposit cancelled by user',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Deposit failed',
    };
  }
}

/**
 * Execute full ZetaChain cross-chain swap (approve + deposit + monitor)
 *
 * @param chainName - Name of the source chain ('Sepolia', 'Base')
 * @param amountEth - Amount to swap in ETH
 * @param btcDestination - Destination BTC address
 * @returns Array of TransactionResults for each step
 */
export async function executeZetaChainSwap(
  chainName: string,
  amountEth: number,
  btcDestination: string
): Promise<TransactionResult[]> {
  const results: TransactionResult[] = [];

  try {
    // Map chain name to chainId
    const chainId = getChainIdFromName(chainName);

    if (!chainId) {
      results.push({
        success: false,
        error: `Unsupported chain: ${chainName}`,
      });
      return results;
    }

    const zrc20Address = ZRC20_ADDRESSES[chainId];
    const gatewayAddress = GATEWAY_ADDRESSES[chainId];

    if (!zrc20Address || !gatewayAddress) {
      results.push({
        success: false,
        error: `Missing contract addresses for chain ${chainId}`,
      });
      return results;
    }

    // Step 1: Approve Gateway
    const approvalResult = await approveGateway({
      chainId,
      amountEth,
      zrc20Address,
      gatewayAddress,
    });
    results.push(approvalResult);

    if (!approvalResult.success) {
      return results; // Stop if approval fails
    }

    // Step 2: Deposit to Gateway
    const depositResult = await depositToGateway({
      chainId,
      amountEth,
      btcDestination,
      zrc20Address,
      gatewayAddress,
    });
    results.push(depositResult);

    if (!depositResult.success) {
      return results; // Stop if deposit fails
    }

    // Step 3: Monitor swap (simple processing state)
    // In production, this would poll ZetaChain or listen to events
    // For MVP, we just mark as successful since the deposit went through
    results.push({
      success: true,
      txHash: depositResult.txHash, // Same as deposit tx
      error: undefined,
    });

    return results;
  } catch (error) {
    results.push({
      success: false,
      error: error instanceof Error ? error.message : 'Swap failed',
    });
    return results;
  }
}

/**
 * Map chain name to chain ID
 */
function getChainIdFromName(chainName: string): number | null {
  const name = chainName.toLowerCase();
  if (name.includes('sepolia') && !name.includes('base')) return 11155111;
  if (name.includes('base')) return 84532;
  return null;
}
