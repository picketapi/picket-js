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

import { Wallet } from "../";

const { provider } = configureChains(allChains, [publicProvider()]);

const needsInjectedWallet = () =>
  typeof window !== "undefined" &&
  window.ethereum &&
  !isMetaMask(window.ethereum) &&
  // hide in Coinbase and Trust Wallet in-app browsers
  !window.ethereum.isCoinbaseWallet &&
  !window.ethereum.isTrust;
// &&
// !window.ethereum.isBraveWallet;
// TODO: Consider adding brave native wallet support (for icon)

let walletsPromise: Promise<Wallet[]> | null = null;

// lazily get wallets
export const loadWallets = async (): Promise<Wallet[]> => {
  if (walletsPromise) return walletsPromise;

  walletsPromise = new Promise(async (resolve) => {
    const walletCreators = needsInjectedWallet()
      ? [Injected, MetaMask, Rainbow, Coinbase, WalletConnect, Trust, Argent]
      : [MetaMask, Rainbow, Coinbase, WalletConnect, Trust, Argent];

    const wallets = await Promise.all(walletCreators.map((wallet) => wallet()));

    // this is never referenced but is needed!
    createClient({
      connectors: wallets.map((wallet) => wallet.connector),
      provider,
    });

    return resolve(wallets);
  });

  return walletsPromise;
};

export default loadWallets;
