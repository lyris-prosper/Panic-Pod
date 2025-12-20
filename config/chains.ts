export interface ChainConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const ETHEREUM_SEPOLIA: ChainConfig = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  name: 'Ethereum Sepolia',
  rpcUrl: 'https://rpc.sepolia.org',
  blockExplorer: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const BASE_SEPOLIA: ChainConfig = {
  chainId: 84532,
  chainIdHex: '0x14a34',
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const LINEA_SEPOLIA: ChainConfig = {
  chainId: 59141,
  chainIdHex: '0xe705',
  name: 'Linea Sepolia',
  rpcUrl: 'https://rpc.sepolia.linea.build',
  blockExplorer: 'https://sepolia.lineascan.build',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const ZETACHAIN_TESTNET: ChainConfig = {
  chainId: 7001,
  chainIdHex: '0x1b59',
  name: 'ZetaChain Testnet',
  rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  blockExplorer: 'https://athens.explorer.zetachain.com',
  nativeCurrency: {
    name: 'Zeta',
    symbol: 'ZETA',
    decimals: 18,
  },
};

// Bitcoin Signet reference
export const BITCOIN_SIGNET = {
  name: 'Bitcoin Signet',
  symbol: 'BTC',
  network: 'signet',
  blockExplorer: 'https://mempool.space/signet',
} as const;

export const SUPPORTED_EVM_CHAINS = [
  ETHEREUM_SEPOLIA,
  BASE_SEPOLIA,
  LINEA_SEPOLIA,
  ZETACHAIN_TESTNET,
] as const;

export const CHAIN_ID_MAP: Record<number, ChainConfig> = {
  [ETHEREUM_SEPOLIA.chainId]: ETHEREUM_SEPOLIA,
  [BASE_SEPOLIA.chainId]: BASE_SEPOLIA,
  [LINEA_SEPOLIA.chainId]: LINEA_SEPOLIA,
  [ZETACHAIN_TESTNET.chainId]: ZETACHAIN_TESTNET,
};
