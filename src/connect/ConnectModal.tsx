import { useState, useEffect } from "react";
import { tw } from "twind";

import "./styles.css";

import { SigningMessageFormat, ChainTypes } from "../types";

import { MSG_OPEN, MSG_CLOSE, MSG_SUCCESS } from "./constants";
import { Wallet } from "./wallets";
import evmWallets from "./wallets/evm";
import solanaWallets from "./wallets/solana";

const displayAddress = (address: string) => {
  return (
    address.substring(0, 6) + "..." + address.substring(address.length - 4)
  );
};

type WalletOption = {
  slug: string;
  name: string;
  wallets: Wallet[];
};

const defaultWalletOptions: WalletOption[] = [
  {
    slug: "ethereum",
    name: "Ethereum",
    wallets: evmWallets,
  },
  {
    slug: "polygon",
    name: "Polygon",
    wallets: evmWallets,
  },
  {
    slug: "solana",
    name: "Solana",
    wallets: solanaWallets,
  },
];

interface ConnectModalProps {
  chain?: string;
  messageFormat?: `${SigningMessageFormat}`;
}

// Chain cases
// Not specified = all chains
// Specified = only that chain
//
//
//
//
// wallets need
// -> chain
// -> chainId
// -> chainType
//
// on load
// if no chain, show all
// get chain display name
// (chain_slug -> wallet) show only wallets for the chain

const ConnectModal = ({
  chain,
  messageFormat = SigningMessageFormat.SIWE,
}: ConnectModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<Wallet>();
  const [walletAddress, setWalletAddress] = useState<string>();

  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>("");

  useEffect(() => {
    if (!chain) {
      setWalletOptions(defaultWalletOptions);
      setSelectedChain(defaultWalletOptions[0].slug);
      return;
    }

    const fetchChainData = async () => {
      try {
        const { chainSlug, chainType, chainName } =
          await window.picket.chainInfo(chain);

        setSelectedChain(chainSlug);
        if (chainType === ChainTypes.SOL) {
          setWalletOptions([
            {
              slug: chainSlug,
              name: chainName,
              wallets: solanaWallets,
            },
          ]);
          return;
        }
        // assume EVM
        setWalletOptions([
          {
            slug: chainSlug,
            name: chainName,
            wallets: evmWallets,
          },
        ]);
        return;
      } catch (err) {
        console.error(err);
        setError(`Unsupported chain: ${chain}`);
      }
    };

    fetchChainData();
  }, []);

  useEffect(() => {
    const handleOpenEvent = (event: MessageEvent) => {
      if (!event.data?.type) return;
      if (event.data.type !== MSG_OPEN) return;

      // do nothing if already open
      if (isOpen) return;

      // reset  state on open
      setIsOpen(true);
      setSuccess(false);
      setError("");
      setSelectedWallet(undefined);
      setWalletAddress("");
    };

    window.addEventListener("message", handleOpenEvent);

    return () => {
      window.removeEventListener("message", handleOpenEvent);
    };
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    window.postMessage({
      type: MSG_CLOSE,
    });
  };

  // useCallback
  const connect = async (wallet: Wallet) => {
    try {
      setSelectedWallet(wallet);

      // TODO: Set timeout for connecting, show warning
      const { walletAddress, provider } = await wallet.connect();

      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();

      // use chain associated with the auth request
      // should be cached at this point
      const { chainId } = await window.picket.chainInfo(selectedChain);

      const context = {
        domain,
        uri,
        issuedAt,
        chainId,
      };

      // TODO: Error messages
      // TODO: Conditional based off Picket availability (refactor to separate library)
      const { nonce, statement } = await window.picket.nonce({
        walletAddress,
        chain: selectedChain,
      });

      const message = window.Picket.createSigningMessage(
        { nonce, statement, walletAddress, ...context },
        { format: messageFormat }
      );

      const signature = await wallet.signMessage(message);

      // save provider to window for sharing b/c it isn't serializable
      window.PicketProvider = provider;

      setWalletAddress(walletAddress);
      setSuccess(true);
      setError("");
      window.postMessage({
        type: MSG_SUCCESS,
        data: {
          walletAddress,
          signature,
          context,
          chain: selectedChain,
        },
      });
    } catch (err: unknown) {
      console.log(err);
      setSelectedWallet(undefined);
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        // @ts-ignore
        err.message.includes("User rejected")
      ) {
        setError(
          `The request to connect to ${wallet.name} was rejected. Is your wallet unlocked?`
        );
        return;
      }
      setError(`Failed to connect to ${wallet.name}`);
    }
  };

  return (
    <main
      className={tw`fixed top-0 left-0 right-0 h-full w-full flex flex-col justify-center items-center flex-1 font-[Inter] ${
        isOpen ? "visible backdrop-filter backdrop-blur-sm" : "invisible"
      }`}
    >
      <div
        className={tw`w-96 pt-12 pb-4 px-6 bg-[#FAFAFA] relative rounded-xl shadow-lg`}
      >
        <h1
          className={tw`text-2xl font-bold ${
            success ? "text-center" : "text-left"
          } `}
        >
          {success
            ? `Welcome ${displayAddress(walletAddress as string)}`
            : "Sign-In with Your Wallet"}
        </h1>
        <button onClick={close}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={tw`w-8 h-8 absolute top-0 right-0 mr-4 mt-4 bg-white text-gray-400 rounded-lg hover:shadow`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {!success && (
          <div className={tw`mb-4 flex flex-row flex-nowrap space-x-4`}>
            {walletOptions.map(({ slug, name }) => (
              <button
                key={slug}
                onClick={() => setSelectedChain(slug)}
                // Use style for underline offset until twind supports Tailwind v3
                style={{
                  textUnderlineOffset: "2px",
                }}
                className={tw`font-bold hover:text-[#5469D4] ${
                  selectedChain === slug
                    ? "underline underline-offset-2 text-[#5469D4]"
                    : ""
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {error && (
          <div className={tw`rounded-md bg-red-100 p-4 mt-2`}>
            <div className={tw`flex`}>
              <div className={tw`flex-shrink-0`}>
                <svg
                  className={tw`h-5 w-5 text-red-400`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className={tw`ml-3`}>
                <div className={tw`text-sm text-red-700`}>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className={tw`mt-4 mb-8 flex flex-col space-y-4 min-h-[300px]`}>
          {!success &&
            walletOptions
              .filter(({ slug }) => slug === selectedChain)[0]
              ?.wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => connect(wallet)}
                  className={tw`p-4 w-full bg-white rounded-lg shadow flex items-center font-semibold hover:bg-gray-100`}
                >
                  <div className={tw`mr-2 rounded-full`}>{wallet.icon}</div>
                  {selectedWallet?.id === wallet.id
                    ? "Connecting..."
                    : wallet.name}
                </button>
              ))}
          {success && (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={tw`h-full w-full text-[${selectedWallet?.color}]`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className={tw`flex flex-col items-center text-center`}>
                {selectedWallet?.icon}
                <p className={tw`text-center`}>
                  You have successfully authenticated with{" "}
                  {selectedWallet?.name}
                </p>
              </div>
            </>
          )}
        </div>
        <div
          className={tw`w-full mt-8 text-center font-light text-sm text-gray-500`}
        >
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://picketapi.com"
          >
            Powered by Picket
          </a>
        </div>
      </div>
    </main>
  );
};

export default ConnectModal;
