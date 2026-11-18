import { describe, it, expect, vi, beforeEach } from 'vitest';
import { COOKIE_KEYS } from '../auth-storage';

const mockCookiesGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: mockCookiesGet,
  }),
  headers: async () => new Headers({ host: 'famidoc.online' }),
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
  });
});
