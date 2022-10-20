import React from "react";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";

import { SolanaWalletAdpaterWallet } from "../../wallets";

const color = "#e23f3f";

const wallet = new SolanaWalletAdpaterWallet({
  // Ignoring the type difference for now
  // BackpackWalletAdapter sendTransaction is extends BaseMessageSignerWalletAdapter in an incompatible way
  // @ts-ignore
  adapter: new BackpackWalletAdapter(),
  color,
});

export default wallet;
