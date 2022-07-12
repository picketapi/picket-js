import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import { SolanaWalletAdpaterWallet } from "../../wallets";

const color = "#fb402e";

const walllet = new SolanaWalletAdpaterWallet({
  adapter: new SolflareWalletAdapter(),
  color,
});

export default walllet;
