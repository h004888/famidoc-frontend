import { NextResponse } from 'next/server';

/**
 * Endpoint hỗ trợ lập trình viên & người kiểm thử chuyển đổi nhanh giữa các vai trò:
 * - /api/dev-login?role=FAMILY&redirect=/family/billing
 * - /api/dev-login?role=FACILITY&redirect=/facility/revenue
 * - /api/dev-login?role=ADMIN&redirect=/admin/reconciliation
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = (searchParams.get('role') || 'FAMILY').toUpperCase();
  const redirect = searchParams.get('redirect') || '/';

  const destination = new URL(redirect, request.url);
  const response = NextResponse.redirect(destination);
  response.cookies.set('famidoc_role', role, { path: '/', maxAge: 86400 });
  response.cookies.set('famidoc_token', 'mock_token_dev', { path: '/', maxAge: 86400 });
  return response;
}
