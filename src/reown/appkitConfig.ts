import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { arbitrum,base,bsc,mainnet,optimism,polygon } from "@reown/appkit/networks";
import { cookieStorage,createStorage,http } from "@wagmi/core";
import { type Config } from "wagmi";

export const projectId = process.env.NEXT_PUBLIC_APPKIT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_APPKIT_PROJECT_ID is not defined");
}

export const networks = [mainnet, arbitrum, polygon, base, optimism, bsc];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
  },
});

export const wagmiConfig =
  (wagmiAdapter.wagmiConfig as Config);
