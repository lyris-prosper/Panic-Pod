import { create } from 'zustand';
import { Asset, PanicStrategy, ChainExecution, ExecutionLog, WalletBalances, PriceData, StrategyMode, ExecutionPhase, ExecutionStep } from '@/types';
import { DUST_THRESHOLD_USD } from '@/types';

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
  executionMode: StrategyMode | null;
  executionPhase: ExecutionPhase;
  executions: ChainExecution[];
  executionLogs: ExecutionLog[];
  hasPanicExecuted: boolean; // Track if panic has been executed in current session
  startExecution: (mode: StrategyMode) => void;
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
  executionMode: null,
  executionPhase: 'loading',
  executions: [],
  executionLogs: [],
  hasPanicExecuted: false, // Resets on page refresh
  startExecution: (mode: StrategyMode) => {
    set((state) => {
      const strategy = state.strategy;
      const balances = state.balances;
      const prices = state.prices;

      if (!strategy || !balances || !prices) {
        return state;
      }

      const config = mode === 'escape' ? strategy.escapeConfig : strategy.havenConfig;
      if (!config) {
        return state;
      }

      const executions: ChainExecution[] = [];

      // BTC execution - always transfer to safe address
      executions.push({
        chain: 'btc',
        status: 'pending',
        steps: [{
          name: 'Transfer BTC to Safe Address',
          status: 'pending'
        }]
      });

      // ETH execution - depends on mode
      const ethSteps: ExecutionStep[] = [];

      if (mode === 'escape') {
        // Escape mode: Transfer ETH on each chain separately
        const chains = [
          { name: 'Sepolia', key: 'sepolia' as const },
          { name: 'Base', key: 'base' as const },
        ];

        for (const { name, key } of chains) {
          const balance = balances.eth[key];

          if (balance === 0) {
            ethSteps.push({
              name: `Transfer ${name} ETH`,
              status: 'pending',
              skipReason: 'No balance'
            });
          } else if (!config.evmAddress) {
            ethSteps.push({
              name: `Transfer ${name} ETH`,
              status: 'pending',
              skipReason: 'No EVM address configured'
            });
          } else {
            ethSteps.push({
              name: `Transfer ${name} ETH`,
              status: 'pending'
            });
          }
        }
      } else {
        // Haven mode: Process each chain separately
        // Note: Linea support removed per implementation requirements
        const chains = [
          { name: 'Sepolia', key: 'sepolia' as const },
          { name: 'Base', key: 'base' as const },
        ];

        for (const { name, key } of chains) {
          const balance = balances.eth[key];
          const usdValue = balance * prices.ethereum;

          if (balance === 0) {
            ethSteps.push({
              name: `Process ETH on ${name}`,
              status: 'pending',
              skipReason: 'No balance'
            });
          } else if (usdValue < DUST_THRESHOLD_USD) {
            // Dust amount
            if (config.evmAddress) {
              ethSteps.push({
                name: `Process ETH on ${name}`,
                status: 'pending',
                warning: `Below $${DUST_THRESHOLD_USD} threshold`,
                subSteps: [{
                  name: 'Transfer to EVM fallback',
                  status: 'pending'
                }]
              });
            } else {
              ethSteps.push({
                name: `Process ETH on ${name}`,
                status: 'pending',
                skipReason: `Dust amount (below $${DUST_THRESHOLD_USD})`
              });
            }
          } else {
            // Above threshold - swap via ZetaChain
            ethSteps.push({
              name: `Process ETH on ${name}`,
              status: 'pending',
              subSteps: [
                { name: 'Approve Gateway', status: 'pending' },
                { name: 'Send to ZetaChain', status: 'pending' },
                { name: 'Swap & Withdraw to BTC', status: 'pending' }
              ]
            });
          }
        }
      }

      executions.push({
        chain: 'eth',
        status: 'pending',
        steps: ethSteps
      });

      // ZETA execution - always skip
      executions.push({
        chain: 'zeta',
        status: 'pending',
        steps: [{
          name: 'ZETA Assets',
          status: 'pending',
          skipReason: 'No action required - remains on ZetaChain'
        }]
      });

      return {
        isExecuting: true,
        executionMode: mode,
        executionPhase: 'executing' as ExecutionPhase,
        executions,
        executionLogs: [
          {
            timestamp: new Date().toISOString(),
            message: `${mode === 'escape' ? 'Security Escape' : 'Safe Haven'} evacuation sequence initiated`,
            type: 'info' as const,
          },
        ],
        hasPanicExecuted: true, // Mark that panic has been executed
      };
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
      executionMode: null,
      executionPhase: 'loading',
      executions: [],
      executionLogs: [],
    });
  },
}));
