"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import BtcIcon from "cryptocurrency-icons/svg/color/btc.svg";
import EthIcon from "cryptocurrency-icons/svg/color/eth.svg";
import UsdcIcon from "cryptocurrency-icons/svg/color/usdc.svg";
import UsdtIcon from "cryptocurrency-icons/svg/color/usdt.svg";
import SolIcon from "cryptocurrency-icons/svg/color/sol.svg";
import TrxIcon from "cryptocurrency-icons/svg/color/trx.svg";
import LtcIcon from "cryptocurrency-icons/svg/color/ltc.svg";
import XmrIcon from "cryptocurrency-icons/svg/color/xmr.svg";
import BnbIcon from "cryptocurrency-icons/svg/color/bnb.svg";

export const CRYPTO_CURRENCIES = [
  { code: "BTC", name: "Bitcoin", Icon: BtcIcon, color: "#F7931A" },
  { code: "ETH", name: "Ethereum", Icon: EthIcon, color: "#627EEA" },
  { code: "USDC", name: "USD Coin", Icon: UsdcIcon, color: "#2775CA" },
  { code: "USDT", name: "Tether", Icon: UsdtIcon, color: "#26A17B" },
  { code: "SOL", name: "Solana", Icon: SolIcon, color: "#14F195" }, // Using a vibrant green/purple mix, but green is safer for text
  { code: "TRX", name: "Tron (TRC-20)", Icon: TrxIcon, color: "#FF0013" },
  { code: "LTC", name: "Litecoin", Icon: LtcIcon, color: "#888888" },
  { code: "XMR", name: "Monero", Icon: XmrIcon, color: "#FF6600" },
  { code: "BNB", name: "BNB", Icon: BnbIcon, color: "#F3BA2F" },
];

type CryptoContextType = {
  selectedCrypto: string;
  setSelectedCrypto: (code: string) => void;
  selectedCryptoData: typeof CRYPTO_CURRENCIES[0];
  isSelectorOpen: boolean;
  setIsSelectorOpen: (isOpen: boolean) => void;
};

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [selectedCrypto, setSelectedCrypto] = useState("USDC");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const selectedCryptoData = CRYPTO_CURRENCIES.find(c => c.code === selectedCrypto) || CRYPTO_CURRENCIES[2]; // Default to USDC

  return (
    <CryptoContext.Provider value={{ selectedCrypto, setSelectedCrypto, selectedCryptoData, isSelectorOpen, setIsSelectorOpen }}>
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error("useCrypto must be used within a CryptoProvider");
  }
  return context;
}
