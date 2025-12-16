export type ChainType = 'btc' | 'eth' | 'sol';

export interface Asset {
  chain: ChainType;
  symbol: string;
  balance: number;
  price: number;
  usdValue: number;
}

export interface SafeAddresses {
  btc: string;
  evm?: string;
  solana?: string;
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
