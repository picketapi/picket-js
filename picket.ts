import ethers, { providers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";

export const API_VERSION = "v1";
const BASE_API_URL = `https://picket-picketauth.vercel.app/api/${API_VERSION}`;

export interface NonceResponse {
  nonce: string;
}

export interface AuthRequest {
  walletAddress: string;
  signature: string;
  contractAddress?: string;
  minTokenBalance?: number;
}

export interface AuthResponse {
  token: string;
}

export class Picket {
  #apiKey;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Missing API Key");
    }
    this.#apiKey = apiKey;

    // TODO: Do API key validation and get the associated wallet address
  }

  // API SDK

  /**
   * getNonce
   * Function for retrieving nonce for a given user
   */
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    const url = `${BASE_API_URL}/nonce/${walletAddress}`;
    const headers = {
      "Content-Type": "application/json",
      "X-API-KEY": this.#apiKey,
    };
    const res = await fetch(url, { headers });
    return res.json();
  }

  /**
   * Auth
   * Function for initiating auth / token gating
   */
  async auth({
    walletAddress,
    signature,
    contractAddress,
    minTokenBalance,
  }: AuthRequest): Promise<AuthResponse> {
    if (!walletAddress) {
      throw new Error(
        "walletAddress parameter is required - see docs for reference."
      );
    }
    if (!signature) {
      throw new Error(
        "signature parameter is required - see docs for reference."
      );
    }

    const requestBody = Boolean(contractAddress)
      ? { walletAddress, signature, contractAddress, minTokenBalance }
      : { walletAddress, signature };
    const url = `${BASE_API_URL}/auth`;
    const headers = {
      "Content-Type": "application/json",
      "X-API-KEY": this.#apiKey,
    };
    const reqOptions = {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    };
    const res = await fetch(url, reqOptions);
    return res.json();
  }

  // -----------
  // SDK Utilities
  // -----------

  /**
   * getSigner
   * Method to handle client side logic for fetching wallet/signer
   */
  async getSigner(): Promise<providers.JsonRpcSigner> {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: "8f98cc81f4be40439b2bbd92f4995f48",
        },
      },
    };
    const web3Modal = new Web3Modal({
      cacheProvider: false, // optional
      providerOptions, // required
      disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    });

    const provider = await web3Modal.connect();
    const wallet = new ethers.providers.Web3Provider(provider);
    const signer = wallet.getSigner();

    return signer;
  }

  /**
   * Connect
   * Initiates signature request
   */
  async connect(): Promise<{ walletAddress: string; signature: string }> {
    //Initiate signature request
    const signer = await this.getSigner(); //Invokes client side wallet for user to connect wallet
    const walletAddress = await signer.getAddress();

    //Get Nonce
    const { nonce } = await this.getNonce(walletAddress);

    //Sign the nonce to get signature
    const signature = await signer.signMessage(nonce);

    return {
      walletAddress,
      signature,
    };
  }
}
