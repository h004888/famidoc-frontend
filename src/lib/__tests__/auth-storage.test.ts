import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  COOKIE_KEYS,
  AuthUser,
  saveAuthSession,
  getStoredAuthSession,
  clearAuthSession,
} from '../auth-storage';

const user: AuthUser = {
  id: 'u-1',
  name: 'Nguyễn Văn A',
  phone: '0912345678',
  email: 'a@famidoc.vn',
  role: 'FAMILY',
  avatarText: 'NA',
};

const cookieWrites: string[] = [];
let originalCookieDescriptor: PropertyDescriptor | undefined;

const cookieExpirations = (): void => {
  for (const name of Object.values(COOKIE_KEYS)) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Max-Age=0`;
  }
};

describe('auth-storage: Dual-Tier Session & Cookie Lifecycle', () => {
  beforeEach(() => {
    originalCookieDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'cookie',
    );

    // Bắt lại mọi lệnh ghi document.cookie để kiểm chứng thuộc tính expires / Max-Age
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => originalCookieDescriptor?.get?.call(document),
      set: (value: string) => {
        cookieWrites.push(value);
        originalCookieDescriptor?.set?.call(document, value);
      },
    });

    localStorage.clear();
    sessionStorage.clear();
    cookieExpirations();
    cookieWrites.length = 0;
  });

  afterEach(() => {
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', originalCookieDescriptor);
    }
    localStorage.clear();
    sessionStorage.clear();
    cookieExpirations();
  });

  it('Case 1 (rememberMe = true): cookie có expires, localStorage đủ 3 keys, sessionStorage trống', () => {
    saveAuthSession('FAMILY', user, 'token-123', true);

    const tokenWrite = cookieWrites.find((write) =>
      write.startsWith(`${COOKIE_KEYS.TOKEN}=`),
    );
    expect(tokenWrite).toBeDefined();
    expect(tokenWrite).toMatch(/expires=/i);
    expect(tokenWrite).toMatch(/max-age=/i);

    expect(localStorage.getItem(COOKIE_KEYS.ROLE)).toBe('FAMILY');
    expect(localStorage.getItem(COOKIE_KEYS.TOKEN)).toBe('token-123');
    expect(localStorage.getItem(COOKIE_KEYS.USER)).toBe(JSON.stringify(user));

    expect(sessionStorage.length).toBe(0);
  });

  it('Case 2 (rememberMe = false): cookie là Session Cookie (không expires), sessionStorage đủ 3 keys, localStorage sạch', () => {
    localStorage.setItem(COOKIE_KEYS.ROLE, 'DOCTOR');
    localStorage.setItem(COOKIE_KEYS.TOKEN, 'stale-token');
    localStorage.setItem(COOKIE_KEYS.USER, JSON.stringify(user));

    saveAuthSession('FAMILY', user, 'token-123', false);

    const tokenWrite = cookieWrites.find((write) =>
      write.startsWith(`${COOKIE_KEYS.TOKEN}=`),
    );
    expect(tokenWrite).toBeDefined();
    expect(tokenWrite).not.toMatch(/expires=/i);
    expect(tokenWrite).not.toMatch(/max-age=/i);

    expect(sessionStorage.getItem(COOKIE_KEYS.ROLE)).toBe('FAMILY');
    expect(sessionStorage.getItem(COOKIE_KEYS.TOKEN)).toBe('token-123');
    expect(sessionStorage.getItem(COOKIE_KEYS.USER)).toBe(
      JSON.stringify(user),
    );

    expect(localStorage.length).toBe(0);
  });

  it('Case 3a (fallback sessionStorage): cookie bị xóa nhưng sessionStorage còn dữ liệu', () => {
    sessionStorage.setItem(COOKIE_KEYS.ROLE, 'FAMILY');
    sessionStorage.setItem(COOKIE_KEYS.TOKEN, 'session-token');
    sessionStorage.setItem(COOKIE_KEYS.USER, JSON.stringify(user));

    const stored = getStoredAuthSession();

    expect(stored.role).toBe('FAMILY');
    expect(stored.token).toBe('session-token');
    expect(stored.user?.name).toBe(user.name);
  });

  it('Case 3b (fallback localStorage): sessionStorage rỗng nhưng localStorage còn dữ liệu', () => {
    localStorage.setItem(COOKIE_KEYS.ROLE, 'FAMILY');
    localStorage.setItem(COOKIE_KEYS.TOKEN, 'persistent-token');
    localStorage.setItem(COOKIE_KEYS.USER, JSON.stringify(user));

    const stored = getStoredAuthSession();

    expect(stored.role).toBe('FAMILY');
    expect(stored.token).toBe('persistent-token');
    expect(stored.user?.name).toBe(user.name);
  });

  it('Case 4 (clearAuthSession): xóa sạch cookies, localStorage và sessionStorage', () => {
    saveAuthSession('FAMILY', user, 'token-123', true);
    saveAuthSession('FAMILY', user, 'token-456', false);

    clearAuthSession();

    for (const name of Object.values(COOKIE_KEYS)) {
      expect(document.cookie).not.toContain(`${name}=`);
    }
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
