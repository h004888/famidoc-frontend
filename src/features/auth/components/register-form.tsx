'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerFamilySchema } from '../schemas/auth.schema';
import { useAuth } from '../context/auth-context';
import { authApi, mapRegistrationErrorToFields } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/http/errors';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPackage = searchParams.get('packageId');
  const preselectedDoctor = searchParams.get('doctorId');
  const { isAuthenticated, role, getDefaultPathForRole } = useAuth();

  // Khi đã đăng nhập, tự động chuyển thẳng sang phân hệ phù hợp thay vì đăng ký lại
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'FAMILY' || role === 'PATIENT') {
        const target = preselectedDoctor
          ? `/family/subscription/new?doctorId=${encodeURIComponent(preselectedDoctor)}${preselectedPackage ? `&packageId=${encodeURIComponent(preselectedPackage)}` : ''}`
          : preselectedPackage
            ? `/family/subscription/new?packageId=${encodeURIComponent(preselectedPackage)}`
            : '/family/subscription';
        router.replace(target);
      } else {
        router.replace(getDefaultPathForRole(role));
      }
    }
  }, [isAuthenticated, role, preselectedPackage, preselectedDoctor, router, getDefaultPathForRole]);

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


  const strengthText = pass.length === 0 ? 'Chưa nhập mật khẩu' : strengthLabels[strengthCount] || 'Chưa đủ an toàn';
  const strengthScore = pass.length === 0 ? 0 : strengthCount;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Xóa lỗi của trường tương ứng khi người dùng gõ lại (cải thiện UX sau API 409 error)
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof typeof prev];
        return next;
      });
    }
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
      const result = await authApi.registerRepresentative({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
      });

      setLoading(false);
      // Lưu OTP metadata để VerifyEmailOtpView đọc từ sessionStorage
      sessionStorage.setItem(
        'famidoc_pending_otp_meta',
        JSON.stringify(result)
      );
      router.push(`/verify-otp?email=${encodeURIComponent(result.email)}`);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        const fieldErrors = mapRegistrationErrorToFields(err);
        setErrors(fieldErrors);
      } else {
        setErrors({ global: 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.' });
      }
    }
  };

  return (
    <div
      className="text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-700 min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 py-6 sm:py-8 lg:py-8 relative overflow-x-hidden"
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
      {/* MAIN REGISTRATION SCREEN CONTAINER                                        */}
      {/* ========================================================================= */}
      <main
        className="w-full max-w-[1360px] py-1 sm:py-3 lg:py-0 mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-4 lg:gap-6 xl:gap-8 relative z-20"
        data-purpose="registration-screen"
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BRAND PRESENTATION & HERO IMAGERY                            */}
        {/* ========================================================================= */}
        <section
          className="hidden lg:flex lg:col-span-6 xl:col-span-6 flex-col justify-between h-full relative"
          data-purpose="brand-showcase"
        >
          <div className="pt-1 lg:pt-2 xl:pt-4 pl-2 lg:pl-4 xl:pl-6 pr-2">
            {/* Brand Logo Header: Logo FamiDoc chính thức của dự án */}
            <Link
              href="/"
              className="inline-block mb-3 sm:mb-4 focus:outline-none rounded-xl group"
              data-purpose="main-logo"
            >
              <img
                src="/images/logo.png"
                alt="FamiDoc Logo"
                className="h-8 xl:h-9 w-auto object-contain drop-shadow-xs transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Main Headline & Subtitle */}
            <div className="max-w-xl mb-4 sm:mb-5" data-purpose="hero-copy">
              <h2 className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Bảo vệ bản thân &amp; gia đình bạn —
                <span className="block text-blue-600 mt-1 font-bold">Đặt lịch khám trực tuyến dễ dàng.</span>
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm lg:text-sm xl:text-base mt-2 font-normal leading-relaxed">
                FamiDoc – Nền tảng quản lý bác sĩ gia đình và chăm sóc sức khỏe toàn diện.
              </p>
            </div>

            {/* 3 Feature Highlight Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mb-2 relative z-30" data-purpose="feature-cards">
              {/* Feature 1: Đặt lịch nhanh chóng */}
              <div className="bg-white/90 backdrop-blur-sm border border-blue-100/90 rounded-2xl p-2.5 xl:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                  <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                    <circle cx="8" cy="14" fill="currentColor" r="1" />
                    <circle cx="12" cy="14" fill="currentColor" r="1" />
                    <circle cx="16" cy="14" fill="currentColor" r="1" />
                  </svg>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight">
                  Đặt lịch
                  <br />
                  nhanh chóng
                </span>
              </div>

              {/* Feature 2: Theo dõi sức khỏe dễ dàng */}
              <div className="bg-white/90 backdrop-blur-sm border border-blue-100/90 rounded-2xl p-2.5 xl:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                  <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight">
                  Theo dõi
                  <br />
                  sức khỏe dễ dàng
                </span>
              </div>

              {/* Feature 3: Chăm sóc cá nhân hóa */}
              <div className="bg-white/90 backdrop-blur-sm border border-blue-100/90 rounded-2xl p-2.5 xl:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                  <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    <path d="M3.5 12h3l2-3 3 6 2-3h5" />
                  </svg>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight">
                  Chăm sóc
                  <br />
                  cá nhân hóa
                </span>
              </div>
            </div>
          </div>

          {/* Hero Illustration: Family + Hospital + Heartbeat Badge + Waves */}
          <div className="relative w-full mt-auto -mb-2 lg:-mb-4 -ml-2 sm:-ml-4 lg:-ml-6 pointer-events-none select-none z-10" data-purpose="hero-illustration">
            <img
              alt="Bác sĩ gia đình và chăm sóc sức khỏe toàn diện FamiDoc"
              src="/images/famidoc_register_hero.png"
              className="w-full max-w-[440px] lg:max-w-[500px] xl:max-w-[620px] max-h-[240px] lg:max-h-[290px] xl:max-h-[350px] h-auto object-contain object-bottom select-none"
            />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: REGISTRATION FORM CARD                                      */}
        {/* ========================================================================= */}
        <section className="lg:col-span-6 xl:col-span-6 flex justify-center" data-purpose="form-section">
          <div className="w-full max-w-[580px] bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-5 xl:p-7 shadow-[0_15px_40px_rgba(26,86,219,0.08)] border border-blue-100/60 relative">
            {/* Subtle cross decorative icon top right of card */}
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 text-blue-200 pointer-events-none select-none opacity-80">
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
              </svg>
            </div>

            {/* Form Header */}
            <div className="mb-3 sm:mb-4" data-purpose="card-header">
              {/* Brand Logo in form header matching Image 2 */}
              <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                <img
                  src="/images/logo.png"
                  alt="FamiDoc Logo"
                  className="h-7 sm:h-8 w-auto object-contain"
                />
              </div>

              {/* Form Title (h1 with font-bold for UT compliance) */}
              <h1 className="text-lg sm:text-xl lg:text-[23px] font-bold text-slate-900 tracking-tight">
                Đăng ký tài khoản đại diện gia đình
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý và theo dõi sức khỏe gia đình của bạn một cách dễ dàng hơn.
              </p>
            </div>

            {/* Gói đăng ký đính kèm (nếu có từ URL ?packageId=...) */}
            {preselectedPackage && (
              <div className="mb-3 py-1.5 px-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-between border border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>
                    Đang đăng ký cho gói: <strong className="uppercase">{preselectedPackage}</strong>
                  </span>
                </div>
                <Link href="/packages" className="text-xs text-blue-600 underline hover:text-blue-800">
                  Đổi gói
                </Link>
              </div>
            )}

            {/* Global error banner (from authApi errors) */}
            {errors.global && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <span className="font-medium">{errors.global}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5" data-purpose="signup-form">
              {/* Full Name Field */}
              <div className="space-y-1" data-purpose="field-fullname">
                <label htmlFor="register-fullname" className="block text-xs font-semibold text-slate-700">
                  Họ và tên người đại diện <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all bg-slate-50/30 overflow-hidden ${errors.fullName
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                    }`}
                >
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
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
                    className="w-full pl-10 pr-4 py-1.5 sm:py-2 bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  />
                </div>
                {errors.fullName && (
                  <p role="alert" className="text-xs text-red-600 font-medium mt-0.5">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email & Phone Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3" data-purpose="field-contacts">
                {/* Email Field */}
                <div className="space-y-1">
                  <label htmlFor="register-email" className="block text-xs font-semibold text-slate-700">
                    Email đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative rounded-xl border transition-all bg-slate-50/30 overflow-hidden ${errors.email
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                      }`}
                  >
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="16" rx="2" width="20" x="2" y="4" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
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
                      className="w-full pl-10 pr-3 py-1.5 sm:py-2 bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                  </div>
                  {errors.email && (
                    <p role="alert" className="text-xs text-red-600 font-medium mt-0.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Number Field with Country Code */}
                <div className="space-y-1">
                  <label htmlFor="register-phone" className="block text-xs font-semibold text-slate-700">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative flex rounded-xl border transition-all bg-slate-50/30 overflow-hidden ${errors.phone
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                      }`}
                  >
                    {/* Country Prefix */}
                    <div className="flex items-center pl-3 pr-2 border-r border-slate-200 text-slate-600 bg-slate-50/60 text-xs font-medium space-x-1 select-none shrink-0">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>+84</span>
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
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
                      className="w-full px-3 py-1.5 sm:py-2 bg-transparent border-none text-sm text-slate-800 tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                  </div>
                  {errors.phone && (
                    <p role="alert" className="text-xs text-red-600 font-medium mt-0.5">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3" data-purpose="field-passwords">
                {/* Password Field */}
                <div className="space-y-1">
                  <label htmlFor="register-password" className="block text-xs font-semibold text-slate-700">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative rounded-xl border transition-all bg-slate-50/30 overflow-hidden ${errors.password
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                      }`}
                  >
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
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
                      className="w-full pl-10 pr-9 py-1.5 sm:py-2 bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label="Toggle password"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                  {errors.password && (
                    <p role="alert" className="text-xs text-red-600 font-medium mt-0.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1">
                  <label htmlFor="register-confirmpassword" className="block text-xs font-semibold text-slate-700">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative rounded-xl border transition-all bg-slate-50/30 overflow-hidden ${errors.confirmPassword
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                      }`}
                  >
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
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
                      className="w-full pl-10 pr-9 py-1.5 sm:py-2 bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label="Toggle confirm password"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p role="alert" className="text-xs text-red-600 font-medium mt-0.5">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Modern & Polished Password Strength Indicator Panel */}
              <div
                className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-50/90 via-blue-50/30 to-indigo-50/20 p-2 sm:p-2.5 border border-blue-100/70 shadow-xs space-y-1.5"
                data-purpose="password-strength-panel"
              >
                {/* Header Row: Label, Dynamic Multi-segment Progress Bar & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-700">Độ an toàn mật khẩu</span>
                  </div>

                  {/* 4 Segmented Progress Bar */}
                  <div className="flex items-center gap-1.5 flex-1 max-w-[170px] sm:mx-3" aria-hidden="true">
                    {[1, 2, 3, 4].map((seg) => {
                      const isFilled = strengthScore >= seg;
                      const segColor =
                        strengthScore === 1
                          ? 'bg-rose-500'
                          : strengthScore === 2
                            ? 'bg-amber-500'
                            : strengthScore === 3
                              ? 'bg-blue-500'
                              : 'bg-emerald-500';
                      return (
                        <div
                          key={seg}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${isFilled ? segColor : 'bg-slate-200/80'
                            }`}
                        />
                      );
                    })}
                  </div>

                  {/* Status Badge Pill */}
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border transition-colors ${strengthScore === 0
                      ? 'bg-slate-100 text-slate-500 border-slate-200/60'
                      : strengthScore === 1
                        ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                        : strengthScore === 2
                          ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                          : strengthScore === 3
                            ? 'bg-blue-50 text-blue-700 border-blue-200/70'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                      }`}
                  >
                    <svg
                      className="w-3 h-3 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>{strengthText}</span>
                  </div>
                </div>

                {/* Criteria Checklist Cards (4 Clean Interactive Chips) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
                  {[
                    { label: '8+ ký tự', met: hasMinLength },
                    { label: 'Chữ hoa & thường', met: hasUpperLower },
                    { label: 'Chữ số', met: hasDigit },
                    { label: 'Ký tự đặc biệt', met: hasSpecial },
                  ].map((crit, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] transition-all ${crit.met
                        ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200 font-medium shadow-2xs'
                        : 'bg-white/80 text-slate-500 border-slate-200/70'
                        }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 transition-colors ${crit.met
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 bg-slate-50'
                          }`}
                      >
                        {crit.met ? (
                          <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-1 h-1 rounded-full bg-slate-400" />
                        )}
                      </span>
                      <span className="truncate">{crit.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms Checkboxes */}
              <div className="pt-2 space-y-2.5" data-purpose="terms-checkboxes">
                {/* errors.acceptTerms */}
                {errors.acceptTerms && (
                  <p role="alert" className="text-xs text-red-600 font-medium">
                    {errors.acceptTerms}
                  </p>
                )}

                {/* Term 1 */}
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                    Tôi đồng ý với{' '}
                    <Link href="/privacy" className="text-blue-600 font-medium hover:underline">
                      Chính sách bảo mật y tế
                    </Link>{' '}
                    &amp;{' '}
                    <Link href="/terms" className="text-blue-600 font-medium hover:underline">
                      Điều khoản dịch vụ Khám bệnh từ xa
                    </Link>
                    .
                  </span>
                </label>
                {/* Term 2 */}
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptNotifications"
                    checked={formData.acceptNotifications}
                    onChange={handleChange}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                    Tôi đồng ý tiếp nhận thông báo lịch tiêm chủng, cập nhật dịch vụ và nhắc lịch tái khám tự động.
                  </span>
                </label>
              </div>

              {/* Main CTA Button */}
              <div className="pt-1.5 sm:pt-2" data-purpose="submit-button">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-2.5 px-5 rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
                >
                  {loading ? (
                    <span>Đang khởi tạo tài khoản...</span>
                  ) : (
                    <>
                      <span>Đăng ký tài khoản FamiDoc</span>
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
            </form>

            {/* Card Footer */}
            <div
              className="mt-3 sm:mt-4 pt-3 sm:pt-3.5 border-t border-slate-100 flex flex-col items-center justify-center gap-2 text-center"
              data-purpose="card-footer"
            >
              {/* Sign-in Link */}
              <div className="text-slate-500 whitespace-nowrap shrink-0">
                Đã có tài khoản?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
