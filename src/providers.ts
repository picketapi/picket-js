import { IProviderOptions } from "web3modal";

// For now, default to flashbots node
const ETH_MAINNET_RPC_URL = "https://rpc.flashbots.net";

export type ProviderOptionsBehavior = "merge" | "override";

export interface ConnectProviderOptions {
  infuraId?: string;
  rpc?: string;
  providerOptions?: IProviderOptions;
  behavior?: ProviderOptionsBehavior;
}

export const getProviderOptions = ({
  infuraId,
  rpc = ETH_MAINNET_RPC_URL,
  providerOptions,
  behavior = "merge",
}: ConnectProviderOptions) => {
  if (behavior === "override") return providerOptions;

  const defaultOptions = {
    walletconnect: {
      package: () => import("@walletconnect/web3-provider"),
      options: {
        infuraId,
        rpc: {
          1: rpc,
        },
      },
    },
    coinbasewallet: {
      package: () => import("@coinbase/wallet-sdk"),
      options: {
        appName: "Picket API",
        infuraId,
        rpc,
        chainId: 1,
        darkMode: false,
      },
    },
    frame: {
      // @ts-ignore no types exist
      package: () => import("eth-provider"),
    },
  };

  if (!providerOptions) return defaultOptions;

  // behavior === "merge"
  return { ...defaultOptions, providerOptions };
};
