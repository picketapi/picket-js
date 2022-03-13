import ethers, { providers } from "ethers";
import Web3Modal, { IProviderOptions } from "web3modal";

export const API_VERSION = "v1";
const BASE_API_URL = `https://picket-picketauth.vercel.app/api/${API_VERSION}`;

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
  token: string;
}

export class Picket {
  #apiKey;
  #providerOptions;

  // TODO: Add optional wallet connect options
  constructor(apiKey: string, providerOptions: IProviderOptions = {}) {
    if (!apiKey) {
      throw new Error("Missing API Key");
    }
    this.#apiKey = apiKey;
    this.#providerOptions = providerOptions;

    // TODO: Do API key validation and get the associated wallet address
  }

  // -------------
  // API SDK
  // -------------

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
    return await res.json();
  }

  /**
   * Ownership
   * Function for initiating auth / token gating
   */
  async ownership({
    walletAddress,
    contractAddress,
    minTokenBalance,
  }: OwnershipRequest): Promise<OwnershipResponse> {
    if (!walletAddress) {
      throw new Error(
        "walletAddress parameter is required - see docs for reference."
      );
    }
    if (!contractAddress) {
      throw new Error(
        "contractAddress parameter is required - see docs for reference."
      );
    }

    const requestBody = { walletAddress, contractAddress, minTokenBalance };
    const url = `${BASE_API_URL}/ownership`;
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
    return await res.json();
  }

  /**
   * Verify
   * Function for initiating auth / token gating
   */
  async verify(jwt: string): Promise<boolean> {
    if (!jwt) return false;

    const url = `${BASE_API_URL}/verify`;

    const headers = {
      "Content-Type": "application/json",
      "X-API-KEY": this.#apiKey,
      Authorization: `Bearer ${jwt}`,
    };

    const res = await fetch(url, {
      headers,
    });

    const { valid }: { valid: boolean } = await res.json();

    return valid;
  }

  // -----------
  // SDK Utilities
  // -----------

  /**
   * getSigner
   * Method to handle client side logic for fetching wallet/signer
   */
  async getSigner(): Promise<providers.JsonRpcSigner> {
    const web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions: this.#providerOptions, // required
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
    const { nonce } = await this.getNonce(walletAddress);

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
  }: AuthRequirements = {}): Promise<string> {
    //Initiate signature request
    const signer = await this.getSigner(); //Invokes client side wallet for user to connect wallet
    const walletAddress = await signer.getAddress();
    const signature = await this.getSignature();

    const { token } = await this.auth({
      walletAddress,
      signature,
      contractAddress,
      minTokenBalance,
    });

    return token;
  }
}
