import React from "react";

import { tw } from "twind";
import { mainnet, polygon, optimism, arbitrum, avalanche } from "@wagmi/chains";
import { WalletConnectConnector } from "@wagmi/connectors/walletConnect";

import { WagmiWallet, WALLET_ICON_SIZE, WalletIconProps } from "../../wallets";
import { isAndroid, isMobile } from "../../utils/device";

const allChains = [mainnet, polygon, optimism, arbitrum, avalanche];

const color = "#FF875B";

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
    <rect width="28" height="28" fill="white" />
    <path
      d="M15.9033 7H11.8495C11.714 7 11.6055 7.10935 11.6026 7.24527C11.5207 11.0658 9.52894 14.6919 6.10076 17.2603C5.99192 17.3418 5.96712 17.495 6.04669 17.6053L8.41849 20.8966C8.49918 21.0086 8.6564 21.0338 8.76706 20.9515C10.9106 19.3561 12.6348 17.4314 13.8764 15.2981C15.118 17.4314 16.8423 19.3561 18.9858 20.9515C19.0964 21.0338 19.2536 21.0086 19.3344 20.8966L21.7062 17.6053C21.7857 17.495 21.7609 17.3418 21.6522 17.2603C18.2239 14.6919 16.2322 11.0658 16.1504 7.24527C16.1474 7.10935 16.0388 7 15.9033 7Z"
      fill="#FF875B"
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
  return `https://argent.link/app/wc?uri=${encodeURIComponent(uri)}`;
};

const createWallet = () =>
  new WagmiWallet({
    id: "argent",
    name: "Argent",
    connector: new WalletConnectConnector({
      chains: allChains,
      options: {
        qrcode: false,
      },
    }),
    color,
    Icon,
    getQRCodeURI: getQRCodeURI,
  });

export default createWallet;
