import { create } from 'zustand';
import { Asset, PanicStrategy, ChainExecution, ExecutionLog } from '@/types';
import { mockAssets } from '@/lib/mockData';

interface WalletState {
  // EVM (MetaMask)
  evmAddress: string | null;
  evmChainId: number | null;
  isEvmConnected: boolean;

  // Bitcoin (Xverse)
  btcAddress: string | null;
  isBtcConnected: boolean;

  // Combined check
  isFullyConnected: boolean;
}

interface StoreState extends WalletState {
  // Wallet actions
  setEvmWallet: (address: string | null, chainId: number | null) => void;
  setBtcWallet: (address: string | null) => void;
  clearWallets: () => void;

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

export const useStore = create<StoreState>((set) => ({
  // Wallet state
  evmAddress: null,
  evmChainId: null,
  isEvmConnected: false,
  btcAddress: null,
  isBtcConnected: false,
  isFullyConnected: false,

  // Wallet actions
  setEvmWallet: (address, chainId) => {
    set((state) => {
      const isEvmConnected = !!address;
      const isFullyConnected = isEvmConnected && state.isBtcConnected;
      return {
        evmAddress: address,
        evmChainId: chainId,
        isEvmConnected,
        isFullyConnected,
        // Load mock assets when both wallets connected
        assets: isFullyConnected ? mockAssets : state.assets,
        totalValue: isFullyConnected
          ? mockAssets.reduce((sum, asset) => sum + asset.usdValue, 0)
          : state.totalValue,
      };
    });
  },
  setBtcWallet: (address) => {
    set((state) => {
      const isBtcConnected = !!address;
      const isFullyConnected = state.isEvmConnected && isBtcConnected;
      return {
        btcAddress: address,
        isBtcConnected,
        isFullyConnected,
        // Load mock assets when both wallets connected
        assets: isFullyConnected ? mockAssets : state.assets,
        totalValue: isFullyConnected
          ? mockAssets.reduce((sum, asset) => sum + asset.usdValue, 0)
          : state.totalValue,
      };
    });
  },
  clearWallets: () => {
    set({
      evmAddress: null,
      evmChainId: null,
      isEvmConnected: false,
      btcAddress: null,
      isBtcConnected: false,
      isFullyConnected: false,
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
