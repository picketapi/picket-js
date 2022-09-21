import { ChainInfo } from "../../types";

import { utils } from "ethers";

const NETWORK_DOESNT_EXIST_CODE = 4902;

// pulled from https://github.com/ethereum-lists/chains/tree/master/_data/chains
export const evmChainWalleteInfo: Record<string, object> = {
  ethereum: {
    chainName: "Ethereum",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://etherscan.io/"],
  },
  polygon: {
    chainName: "Polygon",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrls: ["https://polygonscan.com/"],
  },
  optimism: {
    chainName: "Optimism",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://optimistic.etherscan.io/"],
  },
  arbitrum: {
    chainName: "Arbitrum One",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: [
      "https://arbiscan.io/",
      "https://explorer.arbitrum.io/",
    ],
  },
  avalanche: {
    chainName: "Avalanche C-Chain",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
    blockExplorerUrls: ["https://snowtrace.io/"],
  },
};

// switch or add chain
export const addOrSwitchEVMChain = async ({
  chainId,
  chainSlug,
  chainName,
  publicRPC,
}: Pick<
  ChainInfo,
  "chainId" | "chainSlug" | "chainName" | "publicRPC"
>): Promise<undefined> => {
  // only support window.ethereum for now
  if (
    typeof window === "undefined" ||
    !window.ethereum ||
    // @ts-ignore
    !window.ethereum.isConnected()
  )
    return;

  // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
  try {
    await window.ethereum?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: utils.hexValue(chainId) }],
    });
  } catch (err) {
    if (!err) return;

    if (
      typeof err === "object" &&
      "code" in err &&
      // @ts-ignore typecheck not working
      err.code === NETWORK_DOESNT_EXIST_CODE
    ) {
      try {
        const params = evmChainWalleteInfo[chainSlug] || {};
        await window.ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainName,
              chainId: utils.hexValue(chainId),
              rpcUrls: [publicRPC],
              ...params,
            },
          ],
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      // unknown error
      console.log(err);
    }
  }
};
