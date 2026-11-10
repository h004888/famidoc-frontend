import { httpClient } from './http-client';

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
  identifier: string;
  password?: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  };
}

export const authApi = {
  registerRepresentative: (dto: RegisterRepresentativeDto): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>('/api/v1/auth/register-representative', dto);
  },

  verifyEmailOtp: (dto: VerifyOtpDto): Promise<AuthResponseDto> => {
    return httpClient.post<AuthResponseDto>('/api/v1/auth/verify-email-otp', dto);
  },

  resendEmailOtp: (email: string): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>('/api/v1/auth/resend-email-otp', { email });
  },

  login: (dto: LoginDto): Promise<AuthResponseDto> => {
    return httpClient.post<AuthResponseDto>('/api/v1/auth/login', dto);
  },
};
