import { ApiConnectionError, ApiError } from '../http/errors';
import { COOKIE_KEYS, getCookie } from '@/lib/auth-storage';
import { extractErrorMessage, isNetworkFailureMessage } from './error-handler';

const LEGACY_TOKEN_KEY = 'famidoc_auth_token';

export interface TokenRefreshPayload {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
  role?: string;
  user?: unknown;
}

const SKIP_AUTH_REFRESH_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/register-representative',
  '/api/v1/auth/verify-email-otp',
  '/api/v1/auth/reset-password',
];

const TRANSIENT_BLOB_STATUSES = new Set([502, 503, 504]);
const BLOB_RETRY_DELAY_MS = 250;

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRequestError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof SyntaxError) {
    return new ApiError('Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại sau.');
  }
  const rawMessage = error instanceof Error ? error.message : error;
  if (typeof rawMessage === 'string' && isNetworkFailureMessage(rawMessage)) {
    return new ApiConnectionError(extractErrorMessage(error));
  }
  return new ApiError(
    extractErrorMessage(error, 'Không xử lý được yêu cầu. Vui lòng thử lại sau.')
  );
}

class HttpClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private inFlightRefresh: Promise<TokenRefreshPayload | null> | null = null;
  private onTokenRefreshed: ((payload: TokenRefreshPayload) => void) | null = null;
  private onUnauthorized: (() => void) | null = null;
  private unauthorizedNotified = false;

  constructor() {
    this.baseUrl =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://api.famidoc.online';
    if (typeof window !== 'undefined') {
      this.token =
        sessionStorage.getItem(COOKIE_KEYS.TOKEN) ||
        localStorage.getItem(COOKIE_KEYS.TOKEN) ||
        getCookie(COOKIE_KEYS.TOKEN);
      this.refreshToken =
        sessionStorage.getItem(COOKIE_KEYS.REFRESH_TOKEN) ||
        localStorage.getItem(COOKIE_KEYS.REFRESH_TOKEN) ||
        getCookie(COOKIE_KEYS.REFRESH_TOKEN);
    }
  }

  setToken(token: string, rememberMe = true) {
    this.token = token;
    this.unauthorizedNotified = false;
    if (typeof window !== 'undefined') {
      const targetStorage = rememberMe ? localStorage : sessionStorage;
      const staleStorage = rememberMe ? sessionStorage : localStorage;

      targetStorage.setItem(COOKIE_KEYS.TOKEN, token);
      staleStorage.removeItem(COOKIE_KEYS.TOKEN);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  }

  setRefreshToken(refreshToken: string | null, rememberMe = true) {
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      if (refreshToken) {
        const targetStorage = rememberMe ? localStorage : sessionStorage;
        const staleStorage = rememberMe ? sessionStorage : localStorage;
        targetStorage.setItem(COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
        staleStorage.removeItem(COOKIE_KEYS.REFRESH_TOKEN);
      } else {
        localStorage.removeItem(COOKIE_KEYS.REFRESH_TOKEN);
        sessionStorage.removeItem(COOKIE_KEYS.REFRESH_TOKEN);
      }
    }
  }

  getRefreshToken(): string | null {
    if (this.refreshToken) return this.refreshToken;
    if (typeof window !== 'undefined') {
      this.refreshToken =
        sessionStorage.getItem(COOKIE_KEYS.REFRESH_TOKEN) ||
        localStorage.getItem(COOKIE_KEYS.REFRESH_TOKEN) ||
        getCookie(COOKIE_KEYS.REFRESH_TOKEN);
    }
    return this.refreshToken;
  }

  setTokenRefreshedHandler(handler: ((payload: TokenRefreshPayload) => void) | null) {
    this.onTokenRefreshed = handler;
  }

  setUnauthorizedHandler(handler: (() => void) | null) {
    this.onUnauthorized = handler;
  }

  clearToken() {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(COOKIE_KEYS.TOKEN);
      localStorage.removeItem(COOKIE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      sessionStorage.removeItem(COOKIE_KEYS.TOKEN);
      sessionStorage.removeItem(COOKIE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token =
        sessionStorage.getItem(COOKIE_KEYS.TOKEN) ||
        localStorage.getItem(COOKIE_KEYS.TOKEN) ||
        getCookie(COOKIE_KEYS.TOKEN);
    }
    return this.token;
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    baseUrl: string = this.baseUrl
  ): string {
    const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }
    return url.toString();
  }

  private shouldAttemptRefresh(path: string): boolean {
    return !SKIP_AUTH_REFRESH_PATHS.some((skip) => path.includes(skip));
  }

  private notifyUnauthorizedOnce() {
    this.clearToken();
    if (!this.unauthorizedNotified) {
      this.unauthorizedNotified = true;
      this.onUnauthorized?.();
    }
  }

  private async refreshAccessTokenSingleFlight(): Promise<TokenRefreshPayload | null> {
    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    const currentRefreshToken = this.getRefreshToken();
    if (!currentRefreshToken) {
      return null;
    }

    this.inFlightRefresh = (async () => {
      try {
        const res = await fetch(this.buildUrl('/api/v1/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });
        if (!res.ok) {
          return null;
        }
        const json = (await res.json()) as
          | { data?: TokenRefreshPayload }
          | TokenRefreshPayload;
        const payload =
          json && typeof json === 'object' && 'data' in json && json.data
            ? json.data
            : (json as TokenRefreshPayload);
        if (!payload?.accessToken) {
          return null;
        }
        const rememberMe =
          typeof window !== 'undefined' &&
          Boolean(localStorage.getItem(COOKIE_KEYS.TOKEN));
        this.setToken(payload.accessToken, rememberMe);
        if (payload.refreshToken) {
          this.setRefreshToken(payload.refreshToken, rememberMe);
        }
        this.onTokenRefreshed?.(payload);
        return payload;
      } catch {
        return null;
      } finally {
        this.inFlightRefresh = null;
      }
    })();

    return this.inFlightRefresh;
  }

  private async fetchWithAuthRetry(
    path: string,
    executeFetch: (authHeader?: string) => Promise<Response>,
    explicitAuthHeader?: string,
  ): Promise<Response> {
    const token = this.getToken();
    const initialAuth =
      explicitAuthHeader ?? (token ? `Bearer ${token}` : undefined);
    let res = await executeFetch(initialAuth);

    if (res.status === 401 && this.shouldAttemptRefresh(path)) {
      const refreshed = await this.refreshAccessTokenSingleFlight();
      if (refreshed?.accessToken) {
        res = await executeFetch(`Bearer ${refreshed.accessToken}`);
      }
      if (res.status === 401) {
        this.notifyUnauthorizedOnce();
      }
    }

    return res;
  }

  async request<T>(
    path: string,
    options: RequestInit = {},
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      let res: Response;
      try {
        res = await this.fetchWithAuthRetry(
          path,
          (authHeader) => {
            const headers = { ...baseHeaders };
            if (authHeader && !headers['Authorization']) {
              headers['Authorization'] = authHeader;
            } else if (authHeader && authHeader !== baseHeaders['Authorization']) {
              headers['Authorization'] = authHeader;
            }
            return fetch(url, { ...options, headers });
          },
          baseHeaders['Authorization'],
        );
      } catch (networkErr) {
        const fallbackBase = process.env.NEXT_PUBLIC_API_URL;
        const canFallback =
          typeof window === 'undefined' &&
          !path.startsWith('http') &&
          Boolean(fallbackBase) &&
          fallbackBase !== this.baseUrl;
        if (!canFallback || !fallbackBase) {
          throw networkErr;
        }
        const fallbackUrl = this.buildUrl(path, params, fallbackBase);
        const headers = { ...baseHeaders };
        const token = this.getToken();
        if (token && !headers['Authorization']) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        res = await fetch(fallbackUrl, { ...options, headers });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const detailMessage = extractErrorMessage(
          { data: errorData },
          `API error (${res.status})`
        );
        throw new ApiError(detailMessage, res.status, errorData);
      }

      if (res.status === 204) {
        return {} as T;
      }

      return (await res.json()) as T;
    } catch (err) {
      throw normalizeRequestError(err);
    }
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' }, params);
  }

  async getBlob(path: string, options: RequestInit = {}): Promise<Blob> {
    const url = this.buildUrl(path);
    const baseHeaders: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let res: Response;
      try {
        res = await this.fetchWithAuthRetry(
          path,
          (authHeader) => {
            const headers = { ...baseHeaders };
            if (authHeader) {
              headers['Authorization'] = authHeader;
            }
            return fetch(url, {
              ...options,
              method: options.method ?? 'GET',
              headers,
            });
          },
          baseHeaders['Authorization'],
        );
      } catch (networkErr) {
        if (attempt === 0 && !options.signal?.aborted) {
          await sleepMs(BLOB_RETRY_DELAY_MS);
          continue;
        }
        throw normalizeRequestError(networkErr);
      }

      if (!res.ok) {
        if (
          attempt === 0 &&
          TRANSIENT_BLOB_STATUSES.has(res.status) &&
          !options.signal?.aborted
        ) {
          await sleepMs(BLOB_RETRY_DELAY_MS);
          continue;
        }

        let errorData: unknown = undefined;
        const fallbackMessage = `API error (${res.status})`;
        let detailMessage = extractErrorMessage({}, fallbackMessage);
        const contentType =
          typeof res.headers?.get === 'function'
            ? res.headers.get('content-type') || ''
            : '';

        if (contentType.includes('application/json') && typeof res.json === 'function') {
          errorData = await res.json().catch(() => undefined);
          detailMessage = extractErrorMessage({ data: errorData }, fallbackMessage);
        } else if (typeof res.text === 'function') {
          const text = await res.text().catch(() => '');
          if (text.trim()) {
            try {
              errorData = JSON.parse(text);
              detailMessage = extractErrorMessage({ data: errorData }, fallbackMessage);
            } catch {
              detailMessage = extractErrorMessage(text.trim(), fallbackMessage);
            }
          }
        } else if (typeof res.json === 'function') {
          errorData = await res.json().catch(() => undefined);
          detailMessage = extractErrorMessage({ data: errorData }, fallbackMessage);
        }

        throw new ApiError(detailMessage, res.status, errorData);
      }

      try {
        return await res.blob();
      } catch (error) {
        throw normalizeRequestError(error);
      }
    }

    throw new ApiError('Không thể tải tệp từ máy chủ', 503);
  }

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  async upload<T>(
    path: string,
    formData: FormData,
    method: 'POST' | 'PUT' = 'POST'
  ): Promise<T> {
    const url = this.buildUrl(path);
    try {
      const res = await this.fetchWithAuthRetry(path, (authHeader) => {
        const headers: Record<string, string> = {};
        if (authHeader) {
          headers['Authorization'] = authHeader;
        }
        return fetch(url, {
          method,
          headers,
          body: formData,
        });
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const detailMessage = extractErrorMessage(
          { data: errorData },
          `API error (${res.status})`
        );
        throw new ApiError(detailMessage, res.status, errorData);
      }
      return (await res.json()) as T;
    } catch (error) {
      throw normalizeRequestError(error);
    }
  }
}

export const httpClient = new HttpClient();
