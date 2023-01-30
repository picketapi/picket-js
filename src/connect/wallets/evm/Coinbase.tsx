import React from "react";
import { tw } from "twind";
import { mainnet, polygon, optimism, arbitrum, avalanche } from "@wagmi/chains";
import { CoinbaseWalletConnector } from "@wagmi/connectors/coinbaseWallet";

import { WagmiWallet, WALLET_ICON_SIZE, WalletIconProps } from "../../wallets";
import { isIOS } from "../../utils/device";

const allChains = [mainnet, polygon, optimism, arbitrum, avalanche];

const color = "#2C5FF6";

const Icon = ({
  height = WALLET_ICON_SIZE,
  width = WALLET_ICON_SIZE,
}: WalletIconProps) => (
  <svg
    className={tw`rounded-lg`}
    height={height}
    width={width}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect height={28} width={28} fill={color} />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14 23.8C19.4124 23.8 23.8 19.4124 23.8 14C23.8 8.58761 19.4124 4.2 14 4.2C8.58761 4.2 4.2 8.58761 4.2 14C4.2 19.4124 8.58761 23.8 14 23.8ZM11.55 10.8C11.1358 10.8 10.8 11.1358 10.8 11.55V16.45C10.8 16.8642 11.1358 17.2 11.55 17.2H16.45C16.8642 17.2 17.2 16.8642 17.2 16.45V11.55C17.2 11.1358 16.8642 10.8 16.45 10.8H11.55Z"
      fill="white"
    />
  </svg>
);

export const createWallet = () =>
  new WagmiWallet({
    connector: new CoinbaseWalletConnector({
      chains: allChains,
      options: {
        appName: "Picket",
        // headlessMode => means we show our own QR code
        headlessMode: true,
      },
    }),
    color,
    Icon,
    // on iOS, disable custom QR code because it will automatically deep link
    ...(isIOS()
      ? {}
      : {
          getQRCodeURI: async (provider: any) => {
            return provider.qrUrl;
          },
        }),
  });

export default createWallet;
