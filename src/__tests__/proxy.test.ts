// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';

function makeRequest(url: string, cookies: Record<string, string> = {}) {
  const headers = new Headers();
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  if (cookieHeader) headers.set('cookie', cookieHeader);
  return new NextRequest(new URL(url, 'http://localhost:3000'), { headers });
}

function loginRedirectTarget(response: Response): string | null {
  const location = response.headers.get('location');
  if (!location) return null;
  return new URL(location, 'http://localhost:3000').searchParams.get('redirect');
}

describe('proxy - giữ URL đích khi chuyển sang đăng nhập', () => {
  it('giữ cả query string của deep link', () => {
    const response = proxy(
      makeRequest('/family/subscription/tracking?contractId=abc')
    );

    expect(response.status).toBe(307);
    expect(loginRedirectTarget(response)).toBe(
      '/family/subscription/tracking?contractId=abc'
    );
  });

  it('giữ đường dẫn khi không có query string', () => {
    const response = proxy(makeRequest('/family/members'));

    expect(response.status).toBe(307);
    expect(loginRedirectTarget(response)).toBe('/family/members');
  });

  it('áp dụng cho phân hệ bác sĩ và cơ sở y tế', () => {
    expect(
      loginRedirectTarget(proxy(makeRequest('/doctor/contracts/abc/review')))
    ).toBe('/doctor/contracts/abc/review');
    expect(
      loginRedirectTarget(proxy(makeRequest('/facility/coordination?tab=inbox')))
    ).toBe('/facility/coordination?tab=inbox');
  });
});

describe('proxy - không đổi hành vi cũ', () => {
  it('cho qua trang đăng nhập', () => {
    const response = proxy(makeRequest('/login'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('cho qua khi người dùng đã đăng nhập đúng vai trò', () => {
    const response = proxy(
      makeRequest('/family/subscription/tracking?contractId=abc', {
        famidoc_token: 'jwt',
        famidoc_role: 'FAMILY',
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('vẫn đẩy về trang mặc định của vai trò khi sai phân hệ', () => {
    const response = proxy(
      makeRequest('/doctor/contracts', {
        famidoc_token: 'jwt',
        famidoc_role: 'FAMILY',
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/family');
  });
});
