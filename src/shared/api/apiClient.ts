const API_BASE_PATH = "/api/v1";

// Singleton so concurrent 401s only trigger one refresh call.
let refreshPromise: Promise<void> | null = null;

function attemptRefresh(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = request<void>("POST", "/auth/refresh").finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Retry after refresh for /auth/me (silent session restore on load) and all
// non-auth paths. Never retry /auth/login, /auth/register etc. — a 401 there
// means wrong credentials, not an expired token.
function shouldRetryWithRefresh(path: string): boolean {
  return path === "/auth/me" || !path.startsWith("/auth/");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
  isRetry = false,
): Promise<T> {
  const response = await window.fetch(`${API_BASE_PATH}${path}`, {
    method,
    credentials: "include",
    signal,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !isRetry && shouldRetryWithRefresh(path)) {
    try {
      await attemptRefresh();
      return request<T>(method, path, body, signal, true);
    } catch {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      throw new Error("Session expired. Please sign in again.");
    }
  }

  if (!response.ok) {
    let message: string;
    try {
      const data = await response.json() as Record<string, unknown>;
      const detail = data.detail;
      if (Array.isArray(detail)) {
        message = detail
          .map((e) => {
            const msg = (e as Record<string, unknown>).msg as string ?? "";
            return msg.replace(/^Value error,\s*/i, "");
          })
          .filter(Boolean)
          .join("; ") || `Request failed with status ${response.status}`;
      } else {
        message = (detail as string) ?? (data.message as string) ?? `Request failed with status ${response.status}`;
      }
    } catch {
      message = (await response.text()) || `Request failed with status ${response.status}`;
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, undefined, signal),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
