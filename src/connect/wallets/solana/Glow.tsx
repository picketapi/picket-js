import React from "react";
import { GlowWalletAdapter } from "@solana/wallet-adapter-wallets";

import { SolanaWalletAdpaterWallet } from "../../wallets";

const color = "#bb2dc7";

const wallet = new SolanaWalletAdpaterWallet({
  // Ignoring the type difference for now
  // GlowWalletAdapter sendTransaction is extends BaseMessageSignerWalletAdapter in an incompatible way
  // @ts-ignore
  adapter: new GlowWalletAdapter(),
  color,
});

export default wallet;
