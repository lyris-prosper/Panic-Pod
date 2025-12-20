/**
 * EVM transaction orchestration service
 * Handles EVM chain transfers via MetaMask with network switching
 */

import { ethers } from 'ethers';
import { WindowWithEthereum } from '@/types/wallet';
import { TransactionResult } from './types';
import { EVM_GAS_BUFFER, calculateMaxSendAmount } from '../gasEstimation';
import { switchNetwork, getCurrentChainId } from '../evmService';
import { CHAIN_ID_MAP } from '@/config/chains';

/**
 * Execute an EVM transfer via MetaMask
 *
 * @param toAddress - Destination Ethereum address
 * @param amountEth - Amount to send in ETH
 * @param chainId - Target chain ID (11155111 for Sepolia, 84532 for Base Sepolia)
 * @returns TransactionResult with txHash or error
 */
export async function executeEvmTransfer(
  toAddress: string,
  amountEth: number,
  chainId: number
): Promise<TransactionResult> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Window not available',
    };
  }

  const ethWindow = window as WindowWithEthereum;
  const provider = ethWindow.ethereum;

  if (!provider) {
    return {
      success: false,
      error: 'MetaMask not found. Please install MetaMask.',
    };
  }

  if (!toAddress) {
    return {
      success: false,
      error: 'No destination address provided',
    };
  }

  // Validate Ethereum address
  if (!ethers.isAddress(toAddress)) {
    return {
      success: false,
      error: 'Invalid Ethereum address format',
    };
  }

  try {
    // Switch to correct network if needed
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
      // Add small delay after network switch to ensure it completes
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Calculate maximum sendable amount after gas buffer
    const maxSendable = calculateMaxSendAmount(amountEth, 'eth');

    if (maxSendable <= 0) {
      return {
        success: false,
        error: `Insufficient balance to cover gas. Need at least ${EVM_GAS_BUFFER} ETH for gas.`,
      };
    }

    // Get connected accounts
    const accounts = (await provider.request({
      method: 'eth_accounts',
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts connected',
      };
    }

    const fromAddress = accounts[0];

    // Convert ETH to wei
    const amountWei = ethers.parseEther(maxSendable.toString());

    // Create transaction
    const txHash = (await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: fromAddress,
          to: toAddress,
          value: '0x' + amountWei.toString(16),
        },
      ],
    })) as string;

    return {
      success: true,
      txHash,
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
      error: 'Failed to send ETH transaction',
    };
  }
}
