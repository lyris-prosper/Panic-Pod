/**
 * Execution engine for blockchain transactions
 * Thin wrapper around modular transaction services
 */

import { executeBtcTransfer } from './transactions/btcTransaction';
import { executeEvmTransfer as executeEvmTx } from './transactions/evmTransaction';
import { executeZetaChainSwap as executeZetaSwap } from './transactions/zetaGateway';
import { getCurrentChainId } from './evmService';

/**
 * Execute Bitcoin transfer via Xverse wallet
 *
 * @param toAddress - Destination Bitcoin address
 * @param amountBtc - Amount to send in BTC
 * @returns Transaction hash
 * @throws Error if transaction fails
 */
export async function executeBitcoinTransfer(
  toAddress: string,
  amountBtc: number
): Promise<string> {
  const result = await executeBtcTransfer(toAddress, amountBtc);
  if (!result.success) {
    throw new Error(result.error || 'BTC transfer failed');
  }
  return result.txHash!;
}

/**
 * Execute EVM transfer via MetaMask
 *
 * @param toAddress - Destination Ethereum address
 * @param amountEth - Amount to send in ETH
 * @param chainId - Optional chain ID to switch to before transfer
 * @returns Transaction hash
 * @throws Error if transaction fails
 */
export async function executeEvmTransfer(
  toAddress: string,
  amountEth: number,
  chainId?: number
): Promise<string> {
  // If chainId not specified, use current chain
  const targetChainId = chainId || (await getCurrentChainId()) || 11155111;
  const result = await executeEvmTx(toAddress, amountEth, targetChainId);
  if (!result.success) {
    throw new Error(result.error || 'EVM transfer failed');
  }
  return result.txHash!;
}

/**
 * Execute ZetaChain cross-chain swap
 *
 * This function is called per sub-step (Approve, Send, Swap) and returns
 * the appropriate transaction hash for each step
 *
 * @param chainName - Name of the source chain ('Sepolia', 'Base')
 * @param stepName - Name of the sub-step ('Approve Gateway', 'Send to ZetaChain', 'Swap & Withdraw to BTC')
 * @param btcDestination - Destination BTC address
 * @returns Transaction hash for the specific step
 * @throws Error if transaction fails
 */
export async function executeZetaChainSwap(
  chainName: string,
  stepName: string,
  btcDestination: string
): Promise<string> {
  // Determine which sub-step we're executing
  const isApprove = stepName.toLowerCase().includes('approve');
  const isSend = stepName.toLowerCase().includes('send');
  const isSwap = stepName.toLowerCase().includes('swap');

  // For now, use a reasonable test amount
  // TODO: Get actual balance from store context
  const amountEth = 0.01;

  // Execute the full swap flow
  const results = await executeZetaSwap(chainName, amountEth, btcDestination);

  // Return appropriate result based on step
  if (isApprove && results[0]) {
    if (!results[0].success) {
      throw new Error(results[0].error || 'Approval failed');
    }
    return results[0].txHash || '';
  }

  if (isSend && results[1]) {
    if (!results[1].success) {
      throw new Error(results[1].error || 'Deposit failed');
    }
    return results[1].txHash || '';
  }

  if (isSwap && results[2]) {
    if (!results[2].success) {
      throw new Error(results[2].error || 'Swap monitoring failed');
    }
    return results[2].txHash || '';
  }

  throw new Error('Invalid step type');
}

// Re-export helper functions from evmService
export { waitForConfirmation as waitForEvmConfirmation } from './evmService';
