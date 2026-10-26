'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerFamilySchema } from '../schemas/auth.schema';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPackage = searchParams.get('packageId');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    identityCard: '',
    relationship: 'Chủ hộ',
    password: '',
    confirmPassword: '',
    acceptTerms: true,
    acceptNotifications: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Compute real-time password strength
  const pass = formData.password;
  const hasMinLength = pass.length >= 8;
  const hasUpperLower = /[A-Z]/.test(pass) && /[a-z]/.test(pass);
  const hasDigit = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  const strengthCount = [hasMinLength, hasUpperLower, hasDigit, hasSpecial].filter(Boolean).length;
  const strengthLabels = [
    'Chưa đủ an toàn',
    'Mức độ cơ bản',
    'Mức độ trung bình',
    'Mức độ tốt',
    'Mức độ an toàn cao (Khuyến nghị)',
  ];
  const strengthColors = [
    'text-[#ba1a1a]',
    'text-[#ba1a1a]',
    'text-[#fe8f1a]',
    'text-[#0037c1]',
    'text-[#16a34a]',
  ];
  const barColors = [
    'bg-[#ba1a1a]',
    'bg-[#ba1a1a]',
    'bg-[#fe8f1a]',
    'bg-[#0037c1]',
    'bg-[#16a34a]',
  ];

  const strengthText = pass.length === 0 ? 'Chưa nhập mật khẩu' : strengthLabels[strengthCount] || 'Chưa đủ an toàn';
  const activeColor = pass.length === 0 ? 'text-[#747686]' : strengthColors[strengthCount] || 'text-[#ba1a1a]';
  const activeBarBg = barColors[strengthCount] || 'bg-[#16a34a]';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // M-03: Real-time onBlur field validation
  const handleBlur = (field: keyof typeof formData) => {
    const partialData = { ...formData };
    const result = registerFamilySchema.safeParse(partialData);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      if (issue) {
        setErrors((prev) => ({ ...prev, [field]: issue.message }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = registerFamilySchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || 'global';
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/login?registered=true');
    }, 800);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-auto py-1 sm:py-2">
      {/* Main Registration Bento Box Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#c4c5d7]/80 shadow-[0_12px_40px_-12px_rgba(0,37,193,0.08)] overflow-hidden transition-all duration-200">
        {/* Subtle Top Brand Highlight Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00258b] via-[#0037c1] to-[#2c51d7]" />

        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-3.5">
          {/* Header Title inside Card */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#eaedff] text-[#0037c1] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-0.5">
              <span className="material-symbols-outlined text-[13px] leading-none text-[#0037c1]">
                health_and_safety
              </span>
              <span>Đại diện Hộ Gia Đình FamiDoc</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-[#131b2f] tracking-tight">
              Đăng ký Tài khoản Đại diện Gia đình
            </h1>
            <p className="text-[11px] sm:text-xs text-[#444654] max-w-lg mx-auto leading-relaxed">
              Quản lý y tế thông minh, kết nối bác sĩ riêng và bảo vệ sức khỏe trọn đời cho cả gia đình.
            </p>
          </div>

          {/* Preselected Package Badge if present */}
          {preselectedPackage && (
            <div className="py-1.5 px-3 rounded-xl bg-[#f2f3ff] text-[#0037c1] text-[11px] font-semibold flex items-center justify-between border border-[#eaedff]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#52c41a]">verified</span>
                <span>
                  Đang đăng ký cho gói: <strong className="uppercase">{preselectedPackage}</strong>
                </span>
              </div>
              <Link href="/packages" className="text-[10px] underline hover:text-[#00258b]">
                Đổi gói
              </Link>
            </div>
          )}

          {/* Identity Quick Connect: 2 tactile buttons */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Google Auth Button */}
              <button
                type="button"
                className="w-full h-9 sm:h-10 px-2.5 flex items-center justify-center gap-2 rounded-xl border border-[#c4c5d7] bg-white hover:bg-[#f2f3ff] hover:border-[#0037c1]/40 text-[#131b2f] text-[11px] sm:text-xs font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer"
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
                <span>Đăng ký bằng Google</span>
              </button>

              {/* VNeID Government ID Button */}
              <button
                type="button"
                className="w-full h-9 sm:h-10 px-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-gradient-to-r from-red-50/90 via-red-50/50 to-amber-50/60 hover:from-red-100/90 hover:to-amber-100/70 hover:border-red-400 text-red-950 text-[11px] sm:text-xs font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-red-600 text-lg leading-none shrink-0">
                  fingerprint
                </span>
                <span className="truncate">VNeID Đề án 06</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Định danh cấp 2" />
              </button>
            </div>

            {/* Hairline Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#c4c5d7]/60" />
              <span className="flex-shrink mx-3 text-[10px] text-[#747686] font-bold uppercase tracking-wider">
                HOẶC ĐĂNG KÝ BẰNG THÔNG TIN Y TẾ
              </span>
              <div className="flex-grow border-t border-[#c4c5d7]/60" />
            </div>
          </div>

          {/* Registration Form: 3 compact rows on Desktop */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Row 1: Họ tên + Số CCCD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="register-fullname"
                  className="block text-[11px] font-bold text-[#131b2f] mb-1 tracking-tight"
                >
                  Họ và tên người đại diện <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#747686] group-focus-within:text-[#0037c1] transition-colors">
                    <span className="material-symbols-outlined text-[17px]">person</span>
                  </div>
                  <input
                    id="register-fullname"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    required
                    className={`w-full h-9 sm:h-10 pl-8 pr-2.5 rounded-xl border text-xs bg-white text-[#131b2f] focus:outline-none focus:ring-2 focus:ring-[#0037c1]/20 transition-all placeholder:text-[#747686] ${
                      errors.fullName
                        ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                        : 'border-[#c4c5d7] hover:border-[#747686] focus:border-[#0037c1]'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p role="alert" className="text-[10px] text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs leading-none">error</span>
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-cccd"
                  className="block text-[11px] font-bold text-[#131b2f] mb-1 tracking-tight"
                >
                  Số CCCD (12 chữ số) <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#747686] group-focus-within:text-[#0037c1] transition-colors">
                    <span className="material-symbols-outlined text-[17px]">badge</span>
                  </div>
                  <input
                    id="register-cccd"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    name="identityCard"
                    value={formData.identityCard}
                    onChange={handleChange}
                    onBlur={() => handleBlur('identityCard')}
                    placeholder="001099012345"
                    required
                    className={`w-full h-9 sm:h-10 pl-8 pr-2.5 rounded-xl border text-xs font-mono tabular-nums bg-white text-[#131b2f] focus:outline-none focus:ring-2 focus:ring-[#0037c1]/20 transition-all placeholder:text-[#747686] ${
                      errors.identityCard
                        ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                        : 'border-[#c4c5d7] hover:border-[#747686] focus:border-[#0037c1]'
                    }`}
                  />
                </div>
                {errors.identityCard && (
                  <p role="alert" className="text-[10px] text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs leading-none">error</span>
                    <span>{errors.identityCard}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Số điện thoại + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="register-phone"
                  className="block text-[11px] font-bold text-[#131b2f] mb-1 tracking-tight"
                >
                  Số điện thoại liên hệ <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative flex group">
                  <div className="inline-flex items-center gap-1 px-2.5 rounded-l-xl border border-r-0 border-[#c4c5d7] bg-[#f2f3ff] text-[#131b2f] text-[11px] font-bold shrink-0">
                    <span>🇻🇳 +84</span>
                  </div>
                  <input
                    id="register-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phone')}
                    placeholder="0912 345 678"
                    required
                    className={`w-full h-9 sm:h-10 pl-2.5 pr-2.5 rounded-r-xl border text-xs font-mono tabular-nums bg-white text-[#131b2f] focus:outline-none focus:ring-2 focus:ring-[#0037c1]/20 transition-all placeholder:text-[#747686] ${
                      errors.phone
                        ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                        : 'border-[#c4c5d7] hover:border-[#747686] focus:border-[#0037c1]'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p role="alert" className="text-[10px] text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs leading-none">error</span>
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="block text-[11px] font-bold text-[#131b2f] mb-1 tracking-tight"
                >
                  Email nhận thông báo y tế
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#747686] group-focus-within:text-[#0037c1] transition-colors">
                    <span className="material-symbols-outlined text-[17px]">mail</span>
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    placeholder="nguyenvanan@example.vn"
                    className="w-full h-9 sm:h-10 pl-8 pr-2.5 rounded-xl border border-[#c4c5d7] hover:border-[#747686] text-xs bg-white text-[#131b2f] focus:outline-none focus:border-[#0037c1] focus:ring-2 focus:ring-[#0037c1]/20 transition-all placeholder:text-[#747686]"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Mật khẩu + Xác nhận mật khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-[11px] font-bold text-[#131b2f] mb-1 tracking-tight"
                >
                  Mật khẩu *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#747686] group-focus-within:text-[#0037c1] transition-colors">
                    <span className="material-symbols-outlined text-[17px]">lock</span>
                  </div>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    className={`w-full h-9 sm:h-10 pl-8 pr-8 rounded-xl border text-xs bg-white text-[#131b2f] focus:outline-none focus:ring-2 focus:ring-[#0037c1]/20 transition-all placeholder:text-[#747686] ${
                      errors.password
                        ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                        : 'border-[#c4c5d7] hover:border-[#747686] focus:border-[#0037c1]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password"
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#747686] hover:text-[#131b2f] focus:outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p role="alert" className="text-[10px] text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs leading-none">error</span>
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-confirmpassword"
                  className="block text-[11px] font-bold text-[#131b2f] mb-1 tracking-tight"
                >
                  Xác nhận mật khẩu *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#747686] group-focus-within:text-[#0037c1] transition-colors">
                    <span className="material-symbols-outlined text-[17px]">verified</span>
                  </div>
                  <input
                    id="register-confirmpassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className={`w-full h-9 sm:h-10 pl-8 pr-8 rounded-xl border text-xs bg-white text-[#131b2f] focus:outline-none focus:ring-2 focus:ring-[#0037c1]/20 transition-all placeholder:text-[#747686] ${
                      errors.confirmPassword
                        ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                        : 'border-[#c4c5d7] hover:border-[#747686] focus:border-[#0037c1]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label="Toggle confirm password"
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#747686] hover:text-[#131b2f] focus:outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p role="alert" className="text-[10px] text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs leading-none">error</span>
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Tactile Dynamic Password Strength Indicator */}
            <div className="bg-[#f2f3ff] px-3 py-2 rounded-xl border border-[#eaedff]">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[#444654] font-medium">Độ mạnh mật khẩu y tế:</span>
                <span className={`font-semibold flex items-center gap-1 ${activeColor}`}>
                  <span className="material-symbols-outlined text-xs leading-none">
                    {strengthCount >= 3 ? 'verified_user' : 'shield'}
                  </span>
                  <span>{strengthText}</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1">
                <div
                  className={`rounded-full transition-all duration-300 ${
                    strengthCount >= 1 ? activeBarBg : 'bg-[#c4c5d7]/50'
                  }`}
                />
                <div
                  className={`rounded-full transition-all duration-300 ${
                    strengthCount >= 2 ? activeBarBg : 'bg-[#c4c5d7]/50'
                  }`}
                />
                <div
                  className={`rounded-full transition-all duration-300 ${
                    strengthCount >= 3 ? activeBarBg : 'bg-[#c4c5d7]/50'
                  }`}
                />
                <div
                  className={`rounded-full transition-all duration-300 ${
                    strengthCount >= 4 ? activeBarBg : 'bg-[#c4c5d7]/50'
                  }`}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 mt-1.5 text-[10px]">
                <span className={`flex items-center gap-0.5 ${hasMinLength ? 'text-[#16a34a] font-bold' : 'text-[#747686]'}`}>
                  {hasMinLength ? '✓' : '○'} 8+ ký tự
                </span>
                <span className={`flex items-center gap-0.5 ${hasUpperLower ? 'text-[#16a34a] font-bold' : 'text-[#747686]'}`}>
                  {hasUpperLower ? '✓' : '○'} Chữ hoa &amp; thường
                </span>
                <span className={`flex items-center gap-0.5 ${hasDigit ? 'text-[#16a34a] font-bold' : 'text-[#747686]'}`}>
                  {hasDigit ? '✓' : '○'} Chữ số (0-9)
                </span>
                <span className={`flex items-center gap-0.5 ${hasSpecial ? 'text-[#16a34a] font-bold' : 'text-[#747686]'}`}>
                  {hasSpecial ? '✓' : '○'} Ký tự đặc biệt
                </span>
              </div>
            </div>

            {/* Checkbox Terms: Compact & Clean */}
            <div className="space-y-1.5 pt-0.5">
              <label className="flex items-start gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-3.5 h-3.5 rounded text-[#0037c1] border-[#c4c5d7] focus:ring-[#0037c1]/20 cursor-pointer"
                />
                <span className="text-[11px] text-[#444654] leading-snug group-hover:text-[#131b2f] transition-colors">
                  Tôi đồng ý với{' '}
                  <Link href="/#bao-mat" className="text-[#0037c1] font-semibold hover:underline">
                    Chính sách bảo mật y tế
                  </Link>{' '}
                  &amp; Điều khoản dịch vụ Khám bệnh từ xa (Telehealth).
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  name="acceptNotifications"
                  checked={formData.acceptNotifications}
                  onChange={handleChange}
                  className="mt-0.5 w-3.5 h-3.5 rounded text-[#0037c1] border-[#c4c5d7] focus:ring-[#0037c1]/20 cursor-pointer"
                />
                <span className="text-[11px] text-[#444654] leading-snug group-hover:text-[#131b2f] transition-colors">
                  Ủy quyền tiếp nhận thông báo lịch tiêm chủng, cập nhật dịch tễ và nhắc lịch tái khám tự động.
                </span>
              </label>

              {errors.acceptTerms && (
                <p role="alert" className="text-[10px] text-[#ba1a1a] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs leading-none">error</span>
                  <span>{errors.acceptTerms}</span>
                </p>
              )}
            </div>

            {/* Primary Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 sm:h-11 bg-gradient-to-r from-[#00258b] via-[#0037c1] to-[#1554e8] hover:from-[#001d6d] hover:to-[#00258b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-[17px] leading-none">
                      progress_activity
                    </span>
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng ký tài khoản FamiDoc</span>
                    <span className="material-symbols-outlined text-[18px] leading-none transition-transform group-hover:translate-x-1">
                      how_to_reg
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Decree 13/2023 Security Notice & Login Link */}
            <div className="pt-1.5 border-t border-[#c4c5d7]/50 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-[#747686]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#16a34a] text-sm leading-none">
                  verified_user
                </span>
                <span>Bảo mật theo Nghị định 13/2023/NĐ-CP</span>
              </span>

              <span>
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-[#0037c1] font-bold hover:underline">
                  Đăng nhập
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
