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

export interface PanicStrategy {
  safeAddresses: SafeAddresses;
  triggers: TriggerCondition[];
  triggerLogic: 'AND' | 'OR';
}

export type StepStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface ExecutionStep {
  name: string;
  status: StepStatus;
  txHash?: string;
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
