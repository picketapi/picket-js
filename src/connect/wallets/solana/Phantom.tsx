import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import { SolanaWalletAdpaterWallet } from "../../wallets";

const color = "#5520f4";

const walllet = new SolanaWalletAdpaterWallet({
  adapter: new PhantomWalletAdapter(),
  color,
});

export default walllet;
