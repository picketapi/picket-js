import WalletConnectProvider from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import { IProviderOptions } from "web3modal";

// For now, default to flashbots node
const ETH_MAINNET_RPC_URL = "https://rpc.flashbots.net";

export type ProviderOptionsBehavior = "merge" | "override";

export interface ConnectProviderOptions {
  infuraId?: string;
  rpc?: string;
  chain: string;
  providerOptions?: IProviderOptions;
  behavior?: ProviderOptionsBehavior;
}

export const getProviderOptions = ({
  infuraId,
  rpc = ETH_MAINNET_RPC_URL,
  providerOptions,
  behavior = "merge",
}: ConnectProviderOptions): IProviderOptions => {
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
  };
  if (!providerOptions) return defaultOptions;

  // only override if there are options
  if (behavior === "override") return providerOptions;

  // behavior === "merge"
  return { ...defaultOptions, ...providerOptions };
};
