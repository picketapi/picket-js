import { allChains } from "@wagmi/core";
import { MetaMaskConnector } from "@wagmi/core/connectors/metaMask";
import { WalletConnectConnector } from "@wagmi/core/connectors/walletConnect";

import { WagmiWallet, WALLET_ICON_SIZE, WalletIconProps } from "../../wallets";
import { isAndroid } from "../../utils/device";

const Icon = ({
  height = WALLET_ICON_SIZE,
  width = WALLET_ICON_SIZE,
}: WalletIconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 28 28"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" fill="transparent" />
    <path
      d="M24.0891 3.1199L15.3446 9.61456L16.9617 5.7828L24.0891 3.1199Z"
      fill="#E2761B"
      stroke="#E2761B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.90207 3.1199L12.5763 9.67608L11.0383 5.7828L3.90207 3.1199Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.9429 18.1745L18.6139 21.7426L23.597 23.1136L25.0295 18.2536L20.9429 18.1745Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.97929 18.2536L4.40301 23.1136L9.38607 21.7426L7.05713 18.1745L2.97929 18.2536Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.10483 12.1456L7.71626 14.2461L12.6642 14.4658L12.4884 9.14877L9.10483 12.1456Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.8864 12.1456L15.4589 9.08725L15.3446 14.4658L20.2837 14.2461L18.8864 12.1456Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.38606 21.7426L12.3566 20.2925L9.79033 18.2888L9.38606 21.7426Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.6347 20.2925L18.6139 21.7426L18.2009 18.2888L15.6347 20.2925Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.6139 21.7426L15.6347 20.2925L15.8719 22.2348L15.8456 23.0521L18.6139 21.7426Z"
      fill="#D7C1B3"
      stroke="#D7C1B3"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.38606 21.7426L12.1544 23.0521L12.1368 22.2348L12.3566 20.2925L9.38606 21.7426Z"
      fill="#D7C1B3"
      stroke="#D7C1B3"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.1984 17.0056L9.72002 16.2762L11.4689 15.4765L12.1984 17.0056Z"
      fill="#233447"
      stroke="#233447"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.7928 17.0056L16.5223 15.4765L18.28 16.2762L15.7928 17.0056Z"
      fill="#233447"
      stroke="#233447"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.38606 21.7426L9.80791 18.1745L7.05712 18.2536L9.38606 21.7426Z"
      fill="#CD6116"
      stroke="#CD6116"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.1921 18.1745L18.6139 21.7426L20.9429 18.2536L18.1921 18.1745Z"
      fill="#CD6116"
      stroke="#CD6116"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.2837 14.2461L15.3446 14.4658L15.8016 17.0057L16.5311 15.4765L18.2888 16.2762L20.2837 14.2461Z"
      fill="#CD6116"
      stroke="#CD6116"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.72002 16.2762L11.4777 15.4765L12.1984 17.0057L12.6642 14.4658L7.71626 14.2461L9.72002 16.2762Z"
      fill="#CD6116"
      stroke="#CD6116"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.71626 14.2461L9.79033 18.2888L9.72002 16.2762L7.71626 14.2461Z"
      fill="#E4751F"
      stroke="#E4751F"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.2888 16.2762L18.2009 18.2888L20.2837 14.2461L18.2888 16.2762Z"
      fill="#E4751F"
      stroke="#E4751F"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.6642 14.4658L12.1984 17.0057L12.7784 20.0025L12.9102 16.0565L12.6642 14.4658Z"
      fill="#E4751F"
      stroke="#E4751F"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.3446 14.4658L15.1073 16.0477L15.2128 20.0025L15.8016 17.0057L15.3446 14.4658Z"
      fill="#E4751F"
      stroke="#E4751F"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.8016 17.0056L15.2128 20.0025L15.6347 20.2925L18.2009 18.2888L18.2888 16.2762L15.8016 17.0056Z"
      fill="#F6851B"
      stroke="#F6851B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.72002 16.2762L9.79033 18.2888L12.3566 20.2925L12.7784 20.0025L12.1984 17.0056L9.72002 16.2762Z"
      fill="#F6851B"
      stroke="#F6851B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.8456 23.0521L15.8719 22.2348L15.6522 22.0414H12.339L12.1368 22.2348L12.1544 23.0521L9.38606 21.7426L10.3528 22.5336L12.3126 23.8958H15.6786L17.6472 22.5336L18.6139 21.7426L15.8456 23.0521Z"
      fill="#C0AD9E"
      stroke="#C0AD9E"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.6347 20.2925L15.2128 20.0025H12.7784L12.3566 20.2925L12.1368 22.2348L12.339 22.0414H15.6522L15.8719 22.2348L15.6347 20.2925Z"
      fill="#161616"
      stroke="#161616"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24.4583 10.0364L25.2053 6.45072L24.0891 3.1199L15.6347 9.39485L18.8864 12.1456L23.4827 13.4903L24.5022 12.3038L24.0628 11.9874L24.7658 11.3459L24.221 10.924L24.924 10.3879L24.4583 10.0364Z"
      fill="#763D16"
      stroke="#763D16"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.79472 6.45072L3.54174 10.0364L3.06717 10.3879L3.77024 10.924L3.23415 11.3459L3.93722 11.9874L3.4978 12.3038L4.50847 13.4903L9.10483 12.1456L12.3566 9.39485L3.90207 3.1199L2.79472 6.45072Z"
      fill="#763D16"
      stroke="#763D16"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23.4827 13.4903L18.8864 12.1456L20.2837 14.2461L18.2009 18.2888L20.9429 18.2536H25.0295L23.4827 13.4903Z"
      fill="#F6851B"
      stroke="#F6851B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.10484 12.1456L4.50848 13.4903L2.97929 18.2536H7.05713L9.79033 18.2888L7.71626 14.2461L9.10484 12.1456Z"
      fill="#F6851B"
      stroke="#F6851B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.3446 14.4658L15.6347 9.39485L16.9705 5.7828H11.0383L12.3566 9.39485L12.6642 14.4658L12.7696 16.0653L12.7784 20.0025H15.2128L15.2304 16.0653L15.3446 14.4658Z"
      fill="#F6851B"
      stroke="#F6851B"
      strokeWidth="0.0878845"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const isMetaMask = (
  ethereum: NonNullable<typeof window["ethereum"]>
) => {
  // Logic borrowed from wagmi's MetaMaskConnector
  // https://github.com/tmm/wagmi/blob/main/packages/core/src/connectors/metaMask.ts
  const isMetaMask = Boolean(ethereum.isMetaMask);

  if (!isMetaMask) {
    return false;
  }

  // Brave tries to make itself look like MetaMask
  // Could also try RPC `web3_clientVersion` if following is unreliable
  if (ethereum.isBraveWallet && !ethereum._events && !ethereum._state) {
    return false;
  }

  if (ethereum.isTokenPocket) {
    return false;
  }

  if (ethereum.isTokenary) {
    return false;
  }

  return true;
};

const isMetaMaskInjected =
  typeof window !== "undefined" &&
  typeof window.ethereum !== "undefined" &&
  isMetaMask(window.ethereum);

const shouldUseWalletConnect = !isMetaMaskInjected;

const wallet = new WagmiWallet({
  id: "metamask",
  name: "MetaMask",
  connector: shouldUseWalletConnect
    ? new WalletConnectConnector({
        chains: allChains,
        options: {
          qrcode: false,
        },
      })
    : new MetaMaskConnector({
        chains: allChains,
      }),
  color: "#F6851B",
  Icon,
  // show QR code if using wallet connect
  ...(shouldUseWalletConnect
    ? {
        getQRCodeURI: async (provider: any) => {
          const { uri } = provider.connector;
          const android = isAndroid();

          // android devices can use the default QR code
          if (!android) return uri;

          // non-android, use the deep link
          return `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;
        },
      }
    : {}),
});

export default wallet;
