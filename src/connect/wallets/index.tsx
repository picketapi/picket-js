import type { FC } from "react";
import { tw } from "twind";

// Solana
import { BaseMessageSignerWalletAdapter } from "@solana/wallet-adapter-base";
import bs58 from "bs58";

// EVM
import { Connector } from "@wagmi/core";

export const WALLET_ICON_SIZE = 28;

export interface WalletIconProps {
  width?: number;
  height?: number;
}

export type WalletIcon = FC<WalletIconProps>;

export interface Wallet {
  id: string;
  name: string;
  color: string;
  Icon: WalletIcon;
  qrCode?: boolean;
  connect: () => Promise<{
    walletAddress: string;
    provider: any;
  }>;
  signMessage: (message: string) => Promise<string>;
  qrCodeURI?: () => Promise<string>;
}

export class WagmiWallet implements Wallet {
  id: string;
  name: string;
  color: string;
  qrCode: boolean;
  Icon: WalletIcon;
  connector: Connector;
  getQRCodeURI?: (provider: any) => Promise<string>;

  constructor({
    connector,
    color,
    Icon,
    qrCode = false,
    getQRCodeURI,
  }: {
    connector: Connector;
    color: string;
    Icon: WalletIcon;
    qrCode?: boolean;
    getQRCodeURI?: (provider: any) => Promise<string>;
  }) {
    this.connector = connector;

    this.id = connector.id;
    this.name = connector.name;

    this.color = color;
    this.Icon = Icon;
    this.qrCode = qrCode;

    if (qrCode && getQRCodeURI) {
      this.getQRCodeURI = getQRCodeURI;
    }
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

  async qrCodeURI() {
    if (!this.getQRCodeURI) return "";

    const provider = await this.connector.getProvider();
    return await this.getQRCodeURI(provider);
  }
}

export class SolanaWalletAdpaterWallet implements Wallet {
  id: string;
  name: string;
  color: string;
  Icon: WalletIcon;
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
    this.Icon = ({
      height = WALLET_ICON_SIZE,
      width = WALLET_ICON_SIZE,
    }: WalletIconProps) => (
      <img
        className={tw`rounded-md`}
        alt={adapter.name}
        src={adapter.icon}
        height={height}
        width={width}
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
