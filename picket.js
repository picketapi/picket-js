// import Web3Modal from "web3modal";
// import WalletConnectProvider from "@walletconnect/web3-provider";
// import { ethers } from "ethers";

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const ethers = window.ethers;

export class Picket{
    #apiKey;

    constructor(apiKey){
        if(!apiKey){
            throw new Error("Missing API Key");
        }
        this.#apiKey = apiKey
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
    async getNonce(walletAddress){
        // const url = "https://picket-devstein.vercel.app/api/nonce/" + walletAddress
    
        // const res = await fetch(url);
        // return res.json();

        return "7c3a842d-061a-43ad-87ea-5f121758f736"//Temporary until getNonce API is working
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
    async connect(){
        //Initiate signature request
        const signer = await this.getSigner() //Invokes client side wallet for user to connect wallet
        let walletAddress = await signer.getAddress()

        //Get Nonce
        let nonce = await this.getNonce(walletAddress)

        //Sign the nonce to get signature
        let signature = await signer.signMessage(nonce)
        
        //Construct response object
        let responseObject = {}
        responseObject.walletAddress = walletAddress
        responseObject.signature = signature

        return responseObject
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
    async getSigner(){
        const providerOptions = {
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                infuraId: '8f98cc81f4be40439b2bbd92f4995f48'
                },
            },
        };
        const web3Modal = new Web3Modal({
            cacheProvider: false, // optional
            providerOptions, // required
            disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
        });

        let provider = await web3Modal.connect();
        const wallet = await new ethers.providers.Web3Provider(provider);
        const signer = await wallet.getSigner();

        return signer
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
    async auth(walletAddress, signature, contractAddress, minBalance, chain){
        if(! walletAddress){
            throw new Error("walletAddress parameter is required - see https://google.com for reference.")
        }else if(! signature){
            throw new Error("signature parameter is required - see https://google.com for reference.")
        }else{
            //TODO make call to API
            return true 
        }
    }
    
    //Temp test function for retrieving NEO from nasa haha. Used while waiting for out API to go up
    async getNeo(){
        const url = "https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=DEMO_KEY"
    
        const res = await fetch(url);
        return res.json();
    }
}