export interface Network {
  id: string;
  name: string;
  type: "EVM" | "UTXO";
  chainId: string;
  explorerUrl: string;
  requiresMemo: boolean;
}

export interface Currency {
  id: string;
  symbol: string;
  decimals: number;
  networkId: string;
  contractAddress?: string;
  isStablecoin: boolean;
}

export const NETWORKS: Network[] = [
  {
    id: "ethereum-mainnet",
    name: "Ethereum",
    type: "EVM",
    chainId: "1",
    explorerUrl: "https://etherscan.io",
    requiresMemo: false,
  },
  {
    id: "polygon-mainnet",
    name: "Polygon",
    type: "EVM",
    chainId: "137",
    explorerUrl: "https://polygonscan.com",
    requiresMemo: false,
  },
  {
    id: "base-mainnet",
    name: "Base",
    type: "EVM",
    chainId: "8453",
    explorerUrl: "https://basescan.org",
    requiresMemo: false,
  },
  {
    id: "bitcoin-mainnet",
    name: "Bitcoin",
    type: "UTXO",
    chainId: "btc",
    explorerUrl: "https://mempool.space",
    requiresMemo: false,
  },
];

export const CURRENCIES: Currency[] = [
  {
    id: "USDC-ETH",
    symbol: "USDC",
    decimals: 6,
    networkId: "ethereum-mainnet",
    contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    isStablecoin: true,
  },
  {
    id: "USDT-ETH",
    symbol: "USDT",
    decimals: 6,
    networkId: "ethereum-mainnet",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    isStablecoin: true,
  },
  {
    id: "ETH-ETH",
    symbol: "ETH",
    decimals: 18,
    networkId: "ethereum-mainnet",
    isStablecoin: false,
  },
  {
    id: "USDC-POLY",
    symbol: "USDC",
    decimals: 6,
    networkId: "polygon-mainnet",
    contractAddress: "0x3c499c542cbb5e34904b1d7520e97bb3532217f9",
    isStablecoin: true,
  },
  {
    id: "BTC-BTC",
    symbol: "BTC",
    decimals: 8,
    networkId: "bitcoin-mainnet",
    isStablecoin: false,
  },
];

export function getCurrenciesForNetwork(networkId: string) {
  return CURRENCIES.filter((c) => c.networkId === networkId);
}
