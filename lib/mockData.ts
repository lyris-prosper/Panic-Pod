import { Asset, ChainExecution, TriggerCondition } from '@/types';

export const mockAssets: Asset[] = [
  {
    chain: 'btc',
    symbol: 'BTC',
    balance: 0.15,
    price: 43250,
    usdValue: 6487.5
  },
  {
    chain: 'eth',
    symbol: 'ETH',
    balance: 2.5,
    price: 2340,
    usdValue: 5850
  },
];

export const mockExecution: ChainExecution[] = [
  {
    chain: 'btc',
    status: 'success',
    steps: [
      {
        name: 'Send BTC',
        status: 'success',
        txHash: '0x123abc...'
      }
    ]
  },
  {
    chain: 'eth',
    status: 'processing',
    steps: [
      { name: 'Approve', status: 'success' },
      { name: 'Swap to USDC', status: 'processing' },
      { name: 'Bridge to ZetaChain', status: 'pending' }
    ]
  }
];

export const mockParsedTriggers: TriggerCondition[] = [
  { asset: 'ETH', operator: 'lt', value: 2000 },
  { asset: 'BTC', operator: 'lt', value: 40000 },
];

export const mockExecutionPlan = {
  btc: 'Transfer BTC directly to safe address',
  eth: 'Swap ETH to USDC → Bridge to ZetaChain',
};
