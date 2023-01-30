import React from "react";

import { InjectedConnector } from "@wagmi/connectors/injected";
import { WagmiWallet, WALLET_ICON_SIZE, WalletIconProps } from "../../wallets";

const Icon = ({
  height = WALLET_ICON_SIZE,
  width = WALLET_ICON_SIZE,
}: WalletIconProps) => (
  <svg
    stroke="#5469d4"
    fill="#5469d4"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height={height}
    width={width}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M95.5 104h320a87.73 87.73 0 0111.18.71 66 66 0 00-77.51-55.56L86 94.08h-.3a66 66 0 00-41.07 26.13A87.57 87.57 0 0195.5 104zm320 24h-320a64.07 64.07 0 00-64 64v192a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V192a64.07 64.07 0 00-64-64zM368 320a32 32 0 1132-32 32 32 0 01-32 32z"></path>
    <path d="M32 259.5V160c0-21.67 12-58 53.65-65.87C121 87.5 156 87.5 156 87.5s23 16 4 16-18.5 24.5 0 24.5 0 23.5 0 23.5L85.5 236z"></path>
  </svg>
);

export const createWallet = () =>
  new WagmiWallet({
    connector: new InjectedConnector(),
    color: "#5469d4",
    Icon,
  });

export default createWallet;
