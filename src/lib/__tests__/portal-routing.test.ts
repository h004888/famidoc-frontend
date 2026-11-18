// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  extractHostname,
  getLoginUrlForRole,
  getPortalFromHost,
  getPortalOrigin,
  getSubdomainPortal,
  isRoleAllowedOnPortal,
  normalizeHostHeader,
  resolveClientActivePortal,
  resolveLogoutRedirectUrl,
  supportsSubdomainRouting,
} from '../portal-routing';

describe('portal-routing', () => {
  it('chuẩn hóa x-forwarded-host có nhiều giá trị và port', () => {
    expect(normalizeHostHeader('admin.famidoc.online, proxy.internal')).toBe(
      'admin.famidoc.online',
    );
    expect(extractHostname('CSYT.localhost:3000')).toBe('csyt.localhost');
  });

  it('ánh xạ đúng 3 subdomain production và local sang vai trò', () => {
    expect(getSubdomainPortal('admin.famidoc.online')).toBe('ADMIN');
    expect(getSubdomainPortal('csyt.famidoc.online')).toBe('FACILITY');
    expect(getSubdomainPortal('bacsi.famidoc.online')).toBe('DOCTOR');
    expect(getSubdomainPortal('admin.localhost:3000')).toBe('ADMIN');
    expect(getSubdomainPortal('csyt.localhost:3000')).toBe('FACILITY');
    expect(getSubdomainPortal('bacsi.localhost:3000')).toBe('DOCTOR');

    expect(getSubdomainPortal('famidoc.online')).toBeNull();
    expect(getSubdomainPortal('localhost:3000')).toBeNull();
    expect(getPortalFromHost('famidoc.online')).toBe('FAMILY');
  });

  it('kiểm tra quyền vai trò theo từng cổng', () => {
    expect(isRoleAllowedOnPortal('FAMILY_REP', 'FAMILY')).toBe(true);
    expect(isRoleAllowedOnPortal('PATIENT', 'FAMILY')).toBe(true);
    expect(isRoleAllowedOnPortal('ADMIN', 'FAMILY')).toBe(false);
    expect(isRoleAllowedOnPortal('DOCTOR', 'FAMILY')).toBe(false);
    expect(isRoleAllowedOnPortal('HEALTHCARE_FACILITY', 'FACILITY')).toBe(true);
    expect(isRoleAllowedOnPortal('ADMIN', 'ADMIN')).toBe(true);
    expect(isRoleAllowedOnPortal('DOCTOR', 'DOCTOR')).toBe(true);
  });

  it('dựng origin cho từng cổng trên production và localhost', () => {
    expect(getPortalOrigin('ADMIN', 'famidoc.online', 'https')).toBe(
      'https://admin.famidoc.online',
    );
    expect(getPortalOrigin('FACILITY', 'famidoc.online', 'https')).toBe(
      'https://csyt.famidoc.online',
    );
    expect(getPortalOrigin('DOCTOR', 'famidoc.online', 'https')).toBe(
      'https://bacsi.famidoc.online',
    );
    expect(getPortalOrigin('FAMILY', 'admin.famidoc.online', 'https')).toBe(
      'https://famidoc.online',
    );
    expect(getPortalOrigin('ADMIN', 'localhost:3000', 'http')).toBe(
      'http://admin.localhost:3000',
    );
  });

  it('nhận diện supportsSubdomainRouting cho domain thật và localhost, chỉ false cho IP thuần', () => {
    expect(supportsSubdomainRouting('famidoc.online')).toBe(true);
    expect(supportsSubdomainRouting('admin.famidoc.online')).toBe(true);
    expect(supportsSubdomainRouting('localhost:3000')).toBe(true);
    expect(supportsSubdomainRouting('admin.localhost:3000')).toBe(true);
    expect(supportsSubdomainRouting('127.0.0.1:3000')).toBe(false);
    expect(supportsSubdomainRouting('[::1]:3000')).toBe(false);
    expect(supportsSubdomainRouting('192.168.1.10:3000')).toBe(false);
    expect(supportsSubdomainRouting('')).toBe(false);
  });

  it('resolveClientActivePortal cô lập domain gốc khỏi route nghiệp vụ trên localhost và fallback theo pathname trên IP thuần', () => {
    expect(resolveClientActivePortal('admin.localhost:3000', '/')).toBe('ADMIN');
    expect(resolveClientActivePortal('csyt.famidoc.online', '/settings')).toBe('FACILITY');
    expect(resolveClientActivePortal('bacsi.localhost:3000', '/doctor/contracts')).toBe('DOCTOR');
    expect(resolveClientActivePortal('localhost:3000', '/admin/users')).toBe('FAMILY');
    expect(resolveClientActivePortal('famidoc.online', '/packages')).toBe('FAMILY');
    expect(resolveClientActivePortal('127.0.0.1:3000', '/admin/users')).toBe('ADMIN');
    expect(resolveClientActivePortal('127.0.0.1:3000', '/facility/login')).toBe('FACILITY');
    expect(resolveClientActivePortal('127.0.0.1:3000', '/doctor/contracts')).toBe('DOCTOR');
    expect(resolveClientActivePortal('127.0.0.1:3000', '/packages')).toBe('FAMILY');
  });

  it('trả về URL login và logout dùng subdomain *.localhost:3000 trên localhost và giữ fallback trên IP thuần', () => {
    expect(getLoginUrlForRole('ADMIN', 'admin.famidoc.online')).toBe('/login');
    expect(getLoginUrlForRole('ADMIN', 'famidoc.online', 'https')).toBe(
      'https://admin.famidoc.online/login',
    );
    expect(getLoginUrlForRole('ADMIN', 'localhost:3000', 'http')).toBe(
      'http://admin.localhost:3000/login',
    );
    expect(getLoginUrlForRole('FACILITY', 'localhost:3000', 'http')).toBe(
      'http://csyt.localhost:3000/login',
    );
    expect(getLoginUrlForRole('DOCTOR', 'localhost:3000', 'http')).toBe(
      'http://bacsi.localhost:3000/login',
    );
    expect(getLoginUrlForRole('ADMIN', '127.0.0.1:3000', 'http')).toBe('/admin/login');
    expect(getLoginUrlForRole('FACILITY', '127.0.0.1:3000', 'http')).toBe('/facility/login');
    expect(getLoginUrlForRole('DOCTOR', '127.0.0.1:3000', 'http')).toBe('/doctor/login');
    expect(getLoginUrlForRole('FAMILY', 'admin.famidoc.online', 'https')).toBe(
      'https://famidoc.online/login',
    );
    expect(getLoginUrlForRole('FAMILY', 'admin.localhost:3000', 'http')).toBe(
      'http://localhost:3000/login',
    );

    expect(resolveLogoutRedirectUrl('ADMIN', 'admin.famidoc.online', 'https')).toBe('/login');
    expect(resolveLogoutRedirectUrl('ADMIN', 'admin.localhost:3000', 'http')).toBe('/login');
    expect(resolveLogoutRedirectUrl('ADMIN', 'localhost:3000', 'http')).toBe(
      'http://admin.localhost:3000/login',
    );
    expect(resolveLogoutRedirectUrl('FACILITY', 'localhost:3000', 'http')).toBe(
      'http://csyt.localhost:3000/login',
    );
    expect(resolveLogoutRedirectUrl('DOCTOR', 'localhost:3000', 'http')).toBe(
      'http://bacsi.localhost:3000/login',
    );
    expect(resolveLogoutRedirectUrl('ADMIN', '127.0.0.1:3000', 'http')).toBe('/admin/login');
    expect(resolveLogoutRedirectUrl('FAMILY', 'localhost:3000', 'http')).toBe('/login');
  });
});
