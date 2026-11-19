'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Loader2,
  Mail,
  MailCheck,
  Send,
} from 'lucide-react';
import { forgotPasswordSchema } from '../schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!submitted || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedContact = contact.trim();
    const validation = forgotPasswordSchema.safeParse({ contact: trimmedContact });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ');
      return;
    }

    setContact(trimmedContact);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setCountdown(60);
    }, 600);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 py-10 text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-700"
      style={{
        background:
          'radial-gradient(120% 100% at 15% 10%, #FFFFFF 0%, #F4F9FF 38%, #E9F3FE 72%, #DCEBFE 100%)',
      }}
    >
      {/* Focused Recovery Card */}
      <div className="w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-8 xl:p-9 shadow-[0_20px_50px_rgba(26,86,219,0.08)] border border-blue-100/80">
        {/* Card Header */}
        <div className="mb-6" data-purpose="card-header">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-transform hover:scale-[1.02]"
              data-purpose="main-logo"
            >
              <img
                src="/images/logo.png"
                alt="FamiDoc Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${
                submitted
                  ? 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                  : 'bg-blue-50 border-blue-100 text-blue-600'
              }`}
              aria-hidden="true"
            >
              {submitted ? (
                <MailCheck className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight tracking-tight">
            {submitted ? 'Kiểm tra mã xác thực' : 'Quên mật khẩu?'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            {submitted
              ? 'Mã OTP khôi phục tài khoản đã được gửi đến thông tin liên hệ bên dưới.'
              : 'Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP khôi phục.'}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-5" role="status" aria-live="polite">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-emerald-800">
                Đã gửi mã OTP thành công tới
              </p>
              <p className="text-sm font-bold text-slate-900 break-all">{contact}</p>
              <p className="text-xs text-slate-600 pt-1">
                Vui lòng kiểm tra tin nhắn SMS hoặc hộp thư đến (bao gồm mục Thư rác).
              </p>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/login"
                className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Quay lại đăng nhập</span>
              </Link>

              <Button
                type="button"
                variant="outline"
                disabled={countdown > 0}
                onClick={() => setCountdown(60)}
                className="w-full h-11 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold tabular-nums cursor-pointer disabled:opacity-60"
              >
                {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã OTP'}
              </Button>
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setError(null);
                }}
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Dùng email hoặc số điện thoại khác
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" data-purpose="forgot-password-form">
            <div className="space-y-1.5">
              <Label
                htmlFor="forgot-contact"
                className="block text-xs sm:text-sm font-semibold text-slate-700"
              >
                Email hoặc số điện thoại <span className="text-red-500">*</span>
              </Label>
              <div
                className={`relative rounded-xl border transition-all bg-slate-50/50 overflow-hidden ${
                  error
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300'
                }`}
              >
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </span>
                <Input
                  id="forgot-contact"
                  type="text"
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="example@famidoc.vn hoặc 0912 345 678"
                  aria-invalid={Boolean(error)}
                  className="w-full h-11 pl-10 pr-4 bg-transparent border-none shadow-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 focus-visible:border-none"
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Đang gửi mã OTP...</span>
                </>
              ) : (
                <>
                  <span>Gửi mã xác thực OTP</span>
                  <Send className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Quay lại đăng nhập</span>
              </Link>
            </div>
          </form>
        )}
      </div>

      {/* Minimal Support Line */}
      <p className="mt-6 text-center text-xs text-slate-500">
        Cần hỗ trợ khôi phục tài khoản? Liên hệ tổng đài{' '}
        <span className="font-semibold text-slate-700 tabular-nums">1900 6868</span>
      </p>
    </div>
  );
}
