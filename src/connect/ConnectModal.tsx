import { useState, useEffect } from "react";
import { tw } from "twind";

import { SigningMessageFormat, ChainTypes, AuthRequirements } from "../types";

import { MSG_OPEN, MSG_CLOSE, MSG_SUCCESS } from "./constants";
import { PicketConnectResponse } from "./";

import { Wallet } from "./wallets";
import evmWallets from "./wallets/evm";
import solanaWallets from "./wallets/solana";

const displayAddress = (address: string) => {
  return (
    address.substring(0, 5) + "..." + address.substring(address.length - 3)
  );
};

const CONNECT_TIMEOUT_MS = 15000;
const AUTO_CLOSE_MS = 5000;

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

type ConnectState = null | "connect" | "signature" | "auth";

const connectStateMessage = {
  connect: "Connecting...",
  signature: "Requesting signature...",
  auth: "Authorizing...",
};

export interface ConnectModalProps {
  chain?: string;
  messageFormat?: `${SigningMessageFormat}`;
  doAuth?: boolean;
  requirements?: AuthRequirements;
}

const getWarningMessage = ({
  wallet,
  state,
}: {
  wallet?: Wallet;
  state: ConnectState;
}): string => {
  const walletName = wallet?.name ?? "your wallet";

  if (state === "connect") {
    return `Still waiting to connect to ${walletName}. Open ${walletName} to connect.`;
  }

  return `Still waiting for your signature. Open ${walletName} to approve the request.`;
};

const ConnectModal = ({
  chain,
  messageFormat = SigningMessageFormat.SIWE,
  doAuth = false,
  requirements,
}: ConnectModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState(false);
  const [error, setError] = useState("");
  const [connectState, setConnectState] = useState<ConnectState>(null);

  const [walletAddress, setWalletAddress] = useState<string>();
  const [selectedWallet, setSelectedWallet] = useState<Wallet>();
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

      // reset state on open
      setIsOpen(true);
      setSuccess(false);
      setWarning(false);
      setError("");
      setSelectedWallet(undefined);
      setWalletAddress("");
      setConnectState(null);
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

  // options are
  // error message function (error, state, selectedWallet)

  // useCallback
  const connect = async (wallet: Wallet) => {
    // HACK: Keep local state variable to make it available to
    // the catch clause for better error messages
    // This should be done with better error state w/ a function for displaying the message
    let state: ConnectState = "connect";

    // show warning after elapsed time
    setWarning(false);

    const timeoutID = setTimeout(() => {
      setWarning(true);
      setError("");
    }, CONNECT_TIMEOUT_MS);

    try {
      setSelectedWallet(wallet);

      state = "connect";
      setConnectState(state);

      const { walletAddress, provider } = await wallet.connect();

      state = "signature";
      setConnectState(state);

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

      let result: Omit<PicketConnectResponse, "provider"> = {
        walletAddress,
        signature,
        context,
        chain: selectedChain,
      };

      if (doAuth) {
        state = "auth";
        setConnectState(state);

        const auth = await window.picket.auth({
          chain: selectedChain,
          walletAddress,
          signature,
          context,
          requirements,
        });

        result = { ...result, auth };
      }

      setWalletAddress(walletAddress);
      setSuccess(true);
      setError("");

      // save provider to window for sharing b/c it isn't serializable
      window.PicketProvider = provider;
      window.postMessage({
        type: MSG_SUCCESS,
        data: result,
      });

      // start timer to close the modal
      setTimeout(() => setIsOpen(false), AUTO_CLOSE_MS);
    } catch (err: unknown) {
      console.log(err);
      setSelectedWallet(undefined);

      if (state === "auth") {
        if (
          err &&
          typeof err === "object" &&
          "msg" in err &&
          // @ts-ignore
          err.msg.includes("invalid signature")
        ) {
          setError("Signature expired. Please try again.");
          return;
        }

        setError(
          "Unauthorized. Your wallet doesn't hold the necessary tokens to login."
        );
        return;
      }

      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        // @ts-ignore
        err.message.toLowerCase().includes("user rejected")
      ) {
        if (state === "signature") {
          setError(`The signature request was rejected by ${wallet.name}`);
          return;
        }

        setError(
          `The request to connect to ${wallet.name} was rejected. Is your wallet unlocked?`
        );
        return;
      }
      if (state === "signature") {
        setError(`Failed to get signature from ${wallet.name}`);
        return;
      }
      setError(`Failed to connect to ${wallet.name}`);
    } finally {
      // reset connect state
      setConnectState(null);
      // clear warning and timeout
      setWarning(false);
      clearTimeout(timeoutID);
    }
  };

  return (
    <main
      style={{
        fontFamily:
          'Inter,-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
      className={tw`fixed top-0 left-0 right-0 h-full w-full flex flex-col justify-center items-center flex-1${
        isOpen ? "visible backdrop-filter backdrop-blur-sm" : "invisible"
      }`}
    >
      <div
        className={tw`w-96 pt-8 pb-4 px-6 bg-[#FAFAFA] relative rounded-xl shadow-lg`}
      >
        <h1
          className={tw`pt-2 text-xl sm:text-2xl font-semibold ${
            success ? "text-center" : "text-left"
          } `}
        >
          {success
            ? `Welcome ${displayAddress(walletAddress as string)}`
            : "Log In With Your Wallet"}
        </h1>
        <button onClick={close}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={tw`w-8 h-8 absolute top-0 right-0 mr-3 mt-3 bg-white text-gray-400 rounded-lg hover:shadow`}
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
          <div
            className={tw`mb-4 flex flex-row flex-nowrap space-x-4 text-sm sm:text-base`}
          >
            {walletOptions.map(({ slug, name }) => (
              <button
                key={slug}
                onClick={() => setSelectedChain(slug)}
                // Use style for underline offset until twind supports Tailwind v3
                style={{
                  textUnderlineOffset: "2px",
                  outlineStyle: "none",
                }}
                className={tw`font-bold hover:text-[#5469D4] focus:text-[#5469D4] ${
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
        {warning && (
          <div className={tw`rounded-md bg-yellow-100 p-4 mt-2`}>
            <div className={tw`flex`}>
              <div className={tw`flex-shrink-0`}>
                <svg
                  className={tw`h-5 w-5 text-yellow-400`}
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
              <div className={tw`ml-3 text-sm text-yellow-700`}>
                <div>
                  <p>
                    {getWarningMessage({
                      wallet: selectedWallet,
                      state: connectState,
                    })}
                  </p>
                </div>
                {selectedWallet && (
                  <div className={tw`mt-2 text-xs`}>
                    <p>
                      Don{"'"}t see the request?{" "}
                      <button
                        className={tw`underline`}
                        onClick={() => connect(selectedWallet)}
                      >
                        Try again.
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
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
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
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
        <div
          className={tw`flex flex-col  min-h-[300px] ${
            success ? "space-y-0 mt-0 mb-0" : "space-y-2 mt-6 mb-6"
          }`}
        >
          {!success &&
            walletOptions
              .filter(({ slug }) => slug === selectedChain)[0]
              ?.wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => connect(wallet)}
                  style={{
                    outlineOffset: "4px",
                  }}
                  disabled={!!connectState}
                  className={tw`p-2.5 w-full bg-white rounded-lg shadow flex items-center font-semibold text-sm sm:text-base hover:bg-gray-100 disabled:cursor-not-allowed ${
                    selectedWallet?.id === wallet.id
                      ? "bg-gray-100"
                      : "disabled:bg-white"
                  }`}
                >
                  <div className={tw`mr-8 rounded-md overflow-hidden`}>
                    {wallet.icon}
                  </div>
                  {selectedWallet?.id === wallet.id
                    ? connectStateMessage[connectState || "connect"]
                    : wallet.name}
                </button>
              ))}
          {success && (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={tw`pt-0 h-full w-full text-[${selectedWallet?.color}]`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div
                className={tw`flex flex-col items-center text-center space-y-2`}
              >
                {selectedWallet?.icon}
                <p
                  className={tw`text-sm sm:text-base font-base w-45 text-center text-gray-400 break-normal`}
                >
                  You have successfully authenticated
                  {selectedWallet ? ` with ${selectedWallet.name}` : ""}
                </p>
              </div>
            </>
          )}
        </div>
        <div
          className={tw`w-full mt-8 text-center font-base text-sm text-gray-400`}
        >
          <a
            style={{
              outlineOffset: "4px",
            }}
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
