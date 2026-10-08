import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];
  readonly body: unknown;

  constructor(status: number, message: string | string[], body?: unknown) {
    const messages = Array.isArray(message) ? message : [message];
    super(messages.join(', '));
    this.status = status;
    this.messages = messages;
    this.body = body;
  }
}

interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

let refreshInFlight: Promise<void> | null = null;

async function refreshTokens(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, 'No refresh token available');
  }
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    throw new ApiError(res.status, 'Session expired');
  }
  const data = (await res.json()) as TokenPairResponse;
  setTokens(data.accessToken, data.refreshToken);
}

/**
 * Thin fetch wrapper: attaches the bearer token, transparently retries once
 * after a silent refresh on 401 (de-duping concurrent refreshes), and
 * normalizes error responses (including class-validator's array-of-strings
 * `message`) into a single `ApiError`.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && allowRefresh && getRefreshToken()) {
    refreshInFlight ??= refreshTokens().finally(() => {
      refreshInFlight = null;
    });
    try {
      await refreshInFlight;
    } catch {
      clearTokens();
      window.location.assign('/login');
      throw new ApiError(401, 'Session expired');
    }
    return apiFetch<T>(path, options, false);
  }

  if (!res.ok) {
    let message: string | string[] = res.statusText;
    let body: unknown;
    try {
      body = await res.json();
      const parsedMessage = (body as { message?: string | string[] })?.message;
      if (parsedMessage) message = parsedMessage;
    } catch {
      // Response had no JSON body; fall back to statusText.
    }
    throw new ApiError(res.status, message, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
