export type ChainType = 'btc' | 'eth-sepolia' | 'base-sepolia' | 'linea-sepolia' | 'zeta' | 'eth';

export interface ChainBalance {
  chainName: string;
  balance: number;
  usdValue: number;
}

export interface AssetBalance {
  chain: ChainType;
  symbol: string;
  balance: number;
  price: number;
  usdValue: number;
}

export interface AggregatedAsset {
  symbol: 'BTC' | 'ETH' | 'ZETA';
  totalBalance: number;
  totalUsdValue: number;
  breakdown: AssetBalance[];
}

export interface Asset {
  chain: ChainType;
  symbol: string;
  balance: number;
  price: number;
  usdValue: number;
  breakdown?: ChainBalance[];
}

export interface SafeAddresses {
  btc: string;
  evm?: string;
}

export interface TriggerCondition {
  asset: string;
  operator: 'lt' | 'gt';
  value: number;
}

// Strategy mode enumeration
export type StrategyMode = 'escape' | 'haven';

// Security Escape configuration
export interface EscapeConfig {
  btcAddress: string;      // Required
  evmAddress?: string;     // Optional
}

// Safe Haven configuration
export interface HavenConfig {
  btcAddress: string;      // Required, defaults to connected BTC wallet
  evmAddress?: string;     // Optional, for dust amounts under $50
  aiPrompt: string;        // Natural language trigger description
  triggers: TriggerCondition[];  // Parsed conditions
  triggerLogic: 'AND' | 'OR';
}

// Dust threshold constant
export const DUST_THRESHOLD_USD = 50;

export interface PanicStrategy {
  escapeConfig?: EscapeConfig;   // Security Escape configuration
  havenConfig?: HavenConfig;     // Safe Haven configuration
}

export type StepStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface ExecutionStep {
  name: string;
  status: StepStatus;
  txHash?: string;
  subSteps?: ExecutionStep[];    // For nested steps (e.g., multi-chain swaps)
  skipReason?: string;            // Why this step was skipped
  warning?: string;               // Warnings about dust/gas
}

export interface ChainExecution {
  chain: ChainType;
  status: StepStatus;
  steps: ExecutionStep[];
}

export interface ExecutionLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface ZRC20Token {
  symbol: string;
  balance: number;
  address: string;
  usdValue?: number;
}

export interface WalletBalances {
  btc: number;
  eth: {
    sepolia: number;
    base: number;
    linea: number;
    total: number;
  };
  zeta: {
    native: number;
    zrc20: ZRC20Token[];
    total: number;
  };
}

export interface PriceData {
  bitcoin: number;
  ethereum: number;
  zetachain: number;
}

// Execution action types for preview
export type ExecutionAction = 'transfer' | 'swap' | 'skip';
export type ExecutionPhase = 'loading' | 'preview' | 'executing' | 'complete';

export interface ExecutionPreviewItem {
  chain: string;
  asset: string;
  balance: number;
  usdValue: number;
  action: ExecutionAction;
  destination: string;
  estimatedReceive?: number;
  skipReason?: string;
  warning?: string;
}
