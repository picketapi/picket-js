import { createClient, configureChains, defaultChains } from "@wagmi/core";
import { publicProvider } from "@wagmi/core/providers/public";

import MetaMask from "./MetaMask";
import Injected from "./Injected";
import WalletConnect from "./WalletConnect";
import Coinbase from "./Coinbase";

const { provider } = configureChains(defaultChains, [publicProvider()]);

// https://github.com/rainbow-me/rainbowkit/blob/main/packages/rainbowkit/src/wallets/walletConnectors/metaMask/metaMask.ts
export function isMetaMask(
  ethereum: NonNullable<typeof window["ethereum"]>
): boolean {
  // Logic borrowed from wagmi's MetaMaskConnector
  // https://github.com/tmm/wagmi/blob/main/packages/core/src/connectors/metaMask.ts
  const isMetaMask = Boolean(ethereum.isMetaMask);

  if (!isMetaMask) {
    return false;
  }

  // Brave tries to make itself look like MetaMask
  // Could also try RPC `web3_clientVersion` if following is unreliable
  if (ethereum.isBraveWallet && !ethereum._events && !ethereum._state) {
    return false;
  }

  if (ethereum.isTokenary) {
    return false;
  }

  return true;
}

const needsInjectedWallet =
  typeof window !== "undefined" &&
  window.ethereum &&
  !isMetaMask(window.ethereum) &&
  !window.ethereum.isCoinbaseWallet;
// &&
// !window.ethereum.isBraveWallet;
// TODO: Consider adding brave native wallet support (for icon)

export const wallets = needsInjectedWallet
  ? [Injected, MetaMask, WalletConnect, Coinbase]
  : [MetaMask, WalletConnect, Coinbase];

export const wagmiClient = createClient({
  connectors: wallets.map((wallet) => wallet.connector),
  provider,
});

export default wallets;
