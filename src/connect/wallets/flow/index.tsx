import React from "react";

import * as fcl from "@onflow/fcl";

import { Wallet, FlowWallet } from "../";

fcl.config({
  "flow.network": "mainnet",
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "discovery.authn.endpoint": "https://fcl-discovery.onflow.org/api/authn",
  // Wallet list
  // https://github.com/onflow/fcl-discovery/blob/master/data/services.json
  // support dapper and ledger
  "discovery.authn.include": ["0xead892083b3e2c6c", "0xe5cd26afebe62781"],
});

let walletsPromise: Promise<Wallet[]> | null = null;

export const loadWallets = async () => {
  if (walletsPromise) return walletsPromise;

  walletsPromise = new Promise((resolve) => {
    fcl.discovery.authn.subscribe((res: any) => {
      if (!res || !Object.keys(res).length) return;

      const wallets = res.results.map(
        (service: any) => new FlowWallet({ service })
      );

      return resolve(wallets);
    });
  });

  return walletsPromise;
};

export default loadWallets;
