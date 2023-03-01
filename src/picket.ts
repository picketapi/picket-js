import BigNumber from "bignumber.js";
import pkceChallenge from "pkce-challenge";

// Ethereum imports
import { SiweMessage } from "siwe";

import { connect as PicketConnect } from "./connect";

import { randomState, parseAuthorizationCodeParams } from "./pkce";
import * as popup from "./popup";
import {
  AuthenticatedUser,
  ErrorResponse,
  NonceRequest,
  NonceResponse,
  AuthRequirements,
  LoginRequest,
  LoginOptions,
  AuthState,
  AccessTokenPayload,
  ConnectResponse,
  AuthorizationURLRequest,
  LoginCallbackResponse,
  ChainTypes,
  ChainInfo,
  ConnectRequest,
  SigningMessageFormat,
  AuthRequest,
  SigningMessageRequest,
  SigningMessageRequestSIWE,
  SigningMessageRequestSimple,
} from "./types";

export type PicketTheme = "light" | "dark" | "auto";

export interface PicketOptions {
  theme?: PicketTheme;
  baseURL?: string;
}

const DEFAULT_LOCALE = "en";
export const DEFAULT_THEME = "light";

export const API_VERSION = "v1";
const BASE_API_URL = `https://picketapi.com/api/${API_VERSION}`;

// Consider migrating to cookies https://github.com/auth0/auth0.js/pull/817
const LOCAL_STORAGE_KEY = "_picketauth";
const PKCE_STORAGE_KEY = `${LOCAL_STORAGE_KEY}_pkce`;

const isSuccessfulStatusCode = (status: number) =>
  status >= 200 && status < 300;

// If b is 0, then it checks if a is positive
// If b is non-zero, then check for greater than or equal to
const isGreaterThanOrEqualToOrNonZero = (a: BigNumber, b: BigNumber) => {
  if (b.isZero()) {
    // use isGreaterThan because isPositive returns true for 0
    return a.isGreaterThan(0);
  }

  return a.isGreaterThanOrEqualTo(b);
};

// TODO: Connect Provider Options
export class Picket {
  baseURL = BASE_API_URL;
  theme: PicketTheme = DEFAULT_THEME;
  #apiKey;
  #authState?: AuthState;
  #chainCache: Record<string, ChainInfo> = {};
  #isAuthorizing = false;

  constructor(
    apiKey: string,
    { baseURL = BASE_API_URL, theme = DEFAULT_THEME }: PicketOptions = {}
  ) {
    if (!apiKey) {
      throw new Error("Missing publishable API Key");
    }
    this.#apiKey = apiKey;

    this.baseURL = baseURL;
    this.theme = theme;

    if (typeof window !== "undefined") {
      window.picket = this;
    }
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
    chain = ChainTypes.ETH,
    // default to English
    locale = DEFAULT_LOCALE,
  }: NonceRequest): Promise<NonceResponse> {
    const url = `${this.baseURL}/auth/nonce`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        chain,
        walletAddress,
        locale,
      }),
    });
    const data = await res.json();

    // Reject non-successful responses
    if (!isSuccessfulStatusCode(res.status)) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as NonceResponse;
  }

  /**
   * auth
   * Function for initiating auth / token gating
   */
  async auth({
    chain = ChainTypes.ETH,
    walletAddress,
    signature,
    requirements,
    context,
  }: AuthRequest): Promise<AuthState> {
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
        chain,
        walletAddress,
        signature,
        requirements,
        context,
      }),
    };

    const res = await fetch(url, reqOptions);
    const data = await res.json();

    // Reject non-successful responses
    if (!isSuccessfulStatusCode(res.status)) {
      return Promise.reject(data as ErrorResponse);
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    this.#authState = data;

    return data as AuthState;
  }

  /**
   * authz
   * Function for checking if a given user is authorized (aka meets the requirements)
   */
  async authz({
    accessToken,
    requirements,
    revalidate = false,
  }: {
    accessToken: string;
    requirements: AuthRequirements;
    revalidate?: boolean;
  }): Promise<AuthState> {
    if (!accessToken) {
      throw new Error(
        "accessToken parameter is required - see docs for reference."
      );
    }
    if (!requirements) {
      throw new Error(
        "requirements parameter is required - see docs for reference."
      );
    }

    if (this.#isAuthorizing) {
      console.warn(
        "Already authorizing. Concurrent authorization requests are not supported yet and may cause unexpected behavior."
      );
    }

    // TODO: Add request queue to ensure only one request is made at a time
    // Temporary flag for warning developers
    this.#isAuthorizing = true;

    const url = `${this.baseURL}/authz`;
    const reqOptions = {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        accessToken,
        requirements,
        revalidate,
      }),
    };

    const res = await fetch(url, reqOptions);
    const data = await res.json();

    // Reject non-successful responses
    if (!isSuccessfulStatusCode(res.status)) {
      this.#isAuthorizing = false;
      return Promise.reject(data as ErrorResponse);
    }

    // on success update auth state
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    this.#authState = data;

    this.#isAuthorizing = false;
    return data as AuthState;
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

    // Reject non-successful responses
    if (!isSuccessfulStatusCode(res.status)) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as AccessTokenPayload;
  }

  /**
   * chainInfo
   * Function for retrieving chain information
   */
  async chainInfo(chain: string): Promise<ChainInfo> {
    if (this.#chainCache[chain]) return this.#chainCache[chain];

    const url = `${this.baseURL}/chains/${chain}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.#defaultHeaders(),
    });
    const data = await res.json();

    // Reject non-successful responses
    if (!isSuccessfulStatusCode(res.status)) {
      return Promise.reject(data as ErrorResponse);
    }

    // save to cache
    this.#chainCache[chain] = data as ChainInfo;

    return data as ChainInfo;
  }

  /**
   * chains
   * Function for retrieving information on supported chains
   */
  async chains(): Promise<ChainInfo[]> {
    const url = `${this.baseURL}/chains`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.#defaultHeaders(),
    });
    const data = await res.json();

    // reject any error code > 201
    if (!isSuccessfulStatusCode(res.status)) {
      return Promise.reject(data as ErrorResponse);
    }

    // save to cache
    for (const chain of data.data) {
      this.#chainCache[chain.chainSlug] = chain;
    }

    return data.data as ChainInfo[];
  }

  // -----------
  // Client-side SDK Utilities
  // -----------

  /**
   * login
   * Login with your wallet, and optionally, specify login requirements
   */
  async login(req?: LoginRequest): Promise<AuthState> {
    return await this.loginWithTrustedWalletProivder(req);
  }

  /**
   * loginWithTrustedWalletProivder
   * Login with a trusted wallet provider that supports Sign-In With Ethereum (EIP-4361) or similar standard
   */
  async loginWithTrustedWalletProivder({
    chain,
    walletAddress,
    signature,
    context,
    ...requirements
  }: LoginRequest = {}): Promise<AuthState> {
    // 1. If no signature provided, connect to local provider and get signature
    if (!(walletAddress && signature)) {
      const { auth, ...info } = await this.connect({
        chain,
        doAuth: true,
        requirements,
      });

      if (auth) return auth;

      walletAddress = info.walletAddress;
      signature = info.signature;
      context = info.context;
      chain = info.chain;
    }

    // 2. Exchange signature for access token
    return await this.auth({
      chain: chain || ChainTypes.ETH,
      walletAddress,
      signature,
      context,
      requirements,
    });
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
    tokenIds,
    collection,
    creatorAddress,
    minTokenBalance,
    allowedWallets,
    redirectURI,
    codeChallenge,
    state,
    responseMode,
    locale = DEFAULT_LOCALE,
  }: AuthorizationURLRequest): string {
    const url = new URL(`${this.baseURL}/oauth2/authorize`);
    url.searchParams.set("client_id", this.#apiKey);
    url.searchParams.set("redirect_uri", redirectURI);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("state", state);

    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("response_mode", responseMode);

    url.searchParams.set("locale", locale);

    chain && url.searchParams.set("chain", chain);
    walletAddress && url.searchParams.set("walletAddress", walletAddress);
    signature && url.searchParams.set("signature", signature);
    contractAddress && url.searchParams.set("contractAddress", contractAddress);
    minTokenBalance &&
      url.searchParams.set("minTokenBalance", String(minTokenBalance));

    // START: Solana-specific
    if (collection) {
      const collections = Array.isArray(collection) ? collection : [collection];
      for (const c of collections) {
        url.searchParams.append("collection", c);
      }
    }
    creatorAddress && url.searchParams.set("creatorAddress", creatorAddress);

    if (tokenIds) {
      for (let id of tokenIds) {
        url.searchParams.append("tokenIds", id);
      }
    }
    // END: Solana-specific

    if (allowedWallets) {
      for (let address of allowedWallets) {
        url.searchParams.append("allowedWallets", address);
      }
    }

    return url.toString();
  }

  /**
   * loginWithRedirect
   * loginWithRedirect starts the OAuth2.0 PKCE flow
   */
  async loginWithRedirect(
    {
      chain = ChainTypes.ETH,
      walletAddress,
      signature,
      tokenIds,
      contractAddress,
      minTokenBalance,
      allowedWallets,
    }: LoginRequest = {},
    { redirectURI = window.location.href, appState = {} }: LoginOptions = {
      redirectURI: window.location.href,
      appState: {},
    }
  ): Promise<void> {
    // 1. If no signature provided, connect to local provider and get signature
    if (!(walletAddress && signature)) {
      const info = await this.connect({ chain });
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
      tokenIds,
      minTokenBalance,
      allowedWallets,
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
    if (!isSuccessfulStatusCode(res.status)) {
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
   * loginWithPopup
   * loginWithPopup starts the OAuth2.0 PKCE flow
   *
   * Implements https://datatracker.ietf.org/doc/html/draft-sakimura-oauth-wmrm-00#section-2.3
   */
  async loginWithPopup(
    {
      chain = ChainTypes.ETH,
      walletAddress,
      signature,
      contractAddress,
      tokenIds,
      minTokenBalance,
      allowedWallets,
    }: LoginRequest = {},
    { redirectURI = window.location.href }: LoginOptions = {
      redirectURI: window.location.href,
    }
  ): Promise<AuthState> {
    // 1. If no signature provided, connect to local provider and get signature
    if (!(walletAddress && signature)) {
      const info = await this.connect({ chain });
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
      tokenIds,
      minTokenBalance,
      allowedWallets,
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

  static createSigningMessage(args: SigningMessageRequest) {
    const { format = SigningMessageFormat.SIMPLE } = args;

    if (!args.nonce) {
      throw new Error("'nonce' is required to create a signing message");
    }

    if (!args.walletAddress) {
      throw new Error(
        "'walletAddress' is required to create a signing message"
      );
    }

    if (format === SigningMessageFormat.SIMPLE) {
      const { statement, walletAddress, nonce } =
        args as SigningMessageRequestSimple;
      return `${statement}\n\nAddress: ${walletAddress}\nNonce: ${nonce}`;
    }

    const {
      statement,
      walletAddress,
      nonce,
      domain,
      uri,
      issuedAt,
      chainId,
      chainType,
    } = args as SigningMessageRequestSIWE;

    // validate parameters
    if (!statement) {
      throw new Error(
        "'statement' is required to create a SIWE signing message"
      );
    }
    if (!domain) {
      throw new Error("'domain' is required to create a SIWE signing message");
    }
    if (!uri) {
      throw new Error("'uri' is required to create a SIWE signing message");
    }
    if (!issuedAt) {
      throw new Error(
        "'issuedAt' is required to create a SIWE signing message"
      );
    }
    if (!chainId) {
      throw new Error("'chainId' is required to create a SIWE signing message");
    }

    const message = new SiweMessage({
      address: walletAddress,
      nonce,
      statement,
      domain,
      uri,
      chainId,
      issuedAt,
      version: "1",
    });

    let signingMessage = message.prepareMessage();

    if (chainType === ChainTypes.SOL) {
      // Solana doesn't use the SIWE standard, so modifying the message is OK
      signingMessage = signingMessage.replaceAll("Ethereum", "Solana");
    }
    if (chainType === ChainTypes.FLOW) {
      // Flow doesn't use the SIWE standard, so modifying the message is OK
      signingMessage = signingMessage.replaceAll("Ethereum", "Flow");
    }

    return signingMessage;
  }

  /**
   * connect
   * Convenience function to connect wallet and sign nonce, prompts user to connect wallet and returns wallet object
   */
  async connect({
    chain,
    doAuth = false,
    requirements,
  }: ConnectRequest): Promise<ConnectResponse> {
    return await PicketConnect({
      chain,
      doAuth,
      requirements,
      theme: this.theme,
    });
  }

  /**
   * logout
   * Clears authentication information
   */
  async logout(): Promise<void> {
    this.#authState = undefined;
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    // clear wallet connect session on logout
    window.localStorage.removeItem(
      "-walletlink:https://www.walletlink.org:version"
    );
    window.localStorage.removeItem(
      "-walletlink:https://www.walletlink.org:session:id"
    );
    window.localStorage.removeItem(
      "-walletlink:https://www.walletlink.org:session:secret"
    );
    window.localStorage.removeItem(
      "-walletlink:https://www.walletlink.org:session:linked"
    );
    window.localStorage.removeItem("walletconnect");
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
      await this.logout();
      return Promise.resolve(null);
    }

    this.#authState = authState;

    return Promise.resolve(authState);
  }

  /**
   * isCurrentUserAuthorized
   * Does the current user authorized given the requirements?
   */
  async isCurrentUserAuthorized({
    requirements,
    revalidate = false,
  }: {
    requirements: AuthRequirements;
    revalidate?: boolean;
  }): Promise<boolean> {
    const authState = await this.authState();

    // TODO: Is it better to error? prompt login? for logged out users
    if (!authState) return false;

    const { accessToken, user } = authState;

    // first check local user balance before hitting API
    if (!revalidate) {
      const allowed = Picket.meetsAuthRequirements({
        user,
        requirements,
      });

      if (allowed) return true;
    }

    try {
      await this.authz({
        accessToken,
        requirements,
        revalidate,
      });

      return true;
    } catch (err) {
      console.warn("user is not authorized", err);
      return false;
    }
  }

  /**
   * meetsAuthRequirements
   * Does the given user meet the authorization requirements?
   * Synchronous, helper function for users to check easily if the user meets the auth requirements.
   * Example usage is for setting "disabled" property on a button.
   */
  static meetsAuthRequirements({
    user,
    requirements,
  }: {
    user: AuthenticatedUser;
    requirements: AuthRequirements;
  }): boolean {
    if (!user) return false;
    // no requirements (shouldn't happen, but let's handle)
    if (!requirements || Object.keys(requirements).length === 0) return true;

    const { tokenBalances } = user;

    if (!tokenBalances || Object.keys(tokenBalances).length === 0) return false;

    const minTokenBalance = new BigNumber(requirements.minTokenBalance || 0);
    let totalBalance = new BigNumber(0);

    // EVM
    if (requirements.contractAddress && tokenBalances.contractAddress) {
      const { contractAddress } = requirements;

      const balance = tokenBalances.contractAddress[contractAddress];

      if (balance) {
        totalBalance = totalBalance.plus(balance);
      }

      const allowed = isGreaterThanOrEqualToOrNonZero(
        totalBalance,
        minTokenBalance
      );

      if (allowed) return true;
    }

    // Solana
    const { collection, tokenIds, creatorAddress } = requirements;

    if (collection && tokenBalances.collection) {
      const collections = Array.isArray(collection) ? collection : [collection];
      for (const c of collections) {
        const balance = tokenBalances.collection[c];

        if (balance) {
          totalBalance = totalBalance.plus(balance);
        }

        const allowed = isGreaterThanOrEqualToOrNonZero(
          totalBalance,
          minTokenBalance
        );

        if (allowed) return true;
      }
    }

    if (creatorAddress && tokenBalances.creatorAddress) {
      const balance = tokenBalances.creatorAddress[creatorAddress];

      if (balance) {
        totalBalance = totalBalance.plus(balance);
      }

      const allowed = isGreaterThanOrEqualToOrNonZero(
        totalBalance,
        minTokenBalance
      );

      if (allowed) return true;
    }

    if (tokenIds && tokenIds.length > 0 && tokenBalances.tokenIds) {
      for (let tokenId of tokenIds) {
        const balance = tokenBalances.tokenIds[tokenId];

        if (!balance) continue;

        totalBalance = totalBalance.plus(balance);
        const allowed = isGreaterThanOrEqualToOrNonZero(
          totalBalance,
          minTokenBalance
        );

        if (allowed) return true;
      }
    }
    return isGreaterThanOrEqualToOrNonZero(totalBalance, minTokenBalance);
  }
}
export default Picket;
