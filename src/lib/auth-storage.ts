import { LoginRole } from '@/features/auth/schemas/auth.schema';

export const COOKIE_KEYS = {
  ROLE: 'famidoc_role',
  TOKEN: 'famidoc_token',
  USER: 'famidoc_user',
} as const;

const REMEMBER_ME_DAYS = 7;

function clearStorageKeys(storage: Storage): void {
  storage.removeItem(COOKIE_KEYS.ROLE);
  storage.removeItem(COOKIE_KEYS.TOKEN);
  storage.removeItem(COOKIE_KEYS.USER);
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: LoginRole;
  avatarText: string;
  facilityOrTitle?: string;
}

export const DEFAULT_USERS: Record<LoginRole, AuthUser> = {
  FAMILY: {
    id: 'FAM-88219',
    name: 'Nguyễn Văn An (Chủ Hộ)',
    phone: '0912345678',
    email: 'an.nguyen@famidoc.vn',
    role: 'FAMILY',
    avatarText: 'NA',
    facilityOrTitle: 'Hộ FAM-88219 (Quận 5, TP.HCM)',
  },
  PATIENT: {
    id: 'PT-01',
    name: 'Nguyễn Văn Phúc (Bệnh nhân)',
    phone: '0912345678',
    email: 'phuc.nguyen@famidoc.vn',
    role: 'PATIENT',
    avatarText: 'NP',
    facilityOrTitle: 'Thành viên Hộ FAM-88219',
  },
  DOCTOR: {
    id: 'DOC-7901',
    name: 'BS.CKII Trần Thanh Mai',
    phone: '0988123789',
    email: 'mai.tt@famidoc.pro',
    role: 'DOCTOR',
    avatarText: 'TM',
    facilityOrTitle: 'Bác sĩ Gia đình & Nội Tim Mạch (CCHN: 004128/HCM)',
  },
  FACILITY: {
    id: 'FAC-79012',
    name: 'BV Đại Học Y Dược TP.HCM',
    phone: '0903888777',
    email: 'cooperation@umc.edu.vn',
    role: 'FACILITY',
    avatarText: 'YD',
    facilityOrTitle: 'Cơ sở Y tế Đối tác Chiến lược',
  },
  ADMIN: {
    id: 'ADM-001',
    name: 'Ban Quản Trị Hệ Thống',
    phone: '0901888999',
    email: 'admin.super@famidoc.pro',
    role: 'ADMIN',
    avatarText: 'AD',
    facilityOrTitle: 'Super Administrator Backoffice',
  },
};

export function setCookie(name: string, value: string, days?: number): void {
  if (typeof document === 'undefined') return;
  const expiresAttribute =
    typeof days === 'number' && days > 0
      ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}; max-age=${days * 86400}`
      : '';
  document.cookie = `${name}=${encodeURIComponent(value)}${expiresAttribute}; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match && match[3] ? decodeURIComponent(match[3]) : null;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Max-Age=0; SameSite=Lax`;
}

export function saveAuthSession(
  role: LoginRole,
  user?: AuthUser,
  token?: string,
  rememberMe = true,
): void {
  const finalUser = user || DEFAULT_USERS[role];
  const finalToken = token || `jwt-token-${role.toLowerCase()}-${Date.now()}`;
  const days = rememberMe ? REMEMBER_ME_DAYS : undefined;
  const userJson = JSON.stringify(finalUser);

  setCookie(COOKIE_KEYS.ROLE, role, days);
  setCookie(COOKIE_KEYS.TOKEN, finalToken, days);
  setCookie(COOKIE_KEYS.USER, userJson, days);

  if (typeof window !== 'undefined') {
    const targetStorage = rememberMe ? localStorage : sessionStorage;
    const staleStorage = rememberMe ? sessionStorage : localStorage;

    targetStorage.setItem(COOKIE_KEYS.ROLE, role);
    targetStorage.setItem(COOKIE_KEYS.TOKEN, finalToken);
    targetStorage.setItem(COOKIE_KEYS.USER, userJson);

    clearStorageKeys(staleStorage);
  }
}

export function clearAuthSession(): void {
  removeCookie(COOKIE_KEYS.ROLE);
  removeCookie(COOKIE_KEYS.TOKEN);
  removeCookie(COOKIE_KEYS.USER);

  if (typeof window !== 'undefined') {
    clearStorageKeys(localStorage);
    clearStorageKeys(sessionStorage);
  }
}

export function getStoredAuthSession(): {
  role: LoginRole | null;
  token: string | null;
  user: AuthUser | null;
} {
  const readValue = (key: string): string | null => {
    const cookieValue = getCookie(key);
    if (cookieValue) return cookieValue;
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  };

  const role = (readValue(COOKIE_KEYS.ROLE) as LoginRole) || null;
  const token = readValue(COOKIE_KEYS.TOKEN) || null;
  const rawUser = readValue(COOKIE_KEYS.USER);

  let user: AuthUser | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  if (!user && role) {
    user = DEFAULT_USERS[role] || null;
  }

  return { role, token, user };
}

