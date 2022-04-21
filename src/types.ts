import { providers } from "ethers";

export interface ErrorResponse {
  code?: string;
  msg: string;
}

export interface NonceResponse {
  nonce: string;
}

export interface AuthRequirements {
  contractAddress?: string;
  minTokenBalance?: number | string;
}

export interface AuthenticatedUser {
  walletAddress: string;
  displayAddress: string;
  contractAddress?: string;
  tokenBalance?: string;
}

export interface AuthState {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface AccessTokenPayload extends AuthenticatedUser {
  iat: number;
  ext: number;
  iss: string;
  sub: string;
  aud: string;
  tid: string;
}

// support any for non-ethers libraries
export type ConnectProvider =
  | providers.ExternalProvider
  | providers.JsonRpcFetchFunc
  | any;

export interface ConnectResponse {
  walletAddress: string;
  signature: string;
  provider: ConnectProvider;
}

export interface AppState extends Record<string, any> {
  returnTo?: string;
}

export interface LoginRequest extends AuthRequirements {
  walletAddress?: string;
  signature?: string;
}

export interface LoginOptions {
  redirectURI?: string;
  appState?: AppState;
}

export interface LoginCallbackResponse extends AuthState {
  appState: AppState;
}

export interface AuthorizationURLRequest extends AuthRequirements {
  redirectURI: string;
  state: string;
  codeChallenge: string;
  walletAddress: string;
  signature: string;
}
