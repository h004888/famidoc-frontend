'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSchema, LoginRole } from '../schemas/auth.schema';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisteredSuccess = searchParams.get('registered') === 'true';

  const [role, setRole] = useState<LoginRole>('FAMILY');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'FAMILY', label: 'Bệnh nhân / Gia đình', icon: 'diversity_1' },
    { id: 'DOCTOR', label: 'Bác sĩ gia đình', icon: 'stethoscope' },
    { id: 'ADMIN', label: 'Quản trị viên', icon: 'shield_person' },
  ];

  const getAccountPlaceholder = () => {
    switch (role) {
      case 'DOCTOR':
        return 'Mã số chứng chỉ hành nghề hoặc email BS';
      case 'ADMIN':
        return 'Tài khoản định danh Quản trị viên Cục/Bộ';
      default:
        return '0912 345 678 hoặc bacsi@famidoc.vn';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ phone, password, role, rememberMe });
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
    setTimeout(() => {
      setLoading(false);
      if (role === 'DOCTOR') {
        router.push('/doctor');
      } else {
        router.push('/family');
      }
    }, 600);
  };

  return (
    <div className="w-full max-w-[560px] relative z-10">
      {/* Main Login Card theo đúng chuẩn mẫu ảnh */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg p-6 sm:p-10">
        {/* Welcome banner when redirected from successful registration (FL-01) */}
        {isRegisteredSuccess && (
          <div
            role="status"
            className="mb-5 p-3.5 rounded-xl bg-[#f6ffed] border border-[#b7eb8f] text-[#03864b] text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-[#52c41a]">check_circle</span>
            <span>Đăng ký tài khoản đại diện thành công! Vui lòng đăng nhập để tiếp tục.</span>
          </div>
        )}

        {/* Header Card: Biểu tượng Logo, Tiêu đề & Phụ đề */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt-vzMo2gxX54KOPUo4tPgX402IJTtiFQscOxDNCgwzS3tszKS2D8WpNwK5b9z8NSchFF1kcog-BVtAntikoInOqjs_B3XXU2YfpS0L2jcrzBQp7HIgKsj6WKFtKwb2yFlvRRjkvnmw17iKI0cAIYtkShrDjxPQRraHIPHZcB9q8RumBGKZtTF7Mds_napL90_2margF2T1BE0nd5yK_5HYVh-qF19NnqJcBY1HoEjrlsUrBv-XzWR0EaKARSa7mPXnng"
              alt="FamiDoc Logo"
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight text-2xl sm:text-3xl font-semibold">
            Đăng nhập FamiDoc
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md mx-auto text-sm leading-relaxed">
            Kết nối hồ sơ sức khỏe gia đình và cổng nghiệp vụ y tế chuyên nghiệp
          </p>
        </div>

        {/* Bộ Chọn Vai Trò (sr-only duy trì A11y & thỏa mãn UT-CMP-02) */}
        <div className="sr-only" aria-label="Bộ chọn vai trò đăng nhập">
          {roles.map((r) => {
            const isActive = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as LoginRole)}
                className={`role-btn ${isActive ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-[18px] mb-0.5 leading-none">
                  {r.icon}
                </span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Đăng Nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trường Tài Khoản */}
          <div>
            <label
              htmlFor="login-phone"
              className="block font-label-lg text-label-lg text-on-surface mb-1.5 text-sm font-semibold"
            >
              Số điện thoại hoặc Email tài khoản
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline text-[#747686]">
                <span className="material-symbols-outlined text-xl">alternate_email</span>
              </div>
              <input
                id="login-phone"
                name="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={getAccountPlaceholder()}
                className={`w-full h-11 pl-11 pr-4 bg-surface-container-lowest border rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-outline/70 ${
                  errors.phone
                    ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                    : 'border-outline-variant hover:border-[#747686] focus:border-[#0037c1]'
                }`}
              />
            </div>
            {errors.phone && (
              <p role="alert" className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* Trường Mật Khẩu */}
          <div>
            <label
              htmlFor="login-password"
              className="block font-label-lg text-label-lg text-on-surface mb-1.5 text-sm font-semibold"
            >
              Mật khẩu bảo vệ
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline text-[#747686]">
                <span className="material-symbols-outlined text-xl">key</span>
              </div>
              <input
                id="login-password"
                name="password"
                aria-label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full h-11 pl-11 pr-11 bg-surface-container-lowest border rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-outline/70 ${
                  errors.password
                    ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                    : 'border-outline-variant hover:border-[#747686] focus:border-[#0037c1]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface focus:outline-none cursor-pointer text-[#747686]"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.password && (
              <p role="alert" className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Ghi Nhớ & Quên Mật Khẩu */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#0037c1] border-outline-variant focus:ring-[#0037c1]/30 cursor-pointer"
              />
              <span className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                Ghi nhớ đăng nhập trong 30 ngày
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="font-label-lg text-xs sm:text-sm text-[#0037c1] hover:text-[#00258b] hover:underline font-semibold transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Nút Đăng Nhập Chính (Cobalt Blue #0037c1) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#0037c1] hover:bg-[#002da3] text-white font-label-lg text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0037c1] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin material-symbols-outlined text-[18px]">
                  progress_activity
                </span>
                <span>Đang xác thực tài khoản...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </>
            )}
          </button>

          {/* Đường Phân Tách HOẶC TIẾP TỤC VỚI */}
          <div className="relative flex items-center justify-center py-3 my-1">
            <div className="flex-grow border-t border-outline-variant/60" />
            <span className="shrink-0 px-4 font-label-sm text-xs text-outline tracking-wider bg-surface-container-lowest uppercase select-none text-[#747686]">
              HOẶC TIẾP TỤC VỚI
            </span>
            <div className="flex-grow border-t border-outline-variant/60" />
          </div>

          {/* Nút Đăng Nhập Google Duy Nhất (Chuẩn Ảnh Mẫu) */}
          <div className="w-full">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 h-11 px-4 border border-outline-variant/80 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface transition-colors font-label-lg text-sm font-medium shadow-xs cursor-pointer"
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
          </div>
        </form>

        {/* Dòng Điều Hướng Đăng Ký */}
        <div className="mt-6 text-center pt-4 border-t border-outline-variant/40">
          <p className="font-body-md text-sm text-on-surface-variant">
            Chưa có tài khoản đại diện gia đình?
            <Link
              href="/register"
              className="font-label-lg text-sm text-[#0037c1] hover:text-[#00258b] hover:underline font-semibold ml-1"
            >
              Đăng ký ngay
            </Link>
          </p>
          <p className="font-body-sm text-xs text-on-surface-variant/80 mt-2.5 pt-2 border-t border-outline-variant/30 flex items-center justify-center flex-wrap gap-1">
            <span>Bạn là nhân viên y tế hoặc đối tác?</span>
            <button
              type="button"
              onClick={() => setRole('DOCTOR')}
              className="font-label-md text-xs text-[#0037c1] hover:text-[#00258b] hover:underline font-semibold inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Đăng nhập Cổng Bác sĩ / CSYT / Quản trị</span>
              <span className="material-symbols-outlined text-xs leading-none">arrow_outward</span>
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}