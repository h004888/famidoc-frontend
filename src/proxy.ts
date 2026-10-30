import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bỏ qua các file tĩnh, api, hình ảnh
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Lấy role và token từ cookies
  const roleCookie = request.cookies.get('famidoc_role')?.value;
  const tokenCookie = request.cookies.get('famidoc_token')?.value;

  const currentRole = roleCookie ? roleCookie.toUpperCase() : null;
  const isAuthenticated = Boolean(tokenCookie && currentRole);

  // 2. Trang Auth: /login, /register, /forgot-password
  // Luôn cho phép truy cập để người dùng có thể đăng nhập đổi vai trò bất kỳ lúc nào
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password');

  if (isAuthPage) {
    return NextResponse.next();
  }

  // 3. Xử lý các Route Protected cần quyền truy cập riêng biệt
  const isProtectedAdmin = pathname.startsWith('/admin');
  const isProtectedFacility = pathname.startsWith('/facility');
  const isProtectedDoctor = pathname.startsWith('/doctor');
  const isProtectedFamily = pathname.startsWith('/family');

  const isProtectedRoute =
    isProtectedAdmin || isProtectedFacility || isProtectedDoctor || isProtectedFamily;

  if (isProtectedRoute) {
    // Nếu CHƯA ĐĂNG NHẬP -> Bắt buộc chuyển hướng về trang /login
    if (!isAuthenticated || !currentRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // NẾU ĐÃ ĐĂNG NHẬP -> CHỈ CHO VÀO TRANG RIÊNG BIỆT CỦA ROLE ĐÓ:
    // 1. Phân hệ Admin: Chỉ tài khoản ADMIN mới được vào
    if (isProtectedAdmin && currentRole !== 'ADMIN') {
      return redirectUserToRoleHome(currentRole, request);
    }

    // 2. Phân hệ Cơ sở y tế: Chỉ tài khoản FACILITY mới được vào
    if (isProtectedFacility && currentRole !== 'FACILITY') {
      return redirectUserToRoleHome(currentRole, request);
    }

    // 3. Phân hệ Bác sĩ: Chỉ tài khoản DOCTOR mới được vào
    if (isProtectedDoctor && currentRole !== 'DOCTOR') {
      return redirectUserToRoleHome(currentRole, request);
    }

    // 4. Phân hệ Gia đình: Chỉ tài khoản FAMILY hoặc PATIENT mới được vào
    if (isProtectedFamily && currentRole !== 'FAMILY' && currentRole !== 'PATIENT') {
      return redirectUserToRoleHome(currentRole, request);
    }
  }

  return NextResponse.next();
}

// Giữ thêm alias export default để hỗ trợ mọi cách import
export default proxy;

function redirectUserToRoleHome(role: string, request: NextRequest) {
  let targetPath = '/family';
  if (role === 'DOCTOR') targetPath = '/doctor';
  if (role === 'FACILITY') targetPath = '/facility';
  if (role === 'ADMIN') targetPath = '/admin';

  return NextResponse.redirect(new URL(targetPath, request.url));
}

// Cấu hình matcher cho proxy
export const config = {
  matcher: [
    '/admin/:path*',
    '/facility/:path*',
    '/doctor/:path*',
    '/family/:path*',
    '/login',
    '/register',
  ],
};

