import React from "react";
import { tw } from "twind";
import { mainnet, polygon, optimism, arbitrum, avalanche } from "@wagmi/chains";
import { InjectedConnector } from "@wagmi/connectors/injected";
import { WalletConnectConnector } from "@wagmi/connectors/walletConnect";

import { WagmiWallet, WALLET_ICON_SIZE, WalletIconProps } from "../../wallets";
import { isAndroid, isMobile } from "../../utils/device";

const allChains = [mainnet, polygon, optimism, arbitrum, avalanche];

const color = "#3375BB";

const Icon = ({
  height = WALLET_ICON_SIZE,
  width = WALLET_ICON_SIZE,
}: WalletIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={tw`rounded-lg`}
    width={width}
    height={height}
    viewBox="0 0 28 28"
    fill="none"
  >
    <path fill="#fff" d="M0 0h28v28H0z" />
    <path
      fill="#3375BB"
      fillRule="evenodd"
      d="M20.99 7.55a.92.92 0 0 1 .9.92 63.1 63.1 0 0 1-.33 6.19 12.91 12.91 0 0 1-.87 3.7 5.86 5.86 0 0 1-1.03 1.6 8.03 8.03 0 0 1-1.86 1.43l-.91.53c-.68.38-1.43.8-2.27 1.37-.3.2-.7.2-1.01 0-.86-.57-1.62-1-2.3-1.39l-.45-.25c-.8-.47-1.52-.9-2.15-1.55a5.5 5.5 0 0 1-1.08-1.54 10.7 10.7 0 0 1-.85-3.07c-.27-1.7-.4-3.93-.44-7.02a.91.91 0 0 1 .9-.92h.38a9.5 9.5 0 0 0 5.93-1.83.91.91 0 0 1 1.12 0 9.54 9.54 0 0 0 5.94 1.83h.38Zm-2.04 10.23c.29-.6.52-1.4.7-2.56.22-1.4.35-3.29.41-5.86-1.37-.04-3.71-.3-5.95-1.8a11.24 11.24 0 0 1-5.94 1.8c.05 2.13.15 3.78.3 5.08.18 1.48.42 2.48.74 3.19.2.46.43.8.7 1.1.36.4.82.73 1.45 1.1l.85.5c.56.31 1.2.67 1.9 1.12.7-.44 1.33-.8 1.87-1.11l.48-.27a7.94 7.94 0 0 0 1.76-1.24c.29-.3.52-.61.73-1.05Z"
      clipRule="evenodd"
    />
  </svg>
);

const getQRCodeURI = async (provider: any) => {
  const { uri } = provider.connector;
  const android = isAndroid();
  const desktop = !isMobile();

  // android devices can use the default QR code
  if (android || desktop) return uri;

  // non-android, use the deep link
  return `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}`;
};

export const createWallet = () => {
  const inAppBrowser = Boolean(
    typeof window !== "undefined" && window.ethereum?.isTrust
  );

  return new WagmiWallet({
    id: "trust",
    name: "Trust Wallet",
    // return injected connector if in app browser
    connector: inAppBrowser
      ? new InjectedConnector({
          chains: allChains,
        })
      : new WalletConnectConnector({
          chains: allChains,
          options: {
            qrcode: false,
          },
        }),
    color,
    Icon,
    getQRCodeURI: inAppBrowser ? undefined : getQRCodeURI,
  });
};

export default createWallet;
