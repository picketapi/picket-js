import React from "react";

import { config } from "@onflow/fcl";
import * as fcl from "@onflow/fcl";

config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.authn.endpoint":
    "https://fcl-discovery.onflow.org/api/testnet/authn",
});

// Wallet list
// https://github.com/onflow/fcl-discovery/blob/master/data/services.json
export let wallets = [];

// Service	Testnet	Mainnet
// Dapper Wallet	0x82ec283f88a62e65	0xead892083b3e2c6c
// Ledger	0x9d2e44203cb13051	0xe5cd26afebe62781
// config({
// "discovery.authn.endpoint": "https://fcl-discovery.onflow.org/api/testnet/authn", // Endpoint set to Testnet
// "discovery.authn.include": ["0x9d2e44203cb13051"] // Ledger wallet address on Testnet set to be included
// })

export const getWallets = async () =>
  new Promise((resolve) => {
    fcl.discovery.authn.subscribe((res) => {
      if (!res || !Object.keys(res).length) return;
      console.log("here", res);

      resolve(res.results);
    });
  });

export default wallets;
