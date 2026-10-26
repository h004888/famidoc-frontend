import { ApiError } from './errors';

const API_BASE = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const serverClient = {
  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<{ status: number; data: T }> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });

      if (!res.ok) {
        throw new ApiError(`Server responded with ${res.status}: ${res.statusText}`, res.status);
      }

      const data = await res.json() as T;
      return { status: res.status, data };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err instanceof Error ? err.message : 'Unknown Server Network Error');
    }
  },

  async post<T = unknown>(endpoint: string, body?: unknown, options?: RequestInit): Promise<{ status: number; data: T }> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new ApiError(
          (errorBody as { message?: string }).message || `Server error: ${res.status}`,
          res.status,
          errorBody
        );
      }

      const data = await res.json() as T;
      return { status: res.status, data };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err instanceof Error ? err.message : 'Unknown Server Network Error');
    }
  },
};
