import React from "react";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import { SolanaWalletAdpaterWallet } from "../../wallets";

const color = "#fb402e";

export const createWallet = () =>
  new SolanaWalletAdpaterWallet({
    adapter: new SolflareWalletAdapter(),
    color,
  });

export default createWallet;
