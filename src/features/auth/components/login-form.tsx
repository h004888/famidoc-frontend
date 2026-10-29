'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginSchema, LoginRole } from '../schemas/auth.schema';
import { useAuth } from '../context/auth-context';

export function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const isRegisteredSuccess = searchParams.get('registered') === 'true';

  const [role, setRole] = useState<LoginRole>('FAMILY');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [demoSelectedText, setDemoSelectedText] = useState<string>('Hộ Gia đình (Chủ hộ)');

  const roles = [
    { id: 'FAMILY', label: 'Bệnh nhân / Gia đình', icon: 'diversity_1', defaultPhone: '0912345678', target: '/family' },
    { id: 'DOCTOR', label: 'Bác sĩ gia đình', icon: 'stethoscope', defaultPhone: '0988123789', target: '/doctor' },
    { id: 'FACILITY', label: 'Cơ sở y tế / Bệnh viện', icon: 'local_hospital', defaultPhone: '0903888777', target: '/facility' },
    { id: 'ADMIN', label: 'Quản trị viên', icon: 'shield_person', defaultPhone: '0901888999', target: '/admin' },
  ];

  const handleSelectRole = (selectedRoleId: LoginRole) => {
    setRole(selectedRoleId);
    setErrors({});
    const matched = roles.find((r) => r.id === selectedRoleId);
    if (matched) {
      setPhone(matched.defaultPhone);
      setPassword('Password123');
      setDemoSelectedText(matched.label);
    }
  };

  const getAccountPlaceholder = () => {
    switch (role) {
      case 'DOCTOR':
        return '0988 123 789 (Bác sĩ CCHN)';
      case 'FACILITY':
        return '0903 888 777 (Đại diện Bệnh viện)';
      case 'ADMIN':
        return '0901 888 999 (Super Admin)';
      default:
        return '0912 345 678 (Chủ hộ gia đình)';
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
    try {
      await login(role, phone, password);
    } catch {
      setLoading(false);
    }
    setTimeout(() => {
      setLoading(false);
    }, 2500);
  };

  return (
    <div className="w-full max-w-[560px] relative z-10">
      {/* Main Login Card */}
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
              src="/images/FamiDoc Healthcare Logo.png"
              alt="FamiDoc Logo"
              className="h-16 w-auto object-contain drop-shadow-xs"
            />
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight text-2xl sm:text-3xl font-semibold">
            Đăng nhập FamiDoc
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md mx-auto text-sm leading-relaxed" suppressHydrationWarning>
            Kết nối hồ sơ sức khỏe gia đình và cổng nghiệp vụ y tế chuyên nghiệp
          </p>
        </div>

        {/* Bảng chọn Vai trò & Tự động điền tài khoản mẫu */}
        <div className="mb-6" aria-label="Bộ chọn vai trò đăng nhập">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Chọn vai trò đăng nhập (Tự động điền tài khoản mẫu):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {roles.map((r) => {
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRole(r.id as LoginRole)}
                  className={`role-btn p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {r.icon}
                  </span>
                  <span className="leading-tight text-[11px] font-bold line-clamp-1">{r.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{r.target}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between" suppressHydrationWarning>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 text-[16px]">info</span>
              <span>Đang chọn: <strong>{demoSelectedText}</strong></span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">Mật khẩu: Password123</span>
          </div>
        </div>

        {/* Form Đăng Nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trường Tài Khoản */}
          <div>
            <label
              htmlFor="login-phone"
              className="block font-label-lg text-label-lg text-on-surface mb-1.5 text-sm font-semibold"
            >
              2. Số điện thoại đăng nhập
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline text-[#747686]">
                <span className="material-symbols-outlined text-xl">phone_iphone</span>
              </div>
              <input
                id="login-phone"
                name="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={getAccountPlaceholder()}
                className={`w-full h-11 pl-11 pr-4 bg-surface-container-lowest border rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all font-mono placeholder:text-outline/70 ${
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
                Ghi nhớ đăng nhập
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="font-label-lg text-xs sm:text-sm text-[#0037c1] hover:text-[#00258b] hover:underline font-semibold transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Nút Đăng Nhập Chính */}
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
                <span>Đang kết nối phân hệ {role}...</span>
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

          {/* Nút Đăng Nhập Google Duy Nhất */}
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
        </div>
      </div>
    </div>
  );
}