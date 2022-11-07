import React from "react";
import Phantom from "./Phantom";
import Solflare from "./Solflare";
import Glow from "./Glow";
import Backpack from "./Backpack";

import { Wallet } from "../";

export const walletCreators = [Phantom, Solflare, Glow, Backpack];

let walletsPromise: Promise<Wallet[]> | null = null;

// lazily get wallets
export const loadWallets = async () => {
  if (!walletsPromise) {
    walletsPromise = Promise.all(walletCreators.map((wallet) => wallet()));
  }
  return walletsPromise;
};

export default loadWallets;
