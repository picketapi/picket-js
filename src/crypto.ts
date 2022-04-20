// Adapted from https://github.com/auth0/auth0-spa-js/blob/master/src/utils.ts#L143
export const getCryptoSubtle = () => {
  //safari 10.x uses webkitSubtle
  return window.crypto.subtle || (window.crypto as any).webkitSubtle;
};

export const randomString = () => {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.";
  let random = "";
  const randomValues = Array.from(
    window.crypto.getRandomValues(new Uint8Array(43))
  );
  randomValues.forEach((v) => (random += charset[v % charset.length]));
  return random;
};
