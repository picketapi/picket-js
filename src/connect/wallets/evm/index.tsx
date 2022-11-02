import React from "react";
import { createClient, configureChains, allChains } from "@wagmi/core";
import { publicProvider } from "@wagmi/core/providers/public";

import MetaMask, { isMetaMask } from "./MetaMask";
import Injected from "./Injected";
import WalletConnect from "./WalletConnect";
import Rainbow from "./Rainbow";
import Coinbase from "./Coinbase";
import Trust from "./Trust";
import Argent from "./Argent";

const { provider } = configureChains(allChains, [publicProvider()]);

const needsInjectedWallet =
  typeof window !== "undefined" &&
  window.ethereum &&
  !isMetaMask(window.ethereum) &&
  // hide in Coinbase and Trust Wallet in-app browsers
  !window.ethereum.isCoinbaseWallet &&
  !window.ethereum.isTrust;
// &&
// !window.ethereum.isBraveWallet;
// TODO: Consider adding brave native wallet support (for icon)

export const wallets = needsInjectedWallet
  ? [Injected, MetaMask, Rainbow, Coinbase, Trust, Argent, WalletConnect]
  : [MetaMask, Rainbow, Coinbase, Trust, Argent, WalletConnect];

// this is never referenced but is needed!
export const wagmiClient = createClient({
  connectors: wallets.map((wallet) => wallet.connector),
  provider,
});

export default wallets;
