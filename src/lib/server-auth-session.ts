import { cookies } from 'next/headers';
import type { LoginRole } from '@/features/auth/schemas/auth.schema';
import { COOKIE_KEYS, DEFAULT_USERS, type AuthUser } from './auth-storage';

export interface ServerAuthSession {
  role: LoginRole;
  token: string;
  user: AuthUser;
}

const VALID_ROLES = new Set<string>(['FAMILY', 'PATIENT', 'DOCTOR', 'FACILITY', 'ADMIN']);

/**
 * Đọc phiên đăng nhập từ cookies ở phía Server Component.
 * Không ném lỗi khi cookie thiếu hoặc JSON người dùng bị hỏng.
 */
export async function readServerAuthSession(): Promise<ServerAuthSession | null> {
  const cookieStore = await cookies();
  const rawRole = cookieStore.get(COOKIE_KEYS.ROLE)?.value;
  const rawToken = cookieStore.get(COOKIE_KEYS.TOKEN)?.value;
  const rawUser = cookieStore.get(COOKIE_KEYS.USER)?.value;

  if (!rawRole || !rawToken) {
    return null;
  }

  const normalizedRole = decodeURIComponent(rawRole).toUpperCase();
  if (!VALID_ROLES.has(normalizedRole)) {
    return null;
  }

  const role = normalizedRole as LoginRole;
  const token = decodeURIComponent(rawToken);
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
