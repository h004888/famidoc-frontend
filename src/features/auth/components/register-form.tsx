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
    email: '',
    phone: '',
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

  // Tính toán độ mạnh mật khẩu real-time
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
    'text-[#0052cc]',
    'text-[#16a34a]',
  ];
  const barColors = [
    'bg-[#ba1a1a]',
    'bg-[#ba1a1a]',
    'bg-[#fe8f1a]',
    'bg-[#0052cc]',
    'bg-[#16a34a]',
  ];

  const strengthText = pass.length === 0 ? 'Chưa nhập mật khẩu' : strengthLabels[strengthCount] || 'Chưa đủ an toàn';
  const activeColor = pass.length === 0 ? 'text-slate-400' : strengthColors[strengthCount] || 'text-[#ba1a1a]';
  const activeBarBg = barColors[strengthCount] || 'bg-[#16a34a]';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Real-time onBlur field validation
  const handleBlur = (field: keyof typeof formData) => {
    if (field === 'email' && !formData.email) {
      setErrors((prev) => ({ ...prev, email: 'Vui lòng nhập địa chỉ email đăng nhập' }));
      return;
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: 'Vui lòng nhập địa chỉ email đăng nhập' }));
      return;
    }

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
    try {
      const response = await fetch('/api/v1/auth/register-representative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          acceptTerms: formData.acceptTerms,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setErrors({ global: errData.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.' });
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch {
      setLoading(false);
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    }
  };

  return (
    <div className="w-full min-h-screen lg:min-h-0 lg:h-screen lg:max-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden lg:overflow-hidden">
      {/* ========================================================================= */}
      {/* CỘT TRÁI (HERO SECTION): Tràn Viền Full Desktop Khóa Khung, Ẩn Trên Mobile */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-[#f4f8fe] relative p-6 xl:p-8 flex-col justify-between overflow-hidden border-r border-slate-200/80 h-full max-h-screen">
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

        {/* Tiêu đề & Phụ đề Hero Tiếng Việt */}
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

        {/* Footer bản quyền */}
        <div className="pt-4 text-xs text-slate-400 font-medium">
          © 2026 FamiDoc - Family Doctor Management and Healthcare Platform
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CỘT PHẢI (REGISTER FORM): Tối Ưu Lưới 2 Cột Khóa Khung Viewport Desktop   */}
      {/* ========================================================================= */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-7 bg-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-6 xl:p-8 min-h-screen lg:min-h-0 lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-[560px] mx-auto py-1 sm:py-2">
          {/* Logo FamiDoc đồng bộ - Click quay về trang chủ */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 mb-2.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc] rounded-lg"
            title="Quay về trang chủ FamiDoc"
          >
            <img
              src="/images/logo_khong_chu.png"
              alt="FamiDoc Logo"
              className="h-8 w-auto object-contain drop-shadow-xs transition-transform group-hover:scale-105"
            />
            <span className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight group-hover:text-[#0052cc] transition-colors">
              FamiDoc
            </span>
          </Link>

          {/* Tiêu đề & Phụ đề Đăng ký */}
          <div className="mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Đăng ký tài khoản đại diện gia đình
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý y tế gia đình thông minh, kết nối bác sĩ riêng và bảo vệ sức khỏe trọn đời
            </p>
          </div>

          {/* Gói đăng ký đính kèm (nếu có từ URL ?packageId=...) */}
          {preselectedPackage && (
            <div className="mb-3 py-1.5 px-3 rounded-xl bg-[#f2f3ff] text-[#0052cc] text-xs font-semibold flex items-center justify-between border border-[#eaedff]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#52c41a]">verified</span>
                <span>
                  Đang đăng ký cho gói: <strong className="uppercase">{preselectedPackage}</strong>
                </span>
              </div>
              <Link href="/packages" className="text-xs text-[#0052cc] underline hover:text-[#00258b]">
                Đổi gói
              </Link>
            </div>
          )}

          {/* Form Thông Tin Chi Tiết - Bố Cục Lưới 2 Cột Chuẩn UX Khóa Khung Viewport Desktop, Single-Column Mobile */}
          <form onSubmit={handleSubmit} className="space-y-2.5 xl:space-y-3">
            {/* Hàng 1: Họ và tên người đại diện (Full Width) */}
            <div>
              <label
                htmlFor="register-fullname"
                className="text-xs font-semibold text-slate-700 mb-1 h-5 flex items-center"
              >
                Họ và tên người đại diện <span className="text-[#ba1a1a] ml-0.5">*</span>
              </label>
              <div
                className={`h-11 lg:h-10.5 flex items-center border rounded-xl bg-slate-50/50 focus-within:bg-white transition-all px-3 overflow-hidden ${
                  errors.fullName
                    ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                    : 'border-slate-200 focus-within:border-[#0052cc] focus-within:ring-2 focus-within:ring-[#0052cc]/15 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-slate-400 text-lg mr-2 select-none shrink-0">
                  person
                </span>
                <input
                  id="register-fullname"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                  className="w-full h-full bg-transparent text-base sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
              </div>
              {errors.fullName && (
                <p role="alert" className="text-xs text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">error</span>
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Hàng 2: Lưới 2 Cột Desktop / 1 Cột Mobile [Email Đăng Nhập] & [Số Điện Thoại Liên Hệ] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 xl:gap-3 items-start">
              {/* Cột 1: Email (Tài khoản đăng nhập) */}
              <div>
                <label
                  htmlFor="register-email"
                  className="text-xs font-semibold text-slate-700 mb-1 h-5 flex items-center truncate"
                >
                  Email đăng nhập <span className="text-[#ba1a1a] ml-0.5">*</span>
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
                    id="register-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    placeholder="example@famidoc.vn"
                    required
                    className="w-full h-full bg-transparent text-base sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                {errors.email && (
                  <p role="alert" className="text-xs text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Cột 2: Số điện thoại liên hệ (Xác thực OTP) */}
              <div>
                <label
                  htmlFor="register-phone"
                  className="text-xs font-semibold text-slate-700 mb-1 h-5 flex items-center truncate"
                >
                  Số điện thoại liên hệ <span className="text-[#ba1a1a] ml-0.5">*</span>
                </label>
                <div
                  className={`h-11 lg:h-10.5 flex items-center border rounded-xl bg-slate-50/50 focus-within:bg-white transition-all overflow-hidden ${
                    errors.phone
                      ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                      : 'border-slate-200 focus-within:border-[#0052cc] focus-within:ring-2 focus-within:ring-[#0052cc]/15 hover:border-slate-300'
                  }`}
                >
                  <div className="h-full px-2.5 flex items-center border-r border-slate-200 text-xs font-semibold text-slate-700 bg-slate-100/60 select-none shrink-0">
                    🇻🇳 +84
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
                    className="w-full h-full px-2.5 bg-transparent text-base sm:text-sm text-slate-900 tabular-nums focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                {errors.phone && (
                  <p role="alert" className="text-xs text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Hàng 3: Lưới 2 Cột Desktop / 1 Cột Mobile [Mật khẩu mới] & [Xác nhận mật khẩu] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 xl:gap-3 items-start">
              {/* Cột 1: Mật khẩu mới */}
              <div>
                <label
                  htmlFor="register-password"
                  className="text-xs font-semibold text-slate-700 mb-1 h-5 flex items-center truncate"
                >
                  Mật khẩu mới <span className="text-[#ba1a1a] ml-0.5">*</span>
                </label>
                <div
                  className={`h-11 lg:h-10.5 flex items-center border rounded-xl bg-slate-50/50 focus-within:bg-white transition-all px-3 overflow-hidden ${
                    errors.password
                      ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                      : 'border-slate-200 focus-within:border-[#0052cc] focus-within:ring-2 focus-within:ring-[#0052cc]/15 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg mr-1.5 select-none shrink-0">
                    lock
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    className="w-full h-full bg-transparent text-base sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password"
                    className="h-full px-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p role="alert" className="text-xs text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Cột 2: Xác nhận mật khẩu */}
              <div>
                <label
                  htmlFor="register-confirmpassword"
                  className="text-xs font-semibold text-slate-700 mb-1 h-5 flex items-center truncate"
                >
                  Xác nhận mật khẩu <span className="text-[#ba1a1a] ml-0.5">*</span>
                </label>
                <div
                  className={`h-11 lg:h-10.5 flex items-center border rounded-xl bg-slate-50/50 focus-within:bg-white transition-all px-3 overflow-hidden ${
                    errors.confirmPassword
                      ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                      : 'border-slate-200 focus-within:border-[#0052cc] focus-within:ring-2 focus-within:ring-[#0052cc]/15 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg mr-1.5 select-none shrink-0">
                    verified
                  </span>
                  <input
                    id="register-confirmpassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full h-full bg-transparent text-base sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label="Toggle confirm password"
                    className="h-full px-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p role="alert" className="text-xs text-[#ba1a1a] font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Hàng 4: Thanh đo độ an toàn mật khẩu (Compact) */}
            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Độ an toàn mật khẩu:</span>
                <span className={`font-semibold flex items-center gap-1 ${activeColor}`}>
                  <span className="material-symbols-outlined text-xs">
                    {strengthCount >= 3 ? 'verified_user' : 'shield'}
                  </span>
                  <span>{strengthText}</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1">
                <div
                  className={`rounded-full transition-all duration-300 ${
                    strengthCount >= 1 ? activeBarBg : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`rounded-full transition-all duration-300 ${
                    strengthCount >= 2 ? activeBarBg : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`rounded-full transition-all duration-300 ${
                    strengthCount >= 3 ? activeBarBg : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`rounded-full transition-all duration-300 ${
                    strengthCount >= 4 ? activeBarBg : 'bg-slate-200'
                  }`}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 mt-1 text-[11px]">
                <span className={`flex items-center gap-0.5 ${hasMinLength ? 'text-[#16a34a] font-semibold' : 'text-slate-400'}`}>
                  {hasMinLength ? '✓' : '○'} 8+ ký tự
                </span>
                <span className={`flex items-center gap-0.5 ${hasUpperLower ? 'text-[#16a34a] font-semibold' : 'text-slate-400'}`}>
                  {hasUpperLower ? '✓' : '○'} Chữ hoa &amp; thường
                </span>
                <span className={`flex items-center gap-0.5 ${hasDigit ? 'text-[#16a34a] font-semibold' : 'text-slate-400'}`}>
                  {hasDigit ? '✓' : '○'} Chữ số
                </span>
                <span className={`flex items-center gap-0.5 ${hasSpecial ? 'text-[#16a34a] font-semibold' : 'text-slate-400'}`}>
                  {hasSpecial ? '✓' : '○'} Ký tự đặc biệt
                </span>
              </div>
            </div>

            {/* Hàng 5: Điều khoản & Cam kết (Gọn gàng) */}
            <div className="space-y-1.5 pt-0.5">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-3.5 h-3.5 rounded text-[#0052cc] border-slate-300 focus:ring-[#0052cc]/20 cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                  Tôi đồng ý với{' '}
                  <Link href="/#bao-mat" className="text-[#0052cc] font-semibold hover:underline">
                    Chính sách bảo mật y tế
                  </Link>{' '}
                  &amp; Điều khoản dịch vụ Khám bệnh từ xa.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="acceptNotifications"
                  checked={formData.acceptNotifications}
                  onChange={handleChange}
                  className="mt-0.5 w-3.5 h-3.5 rounded text-[#0052cc] border-slate-300 focus:ring-[#0052cc]/20 cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                  Ủy quyền tiếp nhận thông báo lịch tiêm chủng, cập nhật dịch tễ và nhắc lịch tái khám tự động.
                </span>
              </label>

              {errors.acceptTerms && (
                <p role="alert" className="text-xs text-[#ba1a1a] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">error</span>
                  <span>{errors.acceptTerms}</span>
                </p>
              )}
            </div>

            {/* Hàng 6: Nút Đăng Ký Chính */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0052cc] hover:bg-[#003da6] text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0052cc]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-[18px]">
                      progress_activity
                    </span>
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <span>Đăng ký tài khoản FamiDoc</span>
                )}
              </button>
            </div>

            {/* Hàng 7: Cam kết bảo mật & Điều hướng Đăng nhập */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="material-symbols-outlined text-[#16a34a] text-sm leading-none">
                  verified_user
                </span>
                <span>Bảo mật theo Nghị định 13/2023/NĐ-CP</span>
              </span>

              <span>
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-[#0052cc] font-semibold hover:underline">
                  Đăng nhập ngay
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
