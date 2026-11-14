import { ApiError } from '../http/errors';
import { COOKIE_KEYS, getCookie } from '@/lib/auth-storage';

const LEGACY_TOKEN_KEY = 'famidoc_auth_token';

class HttpClient {
  private baseUrl: string;
  private token: string | null = null;

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
    }
  }

  setToken(token: string, rememberMe = true) {
    this.token = token;
    if (typeof window !== 'undefined') {
      const targetStorage = rememberMe ? localStorage : sessionStorage;
      const staleStorage = rememberMe ? sessionStorage : localStorage;

      targetStorage.setItem(COOKIE_KEYS.TOKEN, token);
      staleStorage.removeItem(COOKIE_KEYS.TOKEN);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(COOKIE_KEYS.TOKEN);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      sessionStorage.removeItem(COOKIE_KEYS.TOKEN);
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

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }
    return url.toString();
  }

  async request<T>(
    path: string,
    options: RequestInit = {},
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const detailMessage =
          (errorData as { error?: { detail?: string } })?.error?.detail ||
          (errorData as { message?: string })?.message;
        throw new ApiError(
          detailMessage || `API error (${res.status})`,
          res.status,
          errorData
        );
      }

      if (res.status === 204) {
        return {} as T;
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ', 500);
    }
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' }, params);
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
}

export const httpClient = new HttpClient();
