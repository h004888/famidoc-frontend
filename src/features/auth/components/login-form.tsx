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
    <div className="w-full min-h-screen lg:min-h-0 lg:h-screen lg:max-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden lg:overflow-hidden">
      {/* ========================================================================= */}
      {/* CỘT TRÁI (HERO SECTION): Khóa Cứng Toàn Bộ Chiều Cao Desktop, Không Cuộn   */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-[#f4f8fe] relative p-6 xl:p-8 flex-col justify-between overflow-hidden border-r border-slate-200/80 h-full max-h-screen">
        {/* Họa tiết lượn sóng (Topographical waves) */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-100 80 C 150 120, 200 40, 450 90 C 600 120, 700 80, 800 100"
              stroke="#c7ddfe"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            <path
              d="M-120 140 C 100 180, 250 100, 500 150 C 650 180, 750 140, 850 160"
              stroke="#c7ddfe"
              strokeWidth="1.2"
            />
            <path
              d="M-80 200 C 120 240, 300 160, 520 210 C 680 240, 780 200, 880 220"
              stroke="#dbeafe"
              strokeWidth="1"
            />
            <path
              d="M-140 260 C 80 300, 280 220, 540 270 C 700 300, 800 260, 900 280"
              stroke="#dbeafe"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Ngôi sao trang trí (Blue Starbursts) */}
        <div className="absolute top-8 right-10 text-[#0052cc] animate-pulse pointer-events-none">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
        <div className="absolute top-40 left-8 text-[#1a73e8] opacity-80 pointer-events-none">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>

        {/* Tiêu đề & Phụ đề Hero bằng Tiếng Việt */}
        <div className="relative z-10 pt-2">
          <h2 className="text-xl xl:text-2xl font-bold text-slate-900 leading-snug tracking-tight max-w-lg">
            Bảo vệ Bản thân &amp; Gia đình Bạn —
            <br />
            <span className="text-[#0052cc]">Đặt lịch khám trực tuyến dễ dàng.</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 font-medium max-w-md">
            FamiDoc - Nền tảng quản lý bác sĩ gia đình và chăm sóc sức khỏe
          </p>
        </div>

        {/* Khung Bác sĩ & Các Badge Chỉ số Nổi: Tối Ưu Chiều Cao Khóa Khung */}
        <div className="relative mt-auto pt-4 z-10 flex flex-col items-center">
          <div className="w-full max-w-md relative rounded-[2rem] bg-gradient-to-b from-[#1a73e8] via-[#0052cc] to-[#003da6] overflow-hidden shadow-xl flex items-end justify-center pt-4 px-4 h-[280px] xl:h-[340px]">
            {/* Ảnh Bác sĩ */}
            <img
              src="/images/medsev/doctor/1.jpg"
              alt="FamiDoc Doctor"
              className="w-full h-[250px] xl:h-[300px] object-cover object-top rounded-t-2xl drop-shadow-2xl"
            />

            {/* Badge 1: 5.7 Triệu liều tiêm chủng */}
            <div className="absolute top-[45%] -left-1 xl:left-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-white/80 flex items-center gap-2 text-xs font-bold text-slate-800 transition-transform hover:scale-105">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052cc] flex items-center justify-center text-xs font-bold">
                💉
              </span>
              <span className="text-[11px] xl:text-xs">5.7 Triệu liều tiêm chủng</span>
            </div>

            {/* Badge 2: 98% Tỷ lệ phục hồi & hài lòng */}
            <div className="absolute bottom-4 right-1 xl:right-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-white/80 flex items-center gap-2 text-xs font-bold text-slate-800 transition-transform hover:scale-105">
              <span className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                ✓
              </span>
              <span className="text-[11px] xl:text-xs">98% tỷ lệ hài lòng &amp; phục hồi</span>
            </div>
          </div>
        </div>

        {/* Footer bản quyền nhỏ bên trái desktop */}
        <div className="pt-3 text-xs text-slate-400 font-medium">
          © 2026 FamiDoc - Family Doctor Management and Healthcare Platform
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CỘT PHẢI (LOGIN FORM): Vừa Vặn 1 Khung Toàn Bộ, Không Cần Lăn Chuột        */}
      {/* ========================================================================= */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 bg-white flex flex-col justify-center items-center p-5 sm:p-8 lg:p-8 xl:p-10 min-h-screen lg:min-h-0 lg:h-full lg:max-h-screen overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-[390px] mx-auto py-2">
          {/* Logo FamiDoc - Click quay về trang chủ */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 mb-5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc] rounded-lg"
            title="Quay về trang chủ FamiDoc"
          >
            <img
              src="/images/logo_khong_chu.png"
              alt="FamiDoc"
              className="h-8 w-auto object-contain drop-shadow-xs transition-transform group-hover:scale-105"
            />
            <span className="font-bold text-xl text-slate-900 tracking-tight group-hover:text-[#0052cc] transition-colors">
              FamiDoc
            </span>
          </Link>

          {/* Tiêu đề & Phụ đề Form */}
          <div className="mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Đăng nhập vào tài khoản của bạn
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              An toàn, bảo mật và nhanh chóng
            </p>
          </div>

          {/* Thông báo đăng ký thành công (nếu chuyển hướng từ /register) */}
          {isRegisteredSuccess && (
            <div
              role="status"
              className="mb-4 p-3 rounded-xl bg-[#f6ffed] border border-[#b7eb8f] text-[#03864b] text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-[#52c41a]">check_circle</span>
              <span>Đăng ký tài khoản đại diện thành công! Vui lòng đăng nhập để tiếp tục.</span>
            </div>
          )}

          {/* Form Đăng Nhập */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Trường Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email
              </label>
              <div
                className={`h-11 lg:h-10.5 flex items-center border rounded-xl bg-slate-50/50 focus-within:bg-white transition-all px-3 overflow-hidden ${
                  errors.email
                    ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                    : 'border-slate-200 focus-within:border-[#0052cc] focus-within:ring-2 focus-within:ring-[#0052cc]/15 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-slate-400 text-lg mr-2 select-none shrink-0">
                  mail
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@famidoc.vn"
                  className="w-full h-full bg-transparent text-base sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
              </div>
              {errors.email && (
                <p role="alert" className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[13px]">error</span>
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Trường Mật khẩu */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Mật khẩu
              </label>
              <div
                className={`h-11 lg:h-10.5 flex items-center border rounded-xl bg-slate-50/50 focus-within:bg-white transition-all px-3 overflow-hidden ${
                  errors.password
                    ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                    : 'border-slate-200 focus-within:border-[#0052cc] focus-within:ring-2 focus-within:ring-[#0052cc]/15 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-slate-400 text-lg mr-2 select-none shrink-0">
                  lock
                </span>
                <input
                  id="login-password"
                  name="password"
                  aria-label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-full bg-transparent text-base sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="h-full px-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[13px]">error</span>
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Ghi nhớ & Quên mật khẩu */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#0052cc] border-slate-300 focus:ring-[#0052cc]/30 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#0052cc] hover:text-[#003da6] hover:underline transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Nút Đăng Nhập Chính */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                aria-label="Đăng nhập hệ thống"
                className="w-full h-11 px-4 bg-[#0052cc] hover:bg-[#003da6] text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0052cc]/25 active:scale-[0.99] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-[17px]">
                      progress_activity
                    </span>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>
            </div>

            {/* Nút Đăng nhập với Google */}
            <div className="relative flex items-center justify-center py-1.5 my-0.5">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 px-2.5 text-[11px] text-slate-400 uppercase select-none font-medium">
                Hoặc
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <button
              type="button"
              className="w-full h-10 flex items-center justify-center gap-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-colors text-xs font-semibold shadow-xs cursor-pointer"
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

          {/* Footer nhỏ dẫn hướng */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="text-[#0052cc] hover:underline font-semibold"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
