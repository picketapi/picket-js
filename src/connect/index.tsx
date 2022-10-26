import React from "react";
import { render } from "react-dom";
import { setup, Configuration } from "twind";

import twindConfig from "./twind.config";
import { SigningMessageContext, AuthState } from "../types";

import ConnectModal, { ConnectModalProps } from "./ConnectModal";
import { MODAL_ID, MSG_OPEN, MSG_CLOSE, MSG_SUCCESS } from "./constants";

// TODOs
// - Custom provider options
// - Close on click outside
// - Open success or error state on OAuth2 redirect
// - Prompt to purchase tokens
// - Custom QR codes / Multi-step flow
// - New Wallet Link
// - More error messages
// - Refactor into separate library

interface PicketConnectEvent {
  type: string;
  data: object;
}

export interface PicketConnectResponse {
  walletAddress: string;
  signature: string;
  context: SigningMessageContext;
  provider: any;
  chain: string;
  auth?: AuthState;
}

const mount = async (props: ConnectModalProps) => {
  //  only mount once
  if (document.getElementById(MODAL_ID)) return;

  //  setup tailwind
  setup(twindConfig as unknown as Configuration);

  const el = document.createElement("div");
  el.id = MODAL_ID;
  document.body.appendChild(el);
  const container = document.getElementById(MODAL_ID);

  // This try/catch always fails because of
  // https://github.com/parcel-bundler/parcel/issues/7268
  try {
    // React 18
    const { createRoot } = await import("react-dom/client");
    const root = createRoot(container!);
    root.render(<ConnectModal {...props} />);
  } catch (err) {
    // React <18
    render(<ConnectModal {...props} />, container);
  }
};

export const connect = (
  props: ConnectModalProps
): Promise<PicketConnectResponse> =>
  new Promise((resolve, reject) => {
    //  make sure the modal is mounted
    mount(props).then(() => {
      //  make sure the modal is open
      window.postMessage({
        type: MSG_OPEN,
        data: props,
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
  });
