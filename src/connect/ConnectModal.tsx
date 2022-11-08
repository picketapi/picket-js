import React, { useState, useEffect, useRef } from "react";
import { tw } from "twind";

import { ChainTypes, AuthRequirements, SigningMessageFormat } from "../types";

import { MSG_OPEN, MSG_CLOSE, MSG_SUCCESS } from "./constants";
import { PicketConnectResponse } from "./";
import { addOrSwitchEVMChain } from "./utils/chains";
import { isMobile } from "./utils/device";

import { Wallet } from "./wallets";
import loadEVMWallets from "./wallets/evm";
import loadSolanaWallets from "./wallets/solana";
import loadFlowWallets from "./wallets/flow";

import NewWalletButton from "./NewWalletButton";
import PoweredByPicket from "./PoweredByPicket";
import SuccessScreen from "./SuccessScreen";
import TokenGateFailureScreen from "./TokenGateFailureScreen";
import QRCodeConnectScreen from "./QRCodeConnectScreen";

import { useDarkMode } from "./utils/theme";
import { PicketTheme, DEFAULT_THEME } from "../picket";

const displayWalletAddress = (address: string) => {
  return (
    address.substring(0, 5) + "..." + address.substring(address.length - 3)
  );
};

const CONNECT_TIMEOUT_MS = 15000;
const AUTO_CLOSE_MS = 3000;
const WALLET_LOCAL_STORAGE_KEY = "_picket_wallet";
const HAS_CONNECTED_SESSION_KEY = "_picket_has_connected";

const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";
const RAINBOW_DOWNLOAD_URL = "https://rainbow.me/";
const PHANTOM_DOWNLOAD_URL = "https://phantom.app/download";
const DAPPER_DOWNLOAD_URL = "https://www.meetdapper.com/";

const NOT_ENOUGH_TOKENS_ERROR =
  "Your wallet doesn't hold the necessary tokens to login.";

type ChainOptions = {
  slug: string;
  name: string;
  loadWallets: () => Promise<Wallet[]>;
  desktopPreferredWalletLink?: string;
  mobilePreferredWalletLink?: string;
};

const defaultWalletOptions: ChainOptions[] = [
  {
    slug: "ethereum",
    name: "Ethereum",
    loadWallets: loadEVMWallets,
    desktopPreferredWalletLink: METAMASK_DOWNLOAD_URL,
    mobilePreferredWalletLink: RAINBOW_DOWNLOAD_URL,
  },
  {
    slug: "solana",
    name: "Solana",
    loadWallets: loadSolanaWallets,
    desktopPreferredWalletLink: PHANTOM_DOWNLOAD_URL,
    mobilePreferredWalletLink: PHANTOM_DOWNLOAD_URL,
  },
  {
    slug: "flow",
    name: "Flow",
    loadWallets: loadFlowWallets,
    desktopPreferredWalletLink: DAPPER_DOWNLOAD_URL,
    mobilePreferredWalletLink: DAPPER_DOWNLOAD_URL,
  },
  {
    slug: "polygon",
    name: "Polygon",
    loadWallets: loadEVMWallets,
    desktopPreferredWalletLink: METAMASK_DOWNLOAD_URL,
    mobilePreferredWalletLink: RAINBOW_DOWNLOAD_URL,
  },
  {
    slug: "optimism",
    name: "Optimism",
    loadWallets: loadEVMWallets,
    desktopPreferredWalletLink: METAMASK_DOWNLOAD_URL,
    mobilePreferredWalletLink: RAINBOW_DOWNLOAD_URL,
  },
  {
    slug: "arbitrum",
    name: "Arbitrum",
    loadWallets: loadEVMWallets,
    desktopPreferredWalletLink: METAMASK_DOWNLOAD_URL,
    mobilePreferredWalletLink: RAINBOW_DOWNLOAD_URL,
  },
  {
    slug: "avalanche",
    name: "Avalanche",
    loadWallets: loadEVMWallets,
    desktopPreferredWalletLink: METAMASK_DOWNLOAD_URL,
    mobilePreferredWalletLink: RAINBOW_DOWNLOAD_URL,
  },
];

const hasTokenOwnershipRequirements = (
  requirements: AuthRequirements | undefined
) =>
  Boolean(
    requirements &&
      (requirements.contractAddress ||
        (requirements.tokenIds && requirements.tokenIds?.length > 0) ||
        // @ts-ignore undocumented alpha collections feature
        requirements.colletion)
  );

// toTitleCase upperacses the first letter of a string
const toTitleCase = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

type ConnectState = null | "connect" | "signature" | "auth";

const connectStateMessage = {
  connect: "Connecting...",
  signature: "Requesting signature...",
  auth: "Authorizing...",
};

export interface ConnectModalProps {
  chain?: string;
  doAuth?: boolean;
  requirements?: AuthRequirements;
  theme?: PicketTheme;
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

const getErrorMessage = ({
  err,
  wallet,
  walletAddress,
  state,
  selectedChain,
  requirements,
}: {
  err?: Error;
  wallet: Wallet;
  walletAddress?: string;
  state: ConnectState;
  selectedChain: string;
  requirements?: AuthRequirements;
}): string => {
  const walletName =
    // special case for WalletConnect
    wallet?.name && wallet.name !== "WalletConnect"
      ? wallet.name
      : "your wallet";

  // generic errors
  if (
    err &&
    typeof err === "object" &&
    "msg" in err &&
    // @ts-ignore TS isn't respecting "msg" in err
    typeof err.msg === "string"
  ) {
    // @ts-ignore TS isn't respecting "msg" in err
    if (err.msg.toLowerCase().includes("invalid project key")) {
      return "Invalid API key. Copy your project's publishable key from your Picket dashboard: https://picketapi.com/dashboard";
    }
    // @ts-ignore TS isn't respecting "msg" in err
    if (err.msg.toLowerCase().includes("invalid signature")) {
      return "Signature expired. Please try again.";
    }
  }

  // auth state specific errors
  if (state === "auth") {
    if (
      err &&
      typeof err === "object" &&
      "msg" in err &&
      // @ts-ignore TS isn't respecting "msg" in err
      typeof err.msg === "string"
    ) {
      // @ts-ignore TS isn't respecting "msg" in err
      if (err.msg.toLowerCase().includes("invalid signature")) {
        return "Signature expired. Please try again.";
      }
      // @ts-ignore TS isn't respecting "msg" in err
      if (err.msg.toLowerCase().includes("token gating")) {
        return `${toTitleCase(
          selectedChain
        )} doesn't support token gating yet. Reach out to team@picketapi.com for more info.`;
      }
      if (
        // @ts-ignore TS isn't respecting "msg" in err
        err.msg.toLowerCase().includes("any erc20, erc721, erc1155 tokens")
      ) {
        return `${
          requirements?.contractAddress
            ? displayWalletAddress(requirements.contractAddress)
            : "The provided contract"
        } is not an ERC20, ERC721, or ERC1155 token. If this error persists, please contact your site administrator or team@picketapi.com.`;
      }
      if (
        // @ts-ignore TS isn't respecting "msg" in err
        err.msg.toLowerCase().includes("allowedwallets must be an array")
      ) {
        return `Incorrect parameter type for "allowedWallets". If this error persists, please contact your site administrator or team@picketapi.com.`;
      }
      if (
        // @ts-ignore TS isn't respecting "msg" in err
        err.msg.toLowerCase().includes("allowed wallet addresses")
      ) {
        return `${
          walletAddress
            ? displayWalletAddress(walletAddress)
            : "Your wallet address"
        } is not on the allowed list of wallet addresses.`;
      }
    }

    // assume token-gating error
    return NOT_ENOUGH_TOKENS_ERROR;
  }

  // provider/wallet (Metamask, etc) errors
  // check for user rejected error cases
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    // @ts-ignore
    err.message.toLowerCase().includes("user rejected")
  ) {
    if (state === "signature") {
      return `The signature request was rejected.`;
    }

    return `The request to connect to ${walletName} was rejected. Is your wallet unlocked?`;
  }

  // unknown error in signature state
  if (state === "signature") {
    return `Failed to get your signature.`;
  }

  // last resort
  return `Failed to connect to ${walletName}.`;
};

const ConnectModal = ({
  chain,
  doAuth = false,
  requirements,
  theme = DEFAULT_THEME,
}: ConnectModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState("");
  const [connectState, setConnectState] = useState<ConnectState>(null);

  const [displayAddress, setDisplayAddress] = useState<string>();
  const [selectedWallet, setSelectedWallet] = useState<Wallet>();
  const [chainOptions, setChainOptions] = useState<ChainOptions[]>([]);
  const [selectedChainOption, setSelectedChainOption] =
    useState<ChainOptions>();
  const [walletList, setWalletList] = useState<Wallet[]>();
  const [qrCodeURI, setQRCodeURI] = useState<string>("");

  const selectedChain = selectedChainOption?.slug || "";

  const darkMode = useDarkMode(theme);

  const switchChains = (chain: string) => {
    const options = defaultWalletOptions.filter(
      ({ slug }) => slug === chain
    )[0];
    // should never happen
    if (!options) return;
    setSelectedChainOption(options);
    options.loadWallets().then(setWalletList);
    // clear wallet
    setSelectedWallet(undefined);
  };

  useEffect(() => {
    if (!chain) {
      setChainOptions(defaultWalletOptions);
      switchChains(defaultWalletOptions[0].slug);
      return;
    }

    const fetchChainData = async () => {
      try {
        const { chainSlug, chainType, chainName } =
          await window.picket.chainInfo(chain);

        const options = chainOptions.filter(
          ({ slug }) => slug === chainSlug
        )[0];

        if (!options) throw new Error("Chain not found");
        setSelectedChainOption(options);

        if (chainType === ChainTypes.SOL) {
          setChainOptions([
            {
              slug: chainSlug,
              name: chainName,
              loadWallets: loadSolanaWallets,
            },
          ]);
          return;
        }
        // assume EVM
        setChainOptions([
          {
            slug: chainSlug,
            name: chainName,
            loadWallets: loadEVMWallets,
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

  const reset = () => {
    setIsOpen(true);
    setSuccess(false);
    setWarning(false);
    setError("");
    setSelectedWallet(undefined);
    setDisplayAddress("");
    setConnectState(null);
    warningTimeoutRef.current &&
      clearTimeout(warningTimeoutRef.current as ReturnType<typeof setTimeout>);
  };

  useEffect(() => {
    const handleOpenEvent = (event: MessageEvent) => {
      if (!event.data?.type) return;
      if (event.data.type !== MSG_OPEN) return;

      // do nothing if already open
      if (isOpen) return;

      // reset state on open
      reset();
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

    // get last connected wallet
    // force the wallet to disconnect if we are connecting to a different wallet connect (aka QRCode) wallet
    // or if it has not connected in this tab session (force reconnect)
    const prevWallet = window.localStorage.getItem(WALLET_LOCAL_STORAGE_KEY);
    const hasConnected = window.sessionStorage.getItem(
      HAS_CONNECTED_SESSION_KEY
    );
    if (
      !hasConnected ||
      (prevWallet && prevWallet !== wallet.id && wallet.qrCode)
    ) {
      try {
        // remove wallet connect session and cache
        await wallet.disconnect();
      } catch (err) {
        console.log("error on disconnect", err);
      }
    }

    // save wallet to localStorage
    window.localStorage.setItem(WALLET_LOCAL_STORAGE_KEY, wallet.id);
    // do not disconnect while the session (tab) is active
    window.sessionStorage.setItem(HAS_CONNECTED_SESSION_KEY, "true");

    // clear error state
    setError("");

    // show warning after elapsed time
    setWarning(false);
    const timeoutID = setTimeout(() => {
      setWarning(true);
      setError("");
    }, CONNECT_TIMEOUT_MS);
    warningTimeoutRef.current = timeoutID;

    // keep in scope for error messages
    let walletAddress: string | undefined;

    try {
      setSelectedWallet(wallet);

      state = "connect";
      setConnectState(state);

      // use chain associated with the auth request
      // should be cached at this point
      const { chainSlug, chainId, chainType, publicRPC, chainName } =
        await window.picket.chainInfo(selectedChain);

      // if the wallet is ready and a QR code wallet and has onConnecting callback
      if (wallet.ready && wallet.qrCode && !!wallet.onConnecting) {
        // HACK: RainbowKit implements a similar hack
        // keep local variable to prevent multiple calls to the same callback
        let hasCalledCallback = false;

        wallet.onConnecting(async () => {
          // should never happen
          if (!wallet.qrCodeURI) return;
          // prevent from calling multiple times
          if (hasCalledCallback) return;
          hasCalledCallback = true;

          const uri = await wallet.qrCodeURI();

          const mobile = isMobile();

          // on desktop display the QR code screen
          if (!mobile) {
            setQRCodeURI(uri);
            return;
          }

          // on mobile open the QR code URI
          // adapted from
          // https://github.com/rainbow-me/rainbowkit/blob/main/packages/rainbowkit/src/components/ConnectOptions/MobileOptions.tsx#L64
          // NOTE: This might not work if the modal is in an iFrame (haven't tested)
          if (uri.startsWith("http")) {
            // Workaround for https://github.com/rainbow-me/rainbowkit/issues/524.
            // Using 'window.open' causes issues on iOS in non-Safari browsers and
            // WebViews where a blank tab is left behind after connecting.
            // This is especially bad in some WebView scenarios (e.g. following a
            // link from Twitter) where the user doesn't have any mechanism for
            // closing the blank tab.
            // For whatever reason, links with a target of "_blank" don't suffer
            // from this problem, and programmatically clicking a detached link
            // element with the same attributes also avoids the issue.
            const link = document.createElement("a");
            link.href = uri;
            link.target = "_blank";
            link.rel = "noreferrer noopener";
            link.click();
            return;
          }
          // else navigate navigate to the URI per usual
          window.location.href = uri;
        });
      }

      // do not deconstruct to avoid duplicate walletAddress variables
      const connectResult = await wallet.connect({
        chainId,
      });
      walletAddress = connectResult.walletAddress;
      const { provider } = connectResult;

      state = "signature";
      setConnectState(state);
      // clear warning and error state transition
      setWarning(false);
      setError("");

      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();

      const context = {
        domain,
        uri,
        issuedAt,
        chainId,
        chainType,
        locale: navigator?.language,
      };

      // TODO: Conditional based off Picket availability (refactor to separate library)
      const {
        nonce,
        statement,
        // default to SIWE for backwards compatibility
        format = SigningMessageFormat.SIWE,
      } = await window.picket.nonce({
        walletAddress,
        chain: selectedChain,
        locale: context.locale,
      });

      const message = window.Picket.createSigningMessage({
        nonce,
        statement,
        format,
        walletAddress,
        ...context,
      });

      // request to change chains
      // only support EVM wallets for now
      if (chainType === ChainTypes.ETH) {
        try {
          // @ts-ignore accessing private property for now...
          const p = await wallet.connector.getProvider();
          await addOrSwitchEVMChain({
            provider: p,
            chainSlug,
            chainId,
            chainName,
            publicRPC,
          });
        } catch {
          // ignore error b/c auth will still work. network switch is for UX
        }
      }

      const signature = await wallet.signMessage(message);

      let result: Omit<PicketConnectResponse, "provider"> = {
        walletAddress,
        signature,
        context,
        chain: selectedChain,
      };

      // set displayAddress before doing auth in-case of failure
      setDisplayAddress(displayWalletAddress(walletAddress));

      if (doAuth) {
        state = "auth";
        setConnectState(state);
        // clear warning and error state transition
        setWarning(false);
        setError("");

        const auth = await window.picket.auth({
          chain: selectedChain,
          walletAddress,
          signature,
          context,
          requirements,
        });

        setDisplayAddress(
          auth.user.displayAddress === walletAddress
            ? displayWalletAddress(walletAddress)
            : auth.user.displayAddress
        );

        result = { ...result, auth };
      }

      // re-select wallet in case it was changed
      setSelectedWallet(wallet);
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

      const shouldClearSelectedWallet = !wallet.qrCode;

      const errorMsg = getErrorMessage({
        err: err as Error | undefined,
        state,
        wallet,
        walletAddress,
        selectedChain,
        requirements,
      });

      // do not un-select wallet on token gating error so we can customize the error screen
      if (shouldClearSelectedWallet && errorMsg !== NOT_ENOUGH_TOKENS_ERROR) {
        setSelectedWallet(undefined);
      }

      setError(errorMsg);
    } finally {
      // reset connect state
      setConnectState(null);
      // clear warning and timeout
      setWarning(false);
      clearTimeout(warningTimeoutRef.current);
    }
  };

  const showTokenGateFailureScreen =
    hasTokenOwnershipRequirements(requirements) &&
    error === NOT_ENOUGH_TOKENS_ERROR;

  const showQRCodeConnectScreen = selectedWallet?.qrCode && !isMobile();
  const showBackButton =
    !success && (showTokenGateFailureScreen || showQRCodeConnectScreen);

  return (
    <main
      style={{
        // default color to dark gray
        color: "#414552",
        fontFamily:
          'Inter,-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
      className={tw`z-50 fixed top-0 left-0 right-0 h-full w-full flex flex-col justify-center items-center flex-1${
        isOpen ? "visible backdrop-filter backdrop-blur-sm" : "invisible"
      }`}
    >
      <div
        className={tw`w-96 pt-4 pb-4 px-6 bg-[#FAFAFA] dark:bg-[#040825] relative rounded-xl shadow-lg min-h-[600px] flex flex-col`}
      >
        {showBackButton && (
          <button onClick={reset} className={tw`absolute top-3 left-3`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={tw`w-8 h-8 bg-white dark:bg-[#26293B] text-gray-400 rounded-lg hover:shadow`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        )}
        <button onClick={close} className={tw`absolute top-3 right-3`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={tw`w-8 h-8 bg-white dark:bg-[#26293B] text-gray-400 rounded-lg hover:shadow`}
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
        {success ? (
          <SuccessScreen
            selectedWallet={selectedWallet as Wallet}
            displayAddress={displayAddress as string}
            hasTokenOwnershipRequirements={hasTokenOwnershipRequirements(
              requirements
            )}
          />
        ) : showTokenGateFailureScreen ? (
          <TokenGateFailureScreen
            chain={selectedChain}
            selectedWallet={selectedWallet as Wallet}
            displayAddress={displayAddress as string}
            // only get here when requirements are defined
            requirements={requirements as AuthRequirements}
            back={reset}
          />
        ) : showQRCodeConnectScreen ? (
          <QRCodeConnectScreen
            uri={qrCodeURI}
            selectedWallet={selectedWallet as Wallet}
            connectState={connectState}
            connect={connect}
            error={error}
            warning={warning}
            darkMode={darkMode}
          />
        ) : (
          <>
            <h1
              className={tw`mb-6 text-xl dark:text-white font-semibold break-words text-left`}
            >
              Log In With Your Wallet
            </h1>
            <div
              className={tw`mb-4 flex flex-row flex-nowrap space-x-4 text-sm sm:text-base overflow-x-auto`}
              id="_picketWalletOptions"
            >
              {chainOptions.map(({ slug, name }) => (
                <button
                  key={slug}
                  onClick={() => switchChains(slug)}
                  // Use style for underline offset until twind supports Tailwind v3
                  style={{
                    textUnderlineOffset: "2px",
                    outlineStyle: "none",
                  }}
                  className={tw`font-bold dark:text-gray-400 hover:text-[#5469D4] focus:text-[#5469D4] dark:hover:text-[#5469D4] dark:focus:text-[#5469D4] ${
                    selectedChain === slug
                      ? "underline underline-offset-2 text-[#5469D4] dark:text-[#5469D4]"
                      : ""
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            {warning && connectState !== "auth" && (
              <div className={tw`rounded-lg bg-yellow-100 p-4 mb-4`}>
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
                      {getWarningMessage({
                        wallet: selectedWallet,
                        state: connectState,
                      })}
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
              <div className={tw`rounded-lg bg-red-100 p-4 mb-4`}>
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
                    <div className={tw`text-sm text-red-700`}>{error}</div>
                  </div>
                </div>
              </div>
            )}
            <div className={tw`flex-1 flex flex-col min-h-[350px] space-y-2`}>
              <div
                id="_picketWallets"
                className={tw`flex-1 flex flex-col space-y-2 max-h-[300px] overflow-auto py-2 px-2`}
              >
                {walletList?.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => connect(wallet)}
                    style={{
                      outlineOffset: "4px",
                    }}
                    disabled={!!connectState}
                    className={tw`p-2.5 w-full bg-white dark:bg-[#26293B] dark:text-white rounded-lg shadow flex items-center font-semibold text-sm sm:text-base hover:bg-gray-100 dark:hover:bg-[#181B2E] disabled:cursor-not-allowed ${
                      selectedWallet?.id === wallet.id
                        ? "bg-gray-100"
                        : "disabled:bg-white"
                    }`}
                  >
                    <div className={tw`mr-8 rounded-lg overflow-hidden`}>
                      <wallet.Icon />
                    </div>
                    {selectedWallet?.id === wallet.id
                      ? connectStateMessage[connectState || "connect"]
                      : wallet.name}
                  </button>
                ))}
              </div>
              <div className={tw`flex flex-col px-2`}>
                <div className={tw`w-full flex-grow flex flex-col-reverse`}>
                  <div
                    className={tw`flex flex-row my-2 font-light items-center text-gray-400`}
                  >
                    <div
                      className={tw`block flex-grow border-solid border-gray-200 border border-t border-b-0 border-x-0 h-px mr-6`}
                    ></div>
                    <div className={tw`block`}>or</div>
                    <div
                      className={tw`block flex-grow border-solid border-gray-200 border border-t border-b-0 border-x-0 h-px ml-6`}
                    ></div>
                  </div>
                </div>
                <NewWalletButton
                  mobilePreferredWalletLink={
                    selectedChainOption?.mobilePreferredWalletLink ||
                    RAINBOW_DOWNLOAD_URL
                  }
                  desktopPreferredWalletLink={
                    selectedChainOption?.desktopPreferredWalletLink ||
                    METAMASK_DOWNLOAD_URL
                  }
                />
              </div>
            </div>
            <PoweredByPicket />
          </>
        )}
      </div>
      <style
        // A hacky way to to inject custom CSS without having to have users import the stylesheet
        dangerouslySetInnerHTML={{
          __html: `
  #_picketWalletOptions::-webkit-scrollbar {
    -webkit-appearance: none;
    height: 0px;
    width: 0px;
    background: transparent; /* make scrollbar transparent */
  }
  #_picketWallets::-webkit-scrollbar {
    -webkit-appearance: none;
    height: 0px;
    width: 0px;
    background: transparent; /* make scrollbar transparent */
  }`,
        }}
      ></style>
    </main>
  );
};
export default ConnectModal;
