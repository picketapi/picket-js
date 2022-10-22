import React from "react";
import { tw } from "twind";

import { AuthRequirements } from "../types";

import { Wallet } from "./wallets";

import PoweredByPicket from "./PoweredByPicket";

interface TokenGateFailureScreenProps {
  chain: string;
  displayAddress: string;
  selectedWallet: Wallet;
  requirements: AuthRequirements;
  back: () => void;
}

// TOOD: Distinguish between ERC20 and NFT, NFT SPL and fungible SPL
const getPurchaseLink = (chain: string, requirements: AuthRequirements) => {
  // case 1 Solana
  // don't have a great way to surface the collectioon as of right now, so send to the marketplace
  if (chain === "solana") {
    return "https://magiceden.io/";
  }

  // EVM
  // case 2 assume EVM NFT (for now)
  const { contractAddress } = requirements;

  if (chain === "ethereum") {
    if (!contractAddress)
      return "https://opensea.io/assets?search[chains][0]=ETHEREUM&search[resultModel]=ASSETS";

    return `https://opensea.io/assets?search[resultModel]=ASSETS&search[query]=${contractAddress}&search[chains][0]=ETHEREUM`;
  }

  if (chain === "polygon") {
    if (!contractAddress)
      return "https://opensea.io/assets?search[chains][0]=MATIC&search[resultModel]=ASSETS";

    return `https://opensea.io/assets?search[resultModel]=ASSETS&search[query]=${contractAddress}&search[chains][0]=MATIC`;
  }

  if (chain === "optimism") {
    if (!contractAddress) return "https://qx.app";

    return `https://qx.app/search?query=${contractAddress}`;
  }

  if (chain === "arbitrum") {
    if (!contractAddress)
      return "https://opensea.io/assets?search[chains][0]=ARBITRUM&search[resultModel]=ASSETS";

    return `https://opensea.io/assets?search[resultModel]=ASSETS&search[query]=${contractAddress}&search[chains][0]=ARBITRUM`;
  }

  if (chain === "avalanche") {
    if (!contractAddress) return "https://joepegs.com";

    return `https://joepegs.com/collections/${contractAddress}`;
  }

  // shouldn't get here but return opensea as default
  return "https://opensea.io";
};

const TokenGateFailureScreen = ({
  chain,
  displayAddress,
  selectedWallet,
  requirements,
  back,
}: TokenGateFailureScreenProps) => {
  return (
    <>
      <h1
        className={tw`mb-6 text-xl font-semibold break-words text-center px-7`}
      >
        Almost There
      </h1>
      <div className={tw`flex-1 flex flex-col min-h-[350px] space-y-4`}>
        <svg
          width="197"
          height="187"
          viewBox="0 0 197 187"
          className={tw`text-[${selectedWallet.color}] self-center my-8`}
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="6.16943"
            width="178.904"
            height="178.904"
            rx="89.4522"
            fill="currentColor"
          />
          <path
            d="M90.3038 51.7285C59.8853 51.7285 35.1416 68.4501 35.1416 89.0003V108.154C35.1416 114.914 38.1373 121.236 43.3646 125.494C51.4899 132.119 61.428 136.783 72.3114 139.234C78.0885 140.534 84.1218 141.224 90.3044 141.224C96.4869 141.224 102.525 140.534 108.297 139.234C119.176 136.784 129.113 132.12 137.244 125.494C142.471 121.236 145.467 114.914 145.467 108.154V89.0003C145.467 68.4501 120.723 51.7285 90.305 51.7285H90.3038ZM52.5335 124.757C50.6513 123.555 48.8389 122.265 47.1291 120.867C43.3042 117.75 41.1051 113.115 41.1051 108.153V105.823C44.0169 109.695 47.8978 113.18 52.5335 116.129V124.757ZM69.9301 132.491C65.9327 131.364 62.1077 129.901 58.5017 128.126V119.427C62.0285 121.119 65.8629 122.53 69.9301 123.63V132.491ZM87.322 135.193C83.4225 135.044 79.6021 134.602 75.8936 133.894V124.972C79.5695 125.643 83.39 126.071 87.322 126.216V135.193ZM104.714 133.894C101.005 134.606 97.1804 135.049 93.2855 135.193V126.216C97.2177 126.076 101.043 125.647 104.714 124.972V133.894ZM139.502 108.153C139.502 113.115 137.303 117.75 133.478 120.867C131.769 122.265 129.956 123.551 128.074 124.757V123.29C128.074 121.645 126.737 120.308 125.092 120.308C123.448 120.308 122.111 121.645 122.111 123.29V128.126C118.505 129.905 114.675 131.364 110.682 132.491V123.625C123.186 120.252 133.446 113.878 139.507 105.823L139.502 108.153ZM107.192 118.407C107.122 118.421 107.053 118.435 106.983 118.454C101.774 119.651 96.1553 120.308 90.304 120.308C84.4528 120.308 78.8383 119.651 73.6254 118.454C73.5555 118.435 73.4856 118.421 73.4157 118.407C54.5795 114.014 41.1056 102.492 41.1056 89.0001C41.1056 71.7335 63.1752 57.6919 90.3043 57.6919C117.433 57.6919 139.503 71.7335 139.503 89.0001C139.503 102.492 126.029 114.015 107.193 118.407H107.192Z"
            fill="#FAFAFA"
          />
          <path
            d="M118.467 83.2975C117.992 81.6203 116.51 80.3204 114.516 79.8218L103.134 76.9845L94.2962 70.3921C92.0924 68.7475 88.5143 68.7475 86.3107 70.3921L77.4726 76.9845L66.086 79.8218C64.092 80.3203 62.6151 81.6202 62.1399 83.2975C61.7206 84.7744 62.1399 86.3445 63.2627 87.4998L70.6984 95.1499L70.7637 101.076C70.7823 102.399 71.3973 103.615 72.5061 104.505C73.9644 105.675 76.1355 106.136 78.1714 105.712L90.0098 103.233C90.1915 103.191 90.4105 103.191 90.6015 103.233L102.44 105.712C102.943 105.814 103.451 105.87 103.954 105.87C105.501 105.87 107.006 105.39 108.105 104.51C109.214 103.62 109.829 102.404 109.848 101.081L109.913 95.1546L117.349 87.5045C118.471 86.3491 118.891 84.7743 118.467 83.2975L118.467 83.2975ZM105.123 91.5159C104.382 92.2799 103.963 93.2629 103.954 94.2833L103.893 99.9019C103.819 99.8973 103.739 99.888 103.66 99.874L91.8264 97.3955C91.3279 97.293 90.8154 97.237 90.3076 97.237C89.7951 97.237 89.2826 97.2883 88.7888 97.3955L76.955 99.874C76.8711 99.8926 76.7966 99.9019 76.7174 99.9019L76.6568 94.2786C76.6429 93.2583 76.2282 92.2753 75.4874 91.5112L69.3143 85.1657L78.9956 82.7524C79.7131 82.5707 80.3607 82.2725 80.9151 81.8579L89.8464 75.191C90.0467 75.0838 90.5686 75.0838 90.7316 75.1723L99.7001 81.8626C100.25 82.2726 100.897 82.5755 101.62 82.7525L111.292 85.1751L105.123 91.5159Z"
            fill="#FAFAFA"
          />
          <path
            d="M107.677 62.7943C106.079 62.389 104.458 63.3581 104.057 64.9561C103.652 66.5541 104.621 68.1754 106.214 68.5762C120.773 72.2567 130.557 80.4659 130.557 89.0011C130.557 91.6474 129.625 94.2844 127.79 96.8328C125.935 99.4045 123.256 101.771 119.827 103.872C118.425 104.73 117.982 106.57 118.84 107.972C119.404 108.89 120.382 109.398 121.388 109.398C121.919 109.398 122.455 109.258 122.94 108.96C127.049 106.444 130.306 103.542 132.626 100.322C135.211 96.7349 136.521 92.9285 136.521 89.001C136.521 77.512 125.199 67.2247 107.676 62.7939L107.677 62.7943Z"
            fill="#FAFAFA"
          />
          <rect
            x="133.253"
            width="62.925"
            height="62.925"
            rx="31.4625"
            fill="#F7F7F8"
          />
          <path
            d="M165.332 6.16943C158.461 6.16943 151.871 8.90005 147.011 13.7584C142.153 18.6187 139.422 25.2081 139.422 32.0797C139.422 38.9513 142.152 45.5412 147.011 50.401C151.871 55.2592 158.461 57.99 165.332 57.99C172.204 57.99 178.794 55.2594 183.653 50.401C188.512 45.5407 191.242 38.9513 191.242 32.0797C191.242 25.2081 188.512 18.6182 183.653 13.7584C178.793 8.90027 172.204 6.16943 165.332 6.16943ZM165.332 46.6543C164.023 46.6543 162.842 45.8657 162.34 44.6553C161.838 43.445 162.117 42.0512 163.042 41.1255C163.968 40.1999 165.362 39.9215 166.572 40.4234C167.782 40.9252 168.571 42.106 168.571 43.4155C168.571 45.2035 167.12 46.6543 165.332 46.6543ZM168.571 35.3185H162.093V17.5052H168.571V35.3185Z"
            fill="currentColor"
          />
        </svg>
        <p className={tw`text-sm text-center font-semibold text-gray-600 dark:text-white mb-2`}>
          Your wallet {displayAddress} doesn't hold the necessary tokens
        </p>
        <a
          href={getPurchaseLink(chain, requirements)}
          target="_blank"
          rel="noreferrer"
          className={tw`py-3 bg-[${selectedWallet.color}] text-white font-semibold text-center rounded-lg`}
        >
          Buy Tokens
        </a>
        <button
          className={tw`py-3 bg-gray-300 text-gray-600 font-semibold text-center rounded-lg`}
          onClick={back}
        >
          Try Other Wallet
        </button>
      </div>
      <PoweredByPicket />
    </>
  );
};
export default TokenGateFailureScreen;
