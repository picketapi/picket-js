import { AppState } from "./types";

// hasAuthorizationCodeParams returns true if the url contains OAuth 2.0 authorization code parameters
export const hasAuthorizationCodeParams = (url: string): boolean => {
  const { searchParams } = new URL(url);

  // state is required
  // check for either error param OR code
  return (
    searchParams.has("state") &&
    (searchParams.has("code") || searchParams.has("error"))
  );
};

export interface AuthorizationCodeParams {
  state: string | null;
  code: string | null;
  error: string | null;
  error_description: string | null;
}

// get the authorization code params from a given url if they exist
export const parseAuthorizationCodeParams = (
  url: string
): AuthorizationCodeParams => {
  const { searchParams } = new URL(url);

  if (!hasAuthorizationCodeParams(url)) {
    throw new Error("there are no authorization code params to parse");
  }

  // validate expected parameters exists
  return {
    state: searchParams.get("state"),
    code: searchParams.get("code"),
    error: searchParams.get("error"),
    error_description: searchParams.get("error_description"),
  };
};

// by default, navigate to the returnTo location or clear the query parameters from the url after a successful login
export const defaultLoginRedirectCallback = (appState?: AppState): void =>
  window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname
  );
