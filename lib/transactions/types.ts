/**
 * Shared transaction types for all blockchain transaction services
 */

/**
 * Result of a blockchain transaction operation
 */
export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Parameters for ZetaChain Gateway deposit operation
 */
export interface GatewayDepositParams {
  chainId: number;
  amountEth: number;
  btcDestination: string;
}

/**
 * Parameters for ERC20/ZRC20 token approval
 */
export interface ApprovalParams {
  chainId: number;
  amountEth: number;
}

/**
 * Parameters for monitoring cross-chain swap status
 */
export interface SwapMonitorParams {
  depositTxHash: string;
  expectedBtcAmount: bigint;
  btcDestination: string;
}
