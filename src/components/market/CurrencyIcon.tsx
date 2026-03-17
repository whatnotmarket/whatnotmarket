import Image from "next/image";
import { CRYPTO_CURRENCIES } from "@/contexts/CryptoContext";

export const CurrencyIcon = ({ currency }: { currency?: string }) => {
  if (!currency) return null;
  
  const iconData = CRYPTO_CURRENCIES.find(c => c.code === currency);
  if (!iconData) return null;

  return (
    <Image 
      src={iconData.Icon} 
      alt={currency} 
      width={20} 
      height={20} 
      className="rounded-full"
    />
  );
};
