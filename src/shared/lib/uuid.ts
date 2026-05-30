// crypto.randomUUID() requires a secure context (HTTPS or localhost).
// Fallback to a manual implementation for HTTP deployments without TLS.
export const randomUUID = (): string =>
  crypto.randomUUID?.() ??
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
