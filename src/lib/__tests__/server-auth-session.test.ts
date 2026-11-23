import { describe, it, expect, vi, beforeEach } from 'vitest';
import { COOKIE_KEYS } from '../auth-storage';

const mockCookiesGet = vi.fn();
const mockCacheLife = vi.fn();

vi.mock('next/cache', () => ({
  cacheLife: mockCacheLife,
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: mockCookiesGet,
  }),
  headers: async () => new Headers({ host: 'famidoc.online' }),
}));

vi.mock('next/server', () => ({
  connection: async () => undefined,
}));

describe('readServerAuthSession - JWT exp check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when access token is expired and no refresh token cookie exists', async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 120;
    const expiredJwt = `${btoa(JSON.stringify({ alg: 'HS256' }))}.${btoa(
      JSON.stringify({ sub: 'u-1', exp: pastExp }),
    )}.sig`;

    mockCookiesGet.mockImplementation((name: string) => {
      if (name === COOKIE_KEYS.ROLE) return { value: 'FAMILY' };
      if (name === COOKIE_KEYS.TOKEN) return { value: expiredJwt };
      if (name === COOKIE_KEYS.USER)
        return { value: JSON.stringify({ id: 'u-1', name: 'Hùng', phone: '' }) };
      return undefined;
    });

    const { readServerAuthSession } = await import('../server-auth-session');
    const session = await readServerAuthSession();
    expect(session).toBeNull();
    expect(mockCacheLife).toHaveBeenCalledWith('minutes');
  });

  it('returns ServerAuthSession when access token is valid', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const validJwt = `${btoa(JSON.stringify({ alg: 'HS256' }))}.${btoa(
      JSON.stringify({ sub: 'u-1', exp: futureExp }),
    )}.sig`;

    mockCookiesGet.mockImplementation((name: string) => {
      if (name === COOKIE_KEYS.ROLE) return { value: 'FAMILY' };
      if (name === COOKIE_KEYS.TOKEN) return { value: validJwt };
      if (name === COOKIE_KEYS.USER)
        return { value: JSON.stringify({ id: 'u-1', name: 'Hùng', phone: '0912345678' }) };
      return undefined;
    });

    const { readServerAuthSession } = await import('../server-auth-session');
    const session = await readServerAuthSession();
    expect(session).not.toBeNull();
    expect(session?.role).toBe('FAMILY');
    expect(session?.token).toBe(validJwt);
    expect(session?.user.name).toBe('Hùng');
  });

  it('returns ServerAuthSession when access token is expired but refresh token exists', async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 120;
    const expiredJwt = `${btoa(JSON.stringify({ alg: 'HS256' }))}.${btoa(
      JSON.stringify({ sub: 'u-1', exp: pastExp }),
    )}.sig`;

    mockCookiesGet.mockImplementation((name: string) => {
      if (name === COOKIE_KEYS.ROLE) return { value: 'FAMILY' };
      if (name === COOKIE_KEYS.TOKEN) return { value: expiredJwt };
      if (name === COOKIE_KEYS.REFRESH_TOKEN) return { value: 'refresh-tok-123' };
      if (name === COOKIE_KEYS.USER)
        return { value: JSON.stringify({ id: 'u-1', name: 'Hùng', phone: '0912345678' }) };
      return undefined;
    });

    const { readServerAuthSession } = await import('../server-auth-session');
    const session = await readServerAuthSession();
    expect(session).not.toBeNull();
    expect(session?.role).toBe('FAMILY');
    expect(session?.token).toBe(expiredJwt);
  });
});
