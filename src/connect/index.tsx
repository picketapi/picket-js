import { createRoot } from "react-dom/client";

import { SigningMessageFormat, SigningMessageContext } from "../types";

import ConnectModal from "./ConnectModal";
import { MODAL_ID, MSG_OPEN, MSG_CLOSE, MSG_SUCCESS } from "./constants";

// TODOs
// - Custom provider options
// - Authenticate and authorize users
// - Time outs! for connecting (15s)
// - Custom QR codes / Multi-step flow
// - New Wallet Link
// - More error messages
// - Refactor into separate library

interface PicketConnectEvent {
  type: string;
  data: object;
}

const mount = (props: PicketConnectRequest) => {
  //  only mount once
  if (document.getElementById(MODAL_ID)) return;

  const el = document.createElement("div");
  el.id = MODAL_ID;
  document.body.appendChild(el);

  const container = document.getElementById(MODAL_ID);
  const root = createRoot(container!);

  root.render(<ConnectModal {...props} />);
};

export interface PicketConnectRequest {
  chain?: string;
  messageFormat?: `${SigningMessageFormat}`;
}

export interface PicketConnectResponse {
  walletAddress: string;
  signature: string;
  context: SigningMessageContext;
  provider: any;
  chain: string;
}

export const connect = ({
  chain,
  messageFormat = SigningMessageFormat.SIWE,
}: PicketConnectRequest): Promise<PicketConnectResponse> =>
  new Promise((resolve, reject) => {
    //  make sure the modal is mounted
    mount({ chain, messageFormat });
    //  make sure the modal is open
    window.postMessage({
      type: MSG_OPEN,
      data: {
        messageFormat,
        chain,
      },
    });
    //  wait for close or connect
    window.addEventListener("message", (event) => {
      if (!event.data?.type) return;
      const { type, data } = event.data as PicketConnectEvent;

      if (type === MSG_CLOSE) {
        return reject("Modal closed");
      }

      // pass data
      if (type === MSG_SUCCESS) {
        // cannot serialize provider, pass through window object
        const provider = window.PicketProvider;
        resolve({
          ...(data as Omit<PicketConnectResponse, "provider">),
          provider,
        });
      }
    });
  });
