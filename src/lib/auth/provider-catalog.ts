import "server-only";

export type AuthProviderId = "email" | "google" | "apple" | "wallet" | "telegram";
export type AuthMode = "signin" | "signup";

type AuthProviderDefinition = {
  id: AuthProviderId;
  label: string;
  category: "auth0_native" | "external_adapter";
  auth0ConnectionEnv?: string;
  auth0FallbackConnection?: string;
};

const PROVIDERS: Record<AuthProviderId, AuthProviderDefinition> = {
  email: {
    id: "email",
    label: "Email",
    category: "auth0_native",
    auth0ConnectionEnv: "AUTH0_CONNECTION_EMAIL",
    auth0FallbackConnection: "email",
  },
  google: {
    id: "google",
    label: "Google",
    category: "auth0_native",
    auth0ConnectionEnv: "AUTH0_CONNECTION_GOOGLE",
    auth0FallbackConnection: "google-oauth2",
  },
  apple: {
    id: "apple",
    label: "Apple",
    category: "auth0_native",
    auth0ConnectionEnv: "AUTH0_CONNECTION_APPLE",
    auth0FallbackConnection: "apple",
  },
  wallet: {
    id: "wallet",
    label: "Wallet Connect",
    category: "external_adapter",
    auth0ConnectionEnv: "AUTH0_CONNECTION_WALLET",
  },
  telegram: {
    id: "telegram",
    label: "Telegram",
    category: "external_adapter",
    auth0ConnectionEnv: "AUTH0_CONNECTION_TELEGRAM",
  },
};

export function isAuthProviderId(value: string): value is AuthProviderId {
  return value in PROVIDERS;
}

export function getAuthProviderDefinition(id: AuthProviderId) {
  return PROVIDERS[id];
}

export function getAuth0ConnectionForProvider(id: AuthProviderId) {
  const provider = PROVIDERS[id];
  const dynamicValue = provider.auth0ConnectionEnv
    ? process.env[provider.auth0ConnectionEnv]
    : undefined;

  const connection = dynamicValue || provider.auth0FallbackConnection;
  return connection ?? null;
}

