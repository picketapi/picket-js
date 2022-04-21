import { ethers, providers } from "ethers";
import Web3Modal from "web3modal";
import pkceChallenge from "pkce-challenge";

import { getProviderOptions, ConnectProviderOptions } from "./providers";
import { randomState, parseAuthorizationCodeParams } from "./pkce";
import {
  ErrorResponse,
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
  web3Modal?: Web3Modal;
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
      this.web3Modal = new Web3Modal({
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
  async login(req?: LoginRequest, opts?: LoginOptions): Promise<void> {
    return await this.loginWithRedirect(req, opts);
  }

  /**
   * getAuthorizationURL
   * getAuthorizationURL returns the authorization URL for the PKCE authorization parameters.
   */
  getAuthorizationURL({
    walletAddress,
    signature,
    contractAddress,
    minTokenBalance,
    redirectURI,
    codeChallenge,
    state,
  }: AuthorizationURLRequest): string {
    const url = new URL(`${this.baseURL}/oauth2/authorize`);
    url.searchParams.set("client_id", this.#apiKey);
    url.searchParams.set("walletAddress", walletAddress);
    url.searchParams.set("signature", signature);
    url.searchParams.set("redirect_uri", redirectURI);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("state", state);

    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("response_type", "code");

    if (contractAddress) {
      url.searchParams.set("contractAddress", contractAddress);
    }
    if (minTokenBalance) {
      url.searchParams.set("minTokenBalance", String(minTokenBalance));
    }
    return url.toString();
  }

  /**
   * loginWithRedirect
   * loginWithRedirect starts the OAuth2.0 PKCE flow
   */
  async loginWithRedirect(
    {
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
      const info = await this.connect();
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
      walletAddress,
      signature,
      contractAddress,
      minTokenBalance,
      redirectURI,
      state,
      codeChallenge: code_challenge,
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
