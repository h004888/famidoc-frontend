'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginSchema, LoginRole } from '../schemas/auth.schema';
import { useAuth, getDefaultPathForRole } from '../context/auth-context';
import { saveAuthSession, AuthUser } from '@/lib/auth-storage';
import { httpClient } from '@/lib/api/http-client';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const isRegisteredSuccess = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email.trim(), password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErrors({
          global: errorData.message || 'Tài khoản hoặc mật khẩu không chính xác',
        });
        setLoading(false);
        return;
      }

      const data = await res.json();
      const rawRole = (data.user?.role?.toUpperCase() || 'FAMILY') as string;
      const role: LoginRole = rawRole === 'FAMILY_REP' ? 'FAMILY' : (rawRole as LoginRole);
      const authUser: AuthUser = {
        id: data.user?.id || 'usr-1',
        name: data.user?.fullName || email,
        email: data.user?.email || email,
        phone: data.user?.phone || '0912345678',
        role,
        avatarText: (data.user?.fullName || email).slice(0, 2).toUpperCase(),
      };

      if (data.accessToken) {
        httpClient.setToken(data.accessToken);
      }
      saveAuthSession(role, authUser, data.accessToken);
      setLoading(false);

      const redirectPath = getDefaultPathForRole(role);
      if (typeof window !== 'undefined') {
        window.location.replace(redirectPath);
      } else {
        router.push(redirectPath);
      }
    } catch {
      setLoading(false);
      setErrors({ global: 'Không thể kết nối đến máy chủ đăng nhập' });
    }
  };

  return (
    <div
      className="text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-700 min-h-screen w-full flex items-center justify-center p-3 sm:p-5 lg:p-8 relative overflow-x-hidden"
      style={{
        background: 'radial-gradient(120% 100% at 0% 0%, #FFFFFF 0%, #EBF4FE 45%, #DFEEFD 100%)',
      }}
    >
      {/* ========================================================================= */}
      {/* FLOATING BACKGROUND MEDICAL CROSS ACCENTS                                 */}
      {/* ========================================================================= */}
      <div className="absolute top-12 left-1/3 opacity-30 text-blue-400 pointer-events-none select-none">
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
        </svg>
      </div>
      <div className="absolute top-80 left-8 opacity-40 text-blue-300 pointer-events-none select-none">
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
        </svg>
      </div>
      <div className="absolute top-10 right-14 opacity-30 text-blue-300 pointer-events-none select-none">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
        </svg>
      </div>
      <div className="absolute bottom-48 left-6 opacity-40 text-blue-300 pointer-events-none select-none">
        <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* MAIN SCREEN CONTAINER                                                     */}
      {/* ========================================================================= */}
      <main
        className="w-full max-w-[1580px] min-h-[880px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-8 relative z-20"
        data-purpose="login-screen"
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BRAND PRESENTATION & HERO IMAGERY                            */}
        {/* ========================================================================= */}
        <section
          className="hidden lg:flex lg:col-span-6 xl:col-span-6 flex-col justify-between h-full relative"
          data-purpose="brand-showcase"
        >
          <div className="pt-4 lg:pt-8 pl-4 lg:pl-8 xl:pl-10 pr-4">
            {/* Brand Logo Header */}
            <Link
              href="/"
              className="inline-block mb-6 focus:outline-none rounded-xl group"
              data-purpose="main-logo"
            >
              <img
                src="/images/logo.png"
                alt="FamiDoc Logo"
                className="h-10 xl:h-11 w-auto object-contain drop-shadow-xs transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Main Headline & Subtitle */}
            <div className="max-w-xl mb-7" data-purpose="hero-copy">
              <h2 className="text-3xl lg:text-[40px] font-bold text-slate-900 leading-[1.25] tracking-tight">
                Bảo vệ bản thân &amp; gia đình bạn —
                <span className="block text-blue-600 mt-1 font-bold">Đặt lịch khám trực tuyến dễ dàng.</span>
              </h2>
              <p className="text-slate-600 text-base lg:text-lg mt-4 font-normal leading-relaxed">
                FamiDoc – Nền tảng quản lý bác sĩ gia đình và chăm sóc sức khỏe toàn diện.
              </p>
            </div>

            {/* 3 Feature Highlight Badges */}
            <div className="grid grid-cols-3 gap-3.5 max-w-lg mb-4 relative z-30" data-purpose="feature-cards">
              {/* Feature 1 */}
              <div className="bg-white/90 backdrop-blur-sm border border-blue-100/90 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                    <circle cx="8" cy="14" fill="currentColor" r="1" />
                    <circle cx="12" cy="14" fill="currentColor" r="1" />
                    <circle cx="16" cy="14" fill="currentColor" r="1" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700 leading-tight">
                  Đặt lịch
                  <br />
                  nhanh chóng
                </span>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/90 backdrop-blur-sm border border-blue-100/90 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700 leading-tight">
                  Theo dõi
                  <br />
                  sức khỏe dễ dàng
                </span>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/90 backdrop-blur-sm border border-blue-100/90 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    <path d="M3.5 12h3l2-3 3 6 2-3h5" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700 leading-tight">
                  Chăm sóc
                  <br />
                  cá nhân hóa
                </span>
              </div>
            </div>
          </div>

          {/* Hero Illustration: Family + Hospital + Heartbeat Badge + Waves */}
          <div className="relative w-full mt-auto -mb-4 lg:-mb-8 -ml-3 sm:-ml-5 lg:-ml-8 pointer-events-none select-none z-10" data-purpose="hero-illustration">
            <img
              alt="Bác sĩ gia đình và chăm sóc sức khỏe toàn diện FamiDoc"
              src="/images/famidoc_register_hero.png"
              className="w-full max-w-[760px] h-auto object-contain object-bottom select-none"
            />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LOGIN FORM CARD                                             */}
        {/* ========================================================================= */}
        <section className="lg:col-span-6 xl:col-span-6 flex justify-center items-center" data-purpose="form-section">
          <div className="w-full max-w-[560px] bg-white rounded-[32px] p-6 sm:p-9 lg:p-10 shadow-[0_20px_50px_rgba(26,86,219,0.08)] border border-blue-100/60 relative">
            {/* Subtle cross decorative icon top right of card */}
            <div className="absolute top-8 right-8 text-blue-200 pointer-events-none select-none opacity-80">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
              </svg>
            </div>

            {/* Form Header */}
            <div className="mb-6 sm:mb-7" data-purpose="card-header">
              {/* Brand Logo Header */}
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/images/logo.png"
                  alt="FamiDoc Logo"
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </div>

              {/* Form Title */}
              <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                Đăng nhập vào tài khoản của bạn
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Truy cập hồ sơ sức khỏe và kết nối với bác sĩ gia đình của bạn.
              </p>
            </div>

            {/* Thông báo đăng ký thành công nếu có ?registered=true */}
            {isRegisteredSuccess && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0">
                  ✓
                </span>
                <span>Đăng ký tài khoản đại diện thành công! Vui lòng đăng nhập để tiếp tục.</span>
              </div>
            )}

            {/* Form Đăng Nhập */}
            <form onSubmit={handleSubmit} className="space-y-4" data-purpose="login-form">
              {/* Trường Email / Tên đăng nhập */}
              <div className="space-y-1.5" data-purpose="field-email">
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
                  Email đăng nhập <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all bg-slate-50/30 overflow-hidden ${
                    errors.email
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300'
                  }`}
                >
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect height="16" rx="2" width="20" x="2" y="4" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@famidoc.vn"
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
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
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all bg-slate-50/30 overflow-hidden ${
                    errors.password
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300'
                  }`}
                >
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    name="password"
                    aria-label="Mật khẩu"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 tracking-wider focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Nút Đăng Nhập Chính */}
              <div className="pt-2" data-purpose="submit-button">
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Đăng nhập hệ thống"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng nhập hệ thống</span>
                      <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        viewBox="0 0 24 24"
                      >
                        <line x1="5" x2="19" y1="12" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Nút Đăng nhập với Google */}
              <div className="relative flex items-center justify-center py-1.5 my-0.5">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink-0 px-3 text-[11px] text-slate-400 uppercase select-none font-medium">
                  Hoặc
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <button
                type="button"
                className="w-full h-11 flex items-center justify-center gap-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-colors text-xs font-semibold shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              </button>
            </form>

            {/* Card Footer */}
            <div
              className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs gap-3"
              data-purpose="card-footer"
            >
              {/* Compliance Badge */}
              <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                <svg
                  className="w-4 h-4 text-emerald-600 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span>Bảo mật theo Nghị định 13/2023/NĐ-CP</span>
              </div>
              {/* Register Link */}
              <div className="text-slate-500">
                Chưa có tài khoản?{' '}
                <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
