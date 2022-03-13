import ethers from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";

const BASE_API_URL = "https://picket-picketauth.vercel.app/api/v1";

export class Picket {
  #apiKey;

  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("Missing API Key");
    }
    this.#apiKey = apiKey;
  }

  /**
   * getNonce
   * Function for retrieving nonce for a given user
   *
   * @param  {string} walletAddress
   *
   * @returns {Object} Object contains wallet address and signature.
   *
   */
  async getNonce(walletAddress) {
    const url = `${BASE_API_URL}/nonce/${walletAddress}`;
    const headers = {
      "Content-Type": "application/json",
      "X-API-KEY": this.#apiKey,
    };
    const res = await fetch(url, { headers });
    return res.json();
  }

  /**
   * Connect
   * Initiates signature request
   *
   * @params  none
   *
   * @returns {Object} Object contains wallet address and signature.
   *
   */
  async connect() {
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

  /**
   * getSigner
   * Method to handle client side logic for fetching wallet/signer
   *
   * @params  none
   *
   * @returns {Object} Signer
   *
   */
  async getSigner() {
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
   * Auth
   * Function for initiating auth / token gating
   *
   * @params  none
   *
   * @returns {Object} Signer
   *
   */
  async auth({ walletAddress, signature, contractAddress, minTokenBalance }) {
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

    let requestBody = { walletAddress, signature };
    if (contractAddress && minTokenBalance) {
      requestBody = {
        walletAddress,
        signature,
        contractAddress,
        minTokenBalance,
      };
    }

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
}
