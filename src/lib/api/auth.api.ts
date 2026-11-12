import { httpClient } from './http-client';
import { ApiError } from '../http/errors';

export interface RegisterRepresentativeDto {
  fullName: string;
  phone: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms: boolean;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface LoginDto {
  email: string;
  password?: string;
  identifier?: string; // Tương thích ngược nếu có form cũ truyền identifier
  rememberMe?: boolean;
}

export interface AuthUserData {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
}

export interface LoginResponseData {
  accessToken: string;
  role: string;
  user: AuthUserData;
}

export interface UnifiedResponse<T> {
  success: boolean;
  code: number;
  message?: string;
  data: T;
  meta?: unknown;
  timestamp?: string;
  requestId?: string;
}

// Backward-compatible alias
export type AuthResponseDto = LoginResponseData;

export function mapBackendRoleToFrontendRole(
  backendRole: string
): 'FAMILY' | 'DOCTOR' | 'FACILITY' | 'ADMIN' | 'PATIENT' {
  const normalized = (backendRole || '').toUpperCase();
  if (normalized === 'FAMILY_REP' || normalized === 'FAMILY') return 'FAMILY';
  if (normalized === 'DOCTOR') return 'DOCTOR';
  if (normalized === 'FACILITY') return 'FACILITY';
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'PATIENT') return 'PATIENT';
  return 'FAMILY';
}

export interface RegisterInitiateResponseData {
  email: string;
  expiresInSeconds: number;
  devOtp?: string;
  message?: string;
}

interface Rfc9457ErrorBody {
  errorCode?: string;
  detail?: string;
  title?: string;
  invalidParams?: Array<{ field?: string; message?: string }>;
}

/**
 * Ánh xạ lỗi từ Backend (RFC 9457 Unified Envelope) sang field-level error object.
 */
export function mapRegistrationErrorToFields(apiError: ApiError): Record<string, string> {
  const result: Record<string, string> = {};
  if (!apiError.details) return result;

  const errorData =
    apiError.details && typeof apiError.details === 'object'
      ? (apiError.details as { error?: Rfc9457ErrorBody })
      : {};
  const errorObj: Rfc9457ErrorBody = errorData.error || {};
  const errorCode = errorObj.errorCode;
  const detail = errorObj.detail || errorObj.title || apiError.message;

  // RFC 9457 invalidParams array — ánh xạ từng phần tử vào field tương ứng
  if (Array.isArray(errorObj.invalidParams)) {
    for (const param of errorObj.invalidParams) {
      if (param.field && param.message) {
        result[param.field] = param.message;
      }
    }
    return result;
  }

  switch (errorCode) {
    case 'AUTH_EMAIL_ALREADY_EXISTS':
      result.email = 'Email này đã được đăng ký trong hệ thống';
      break;
    case 'AUTH_PHONE_ALREADY_EXISTS':
      result.phone = 'Số điện thoại này đã được đăng ký trong hệ thống';
      break;
    default:
      break;
  }

  if (apiError.status === 429) {
    result.global = 'Vui lòng chờ 60 giây trước khi yêu cầu gửi lại mã OTP';
  } else if (apiError.status === 400 && !result.fullName && !result.password && !result.phone && !result.email) {
    result.global = detail || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
  } else if (apiError.status === 409 && !result.email && !result.phone) {
    result.global = detail || 'Đã xảy ra xung đột dữ liệu. Vui lòng kiểm tra lại.';
  }

  return result;
}

export const authApi = {
  registerRepresentative: async (dto: RegisterRepresentativeDto): Promise<RegisterInitiateResponseData> => {
    // Chuẩn hóa: xóa khoảng trắng ở phone, lowercase email
    const payload = {
      fullName: dto.fullName,
      phone: (dto.phone ?? '').replace(/\s+/g, ''),
      email: (dto.email ?? '').toLowerCase(),
      password: dto.password,
      confirmPassword: dto.confirmPassword,
      acceptTerms: dto.acceptTerms,
    };
    const res = await httpClient.post<UnifiedResponse<RegisterInitiateResponseData> | RegisterInitiateResponseData>(
      '/api/v1/auth/register-representative',
      payload
    );

    // Tự động giải nén Unified Envelope nếu Backend trả về dạng { success, code, data: { ... } }
    if (res && typeof res === 'object' && 'data' in res && res.data) {
      return res.data;
    }
    return res as RegisterInitiateResponseData;
  },

  verifyEmailOtp: (dto: VerifyOtpDto): Promise<AuthResponseDto> => {
    return httpClient.post<AuthResponseDto>('/api/v1/auth/verify-email-otp', dto);
  },

  resendEmailOtp: (email: string): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>('/api/v1/auth/resend-email-otp', { email });
  },

  login: async (dto: LoginDto): Promise<LoginResponseData> => {
    const email = (dto.email || dto.identifier || '').trim();
    const payload = {
      email,
      password: dto.password,
      rememberMe: dto.rememberMe,
    };
    const res = await httpClient.post<UnifiedResponse<LoginResponseData> | LoginResponseData>(
      '/api/v1/auth/login',
      payload
    );

    // Tự động giải nén Unified Envelope nếu Backend trả về dạng { success, data: { ... } }
    if (res && typeof res === 'object' && 'data' in res && res.data) {
      return res.data;
    }
    return res as LoginResponseData;
  },
};
