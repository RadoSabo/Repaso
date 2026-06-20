/**
 * The single backend that generates cards. The app always talks to this URL —
 * it is not user-configurable. Change it here (or via the EXPO_PUBLIC_PROXY_URL
 * build var, e.g. in eas.json) if the proxy is redeployed to a different host.
 */
export const PROXY_URL = (process.env.EXPO_PUBLIC_PROXY_URL ?? 'https://repaso.expo.app').replace(
  /\/+$/,
  ''
);
