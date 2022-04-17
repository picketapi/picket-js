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

export interface AuthRequest {
  walletAddress: string;
  signature: string;
  requirements?: AuthRequirements;
}

export interface AuthenticatedUser {
  walletAddress: string;
  displayAddress: string;
  contractAddress?: string;
  tokenBalance?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
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
