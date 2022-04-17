import WalletConnectProvider from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
// @ts-ignore no types exist
import ethProvider from "eth-provider";

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
      package: WalletConnectProvider,
      options: {
        infuraId,
        rpc: {
          1: rpc,
        },
      },
    },
    coinbasewallet: {
      package: CoinbaseWalletSDK,
      options: {
        appName: "Picket API",
        // provide infuraId OR rpc
        ...(infuraId ? { infuraId } : { rpc }),
      },
    },
    frame: {
      // @ts-ignore no types exist
      package: ethProvider,
    },
  };

  if (!providerOptions) return defaultOptions;

  // behavior === "merge"
  return { ...defaultOptions, providerOptions };
};
