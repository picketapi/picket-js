import pkceChallenge from "pkce-challenge";

// Ethereum imports
import { ethers, providers } from "ethers";
import Web3Modal from "web3modal";

// Solana imports
import bs58 from "bs58";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import { getProviderOptions, ConnectProviderOptions } from "./providers";
import { randomState, parseAuthorizationCodeParams } from "./pkce";
import * as popup from "./popup";
import {
  ErrorResponse,
  NonceRequest,
  NonceResponse,
  AuthRequirements,
  LoginRequest,
  LoginOptions,
  AuthState,
  AccessTokenPayload,
  ConnectProvider,
  ConnectResponse,
  AuthorizationURLRequest,
  LoginCallbackResponse,
  Chains,
  Chain,
} from "./types";

export interface PicketOptions {
  connectProviderOptions?: ConnectProviderOptions;
  baseURL?: string;
}

export const API_VERSION = "v1";
const BASE_API_URL = `https://picketapi.com/api/${API_VERSION}`;

// Consider migrating to cookies https://github.com/auth0/auth0.js/pull/817
const LOCAL_STORAGE_KEY = "_picketauth";
const PKCE_STORAGE_KEY = `${LOCAL_STORAGE_KEY}_pkce`;

// TODO: Delete AuthState on 401
export class Picket {
  baseURL = BASE_API_URL;
  #provider?: ConnectProvider;
  #connectProviderOptions: ConnectProviderOptions;
  #apiKey;
  #authState?: AuthState;

  constructor(
    apiKey: string,
    { connectProviderOptions = {}, baseURL = BASE_API_URL }: PicketOptions = {}
  ) {
    if (!apiKey) {
      throw new Error("Missing publishable API Key");
    }
    this.#apiKey = apiKey;

    this.#connectProviderOptions = connectProviderOptions;
    this.baseURL = baseURL;
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
  async nonce({
    walletAddress,
    chain = Chains.ETH,
  }: NonceRequest): Promise<NonceResponse> {
    const url = `${this.baseURL}/auth/nonce`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        chain,
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
    // return selected provider if it exists
    if (this.#provider) {
      return this.#provider;
    }

    const providerOptions = getProviderOptions(this.#connectProviderOptions);

    const web3Modal = new Web3Modal({
      network: "mainnet",
      // for now, disable caching
      cacheProvider: false,
      providerOptions,
    });

    const provider = await web3Modal.connect();
    this.#provider = provider;

    return provider;
  }

  /**
   * login
   * Login with your wallet, and optionally, specify login requirements
   */
  async login(req?: LoginRequest, opts?: LoginOptions): Promise<void> {
    return await this.loginWithRedirect(req, opts);
  }

  /**
   * getAuthorizationURL
   * getAuthorizationURL returns the authorization URL for the PKCE authorization parameters.
   */
  getAuthorizationURL({
    chain,
    walletAddress,
    signature,
    contractAddress,
    minTokenBalance,
    redirectURI,
    codeChallenge,
    state,
    responseMode,
  }: AuthorizationURLRequest): string {
    const url = new URL(`${this.baseURL}/oauth2/authorize`);
    url.searchParams.set("client_id", this.#apiKey);
    url.searchParams.set("redirect_uri", redirectURI);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("state", state);

    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("response_mode", responseMode);

    chain && url.searchParams.set("chain", chain);
    walletAddress && url.searchParams.set("walletAddress", walletAddress);
    signature && url.searchParams.set("signature", signature);
    contractAddress && url.searchParams.set("contractAddress", contractAddress);
    minTokenBalance &&
      url.searchParams.set("minTokenBalance", String(minTokenBalance));

    return url.toString();
  }

  /**
   * loginWithRedirect
   * loginWithRedirect starts the OAuth2.0 PKCE flow
   */
  async loginWithRedirect(
    {
      chain = Chains.ETH,
      walletAddress,
      signature,
      contractAddress,
      minTokenBalance,
    }: LoginRequest = {},
    { redirectURI = window.location.href, appState = {} }: LoginOptions = {
      redirectURI: window.location.href,
      appState: {},
    }
  ): Promise<void> {
    // 1. If no signature provided, connect to local provider and get signature
    if (!(walletAddress && signature)) {
      const info = await this.connect(chain);
      walletAddress = info.walletAddress;
      signature = info.signature;
    }

    const state = randomState();

    // 2. generate PKCE and store!
    const { code_challenge, code_verifier } = pkceChallenge();
    window.localStorage.setItem(
      PKCE_STORAGE_KEY,
      JSON.stringify({
        code_verifier,
        state,
        appState,
        redirectURI,
      })
    );

    // 3. get authorization URL
    const authorizationURL = this.getAuthorizationURL({
      chain,
      walletAddress,
      signature,
      contractAddress,
      minTokenBalance,
      redirectURI,
      state,
      codeChallenge: code_challenge,
      responseMode: "code",
    });

    // 4. redirect user
    window.location.assign(authorizationURL);
  }

  /**
   * oauth2AuthorizationCodeToken
   * oauth2AuthorizationCodeToken implements the final step of the OAuth2.0 PKCE flow and exchanges an authorization code for an access token.
   */
  async oauth2AuthorizationCodeToken({
    code,
    codeVerifier,
    redirectURI,
  }: {
    code: string;
    codeVerifier: string;
    redirectURI: string;
  }): Promise<AuthState> {
    // get the token!
    const res = await fetch(`${this.baseURL}/oauth2/token`, {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
        code,
        redirect_uri: redirectURI,
      }),
    });

    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    // save it locally!
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    this.#authState = data;

    return data as AuthState;
  }

  /**
   * handleLoginRedirect
   * handleLoginRedirect fetches an access token after a successful authorization redirect.
   * If there are no authorization code query parameters or there are error query parameters, it will raise an error.
   */
  async handleLoginRedirect(
    url: string = window.location.href
  ): Promise<LoginCallbackResponse> {
    const { code, state, error, error_description } =
      parseAuthorizationCodeParams(url);

    if (error) {
      // OAuth 2.0 specifies at least error must be defined
      throw new Error(error_description || error);
    }

    if (!code) {
      throw new Error("no authorization code in query");
    }

    const transaction = window.localStorage.getItem(PKCE_STORAGE_KEY);

    if (!transaction) {
      throw new Error("invalid state. missing pkce transaction data.");
    }

    const {
      code_verifier,
      state: storedState,
      redirectURI,
      appState,
    } = JSON.parse(transaction);
    if (!code_verifier) {
      throw new Error(
        "invalid state. code_verifier is missing in pkce transaction data"
      );
    }

    if (storedState !== state) {
      throw new Error(
        "invalid state. stored state doesn't match query parameter state "
      );
    }

    const auth = await this.oauth2AuthorizationCodeToken({
      code,
      codeVerifier: code_verifier,
      redirectURI,
    });

    // clear PKCE transaction from storage
    window.localStorage.removeItem(PKCE_STORAGE_KEY);

    return { ...auth, appState } as LoginCallbackResponse;
  }

  /**
   *ggloginWithPopup
   * loginWithPopup starts the OAuth2.0 PKCE flow
   *
   * Implements https://datatracker.ietf.org/doc/html/draft-sakimura-oauth-wmrm-00#section-2.3
   */
  async loginWithPopup(
    {
      chain = Chains.ETH,
      walletAddress,
      signature,
      contractAddress,
      minTokenBalance,
    }: LoginRequest = {},
    { redirectURI = window.location.href }: LoginOptions = {
      redirectURI: window.location.href,
    }
  ): Promise<AuthState> {
    // 1. If no signature provided, connect to local provider and get signature
    if (!(walletAddress && signature)) {
      const info = await this.connect(chain);
      walletAddress = info.walletAddress;
      signature = info.signature;
    }

    const state = randomState();

    // 2. generate PKCE and store!
    const { code_challenge, code_verifier } = pkceChallenge();

    // 3. get authorization URL
    const authorizationURL = this.getAuthorizationURL({
      chain,
      walletAddress,
      signature,
      contractAddress,
      minTokenBalance,
      state,
      codeChallenge: code_challenge,
      redirectURI,
      responseMode: "web_message",
    });

    // 4. Open popup
    let authorizationPopup = popup.open(authorizationURL);

    // try see if the popup has been blocked
    if (
      !authorizationPopup ||
      authorizationPopup.closed ||
      typeof authorizationPopup.closed === "undefined"
    ) {
      throw new Error("failed to open popup");
    }

    const res = await popup.run(authorizationPopup);

    if (res.error) {
      // OAuth 2.0 specifies at least error must be defined
      throw new Error(res.error_description || res.error);
    }

    if (!res.code) {
      throw new Error("no authorization code returned from popup");
    }

    if (res.state !== state) {
      throw new Error(
        "invalid state. stored state doesn't match query parameter state "
      );
    }

    const auth = await this.oauth2AuthorizationCodeToken({
      code: res.code,
      codeVerifier: code_verifier,
      redirectURI,
    });

    return auth;
  }

  /**
   * connect
   * Convenience function to connect wallet and sign nonce, prompts user to connect wallet and returns wallet object
   */
  async connect(chain: Chain = Chains.ETH): Promise<ConnectResponse> {
    // TODO: Support Multiple Solana Wallets
    // Connect to Solana Wallet
    if (chain === Chains.SOL) {
      const wallet = new PhantomWalletAdapter();
      await wallet.connect();

      const { connected, publicKey } = wallet;

      if (!connected || !publicKey) {
        throw new Error("failed to connect to Phantom wallet");
      }

      const walletAddress = publicKey.toString();

      // Get Nonce
      const { nonce } = await this.nonce({ walletAddress, chain });
      const message = new TextEncoder().encode(nonce);

      const signatureBytes = await wallet.signMessage(message);
      const signature = bs58.encode(signatureBytes);

      return {
        walletAddress,
        signature,
        provider: wallet,
      };
    }

    // Connect to Ethereum Wallet

    // connect to user's wallet provider
    const provider = await this.getProvider();
    const wallet = new ethers.providers.Web3Provider(provider);
    const signer = wallet.getSigner();
    const walletAddress = await signer.getAddress();

    // Get Nonce
    const { nonce } = await this.nonce({ chain, walletAddress });

    // Sign the nonce to get signature
    const signature = await signer.signMessage(nonce);

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
    this.#provider = undefined;
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
