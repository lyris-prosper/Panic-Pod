import { create } from 'zustand';
import { Asset, PanicStrategy, ChainExecution, ExecutionLog, WalletBalances, PriceData } from '@/types';

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

  // Real balance data
  balances: WalletBalances | null;
  prices: PriceData | null;
  isLoadingBalances: boolean;
  balanceError: string | null;

  // Balance actions
  setBalances: (balances: WalletBalances | null) => void;
  setPrices: (prices: PriceData | null) => void;
  setLoadingBalances: (loading: boolean) => void;
  setBalanceError: (error: string | null) => void;

  // Assets (computed from balances + prices in Dashboard)
  assets: Asset[];
  totalValue: number;

  // Strategy
  strategy: PanicStrategy | null;
  setStrategy: (config: Partial<PanicStrategy>) => void;

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
      balances: null,
      prices: null,
      strategy: null,
    });
  },

  // Real balance data
  balances: null,
  prices: null,
  isLoadingBalances: false,
  balanceError: null,

  // Balance actions
  setBalances: (balances) => set({ balances }),
  setPrices: (prices) => set({ prices }),
  setLoadingBalances: (loading) => set({ isLoadingBalances: loading }),
  setBalanceError: (error) => set({ balanceError: error }),

  // Assets (will be set by Dashboard from computed balances + prices)
  assets: [],
  totalValue: 0,

  // Strategy
  strategy: null,
  setStrategy: (config) =>
    set((state) => ({
      strategy: { ...state.strategy, ...config } as PanicStrategy
    })),

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
          steps: [{ name: 'Send BTC to safe address', status: 'pending' }],
        },
        {
          chain: 'eth',
          status: 'pending',
          steps: [
            { name: 'Approve ETH', status: 'pending' },
            { name: 'Swap to USDC', status: 'pending' },
            { name: 'Bridge to ZetaChain', status: 'pending' },
          ],
        },
        {
          chain: 'zeta',
          status: 'pending',
          steps: [
            { name: 'Process ZETA assets', status: 'pending' },
            { name: 'Send to safe address', status: 'pending' },
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
