export interface EvmWalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface EvmWalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

export interface UseEvmWallet extends EvmWalletState, EvmWalletActions {}

export interface BitcoinWalletState {
  address: string | null;
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface BitcoinWalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
}

export interface UseBitcoinWallet extends BitcoinWalletState, BitcoinWalletActions {}

// EIP-1193 Provider types
export interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

export interface WindowWithEthereum extends Window {
  ethereum?: EIP1193Provider;
}

// Xverse/Bitcoin Wallet Standard types
export interface BitcoinAddress {
  address: string;
  publicKey: string;
  purpose: 'payment' | 'ordinals' | 'stacks';
  addressType: 'p2tr' | 'p2wpkh' | 'p2sh' | 'stacks';
}

export interface GetAddressResponse {
  addresses: BitcoinAddress[];
}

export interface BitcoinProvider {
  request: (method: string, params?: unknown) => Promise<unknown>;
}

export interface WindowWithBitcoin extends Window {
  btc?: BitcoinProvider;
  XverseProviders?: {
    BitcoinProvider?: BitcoinProvider;
  };
}
