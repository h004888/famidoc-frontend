'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginSchema, LoginRole } from '../schemas/auth.schema';
import { useAuth } from '../context/auth-context';
import { AuthUser } from '@/lib/auth-storage';
import { authApi, mapBackendRoleToFrontendRole } from '@/lib/api/auth.api';
import { useRouter } from 'next/navigation';
import { resolveReturnUrl } from '../return-url';
import {
  getCurrentBrowserHost,
  getCurrentBrowserProto,
  getLoginUrlForRole,
  getPortalDisplayLabel,
  isFamilyPortalRole,
} from '@/lib/portal-routing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FamilyAuthShell } from './family-auth-shell';

export function LoginForm() {
  const router = useRouter();
  const { applySession } = useAuth();
  const searchParams = useSearchParams();
  const isRegisteredSuccess = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wrongPortalTarget, setWrongPortalTarget] = useState<{
    label: string;
    href: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setWrongPortalTarget(null);

    const validation = loginSchema.safeParse({ email, password, rememberMe });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'global';
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const validData = validation.data;

    try {
      const data = await authApi.login({
        email: email.trim(),
        password,
        rememberMe: validData.rememberMe,
      });

      const rawRole = (data.user?.role || data.role || 'FAMILY').toUpperCase();
      const role: LoginRole = (mapBackendRoleToFrontendRole(rawRole) as LoginRole) || 'FAMILY';

      if (!isFamilyPortalRole(role)) {
        const portalHref = getLoginUrlForRole(
          role,
          getCurrentBrowserHost(),
          getCurrentBrowserProto(),
        );
        const portalLabel = getPortalDisplayLabel(role);
        setLoading(false);
        setWrongPortalTarget({ label: portalLabel, href: portalHref });
        setErrors({
          global: `Tài khoản của bạn thuộc ${portalLabel}. Trang đăng nhập này chỉ dành riêng cho Khách hàng Gia đình.`,
        });
        return;
      }

      const authUser: AuthUser = {
        id: data.user?.id || 'usr-1',
        name: data.user?.fullName || email,
        email: data.user?.email || email,
        phone: data.user?.phone || '0912345678',
        role,
        avatarText: (data.user?.fullName || email).slice(0, 2).toUpperCase(),
        mustChangePassword: Boolean(data.user?.mustChangePassword),
      };

      applySession(
        role,
        authUser,
        data.accessToken,
        validData.rememberMe,
        data.refreshToken,
      );
      setLoading(false);

      // Quay lại đúng trang người dùng định vào; chỉ nhận đường dẫn nội bộ hợp lệ.
      const returnUrl = resolveReturnUrl(
        searchParams.get('returnUrl') ?? searchParams.get('redirect')
      );
      const redirectPath = returnUrl ?? '/';
      router.replace(redirectPath);
    } catch (err: unknown) {
      setLoading(false);
      const rawMessage = err instanceof Error ? err.message.trim() : '';
      const isUnhelpfulMessage =
        !rawMessage ||
        rawMessage.toLowerCase() === 'unauthorized' ||
        /^API error \(\d+\)$/.test(rawMessage);
      setErrors({
        global: isUnhelpfulMessage
          ? 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
          : rawMessage,
      });
    }
  };

  return (
    <FamilyAuthShell dataPurpose="login-screen">
      <div className="w-full max-w-[460px] sm:max-w-[500px] lg:max-w-[520px] xl:max-w-[540px] bg-white rounded-3xl p-6 sm:p-8 xl:p-10 shadow-[0_20px_50px_rgba(26,86,219,0.08)] border border-blue-100/80 relative">
            {/* Form Header */}
            <div className="mb-6" data-purpose="card-header">
              {/* Brand Logo Header (hiển thị trên mobile/tablet khi cột trái ẩn) */}
              <div className="flex lg:hidden items-center gap-2 mb-4">
                <img
                  src="/images/logo.png"
                  alt="FamiDoc Logo"
                  className="h-8 w-auto object-contain"
                />
              </div>

              {/* Form Title */}
              <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight tracking-tight">
                Đăng nhập vào tài khoản
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Truy cập hồ sơ sức khỏe và kết nối với bác sĩ gia đình của bạn.
              </p>
            </div>

            {/* Thông báo đăng ký thành công nếu có ?registered=true */}
            {isRegisteredSuccess && (
              <div
                role="status"
                className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0">
                  ✓
                </span>
                <span>Đăng ký tài khoản đại diện thành công! Vui lòng đăng nhập để tiếp tục.</span>
              </div>
            )}

            {/* Form Đăng Nhập */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" data-purpose="login-form">
              {errors.global && (
                <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 text-red-700">
                  <AlertDescription className="flex flex-col gap-2 text-xs font-semibold text-red-700">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">
                        !
                      </span>
                      <span>{errors.global}</span>
                    </div>
                    {wrongPortalTarget && (
                      <a
                        href={wrongPortalTarget.href}
                        className="inline-flex w-fit items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100/60 transition-colors"
                      >
                        <span>Chuyển tới {wrongPortalTarget.label}</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Trường Email / Tên đăng nhập */}
              <div className="space-y-1.5" data-purpose="field-email">
                <label htmlFor="login-email" className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Email đăng nhập <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all bg-slate-50/50 overflow-hidden ${errors.email
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300'
                    }`}
                >
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <rect height="16" rx="2" width="20" x="2" y="4" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@famidoc.vn"
                    className="w-full h-11 pl-10 pr-4 bg-transparent border-none shadow-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 focus-visible:border-none"
                  />
                </div>
                {errors.email && (
                  <p role="alert" className="text-xs text-red-600 font-medium mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Trường Mật khẩu */}
              <div className="space-y-1.5" data-purpose="field-password">
                <label htmlFor="login-password" className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all bg-slate-50/50 overflow-hidden ${errors.password
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300'
                    }`}
                >
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <Input
                    id="login-password"
                    name="password"
                    aria-label="Mật khẩu"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-11 bg-transparent border-none shadow-none text-sm text-slate-800 placeholder:text-slate-400 tracking-wider focus:outline-none focus-visible:ring-0 focus-visible:border-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-blue-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p role="alert" className="text-xs text-red-600 font-medium mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Ghi nhớ & Quên mật khẩu */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none min-h-6">
                  <input
                    type="checkbox"
                    id="login-remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Nút Đăng Nhập Chính */}
              <div className="pt-1" data-purpose="submit-button">
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Đăng nhập hệ thống"
                  className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <span>Đăng nhập hệ thống</span>
                  )}
                </button>
              </div>

              {/* Nút Đăng nhập với Google */}
              <div className="relative flex items-center justify-center py-0.5">
                <div className="flex-grow border-t border-slate-200/90" />
                <span className="shrink-0 px-3 text-[11px] text-slate-400 uppercase tracking-wider select-none font-medium">
                  Hoặc
                </span>
                <div className="flex-grow border-t border-slate-200/90" />
              </div>

              <Button
                type="button"
                className="w-full h-11 flex items-center justify-center gap-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-colors text-sm font-semibold shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Đăng nhập với Google</span>
              </Button>
            </form>

            {/* Card Footer */}
            <div
              className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center justify-center gap-2 text-center"
              data-purpose="card-footer"
            >
              {/* Register Link */}
              <div className="text-xs sm:text-sm text-slate-600">
                Chưa có tài khoản?{' '}
                <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                  Đăng ký ngay
                </Link>
              </div>
            </div>
      </div>
    </FamilyAuthShell>
  );
}
