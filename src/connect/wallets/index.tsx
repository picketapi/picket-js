import type { ReactNode } from "react";

// Solana
import { BaseMessageSignerWalletAdapter } from "@solana/wallet-adapter-base";
import bs58 from "bs58";

// EVM
import { Connector } from "@wagmi/core";

export const WALLET_ICON_SIZE = 28;

export interface Wallet {
  id: string;
  name: string;
  color: string;
  icon: ReactNode;
  connect: () => Promise<{
    walletAddress: string;
    provider: any;
  }>;
  signMessage: (message: string) => Promise<string>;
}

export class WagmiWallet implements Wallet {
  id: string;
  name: string;
  color: string;
  icon: ReactNode;
  connector: Connector;

  constructor({
    connector,
    color,
    icon,
  }: {
    connector: Connector;
    color: string;
    icon: ReactNode;
  }) {
    this.connector = connector;

    this.id = connector.id;
    this.name = connector.name;

    this.color = color;
    this.icon = icon;
  }

  async connect() {
    const { account, provider } = await this.connector.connect();
    return {
      walletAddress: account,
      provider,
    };
  }

  async signMessage(message: string) {
    const signer = await this.connector.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  }
}

export class SolanaWalletAdpaterWallet implements Wallet {
  id: string;
  name: string;
  color: string;
  icon: ReactNode;
  adapter: BaseMessageSignerWalletAdapter;

  constructor({
    adapter,
    color,
  }: {
    adapter: BaseMessageSignerWalletAdapter;
    color: string;
  }) {
    this.adapter = adapter;

    this.id = adapter.name;
    this.name = adapter.name;
    this.icon = (
      <img
        alt={adapter.name}
        src={adapter.icon}
        height={WALLET_ICON_SIZE}
        width={WALLET_ICON_SIZE}
      />
    );

    this.color = color;
  }
  async connect() {
    await this.adapter.connect();

    const { connected, publicKey } = this.adapter;

    if (!connected || !publicKey) {
      throw new Error(`failed to connect to ${this.name} wallet`);
    }

    const walletAddress = publicKey.toString();

    return {
      walletAddress,
      provider: this.adapter,
    };
  }

  async signMessage(message: string) {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await this.adapter.signMessage(messageBytes);
    const signature = bs58.encode(signatureBytes);
    return signature;
  }
}
