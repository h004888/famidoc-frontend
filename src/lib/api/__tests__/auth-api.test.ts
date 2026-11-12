import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import { authApi, mapBackendRoleToFrontendRole, mapRegistrationErrorToFields } from '../auth.api';
import { ApiError } from '../../http/errors';

describe('Task 1: authApi and http-client RFC 9457 & Envelope unpacking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpClient.clearToken();
  });

  it('authApi.login sends { email, password } and unpacks Unified Envelope data', async () => {
    const mockEnvelope = {
      success: true,
      code: 200,
      message: 'Đăng nhập thành công',
      data: {
        accessToken: 'mock-jwt-token-rep',
        role: 'FAMILY_REP',
        user: {
          id: 'usr-123',
          email: 'rep@famidoc.vn',
          phone: '0987654321',
          fullName: 'Nguyễn Văn Đại Diện',
          role: 'FAMILY_REP',
          status: 'ACTIVE',
          avatarUrl: null,
        },
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockEnvelope,
    } as Response);

    const result = await authApi.login({
      email: 'rep@famidoc.vn',
      password: 'Password@123',
    });

    expect(result.accessToken).toBe('mock-jwt-token-rep');
    expect(result.role).toBe('FAMILY_REP');
    expect(result.user.fullName).toBe('Nguyễn Văn Đại Diện');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'rep@famidoc.vn',
          password: 'Password@123',
        }),
      })
    );
    fetchSpy.mockRestore();
  });

  it('http-client extracts RFC 9457 error.detail on HTTP 401 error', async () => {
    const rfc9457Error = {
      success: false,
      code: 401,
      error: {
        type: 'https://errors.famidoc.vn/unauthorized',
        title: 'Unauthorized',
        detail: 'Incorrect username or password. Please check again.',
        errorCode: 'AUTH_UNAUTHORIZED',
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => rfc9457Error,
    } as Response);

    await expect(
      authApi.login({ email: 'wrong@famidoc.vn', password: 'WrongPassword' })
    ).rejects.toThrow('Incorrect username or password. Please check again.');

    fetchSpy.mockRestore();
  });

  it('mapBackendRoleToFrontendRole correctly maps FAMILY_REP to FAMILY', () => {
    expect(mapBackendRoleToFrontendRole('FAMILY_REP')).toBe('FAMILY');
    expect(mapBackendRoleToFrontendRole('DOCTOR')).toBe('DOCTOR');
    expect(mapBackendRoleToFrontendRole('ADMIN')).toBe('ADMIN');
    expect(mapBackendRoleToFrontendRole('FACILITY')).toBe('FACILITY');
    expect(mapBackendRoleToFrontendRole('UNKNOWN')).toBe('FAMILY');
  });

  // ===========================================================================
  // registerRepresentative — Unified Envelope unwrap & phone normalization
  // ===========================================================================
  describe('authApi.registerRepresentative', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('unwrap HTTP 201 Unified Envelope and normalize phone/email', async () => {
      const mockEnvelope = {
        success: true,
        code: 201,
        message: 'Đăng ký thành công',
        data: {
          email: 'rep@famidoc.vn',
          expiresInSeconds: 300,
          devOtp: '123456',
        },
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockEnvelope,
      } as Response);

      const result = await authApi.registerRepresentative({
        fullName: 'Nguyễn Văn An',
        phone: '0912 345 678',         // có khoảng trắng → phải được xóa
        email: 'Rep@FAMIDOC.VN',       // phải lowercase
        password: 'SecurePass1!',
        confirmPassword: 'SecurePass1!',
        acceptTerms: true,
      });

      // Result là phần "data" đã unwrap
      expect(result).toEqual({
        email: 'rep@famidoc.vn',
        expiresInSeconds: 300,
        devOtp: '123456',
      });

      // Kiểm tra body gửi đi — phone đã xóa khoảng trắng, email lowercase
      const callArgs = fetchSpy.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.phone).toBe('0912345678');
      expect(body.email).toBe('rep@famidoc.vn');
      expect(body.fullName).toBe('Nguyễn Văn An');
      // Chỉ gồm đúng 6 trường hợp lệ của RegisterFamilyRepDto
      expect(Object.keys(body)).toHaveLength(6);
      expect(body).toHaveProperty('fullName');
      expect(body).toHaveProperty('phone');
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('password');
      expect(body).toHaveProperty('confirmPassword');
      expect(body).toHaveProperty('acceptTerms');
    });
  });

  // ===========================================================================
  // mapRegistrationErrorToFields — RFC 9457 error mapping
  // ===========================================================================
  describe('mapRegistrationErrorToFields', () => {
    it('maps AUTH_EMAIL_ALREADY_EXISTS to field-level Vietnamese error', () => {
      const apiErr = {
        status: 409,
        details: {
          success: false,
          code: 409,
          error: {
            errorCode: 'AUTH_EMAIL_ALREADY_EXISTS',
            detail: 'This email is already registered',
          },
        },
      } as unknown as ApiError;

      const fieldErrors = mapRegistrationErrorToFields(apiErr);
      expect(fieldErrors.email).toBe('Email này đã được đăng ký trong hệ thống');
    });

    it('maps AUTH_PHONE_ALREADY_EXISTS to field-level Vietnamese error', () => {
      const apiErr = {
        status: 409,
        details: {
          success: false,
          code: 409,
          error: {
            errorCode: 'AUTH_PHONE_ALREADY_EXISTS',
            detail: 'This phone number is already registered',
          },
        },
      } as unknown as ApiError;

      const fieldErrors = mapRegistrationErrorToFields(apiErr);
      expect(fieldErrors.phone).toBe('Số điện thoại này đã được đăng ký trong hệ thống');
    });

    it('maps HTTP 429 cooldown to global Vietnamese error', () => {
      const apiErr = {
        status: 429,
        details: {
          success: false,
          code: 429,
          error: {
            title: 'Too Many Requests',
            detail: 'OTP resend cooldown active',
          },
        },
      } as unknown as ApiError;

      const fieldErrors = mapRegistrationErrorToFields(apiErr);
      expect(fieldErrors.global).toBe('Vui lòng chờ 60 giây trước khi yêu cầu gửi lại mã OTP');
    });

    it('maps RFC 9457 invalidParams array to field-level errors', () => {
      const apiErr = {
        status: 400,
        details: {
          success: false,
          code: 400,
          error: {
            title: 'Validation Failed',
            invalidParams: [
              { field: 'fullName', message: 'Họ và tên không được để trống' },
              { field: 'password', message: 'Mật khẩu phải có ít nhất 8 ký tự' },
            ],
          },
        },
      } as unknown as ApiError;

      const fieldErrors = mapRegistrationErrorToFields(apiErr);
      expect(fieldErrors.fullName).toBe('Họ và tên không được để trống');
      expect(fieldErrors.password).toBe('Mật khẩu phải có ít nhất 8 ký tự');
    });
  });
});
