import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readServerAuthSession } from '../server-auth-session';
import { COOKIE_KEYS, DEFAULT_USERS } from '../auth-storage';

const mockGet = vi.fn();
const mockHeaderGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockGet,
  })),
  headers: vi.fn(async () => ({
    get: mockHeaderGet,
  })),
}));

describe('readServerAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaderGet.mockImplementation((name: string) => {
      if (name === 'host') return 'localhost:3000';
      return null;
    });
  });

  it('returns parsed session when role, token, and user cookies are valid on customer host', async () => {
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

  it.each(['FAMILY', 'FAMILY_REP', 'PATIENT'])(
    'accepts customer role %s on famidoc.online and localhost:3000',
    async (role) => {
      mockHeaderGet.mockImplementation((name: string) =>
        name === 'x-forwarded-host' ? 'famidoc.online' : null,
      );
      mockGet.mockImplementation((key: string) => {
        if (key === COOKIE_KEYS.ROLE) return { value: role };
        if (key === COOKIE_KEYS.TOKEN) return { value: 'jwt-cust-1' };
        return undefined;
      });

      const session = await readServerAuthSession();
      expect(session).not.toBeNull();
      expect(session?.role).toBe(role === 'FAMILY_REP' ? 'FAMILY' : role);
    },
  );

  it.each(['ADMIN', 'FACILITY', 'DOCTOR'])(
    'returns null when staff cookie %s is read on customer host (famidoc.online / localhost:3000)',
    async (role) => {
      mockHeaderGet.mockImplementation((name: string) =>
        name === 'x-forwarded-host' ? 'famidoc.online' : null,
      );
      mockGet.mockImplementation((key: string) => {
        if (key === COOKIE_KEYS.ROLE) return { value: role };
        if (key === COOKIE_KEYS.TOKEN) return { value: 'jwt-staff-1' };
        return undefined;
      });

      expect(await readServerAuthSession()).toBeNull();
    },
  );

  it('returns null when FAMILY cookie is read on admin/csyt/bacsi subdomain', async () => {
    mockHeaderGet.mockImplementation((name: string) =>
      name === 'x-forwarded-host' ? 'admin.famidoc.online' : null,
    );
    mockGet.mockImplementation((key: string) => {
      if (key === COOKIE_KEYS.ROLE) return { value: 'FAMILY' };
      if (key === COOKIE_KEYS.TOKEN) return { value: 'jwt-fam-1' };
      return undefined;
    });

    expect(await readServerAuthSession()).toBeNull();
  });

  it('returns null when token or role cookie is missing', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === COOKIE_KEYS.ROLE) return { value: 'FAMILY' };
      return undefined;
    });

    expect(await readServerAuthSession()).toBeNull();
  });

  it('falls back to DEFAULT_USERS[role] when user cookie contains invalid JSON on matching subdomain', async () => {
    mockHeaderGet.mockImplementation((name: string) =>
      name === 'host' ? 'bacsi.localhost:3000' : null,
    );
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

  it('respects explicit expectedPortal override even when host is localhost:3000', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === COOKIE_KEYS.ROLE) return { value: 'ADMIN' };
      if (key === COOKIE_KEYS.TOKEN) return { value: 'jwt-adm-1' };
      return undefined;
    });

    expect(await readServerAuthSession('FAMILY')).toBeNull();
    expect(await readServerAuthSession('ADMIN')).toEqual({
      role: 'ADMIN',
      token: 'jwt-adm-1',
      user: DEFAULT_USERS.ADMIN,
    });
  });
});
