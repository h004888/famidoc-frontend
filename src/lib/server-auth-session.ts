import { cacheLife } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { connection } from 'next/server';
import type { LoginRole } from '@/features/auth/schemas/auth.schema';
import { COOKIE_KEYS, DEFAULT_USERS, isJwtExpired, type AuthUser } from './auth-storage';
import { getPortalFromHost, isRoleAllowedOnPortal, type PortalRole } from './portal-routing';

export interface ServerAuthSession {
  role: LoginRole;
  token: string;
  user: AuthUser;
}

const ROLE_ALIASES: Record<string, LoginRole> = {
  FAMILY: 'FAMILY',
  FAMILY_REP: 'FAMILY',
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  FACILITY: 'FACILITY',
  HEALTHCARE_FACILITY: 'FACILITY',
  ADMIN: 'ADMIN',
};

async function readRequestHostSafely(): Promise<string> {
  try {
    const headerStore = await headers();
    if (!headerStore || typeof headerStore.get !== 'function') {
      return '';
    }
    return headerStore.get('x-forwarded-host') || headerStore.get('host') || '';
  } catch {
    return '';
  }
}

/**
 * Đọc phiên đăng nhập từ cookies ở phía Server Component, có kiểm tra cổng (Portal Audience Guard).
 * Không ném lỗi khi cookie thiếu, JSON người dùng bị hỏng hoặc `headers()` không khả dụng.
 * Trên host khách hàng (`famidoc.online`, `localhost:3000`, hoặc không có host), chỉ nhận `FAMILY`, `FAMILY_REP`, `PATIENT`.
 */
export async function readServerAuthSession(
  expectedPortal?: PortalRole,
): Promise<ServerAuthSession | null> {
  'use cache: private';
  cacheLife('minutes');

  const cookieStore = await cookies();
  const rawRole = cookieStore.get(COOKIE_KEYS.ROLE)?.value;
  const rawToken = cookieStore.get(COOKIE_KEYS.TOKEN)?.value;
  const rawRefreshToken = cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;
  const rawUser = cookieStore.get(COOKIE_KEYS.USER)?.value;

  if (!rawRole || !rawToken) {
    return null;
  }

  // Defer past Next.js cacheComponents prerender phase before isJwtExpired() reads Date.now().
  await connection();

  const token = decodeURIComponent(rawToken);
  if (isJwtExpired(token) && !rawRefreshToken) {
    return null;
  }

  const rawNormalizedRole = decodeURIComponent(rawRole).trim().toUpperCase();
  const role = ROLE_ALIASES[rawNormalizedRole];
  if (!role) {
    return null;
  }

  const activePortal: PortalRole =
    expectedPortal ?? getPortalFromHost(await readRequestHostSafely());

  if (!isRoleAllowedOnPortal(rawNormalizedRole, activePortal)) {
    return null;
  }

  let user: AuthUser | null = null;

  if (rawUser) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawUser)) as Partial<AuthUser>;
      if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string') {
        user = {
          id: parsed.id || DEFAULT_USERS[role].id,
          name: parsed.name,
          phone: parsed.phone || '',
          email: parsed.email,
          role,
          avatarText: parsed.avatarText || parsed.name.slice(0, 2).toUpperCase(),
          ...(parsed.facilityOrTitle ? { facilityOrTitle: parsed.facilityOrTitle } : {}),
          ...(typeof parsed.mustChangePassword === 'boolean'
            ? { mustChangePassword: parsed.mustChangePassword }
            : {}),
        };
      }
    } catch {
      user = null;
    }
  }

  return {
    role,
    token,
    user: user ?? DEFAULT_USERS[role],
  };
}
