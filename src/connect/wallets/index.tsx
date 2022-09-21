import type { FC } from "react";
import { tw } from "twind";

// Solana
import {
  BaseMessageSignerWalletAdapter,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import bs58 from "bs58";

// EVM
import { Connector } from "@wagmi/core";

export const WALLET_ICON_SIZE = 28;

export interface WalletIconProps {
  width?: number;
  height?: number;
}

export type WalletIcon = FC<WalletIconProps>;

interface ConnectOpts {
  chainId?: number;
}

export interface Wallet {
  id: string;
  name: string;
  color: string;
  Icon: WalletIcon;
  qrCode?: boolean;
  ready: boolean;
  connect: ({ chainId }?: ConnectOpts) => Promise<{
    walletAddress: string;
    provider: any;
  }>;
  onConnecting?: (fn: () => void | Promise<void>) => void;
  signMessage: (message: string) => Promise<string>;
  qrCodeURI?: ({ chainId }?: ConnectOpts) => Promise<string>;
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
    this.qrCode = Boolean(getQRCodeURI);

    if (getQRCodeURI) {
      this.getQRCodeURI = getQRCodeURI;
    }
  }

  get ready() {
    return this.connector.ready;
  }

  // onConnecting exposes the start of the connecting event to the client
  // This is needed for getting the QR code URI. The WalletConnect session and it's associated QR code URI are only available
  // once only available once the connector starts "connecting"
  onConnecting(fn: () => void | Promise<void>) {
    this.connector.on("message", ({ type }) =>
      type === "connecting" ? fn() : undefined
    );
  }

  // switch to onConnecting for QR Code models
  async connect({ chainId }: ConnectOpts = {}) {
    const { account, provider } = await this.connector.connect({
      chainId,
    });

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

  async qrCodeURI({ chainId }: ConnectOpts = {}) {
    if (!this.getQRCodeURI) return "";

    const provider = await this.connector.getProvider({
      chainId,
    });

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

  // TODO: In future, we can use Ready state to show the "get wallet" vs "use wallet" based on what is installed on the user's device
  get ready() {
    return (
      this.adapter.readyState === WalletReadyState.Installed ||
      this.adapter.readyState === WalletReadyState.Loadable
    );
  }

  // for now, ignore chainId on Solana
  async connect({}: ConnectOpts = {}) {
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
