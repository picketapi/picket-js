import WalletConnectProvider from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import { IProviderOptions } from "web3modal";

// defaults if none are provided
// this should be needed
const ETH_MAINNET_CHAIN_ID = 1;
const ETH_MAINNET_RPC_URL = "https://rpc.flashbots.net";

export type ProviderOptionsBehavior = "merge" | "override";

export interface ConnectProviderOptions {
  infuraId?: string;
  rpc?: string;
  chainID?: number;
  providerOptions?: IProviderOptions;
  behavior?: ProviderOptionsBehavior;
}

export const getProviderOptions = ({
  infuraId,
  rpc = ETH_MAINNET_RPC_URL,
  chainID = ETH_MAINNET_CHAIN_ID,
  providerOptions,
  behavior = "merge",
}: ConnectProviderOptions): IProviderOptions => {
  const defaultOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId,
        rpc: {
          [chainID]: rpc,
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
