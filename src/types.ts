import { providers } from "ethers";

export interface ErrorResponse {
  code?: string;
  msg: string;
}

export enum ChainTypes {
  ETH = "ethereum",
  SOL = "solana",
}

export type ChainType = `${ChainTypes}`;

export type ChainInfo = {
  chainSlug: string;
  chainId: number;
  chainType: ChainTypes;
  chainName: string;
  publicRPC: string;
  authorizationSupported: boolean;
};

export interface NonceRequest {
  chain: string;
  walletAddress: string;
}

export interface NonceResponse {
  nonce: string;
  statement: string;
}

export interface AuthRequirements {
  contractAddress?: string;
  tokenIds?: string[];
  minTokenBalance?: number | string;
}

export interface AuthenticatedUser {
  chain: string;
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

export enum SigningMessageFormat {
  SIMPLE = "simple",
  SIWE = "siwe",
}

// SigningMessageContext is the minumum additional fields for SIWE that are generated client-side
// and needed to be passed to the server to regenerate the signed message.
// For more details, see https://docs.login.xyz/general-information/siwe-overview/eip-4361#message-field-descriptions
export interface SigningMessageContext {
  // Exlcude version because it is always 1
  // version: 1;
  domain: string;
  uri: string;
  chainId: number;
  issuedAt: string;
}

export interface SigningMessageRequestSimple extends NonceResponse {
  walletAddress: string;
}

export interface SigningMessageRequestSIWE extends SigningMessageRequestSimple {
  domain: string;
  uri: string;
  chainId: number;
  issuedAt: string;
  chainType: ChainType;
}

export type SigningMessageRequest =
  | SigningMessageRequestSimple
  | SigningMessageRequestSIWE;

export interface ConnectRequest {
  chain?: string;
  messageFormat?: `${SigningMessageFormat}`;
  doAuth?: boolean;
  requirements?: AuthRequirements;
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
  context?: SigningMessageContext;
  chain: string;
  auth?: AuthState;
}

export interface AppState extends Record<string, any> {
  returnTo?: string;
}

export interface LoginRequest extends AuthRequirements {
  chain?: string;
  walletAddress?: string;
  signature?: string;
  context?: SigningMessageContext;
}

export interface LoginOptions {
  redirectURI?: string;
  appState?: AppState;
}

export interface LoginCallbackResponse extends AuthState {
  appState: AppState;
}

export type AuthorizationResponseMode = "code" | "web_message";

export interface AuthorizationURLRequest extends AuthRequirements {
  redirectURI: string;
  state: string;
  codeChallenge: string;
  chain?: string;
  walletAddress?: string;
  signature?: string;
  responseMode: AuthorizationResponseMode;
}

export interface AuthorizationServerWebResponse {
  state: string;
  code?: string;
  error?: string;
  error_description?: string;
}

export interface AuthRequest {
  chain: string;
  walletAddress: string;
  signature: string;
  requirements?: AuthRequirements;
  context?: SigningMessageContext;
}
