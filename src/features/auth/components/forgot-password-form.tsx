'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { forgotPasswordSchema } from '../schemas/auth.schema';

export function ForgotPasswordForm() {
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = forgotPasswordSchema.safeParse({ contact });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant shadow-lg space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary-container/20 text-[#fa8c16] mb-2 shadow-sm">
          <span className="material-symbols-outlined text-2xl">lock_reset</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface">Quên &amp; Đặt lại Mật khẩu</h2>
        <p className="text-xs text-on-surface-variant">
          Nhập số điện thoại hoặc email liên kết với tài khoản để nhận mã OTP khôi phục
        </p>
      </div>

      {submitted ? (
        <div className="p-4 rounded-xl bg-[#f6ffed] border border-[#b7eb8f] space-y-3 text-center">
          <span className="material-symbols-outlined text-3xl text-[#039855]">mark_email_read</span>
          <h4 className="font-bold text-sm text-[#039855]">Mã OTP đã được gửi thành công!</h4>
          <p className="text-xs text-on-surface-variant">
            Vui lòng kiểm tra tin nhắn SMS hoặc hộp thư đến tại <span className="font-semibold text-on-surface">{contact}</span>.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-4 py-2 bg-primary-container text-white text-xs font-semibold rounded-lg hover:bg-primary transition-colors"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Số điện thoại hoặc Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[18px]">contact_mail</span>
              </span>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="0912 345 678 hoặc user@famidoc.vn"
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-fixed bg-surface-container-low ${
                  error ? 'border-error ring-1 ring-error' : 'border-outline-variant focus:border-primary'
                }`}
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-container hover:bg-primary text-white rounded-lg font-semibold text-sm shadow-md transition-all duration-150 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                <span>Đang gửi mã OTP...</span>
              </>
            ) : (
              <>
                <span>Gửi mã xác thực OTP</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Quay lại màn hình đăng nhập
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
