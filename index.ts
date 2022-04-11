import { ethers, providers } from "ethers";
import Web3Modal from "web3modal";

export const API_VERSION = "v1";
const BASE_API_URL = `https://www.picketapi.com/api/${API_VERSION}`;

export interface NonceResponse {
  nonce: string;
}

export interface AuthRequirements {
  contractAddress?: string;
  minTokenBalance?: number;
}

export interface AuthRequest extends AuthRequirements {
  walletAddress: string;
  signature: string;
}

export interface OwnershipRequest {
  walletAddress: string;
  contractAddress: string;
  minTokenBalance?: number;
}

export interface OwnershipResponse {
  allowed: boolean;
}

export interface AuthResponse {
  accessToken: string;
}

export interface AuthenticatedUser {
  walletAddress: string;
  displayAddress: string;
  // TODO: Add more
}

export interface AuthState {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface ConnectResponse {
  walletAddress: string;
  signature: string;
}

// Consider migrating to cookies https://github.com/auth0/auth0.js/pull/817
const LOCAL_STORAGE_KEY = "_picketauth";

export class Picket {
  baseURL = BASE_API_URL;
  #apiKey;
  #authState?: AuthState;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Missing publishable API Key");
    }
    this.#apiKey = apiKey;
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
      headers: { ...this.#defaultHeaders },
      body: JSON.stringify({
        walletAddress,
      }),
      credentials: "include",
    });
    return await res.json();
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
    const url = `${this.baseURL}/auth`;
    const reqOptions = {
      method: "POST",
      headers: { ...this.#defaultHeaders },
      body: JSON.stringify(requestBody),
    };
    const res = await fetch(url, reqOptions);
    return await res.json();
  }

  /**
   * Validate
   * Validate the given access token and requirements
   */
  async validate(jwt: string): Promise<boolean> {
    if (!jwt) return false;

    const url = `${this.baseURL}/auth/verify`;

    // TODO: Fix to only use one authorization method
    const headers = {
      Authorization: `Bearer ${jwt}`,
      ...this.#defaultHeaders,
    };

    const res = await fetch(url, {
      headers,
    });

    const { valid }: { valid: boolean } = await res.json();

    return valid;
  }

  // -----------
  // Client-side SDK Utilities
  // -----------

  /**
   * getSigner
   * Method to handle client side logic for fetching wallet/signer
   */
  async getSigner(): Promise<providers.JsonRpcSigner> {
    // Temporary workaround for issues with Web3Modal bundling w/ swc
    // @ts-ignore
    const web3Modal = new Web3Modal.default({
      cacheProvider: true,
      providerOptions: {}, // required
      disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    });

    const provider = await web3Modal.connect();
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

    const { accessToken } = await this.auth({
      walletAddress,
      signature,
      contractAddress,
      minTokenBalance,
    });

    const authState = {
      accessToken,
      // TODO: Derive user from auth response (or include in auth response)
      user: {
        walletAddress,
        displayAddress: walletAddress,
      },
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
    //Initiate signature request
    const signer = await this.getSigner();
    // Invokes client side wallet for user to connect wallet
    const walletAddress = await signer.getAddress();
    const signature = await this.getSignature();

    return {
      walletAddress,
      signature,
    };
  }

  /**
   * logout
   * Clears authentication information
   */
  async logout(): Promise<void> {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    return Promise.resolve();
  }

  /**
   * getAuthState
   * get user auth information if it exists
   */
  async getAuthState(): Promise<AuthState | null> {
    // check memory
    // check state
    if (this.#authState) return this.#authState;

    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return Promise.resolve(null);

    // TODO: if JWT is expired deleted it!

    const authState: AuthState = JSON.parse(stored);
    this.#authState = authState;

    return Promise.resolve(authState);
  }
}

export default Picket;
