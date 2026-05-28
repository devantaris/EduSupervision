let _accessToken: string | null = null;
let _expiresAt: number = 0;
let _refreshPromise: Promise<string | null> | null = null;

export const tokenStore = {
  get: () => _accessToken,
  isValid: () => _accessToken !== null && Date.now() < _expiresAt - 30_000,
  set: (token: string, expiresInSeconds: number) => {
    _accessToken = token;
    _expiresAt = Date.now() + expiresInSeconds * 1000;
  },
  clear: () => {
    _accessToken = null;
    _expiresAt = 0;
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
      tokenStore.set(data.access_token, data.expires_in);
      return data.access_token as string;
    })
    .catch((err) => {
      console.error("Token silent refresh failed:", err);
      tokenStore.clear();
      // Redirect to login if on client-side
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return null;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let token = tokenStore.get();

  // If token is expired or missing but we are on client-side, attempt to refresh once
  if (!tokenStore.isValid() && typeof window !== "undefined") {
    token = await silentRefresh();
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure content type defaults to JSON if we pass a body and it is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  // Intercept 401 and try token refresh once
  if (response.status === 401 && typeof window !== "undefined") {
    const newToken = await silentRefresh();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      return fetch(path, {
        ...options,
        headers,
      });
    }
  }

  return response;
}
