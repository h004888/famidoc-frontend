'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerFamilySchema } from '../schemas/auth.schema';
import { resolveReturnUrl } from '../return-url';
import { useAuth } from '../context/auth-context';
import { isFamilyPortalRole } from '@/lib/portal-routing';
import { authApi, mapRegistrationErrorToFields } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/http/errors';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FamilyAuthShell } from './family-auth-shell';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPackage = searchParams.get('packageId');
  const redirectTarget = resolveReturnUrl(searchParams.get('redirect'));
  const { isAuthenticated, isLoading, role } = useAuth();

  // Khi đã đăng nhập bằng tài khoản khách hàng (FAMILY/FAMILY_REP/PATIENT),
  // tự động chuyển thẳng sang luồng chọn bác sĩ / URL đích thay vì đăng ký lại.
  // Tài khoản ADMIN/FACILITY/DOCTOR vẫn thấy biểu mẫu đăng ký khách hàng bình thường.
  useEffect(() => {
    if (!isLoading && isAuthenticated && isFamilyPortalRole(role)) {
      if (redirectTarget) {
        router.replace(redirectTarget);
        return;
      }
      router.replace('/doctors');
    }
  }, [isAuthenticated, isLoading, role, redirectTarget, router]);

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
    <FamilyAuthShell dataPurpose="registration-screen">
      <div className="w-full max-w-[460px] sm:max-w-[540px] lg:max-w-[560px] xl:max-w-[580px] bg-white rounded-3xl p-6 sm:p-8 xl:p-9 shadow-[0_20px_50px_rgba(26,86,219,0.08)] border border-blue-100/80 relative">
        {/* Form Header */}
        <div className="mb-5" data-purpose="card-header">
          {/* Brand Logo (hiển thị trên mobile/tablet khi cột trái ẩn) */}
          <div className="flex lg:hidden items-center gap-2 mb-4">
            <img
              src="/images/logo.png"
              alt="FamiDoc Logo"
              className="h-8 w-auto object-contain"
            />
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight tracking-tight">
            Đăng ký tài khoản đại diện gia đình
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Quản lý và theo dõi sức khỏe gia đình của bạn một cách dễ dàng hơn.
          </p>
        </div>

            <>
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
              <Alert variant="destructive" className="mb-4 rounded-xl border-rose-200 bg-rose-50 text-rose-700">
                <AlertDescription className="flex items-center gap-2 text-xs text-rose-700">
                  <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  <span className="font-medium">{errors.global}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5" data-purpose="signup-form">
              {/* Full Name Field */}
              <div className="space-y-1.5" data-purpose="field-fullname">
                <label htmlFor="register-fullname" className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Họ và tên người đại diện <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all bg-slate-50/50 overflow-hidden ${errors.fullName
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300'
                    }`}
                >
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <Input
                    id="register-fullname"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    required
                    className="w-full h-11 pl-10 pr-4 bg-transparent border-none shadow-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 focus-visible:border-none"
                  />
                </div>
                {errors.fullName && (
                  <p role="alert" className="text-xs text-red-600 font-medium mt-0.5">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email & Phone Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-purpose="field-contacts">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="register-email" className="block text-xs sm:text-sm font-semibold text-slate-700">
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
                      id="register-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      placeholder="example@famidoc.vn"
                      required
                      className="w-full h-11 pl-10 pr-3 bg-transparent border-none shadow-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 focus-visible:border-none"
                    />
                  </div>
                  {errors.email && (
                    <p role="alert" className="text-xs text-red-600 font-medium mt-0.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Number Field with Country Code */}
                <div className="space-y-1.5">
                  <label htmlFor="register-phone" className="block text-xs sm:text-sm font-semibold text-slate-700">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative flex rounded-xl border transition-all bg-slate-50/50 overflow-hidden ${errors.phone
                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                      : 'border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center pl-3 pr-2 border-r border-slate-200 text-slate-600 bg-slate-100/70 text-xs font-medium space-x-1 select-none shrink-0">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>+84</span>
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
                      className="w-full h-11 px-3 bg-transparent border-none text-sm text-slate-800 tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-0"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-purpose="field-passwords">
                {/* Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="register-password" className="block text-xs sm:text-sm font-semibold text-slate-700">
                    Mật khẩu mới <span className="text-red-500">*</span>
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
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      placeholder="Tối thiểu 8 ký tự"
                      required
                      className="w-full h-11 pl-10 pr-10 bg-transparent border-none shadow-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 focus-visible:border-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label="Toggle password"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-blue-600 cursor-pointer"
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
                    <p role="alert" className="text-xs text-red-600 font-medium mt-0.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="register-confirmpassword" className="block text-xs sm:text-sm font-semibold text-slate-700">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative rounded-xl border transition-all bg-slate-50/50 overflow-hidden ${errors.confirmPassword
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
                      id="register-confirmpassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      placeholder="Nhập lại mật khẩu"
                      required
                      className="w-full h-11 pl-10 pr-10 bg-transparent border-none shadow-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 focus-visible:border-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label="Toggle confirm password"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-blue-600 cursor-pointer"
                    >
                      {showConfirmPassword ? (
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
              <div className="pt-1 space-y-2.5" data-purpose="terms-checkboxes">
                {errors.acceptTerms && (
                  <p role="alert" className="text-xs text-red-600 font-medium">
                    {errors.acceptTerms}
                  </p>
                )}

                {/* Term 1 */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="mt-0.5 rounded text-blue-600 accent-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    Tôi đồng ý với{' '}
                    <Link href="/privacy" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
                      Chính sách bảo mật y tế
                    </Link>{' '}
                    &amp;{' '}
                    <Link href="/terms" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
                      Điều khoản dịch vụ Khám bệnh từ xa
                    </Link>
                    .
                  </span>
                </label>
                {/* Term 2 */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="acceptNotifications"
                    checked={formData.acceptNotifications}
                    onChange={handleChange}
                    className="mt-0.5 rounded text-blue-600 accent-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    Tôi đồng ý tiếp nhận thông báo lịch tiêm chủng, cập nhật dịch vụ và nhắc lịch tái khám tự động.
                  </span>
                </label>
              </div>

              {/* Main CTA Button */}
              <div className="pt-1" data-purpose="submit-button">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang khởi tạo tài khoản...</span>
                    </>
                  ) : (
                    <span>Đăng ký tài khoản FamiDoc</span>
                  )}
                </button>
              </div>
            </form>
          </>

            {/* Card Footer */}
            <div
              className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center justify-center gap-2 text-center"
              data-purpose="card-footer"
            >
              {/* Sign-in Link */}
              <div className="text-xs sm:text-sm text-slate-600">
                Đã có tài khoản?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
      </div>
    </FamilyAuthShell>
  );
}
