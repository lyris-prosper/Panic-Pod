import { create } from 'zustand';
import { Asset, PanicStrategy, ChainExecution, ExecutionLog } from '@/types';
import { mockAssets } from '@/lib/mockData';

interface StoreState {
  // Wallet
  isConnected: boolean;
  walletAddress: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;

  // Assets
  assets: Asset[];
  totalValue: number;

  // Strategy
  strategy: PanicStrategy | null;
  setStrategy: (strategy: PanicStrategy) => void;

  // Execution
  isExecuting: boolean;
  executions: ChainExecution[];
  executionLogs: ExecutionLog[];
  startExecution: () => void;
  updateExecution: (chainIndex: number, execution: ChainExecution) => void;
  addLog: (log: ExecutionLog) => void;
  resetExecution: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Wallet
  isConnected: false,
  walletAddress: null,
  connectWallet: () => {
    // Mock wallet connection
    set({
      isConnected: true,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      assets: mockAssets,
      totalValue: mockAssets.reduce((sum, asset) => sum + asset.usdValue, 0),
    });
  },
  disconnectWallet: () => {
    set({
      isConnected: false,
      walletAddress: null,
      assets: [],
      totalValue: 0,
      strategy: null,
    });
  },

  // Assets
  assets: [],
  totalValue: 0,

  // Strategy
  strategy: null,
  setStrategy: (strategy) => set({ strategy }),

  // Execution
  isExecuting: false,
  executions: [],
  executionLogs: [],
  startExecution: () => {
    set({
      isExecuting: true,
      executions: [
        {
          chain: 'btc',
          status: 'pending',
          steps: [{ name: 'Send BTC', status: 'pending' }],
        },
        {
          chain: 'eth',
          status: 'pending',
          steps: [
            { name: 'Approve', status: 'pending' },
            { name: 'Swap to USDC', status: 'pending' },
            { name: 'Bridge to ZetaChain', status: 'pending' },
          ],
        },
        {
          chain: 'sol',
          status: 'pending',
          steps: [
            { name: 'Approve', status: 'pending' },
            { name: 'Swap to USDC', status: 'pending' },
            { name: 'Bridge to ZetaChain', status: 'pending' },
          ],
        },
      ],
      executionLogs: [
        {
          timestamp: new Date().toISOString(),
          message: 'Evacuation sequence initiated',
          type: 'info',
        },
      ],
    });
  },
  updateExecution: (chainIndex, execution) => {
    set((state) => {
      const newExecutions = [...state.executions];
      newExecutions[chainIndex] = execution;
      return { executions: newExecutions };
    });
  },
  addLog: (log) => {
    set((state) => ({
      executionLogs: [...state.executionLogs, log],
    }));
  },
  resetExecution: () => {
    set({
      isExecuting: false,
      executions: [],
      executionLogs: [],
    });
  },
}));
