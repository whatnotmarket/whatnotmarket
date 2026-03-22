"use client";

import {
createContext,
useCallback,
useContext,
useEffect,
useMemo,
useRef,
useState,
type ReactNode,
} from "react";

type ProviderKind = "walletconnect" | "injected";
type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

type SendTransactionInput = {
  from: string;
  to: string;
  valueHex: string;
};

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  disconnect?: () => Promise<void>;
};

type WalletContextType = {
  status: WalletStatus;
  providerKind: ProviderKind | null;
  address: string | null;
  chainId: string | null;
  error: string | null;
  connect: (kind?: ProviderKind) => Promise<{ address: string; chainId: string }>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (input: SendTransactionInput) => Promise<string>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

async function createWalletConnectProvider() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("WalletConnect is not configured.");
  }

  const appUrl =
    (typeof window !== "undefined" ? window.location.origin : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const EthereumProvider = (await import("@walletconnect/ethereum-provider")).default;
  const provider = await EthereumProvider.init({
    projectId,
    showQrModal: true,
    chains: [1],
    optionalChains: [1, 137, 10, 8453, 56],
    metadata: {
      name: "OpenlyMarket",
      description: "OpenlyMarket wallet auth and escrow payments",
      url: appUrl,
      icons: [`${appUrl}/images/ico/faviconbianco.ico`],
    },
    qrModalOptions: {
      themeMode: "dark",
      enableExplorer: true,
      mobileWallets: [
        {
          id: "metamask",
          name: "MetaMask",
          links: {
            native: "metamask://",
            universal: "https://metamask.app.link/wc?uri=",
          },
        },
        {
          id: "trust",
          name: "Trust Wallet",
          links: {
            native: "trust://",
            universal: "https://link.trustwallet.com/wc?uri=",
          },
        },
        {
          id: "rainbow",
          name: "Rainbow",
          links: {
            native: "rainbow://",
            universal: "https://rnbwapp.com/wc?uri=",
          },
        },
      ],
    },
  });

  await provider.enable();
  return provider as unknown as Eip1193Provider;
}

function normalizeAddress(input: unknown) {
  return typeof input === "string" ? input.toLowerCase() : null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const providerRef = useRef<Eip1193Provider | null>(null);
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [providerKind, setProviderKind] = useState<ProviderKind | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStatus("disconnected");
    setProviderKind(null);
    setAddress(null);
    setChainId(null);
    setError(null);
  }, []);

  const bindProviderState = useCallback(async (provider: Eip1193Provider) => {
    const accounts = (await provider.request({ method: "eth_accounts" })) as unknown[];
    const currentAddress = normalizeAddress(accounts[0]);
    const currentChain = (await provider.request({ method: "eth_chainId" })) as string;

    setAddress(currentAddress);
    setChainId(currentChain);
    setStatus(currentAddress ? "connected" : "disconnected");

    return {
      address: currentAddress,
      chainId: currentChain,
    };
  }, []);

  const connect = useCallback(async (kind: ProviderKind = "walletconnect") => {
    setStatus("connecting");
    setError(null);

    try {
      let provider: Eip1193Provider | null = null;
      const resolvedKind: ProviderKind = kind;

      if (kind === "walletconnect") {
        provider = await createWalletConnectProvider();
      } else {
        const injected = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
        if (!injected) {
          throw new Error("Injected wallet not available.");
        }
        provider = injected;
      }

      if (!provider) {
        throw new Error("Wallet provider unavailable");
      }

      await provider.request({ method: "eth_requestAccounts" });

      providerRef.current = provider;
      setProviderKind(resolvedKind);
      const connected = await bindProviderState(provider);
      if (!connected.address) {
        throw new Error("No wallet account found.");
      }
      return connected as { address: string; chainId: string };
    } catch (connectError) {
      // Fallback from WalletConnect to injected when QR flow is unavailable.
      if (kind === "walletconnect") {
        const injected = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
        if (injected) {
          providerRef.current = injected;
          setProviderKind("injected");
          await injected.request({ method: "eth_requestAccounts" });
          const connected = await bindProviderState(injected);
          if (!connected.address) {
            throw new Error("No wallet account found.");
          }
          return connected as { address: string; chainId: string };
        }
      }

      setStatus("error");
      setError(connectError instanceof Error ? connectError.message : "Wallet connection failed");
      throw connectError instanceof Error ? connectError : new Error("Wallet connection failed");
    }
  }, [bindProviderState]);

  const disconnect = useCallback(async () => {
    if (providerRef.current?.disconnect) {
      try {
        await providerRef.current.disconnect();
      } catch {
        // Ignore provider-level disconnect errors.
      }
    }
    providerRef.current = null;
    resetState();
  }, [resetState]);

  const signMessage = useCallback(async (message: string) => {
    if (!providerRef.current) {
      throw new Error("Wallet not connected");
    }

    const accounts = (await providerRef.current.request({ method: "eth_accounts" })) as unknown[];
    const signerAddress = normalizeAddress(accounts[0]);
    if (!signerAddress) {
      throw new Error("Wallet not connected");
    }

    const signature = await providerRef.current.request({
      method: "personal_sign",
      params: [message, signerAddress],
    });

    if (typeof signature !== "string") {
      throw new Error("Invalid signature response");
    }

    return signature;
  }, []);

  const sendTransaction = useCallback(async (input: SendTransactionInput) => {
    if (!providerRef.current) {
      throw new Error("Wallet not connected");
    }

    const txHash = await providerRef.current.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: input.from,
          to: input.to,
          value: input.valueHex,
        },
      ],
    });

    if (typeof txHash !== "string") {
      throw new Error("Invalid transaction response");
    }

    return txHash;
  }, []);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider?.on) return;

    const handleAccountsChanged = (accountsRaw: unknown) => {
      const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
      const nextAddress = normalizeAddress(accounts[0]);
      setAddress(nextAddress);
      setStatus(nextAddress ? "connected" : "disconnected");
    };

    const handleChainChanged = (chain: unknown) => {
      if (typeof chain === "string") {
        setChainId(chain);
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [providerKind]);

  const value = useMemo<WalletContextType>(
    () => ({
      status,
      providerKind,
      address,
      chainId,
      error,
      connect,
      disconnect,
      signMessage,
      sendTransaction,
    }),
    [address, chainId, connect, disconnect, error, providerKind, sendTransaction, signMessage, status]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

