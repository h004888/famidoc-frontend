import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readServerAuthSession } from '../server-auth-session';
import { COOKIE_KEYS, DEFAULT_USERS } from '../auth-storage';

const mockGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockGet,
  })),
}));

describe('readServerAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed session when role, token, and user cookies are valid', async () => {
    const userPayload = {
      id: 'usr-99',
      name: 'Nguyễn Thị Lan',
      phone: '0909123456',
      email: 'lan@famidoc.vn',
      role: 'FAMILY',
      avatarText: 'NL',
    };

    mockGet.mockImplementation((key: string) => {
      if (key === COOKIE_KEYS.ROLE) return { value: 'FAMILY' };
      if (key === COOKIE_KEYS.TOKEN) return { value: 'jwt-abc-123' };
      if (key === COOKIE_KEYS.USER) return { value: encodeURIComponent(JSON.stringify(userPayload)) };
      return undefined;
    });

    const session = await readServerAuthSession();

    expect(session).toEqual({
      role: 'FAMILY',
      token: 'jwt-abc-123',
      user: userPayload,
    });
  });

  it('returns null when token or role cookie is missing', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === COOKIE_KEYS.ROLE) return { value: 'FAMILY' };
      return undefined;
    });

    expect(await readServerAuthSession()).toBeNull();
  });

  it('falls back to DEFAULT_USERS[role] when user cookie contains invalid JSON', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === COOKIE_KEYS.ROLE) return { value: 'DOCTOR' };
      if (key === COOKIE_KEYS.TOKEN) return { value: 'jwt-doc-1' };
      if (key === COOKIE_KEYS.USER) return { value: '{broken-json' };
      return undefined;
    });

    const session = await readServerAuthSession();

    expect(session).toEqual({
      role: 'DOCTOR',
      token: 'jwt-doc-1',
      user: DEFAULT_USERS.DOCTOR,
    });
  });
});
