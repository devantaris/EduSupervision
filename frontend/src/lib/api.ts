const TOKEN_KEY = "es_access_token";
const EXPIRES_KEY = "es_expires_at";

let _accessToken: string | null = null;
let _expiresAt: number = 0;
let _refreshPromise: Promise<string | null> | null = null;

export const tokenStore = {
  get: () => {
    if (_accessToken) return _accessToken;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          _accessToken = stored;
          _expiresAt = Number(localStorage.getItem(EXPIRES_KEY) || 0);
          return stored;
        }
      } catch {
        // localStorage not available
      }
    }
    return null;
  },
  isValid: () => {
    const token = tokenStore.get();
    if (!token) return false;
    if (_expiresAt > 0) {
      return Date.now() < _expiresAt - 10_000;
    }
    return true;
  },
  set: (token: string, expiresInSeconds: number) => {
    _accessToken = token;
    _expiresAt = Date.now() + expiresInSeconds * 1000;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(EXPIRES_KEY, String(_expiresAt));
      } catch {
        // ignore
      }
    }
  },
  clear: () => {
    _accessToken = null;
    _expiresAt = 0;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRES_KEY);
      } catch {
        // ignore
      }
    }
  },
};

export async function silentRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = fetch("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error("Refresh failed");
      }
      const data = await res.json();
      if (data.access_token) {
        tokenStore.set(data.access_token, data.expires_in || 900);
        return data.access_token as string;
      }
      return null;
    })
    .catch((err) => {
      console.warn("Token refresh attempt was unsuccessful:", err.message);
      return null;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  // Normalize path from /api/... to /api/v1/... (except /api/auth/...)
  let normalizedPath = path;
  if (
    normalizedPath.startsWith("/api/") &&
    !normalizedPath.startsWith("/api/auth/") &&
    !normalizedPath.startsWith("/api/v1/")
  ) {
    normalizedPath = normalizedPath.replace("/api/", "/api/v1/");
  }

  let token = tokenStore.get();

  // If token is expired or missing on client-side, attempt silent refresh
  if (!tokenStore.isValid() && typeof window !== "undefined") {
    const refreshed = await silentRefresh();
    if (refreshed) {
      token = refreshed;
    }
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Default to JSON if body exists and is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(normalizedPath, {
    ...options,
    headers,
  });

  // Intercept 401 and try token refresh once
  if (response.status === 401 && typeof window !== "undefined") {
    const newToken = await silentRefresh();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      return fetch(normalizedPath, {
        ...options,
        headers,
      });
    }
  }

  return response;
}
