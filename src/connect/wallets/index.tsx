import React from "react";
import type { FC } from "react";
import { tw } from "twind";

// Solana
import {
  BaseMessageSignerWalletAdapter,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import bs58 from "bs58";

// EVM
import { Connector } from "@wagmi/connectors";

// Flow
import * as fcl from "@onflow/fcl";

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
  connect: (opts?: ConnectOpts) => Promise<{
    walletAddress: string;
    provider: any;
  }>;
  disconnect: () => Promise<void>;
  onConnecting?: (fn: () => void | Promise<void>) => void;
  signMessage: (message: string) => Promise<string>;
  qrCodeURI?: (opts?: ConnectOpts) => Promise<string>;
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
    id,
    name,
    connector,
    color,
    Icon,
    getQRCodeURI,
  }: {
    id?: string;
    name?: string;
    connector: Connector;
    color: string;
    Icon: WalletIcon;
    qrCode?: boolean;
    getQRCodeURI?: (provider: any) => Promise<string>;
  }) {
    this.connector = connector;

    this.id = id || connector.id;
    this.name = name || connector.name;

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

  async disconnect() {
    // clear wallet link session
    window.localStorage.removeItem(
      "-walletlink:https://www.walletlink.org:version"
    );
    window.localStorage.removeItem(
      "-walletlink:https://www.walletlink.org:session:id"
    );
    window.localStorage.removeItem(
      "-walletlink:https://www.walletlink.org:session:secret"
    );
    window.localStorage.removeItem(
      "-walletlink:https://www.walletlink.org:session:linked"
    );
    return this.connector.disconnect();
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

  async disconnect() {
    return this.adapter.disconnect();
  }

  async signMessage(message: string) {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await this.adapter.signMessage(messageBytes);
    const signature = bs58.encode(signatureBytes);
    return signature;
  }
}

export class FlowWallet implements Wallet {
  id: string;
  name: string;
  color: string;
  Icon: WalletIcon;
  service: any;

  constructor({ service }: { service: any }) {
    this.service = service;

    const { name, color, icon, address } = service.provider;

    this.id = address;
    this.name = name;
    this.Icon = ({
      height = WALLET_ICON_SIZE,
      width = WALLET_ICON_SIZE,
    }: WalletIconProps) => (
      <img
        className={tw`rounded-md`}
        alt={name}
        src={icon}
        height={height}
        width={width}
      />
    );

    this.color = color;
  }

  get ready() {
    return Boolean(this.service);
  }

  // for now, ignore chainId on Solana
  async connect({}: ConnectOpts = {}) {
    const { addr } = await fcl.authenticate({ service: this.service });

    // set this wallet as the chosen wallet for signature call
    fcl.config().put("discovery.wallet", this.service.endpoint);

    return {
      walletAddress: addr,
      provider: this.service.provider,
    };
  }

  async disconnect() {
    return fcl.unauthenticate();
  }

  async signMessage(message: string) {
    const { signUserMessage } = await fcl.currentUser();
    const messageHex = Buffer.from(message).toString("hex");
    const [compositeSignature] = await signUserMessage(messageHex);
    const { signature } = compositeSignature;

    return signature;
  }
}
