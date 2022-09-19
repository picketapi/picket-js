import { useState, useEffect } from "react";
import { tw } from "twind";

import { Wallet } from "./wallets";

import PoweredByPicket from "./PoweredByPicket";
import QRCode from "./utils/QRCode";

type ConnectState = null | "connect" | "signature" | "auth";

interface QRCodeConnectScreenProps {
  selectedWallet: Wallet;
  connectState: ConnectState;
}

const getConnectMessage = (state: ConnectState, walletName: string) => {
  if (!state || state === "connect") {
    return `Connect to ${walletName}`;
  }

  if (state === "signature") {
    return `Requesting Signature`;
  }

  if (state === "auth") {
    return `Authenticating`;
  }

  return `Connect to ${walletName}`;
};

// TODO:
// 1. error and warning messages
// <div
// className={tw`absolute left-0 bottom-0 bg-yellow-500 w-full h-24`}
// ></div>
// 2. Handle iOS vs Android

const QRCodeConnectScreen = ({
  selectedWallet,
  connectState,
}: QRCodeConnectScreenProps) => {
  const [qrCodeURI, setQRCodeURI] = useState<string | null>(null);

  useEffect(() => {
    // should never happen
    if (!selectedWallet.qrCodeURI) return;

    selectedWallet.qrCodeURI().then((uri) => {
      setQRCodeURI(uri);
    });
  }, [selectedWallet]);

  return (
    <>
      <h1 className={tw`text-xl font-semibold break-words text-center px-7`}>
        {getConnectMessage(connectState, selectedWallet.name)}
      </h1>
      <div
        className={tw`flex flex-col items-center min-h-[300px] space-y-4 mt-5 mb-0`}
      >
        {qrCodeURI ? (
          <>
            <QRCode
              uri={qrCodeURI}
              logoColor={selectedWallet.color}
              logo={selectedWallet.Icon}
            />
            <div
              className={tw`bg-white px-4 py-2 text-center font-semibold text-sm`}
            >
              Open your phone camera or wallet to scan this QR code.
            </div>
            <div
              className={tw`flex flex-col justify-center items-center text-gray-500 space-y-2`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.8993 8.86737L16.4222 7.35189C16.176 7.09912 15.7796 7.09912 15.5333 7.35189C15.287 7.60465 15.287 8.01147 15.5333 8.26424L16.8325 9.59767V14.1172C16.8325 14.3277 16.6546 14.5103 16.4495 14.5103C16.2443 14.5103 16.0664 14.3277 16.0664 14.1172C16.0664 13.0502 15.2187 12.18 14.1791 12.18H14.1518V5.79359C14.1518 5.42843 13.8644 5.14771 13.5225 5.14771H6.69862C6.35673 5.14771 6.06932 5.42843 6.06932 5.79359V16.6437H5.72796C5.38607 16.6437 5.09866 16.9387 5.09866 17.2896C5.09866 17.6547 5.38607 17.9355 5.72796 17.9355H14.4804C14.8223 17.9355 15.1097 17.6547 15.1097 17.2896C15.1097 16.9387 14.8223 16.6437 14.4804 16.6437H14.1385V13.4712H14.1657C14.5076 13.4712 14.795 13.7662 14.795 14.1171C14.795 15.0437 15.5333 15.8015 16.4361 15.8015C17.3389 15.8015 18.0772 15.0437 18.0772 14.1171L18.0767 9.33051C18.0906 9.16219 18.0222 8.99386 17.8993 8.8672L17.8993 8.86737ZM10.1042 15.619C9.42041 15.619 8.85949 15.0433 8.85949 14.3415C8.85949 13.7801 9.6389 12.5311 9.96744 12.0399C10.0358 11.9417 10.1865 11.9417 10.2548 12.0399C10.5828 12.5311 11.3628 13.7665 11.3628 14.3415C11.3484 15.0433 10.788 15.619 10.1042 15.619H10.1042ZM12.8799 10.0046H7.3279V6.43968H12.8805L12.8799 10.0046Z"
                  fill="currentColor"
                />
                <circle
                  cx="11"
                  cy="11"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <rect
                  x="3.56757"
                  y="16.813"
                  width="20.0271"
                  height="1.46888"
                  transform="rotate(-35.9706 3.56757 16.813)"
                  fill="currentColor"
                />
              </svg>
              <div className={tw`font-semibold text-sm`}>
                Signing in is free. It costs no gas.
              </div>
            </div>
          </>
        ) : (
          <div
            role="status"
            className={`flex-1 flex flex-col justify-center items-center`}
          >
            <svg
              aria-hidden="true"
              className={tw`mr-2 w-12 h-12 text-gray-200 animate-spin`}
              style={{
                // tw doesn't support fill-* property yet
                fill: selectedWallet.color,
              }}
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className={tw`sr-only`}>Loading...</span>
          </div>
        )}
      </div>
      <PoweredByPicket />
    </>
  );
};
export default QRCodeConnectScreen;
