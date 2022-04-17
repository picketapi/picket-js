import { ethers, providers } from "ethers";
import Web3Modal from "web3modal";

import { getProviderOptions, ConnectProviderOptions } from "./providers";

import {
  ErrorResponse,
  NonceResponse,
  AuthRequirements,
  AuthRequest,
  AuthResponse,
  AuthState,
  AccessTokenPayload,
  ConnectProvider,
  ConnectResponse,
} from "./types";

export interface PicketOptions {
  connectProviderOptions?: ConnectProviderOptions;
}

export const API_VERSION = "v1";
const BASE_API_URL = `https://picketapi.com/api/${API_VERSION}`;

// Consider migrating to cookies https://github.com/auth0/auth0.js/pull/817
const LOCAL_STORAGE_KEY = "_picketauth";

// TODO: Delete AuthState on 401
export class Picket {
  baseURL = BASE_API_URL;
  web3Modal?: Web3Modal;
  #connectProviderOptions: ConnectProviderOptions;
  #apiKey;
  #authState?: AuthState;

  constructor(
    apiKey: string,
    { connectProviderOptions = {} }: PicketOptions = {}
  ) {
    if (!apiKey) {
      throw new Error("Missing publishable API Key");
    }
    this.#apiKey = apiKey;

    this.#connectProviderOptions = connectProviderOptions;
  }

  #defaultHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Basic  ${btoa(this.#apiKey)}`,
  });

  // -------------
  // API SDK
  // -------------

  /**
   * nonce
   * Function for retrieving nonce for a given user
   */
  async nonce(walletAddress: string): Promise<NonceResponse> {
    const url = `${this.baseURL}/auth/nonce`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        walletAddress,
      }),
    });
    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as NonceResponse;
  }

  /**
   * Auth
   * Function for initiating auth / token gating
   */
  async auth({
    walletAddress,
    signature,
    requirements,
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

    const url = `${this.baseURL}/auth`;
    const reqOptions = {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        walletAddress,
        signature,
        requirements,
      }),
    };

    const res = await fetch(url, reqOptions);
    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as AuthResponse;
  }

  /**
   * Validate
   * Validate the given access token and requirements
   */
  async validate(
    accessToken: string,
    requirements?: AuthRequirements
  ): Promise<AccessTokenPayload> {
    if (!accessToken) {
      return Promise.reject({ msg: "access token is empty" });
    }

    const url = `${this.baseURL}/auth/validate`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        accessToken,
        requirements,
      }),
    });

    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as AccessTokenPayload;
  }

  // -----------
  // Client-side SDK Utilities
  // -----------

  /**
   * getProvider
   * connect to wallet provider
   */
  async getProvider(): Promise<ConnectProvider> {
    // only re-init if needed
    if (!(this.web3Modal && this.web3Modal.cachedProvider)) {
      const providerOptions = getProviderOptions(this.#connectProviderOptions);

      // Temporary workaround for issues with Web3Modal bundling w/ swc
      // Solution: https://github.com/Web3Modal/web3modal#using-in-vanilla-javascript
      // @ts-ignore
      this.web3Modal = new Web3Modal.default({
        network: "mainnet",
        cacheProvider: true,
        providerOptions,
      });
    }

    // @ts-ignore this is initialized above, but ts doesn't recognize
    const provider = await this.web3Modal.connect();

    return provider;
  }

  /**
   * getSigner
   * Method to handle client side logic for fetching wallet/signer
   */
  async getSigner(): Promise<providers.JsonRpcSigner> {
    const provider = await this.getProvider();
    const wallet = new ethers.providers.Web3Provider(provider);
    const signer = wallet.getSigner();

    return signer;
  }

  /**
   * getSignature
   * Initiates signature request
   */
  async getSignature(): Promise<string> {
    //Initiate signature request
    const signer = await this.getSigner(); //Invokes client side wallet for user to connect wallet
    const walletAddress = await signer.getAddress();

    //Get Nonce
    const { nonce } = await this.nonce(walletAddress);

    //Sign the nonce to get signature
    const signature = await signer.signMessage(nonce);

    return signature;
  }

  /**
   * login
   * Login with your wallet, and optionally, specify login requirements
   */
  async login({
    contractAddress,
    minTokenBalance,
  }: AuthRequirements = {}): Promise<AuthState> {
    //Initiate signature request
    const signer = await this.getSigner();
    // Invokes client side wallet for user to connect wallet
    const walletAddress = await signer.getAddress();
    const signature = await this.getSignature();

    const { accessToken, user } = await this.auth({
      walletAddress,
      signature,
      requirements: {
        contractAddress,
        minTokenBalance,
      },
    });

    const authState = {
      accessToken,
      user,
    };

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authState));
    this.#authState = authState;

    return authState;
  }

  /**
   * connect
   * Convenience function to connect wallet and sign nonce, prompts user to connect wallet and returns wallet object
   */
  async connect(): Promise<ConnectResponse> {
    // connect to user's wallet provider
    const provider = await this.getProvider();

    const wallet = new ethers.providers.Web3Provider(provider);
    const signer = wallet.getSigner();
    const walletAddress = await signer.getAddress();

    // Initiate signature request
    const signature = await this.getSignature();

    return {
      walletAddress,
      signature,
      provider,
    };
  }

  /**
   * logout
   * Clears authentication information
   */
  async logout(): Promise<void> {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (this.web3Modal) {
      this.web3Modal.clearCachedProvider();
    }
    return Promise.resolve();
  }

  /**
   * authState
   * get user auth information if it exists
   */
  async authState(): Promise<AuthState | null> {
    // check memory
    // check state
    if (this.#authState) return this.#authState;

    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return Promise.resolve(null);

    const authState: AuthState = JSON.parse(stored);

    // validate the accessToken on the ad
    try {
      await this.validate(authState.accessToken);
    } catch (err) {
      console.log("deleting invalid access token:", err);
      return Promise.resolve(null);
    }

    this.#authState = authState;

    return Promise.resolve(authState);
  }
}

export default Picket;
