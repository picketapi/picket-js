import { providers } from "ethers";

export interface ErrorResponse {
  code?: string;
  msg: string;
}

export enum ChainTypes {
  ETH = "ethereum",
  SOL = "solana",
  FLOW = "flow",
}

export type ChainType = `${ChainTypes}`;

export type ChainInfo = {
  chainSlug: string;
  chainId: number;
  chainType: ChainType;
  chainName: string;
  publicRPC: string;
  authorizationSupported: boolean;
};

export enum SigningMessageFormat {
  SIMPLE = "simple",
  SIWE = "siwe",
}

export interface NonceRequest {
  chain: string;
  walletAddress: string;
  locale?: string;
}

export interface NonceResponse {
  nonce: string;
  statement: string;
  format: `${SigningMessageFormat}`;
}

export interface AuthRequirements {
  contractAddress?: string;
  minTokenBalance?: number | string;
  allowedWallets?: string[];
  // Solana specific auth requirement options
  tokenIds?: string[];
  collection?: string | string[];
  creatorAddress?: string;
}

// TokenRequirementsBalances maps type of requirements to balances for the ID/address/name
export type TokenRequirementsBalances = {
  contractAddress?: Record<string, string>;
  collection?: Record<string, string>;
  tokenIds?: Record<string, string>;
  creatorAddress?: Record<string, string>;
};

export interface AuthenticatedUser {
  chain: string;
  walletAddress: string;
  displayAddress: string;
  contractAddress?: string;
  tokenBalances?: TokenRequirementsBalances;
}

export interface AuthState {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface AccessTokenPayload extends AuthenticatedUser {
  iat: number;
  exp: number;
  iss: string;
  sub: string;
  aud: string;
  tid: string;
}

// SigningMessageContext is the minumum additional fields for SIWE that are generated client-side
// and needed to be passed to the server to regenerate the signed message.
// For more details, see https://docs.login.xyz/general-information/siwe-overview/eip-4361#message-field-descriptions
export interface SigningMessageContext {
  // Exclude version because it is always 1
  // version: 1;
  domain: string;
  uri: string;
  chainId: number;
  issuedAt: string;
  chainType: ChainType;
  // add locale to the context even though it is not part of the SIWE spec
  locale?: string;
}

export interface SigningMessageRequestSimple extends NonceResponse {
  walletAddress: string;
}

export interface SigningMessageRequestSIWE
  extends SigningMessageRequestSimple,
    SigningMessageContext {}

export type SigningMessageRequest =
  | SigningMessageRequestSimple
  | SigningMessageRequestSIWE;

export interface ConnectRequest {
  chain?: string;
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
  locale?: string;
  context?: SigningMessageContext;
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
