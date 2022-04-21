import { AuthorizationServerWebResponse } from "./types";

// Adapted from: https://github.com/auth0/auth0-spa-js/blob/0ae6078c02d3a4184147e788adfceae4db78db65/src/utils.ts#L89

const POPUP_WIDTH = 400;
const POPUP_HEIGHT = 400;

export const open = (url: string): Window | null => {
  // center the popup
  const left = window.screenX + (window.innerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.innerHeight - POPUP_HEIGHT) / 2;

  // Need to add some content...
  return window.open(
    url,
    "picket:authorize:popup",
    `left=${left},top=${top},width=${POPUP_WIDTH},height=${POPUP_HEIGHT},resizable,scrollbars=yes,status=1`
  );
};

const TIMEOUT_IN_SECONDS = 60 * 2;

export const run = (popup: Window) => {
  return new Promise<AuthorizationServerWebResponse>((resolve, reject) => {
    // @ts-ignore MessageEvent implements Event per docs. Unclear why TS complains
    const popupEventListener: EventListenerOrEventListenerObject = function (
      e: MessageEvent
    ) {
      if (!e.isTrusted) return;

      // verify the message came from the authorization server
      if (e.origin !== popup.origin) return;

      const { data } = e;
      if (!data || data.type !== "authorization_response") {
        return;
      }

      const { response } = data;
      // we expect a response...
      if (!response) return;

      clearTimeout(timeoutId);
      clearInterval(popupTimer);
      window.removeEventListener("message", popupEventListener, false);
      popup.close();

      const { error, error_description } = response;

      if (error) {
        return reject(new Error(error_description || error));
      }

      resolve(response);
    };

    // Check each second if the popup is closed triggering a PopupCancelledError
    const popupTimer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(popupTimer);
        clearTimeout(timeoutId);
        window.removeEventListener("message", popupEventListener, false);
        reject(new Error("popup closed"));
      }
    }, 1000);

    const timeoutId = setTimeout(() => {
      clearInterval(popupTimer);
      reject(new Error("popup timed out"));
      window.removeEventListener("message", popupEventListener, false);
    }, TIMEOUT_IN_SECONDS * 1000);

    window.addEventListener("message", popupEventListener);
  });
};
