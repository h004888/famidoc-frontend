import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_KEYS, isJwtExpired } from '@/lib/auth-storage';
import {
  getPortalOrigin,
  getRoleHomePath,
  getRoleInternalLoginPath,
  getSubdomainPortal,
  isFamilyPortalRole,
  isRoleAllowedOnPortal,
  normalizeHostHeader,
  supportsSubdomainRouting,
  type PortalRole,
} from '@/lib/portal-routing';

const SUBDOMAIN_REGISTER_ALLOWED: ReadonlySet<Exclude<PortalRole, 'FAMILY'>> = new Set([
  'DOCTOR',
]);

const STAFF_PORTAL_ROLES: ReadonlySet<string> = new Set([
  'ADMIN',
  'FACILITY',
  'HEALTHCARE_FACILITY',
  'DOCTOR',
]);

function clearStaleCookiesOnResponse(response: NextResponse): NextResponse {
  response.cookies.delete({ name: COOKIE_KEYS.ROLE, path: '/' });
  response.cookies.delete({ name: COOKIE_KEYS.TOKEN, path: '/' });
  response.cookies.delete({ name: COOKIE_KEYS.USER, path: '/' });
  return response;
}

function resolveRequestOrigin(request: NextRequest): {
  rawHost: string;
  rawProto: string;
  baseOrigin: string;
} {
  const rawHost = normalizeHostHeader(
    request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      request.nextUrl.host,
  );
  const rawProto = (
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    request.nextUrl.protocol.replace(/:$/, '') ||
    'http'
  ).toLowerCase();

  const baseOrigin = rawHost ? `${rawProto}://${rawHost}` : request.nextUrl.origin;
  return { rawHost, rawProto, baseOrigin };
}

function buildLoginRedirect(
  loginPath: string,
  pathname: string,
  search: string,
  baseOrigin: string,
): NextResponse {
  const loginUrl = new URL(loginPath, baseOrigin);
  // Giữ cả query string để deep link (ví dụ link thanh toán trong email) không mất ngữ cảnh.
  loginUrl.searchParams.set('redirect', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

function getTargetPortalForPath(pathname: string): Exclude<PortalRole, 'FAMILY'> | null {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'ADMIN';
  if (pathname === '/facility' || pathname.startsWith('/facility/')) return 'FACILITY';
  if (pathname === '/doctor' || pathname.startsWith('/doctor/')) return 'DOCTOR';
  return null;
}

function isSharedProtectedPath(pathname: string): boolean {
  return (
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    pathname === '/notifications' ||
    pathname.startsWith('/notifications/')
  );
}

function isGeneralAuthPath(pathname: string): boolean {
  return (
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/change-password') ||
    pathname.startsWith('/verify-otp')
  );
}

function handleSubdomainRequest(
  request: NextRequest,
  subdomainPortal: Exclude<PortalRole, 'FAMILY'>,
  baseOrigin: string,
  isAuthenticated: boolean,
  currentRole: string | null,
): NextResponse {
  const { pathname, search } = request.nextUrl;
  const portalHome = getRoleHomePath(subdomainPortal);
  const portalLogin = getRoleInternalLoginPath(subdomainPortal);
  const hasValidSubdomainSession =
    isAuthenticated && isRoleAllowedOnPortal(currentRole, subdomainPortal);

  // Rewrite /login -> /admin/login | /facility/login | /doctor/login
  if (pathname === '/login') {
    return NextResponse.rewrite(new URL(`${portalLogin}${search}`, request.url));
  }

  // Rewrite /register -> /doctor/register (Admin & CSYT không tự đăng ký qua /register)
  if (pathname === '/register') {
    if (SUBDOMAIN_REGISTER_ALLOWED.has(subdomainPortal)) {
      return NextResponse.rewrite(new URL(`/doctor/register${search}`, request.url));
    }
    return NextResponse.redirect(new URL('/login', baseOrigin));
  }

  // Trang gốc `/` trên subdomain điều hướng vào dashboard hoặc `/login` của subdomain
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(hasValidSubdomainSession ? portalHome : '/login', baseOrigin),
    );
  }

  // Cho phép các trang auth hợp lệ của chính subdomain
  const ownAuthPaths =
    subdomainPortal === 'ADMIN'
      ? ['/admin/login']
      : subdomainPortal === 'FACILITY'
        ? ['/facility/login']
        : ['/doctor/login', '/doctor/register'];

  if (ownAuthPaths.includes(pathname) || isGeneralAuthPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === '/403') {
    return NextResponse.next();
  }

  // Chỉ cho phép route thuộc phân hệ của subdomain hoặc route dùng chung (/settings, /notifications)
  const pathPortal = getTargetPortalForPath(pathname);
  const isOwnPortalRoute = pathPortal === subdomainPortal;
  const isAllowedShared = isSharedProtectedPath(pathname);

  if (isOwnPortalRoute || isAllowedShared) {
    if (!hasValidSubdomainSession) {
      return buildLoginRedirect('/login', pathname, search, baseOrigin);
    }
    return NextResponse.next();
  }

  // Truy cập phân hệ khác hoặc trang public trên subdomain -> đẩy về cổng của subdomain hiện tại
  return NextResponse.redirect(
    new URL(hasValidSubdomainSession ? portalHome : '/login', baseOrigin),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Bỏ qua các file tĩnh, api, hình ảnh
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const { rawHost, rawProto, baseOrigin } = resolveRequestOrigin(request);
  const activeSubdomain = getSubdomainPortal(rawHost);
  const canUseSubdomains = supportsSubdomainRouting(rawHost);

  // Lấy role và token từ cookies
  const roleCookie = request.cookies.get(COOKIE_KEYS.ROLE)?.value;
  const tokenCookie = request.cookies.get(COOKIE_KEYS.TOKEN)?.value;
  const refreshTokenCookie = request.cookies.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;

  const decodedToken = tokenCookie ? decodeURIComponent(tokenCookie) : null;
  const isTokenHardExpired =
    Boolean(decodedToken && isJwtExpired(decodedToken)) && !refreshTokenCookie;

  const currentRole =
    !isTokenHardExpired && roleCookie
      ? decodeURIComponent(roleCookie).trim().toUpperCase()
      : null;
  const isAuthenticated = Boolean(
    !isTokenHardExpired && decodedToken && currentRole,
  );
  const hasStaleStaffCookie = Boolean(currentRole && STAFF_PORTAL_ROLES.has(currentRole));

  // 2. Xử lý khi truy cập qua 3 subdomain riêng (`admin.*`, `csyt.*`, `bacsi.*`)
  if (activeSubdomain) {
    return handleSubdomainRequest(
      request,
      activeSubdomain,
      baseOrigin,
      isAuthenticated,
      currentRole,
    );
  }

  // 3. Domain chính (`famidoc.online` hoặc `localhost:3000`) và fallback IP thuần (`127.0.0.1:3000`)
  const pathPortal = getTargetPortalForPath(pathname);
  const isRoleAuthPage =
    pathname === '/admin/login' ||
    pathname === '/facility/login' ||
    pathname === '/doctor/login' ||
    pathname === '/doctor/register';

  // Trên domain hỗ trợ subdomain (`famidoc.online` và `localhost:3000`),
  // chuyển hướng mọi route của 3 cổng nghiệp vụ sang subdomain tương ứng.
  if (canUseSubdomains && pathPortal) {
    const targetOrigin = getPortalOrigin(pathPortal, rawHost, rawProto);
    const mappedPath =
      pathname === '/admin/login' ||
      pathname === '/facility/login' ||
      pathname === '/doctor/login'
        ? '/login'
        : pathname === '/doctor/register'
          ? '/register'
          : pathname;
    return NextResponse.redirect(new URL(`${mappedPath}${search}`, targetOrigin));
  }

  const finalizeCustomerResponse = (response: NextResponse): NextResponse => {
    if (canUseSubdomains && hasStaleStaffCookie) {
      return clearStaleCookiesOnResponse(response);
    }
    return response;
  };

  // Cho phép trang auth công khai & các cổng auth riêng trên IP fallback
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname === '/facilities/register' ||
    pathname === '/family/login' ||
    pathname === '/family/register' ||
    isGeneralAuthPath(pathname) ||
    isRoleAuthPage;

  if (isAuthPage) {
    return finalizeCustomerResponse(NextResponse.next());
  }

  // Route bảo vệ của Admin / Facility / Doctor trên IP thuần (fallback không subdomain)
  if (pathPortal) {
    if (!isAuthenticated || !currentRole) {
      return buildLoginRedirect(
        getRoleInternalLoginPath(pathPortal),
        pathname,
        search,
        baseOrigin,
      );
    }

    if (!isRoleAllowedOnPortal(currentRole, pathPortal)) {
      return redirectUserToRoleHome(currentRole, request, baseOrigin);
    }

    return NextResponse.next();
  }

  // Route bảo vệ của Gia đình & Đặt gói (/family/*, /booking/*)
  const isProtectedFamily = pathname === '/family' || pathname.startsWith('/family/');
  const isProtectedBooking = pathname === '/booking' || pathname.startsWith('/booking/');

  if (isProtectedFamily || isProtectedBooking) {
    if (!isAuthenticated || !currentRole) {
      return finalizeCustomerResponse(
        buildLoginRedirect('/login', pathname, search, baseOrigin),
      );
    }

    if (!isFamilyPortalRole(currentRole)) {
      if (canUseSubdomains) {
        // Phiên ADMIN/FACILITY/DOCTOR trên origin khách hàng bị vô hiệu hóa hoàn toàn và dọn cookie.
        return clearStaleCookiesOnResponse(
          buildLoginRedirect('/login', pathname, search, baseOrigin),
        );
      }
      return redirectUserToRoleHome(currentRole, request, baseOrigin);
    }

    return NextResponse.next();
  }

  // Route dùng chung (/settings, /notifications) yêu cầu đã đăng nhập
  if (isSharedProtectedPath(pathname)) {
    if (!isAuthenticated || !currentRole) {
      return finalizeCustomerResponse(
        buildLoginRedirect('/login', pathname, search, baseOrigin),
      );
    }

    if (canUseSubdomains && !isFamilyPortalRole(currentRole)) {
      return clearStaleCookiesOnResponse(
        buildLoginRedirect('/login', pathname, search, baseOrigin),
      );
    }

    return NextResponse.next();
  }

  return finalizeCustomerResponse(NextResponse.next());
}

// Giữ thêm alias export default để hỗ trợ mọi cách import
export default proxy;

function redirectUserToRoleHome(
  role: string,
  request: NextRequest,
  baseOrigin?: string,
) {
  const targetPath = getRoleHomePath(role);
  return NextResponse.redirect(new URL(targetPath, baseOrigin || request.url));
}

// Cấu hình matcher cho proxy
export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/facility/:path*',
    '/doctor/:path*',
    '/family/:path*',
    '/booking/:path*',
    '/settings',
    '/settings/:path*',
    '/notifications',
    '/notifications/:path*',
    '/login',
    '/register',
    '/packages',
    '/packages/:path*',
    '/doctors',
    '/doctors/:path*',
    '/facilities',
    '/facilities/:path*',
    '/onboarding',
    '/contact',
    '/blog',
    '/blog/:path*',
    '/privacy',
    '/terms',
  ],
};
