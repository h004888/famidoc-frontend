import type { LoginRole } from '@/features/auth/schemas/auth.schema';

export type PortalRole = 'FAMILY' | 'ADMIN' | 'FACILITY' | 'DOCTOR';

const SUBDOMAIN_TO_PORTAL: Record<string, Exclude<PortalRole, 'FAMILY'>> = {
  admin: 'ADMIN',
  csyt: 'FACILITY',
  bacsi: 'DOCTOR',
};

const PORTAL_TO_SUBDOMAIN: Record<Exclude<PortalRole, 'FAMILY'>, string> = {
  ADMIN: 'admin',
  FACILITY: 'csyt',
  DOCTOR: 'bacsi',
};

const PORTAL_ENV_ORIGIN: Record<PortalRole, string | undefined> = {
  FAMILY: process.env.NEXT_PUBLIC_APP_URL,
  ADMIN: process.env.NEXT_PUBLIC_ADMIN_URL,
  FACILITY: process.env.NEXT_PUBLIC_FACILITY_URL,
  DOCTOR: process.env.NEXT_PUBLIC_DOCTOR_URL,
};

/**
 * Chuẩn hóa role từ backend hoặc cookie về 4 nhóm cổng chuẩn.
 */
export function normalizeToPortalRole(role: string | null | undefined): PortalRole {
  const normalized = (role || '').trim().toUpperCase();
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'FACILITY' || normalized === 'HEALTHCARE_FACILITY') return 'FACILITY';
  if (normalized === 'DOCTOR') return 'DOCTOR';
  return 'FAMILY';
}

export function isFamilyPortalRole(role: string | null | undefined): boolean {
  const normalized = (role || '').trim().toUpperCase();
  return normalized === 'FAMILY' || normalized === 'FAMILY_REP' || normalized === 'PATIENT';
}

export function isRoleAllowedOnPortal(userRole: string | null | undefined, portal: PortalRole): boolean {
  const normalized = (userRole || '').trim().toUpperCase();
  switch (portal) {
    case 'ADMIN':
      return normalized === 'ADMIN';
    case 'FACILITY':
      return normalized === 'FACILITY' || normalized === 'HEALTHCARE_FACILITY';
    case 'DOCTOR':
      return normalized === 'DOCTOR';
    case 'FAMILY':
    default:
      return isFamilyPortalRole(normalized);
  }
}

/**
 * Lấy giá trị host đầu tiên từ header `x-forwarded-host` hoặc `host`.
 */
export function normalizeHostHeader(rawHost: string | null | undefined): string {
  if (!rawHost) return '';
  const first = rawHost.split(',')[0]?.trim().toLowerCase() || '';
  return first;
}

/**
 * Tách hostname (bỏ port) từ host string.
 */
export function extractHostname(rawHost: string | null | undefined): string {
  const host = normalizeHostHeader(rawHost);
  if (!host) return '';
  if (host.startsWith('[')) {
    const endBracket = host.indexOf(']');
    return endBracket !== -1 ? host.slice(0, endBracket + 1) : host;
  }
  return host.split(':')[0] || '';
}

function extractPortSegment(rawHost: string | null | undefined): string {
  const host = normalizeHostHeader(rawHost);
  if (!host) return '';
  if (host.startsWith('[')) {
    const endBracket = host.indexOf(']');
    if (endBracket === -1) return '';
    return host.slice(endBracket + 1);
  }
  const colonIdx = host.indexOf(':');
  return colonIdx !== -1 ? host.slice(colonIdx) : '';
}

/**
 * Trả về vai trò subdomain nếu host đang là `admin.*`, `csyt.*`, hoặc `bacsi.*`;
 * trả về `null` nếu là domain chính (`famidoc.online`, `localhost`, `127.0.0.1`).
 */
export function getSubdomainPortal(
  rawHost: string | null | undefined,
): Exclude<PortalRole, 'FAMILY'> | null {
  const hostname = extractHostname(rawHost);
  if (!hostname) return null;
  const firstLabel = hostname.split('.')[0] || '';
  return SUBDOMAIN_TO_PORTAL[firstLabel] || null;
}

export function getPortalFromHost(rawHost: string | null | undefined): PortalRole {
  return getSubdomainPortal(rawHost) || 'FAMILY';
}

export function isLocalOrIpHost(rawHost: string | null | undefined): boolean {
  const hostname = extractHostname(rawHost);
  if (!hostname) return true;
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]'
  ) {
    return true;
  }
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

/**
 * Trả về `true` cho domain thật và `localhost` / `*.localhost` (hỗ trợ subdomain routing);
 * chỉ trả về `false` cho địa chỉ IP thuần như `127.0.0.1` hoặc `[::1]` hay khi thiếu host.
 */
export function supportsSubdomainRouting(rawHost: string | null | undefined): boolean {
  const hostname = extractHostname(rawHost);
  if (!hostname) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith('[')) {
    return false;
  }
  return true;
}

/**
 * Xác định cổng hiện tại ở phía trình duyệt dựa trên host và pathname.
 * - Nếu host có subdomain (`admin.*`, `csyt.*`, `bacsi.*`) -> cổng tương ứng.
 * - Nếu host hỗ trợ subdomain (`famidoc.online`, `localhost:3000`) và không có subdomain -> luôn là `'FAMILY'`.
 * - Nếu là địa chỉ IP thuần (`127.0.0.1`) -> suy ra từ prefix `/admin`, `/facility`, `/doctor`, ngược lại `'FAMILY'`.
 */
export function resolveClientActivePortal(
  rawHost: string | null | undefined,
  pathname?: string | null,
): PortalRole {
  const subdomainPortal = getSubdomainPortal(rawHost);
  if (subdomainPortal) {
    return subdomainPortal;
  }

  if (supportsSubdomainRouting(rawHost)) {
    return 'FAMILY';
  }

  const path = (pathname || '').trim();
  if (path === '/admin' || path.startsWith('/admin/')) return 'ADMIN';
  if (path === '/facility' || path.startsWith('/facility/')) return 'FACILITY';
  if (path === '/doctor' || path.startsWith('/doctor/')) return 'DOCTOR';
  return 'FAMILY';
}

/**
 * Xác định domain gốc (loại bỏ prefix subdomain như `admin.`, `csyt.`, `bacsi.`, `www.`).
 */
export function getRootHostname(rawHost: string | null | undefined): string {
  const hostname = extractHostname(rawHost);
  if (!hostname) return 'famidoc.online';
  const parts = hostname.split('.');
  if (parts.length >= 2 && (SUBDOMAIN_TO_PORTAL[parts[0]] || parts[0] === 'www')) {
    return parts.slice(1).join('.');
  }
  return hostname;
}

/**
 * Dựng origin (`https://admin.famidoc.online` hoặc `http://admin.localhost:3000`) cho một cổng.
 */
export function getPortalOrigin(
  targetPortal: PortalRole,
  currentHost?: string | null,
  currentProto?: string | null,
): string {
  const configured = PORTAL_ENV_ORIGIN[targetPortal];
  const host = normalizeHostHeader(currentHost);
  const hostname = extractHostname(host);

  if (configured && (!hostname || !isLocalOrIpHost(hostname))) {
    return configured.replace(/\/+$/, '');
  }

  if (!hostname) {
    if (targetPortal === 'FAMILY') return 'https://famidoc.online';
    return `https://${PORTAL_TO_SUBDOMAIN[targetPortal]}.famidoc.online`;
  }

  // IP thuần không hỗ trợ subdomain
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname === '[::1]') {
    const proto = currentProto === 'https' ? 'https' : 'http';
    return `${proto}://${host}`;
  }

  const rootHostname = getRootHostname(hostname);
  const portSegment = extractPortSegment(host);
  const isLocal = rootHostname === 'localhost' || rootHostname.endsWith('.localhost');
  const proto = isLocal
    ? 'http'
    : (currentProto || 'https').replace(/:$/, '');

  if (targetPortal === 'FAMILY') {
    return `${proto}://${rootHostname}${portSegment}`;
  }

  return `${proto}://${PORTAL_TO_SUBDOMAIN[targetPortal]}.${rootHostname}${portSegment}`;
}

export function getRoleHomePath(role: LoginRole | PortalRole | string): string {
  const portal = normalizeToPortalRole(role);
  switch (portal) {
    case 'ADMIN':
      return '/admin';
    case 'FACILITY':
      return '/facility';
    case 'DOCTOR':
      return '/doctor';
    case 'FAMILY':
    default:
      return '/family';
  }
}

export function getRoleInternalLoginPath(role: LoginRole | PortalRole | string): string {
  const portal = normalizeToPortalRole(role);
  switch (portal) {
    case 'ADMIN':
      return '/admin/login';
    case 'FACILITY':
      return '/facility/login';
    case 'DOCTOR':
      return '/doctor/login';
    case 'FAMILY':
    default:
      return '/login';
  }
}

/**
 * Trả về URL đăng nhập phù hợp cho `role` dựa trên host hiện tại:
 * - Nếu đang ở đúng subdomain của vai trò đó -> `/login`
 * - Nếu đang ở subdomain khác -> URL tuyệt đối sang subdomain của vai trò đích
 * - Nếu đang ở domain chính (`famidoc.online` hoặc `localhost:3000`) -> URL tuyệt đối sang subdomain đích (hoặc `/login` cho `FAMILY`)
 * - Nếu đang ở IP thuần không hỗ trợ subdomain (`127.0.0.1:3000`) -> `/admin/login`, `/facility/login`, `/doctor/login` (hoặc `/login` cho `FAMILY`)
 */
export function getLoginUrlForRole(
  role: LoginRole | PortalRole | string,
  currentHost?: string | null,
  currentProto?: string | null,
): string {
  const targetPortal = normalizeToPortalRole(role);
  const activeSubdomain = getSubdomainPortal(currentHost);

  if (activeSubdomain) {
    if (activeSubdomain === targetPortal) {
      return '/login';
    }
    return `${getPortalOrigin(targetPortal, currentHost, currentProto)}/login`;
  }

  if (targetPortal === 'FAMILY') {
    return '/login';
  }

  if (currentHost && supportsSubdomainRouting(currentHost)) {
    return `${getPortalOrigin(targetPortal, currentHost, currentProto)}/login`;
  }

  return getRoleInternalLoginPath(targetPortal);
}

/**
 * URL quay về sau khi đăng xuất trên client hoặc server.
 */
export function resolveLogoutRedirectUrl(
  role: LoginRole | PortalRole | string | null | undefined,
  currentHost?: string | null,
  currentProto?: string | null,
): string {
  const activeSubdomain = getSubdomainPortal(currentHost);
  if (activeSubdomain) {
    return '/login';
  }
  return getLoginUrlForRole(role || 'FAMILY', currentHost, currentProto);
}

export function getPortalDisplayLabel(portal: PortalRole | string): string {
  switch (normalizeToPortalRole(portal)) {
    case 'ADMIN':
      return 'Cổng Quản Trị Viên';
    case 'FACILITY':
      return 'Cổng Cơ Sở Y Tế';
    case 'DOCTOR':
      return 'Cổng Bác Sĩ Gia Đình';
    case 'FAMILY':
    default:
      return 'Cổng Khách Hàng Gia Đình';
  }
}

export function getCurrentBrowserHost(): string {
  if (typeof window === 'undefined') return '';
  return window.location.host || '';
}

export function getCurrentBrowserProto(): string {
  if (typeof window === 'undefined') return 'https';
  return window.location.protocol.replace(/:$/, '') || 'https';
}
