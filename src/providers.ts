const ETH_MAINNET_RPC_URL = "https://rpc.flashbots.net";

const providerOptions = {
  walletconnect: {
    package: () => import("@walletconnect/web3-provider"),
    options: {
      rpc: {
        1: ETH_MAINNET_RPC_URL,
      },
    },
  },
  coinbasewallet: {
    package: () => import("@coinbase/wallet-sdk"),
    options: {
      appName: "Picket API",
      rpc: ETH_MAINNET_RPC_URL,
      chainId: 1,
      darkMode: false,
    },
  },
  frame: {
    // @ts-ignore no types exist
    package: () => import("eth-provider"),
  },
};

export default providerOptions;
