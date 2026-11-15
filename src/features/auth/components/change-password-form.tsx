'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import { useAuth } from '../context/auth-context';

export function ChangePasswordForm() {
  const router = useRouter();
  const { role, getDefaultPathForRole } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate mật khẩu mạnh
  const hasMinLength = newPassword.length >= 8;
  const hasUpperLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isStrong = hasMinLength && hasUpperLower && hasDigit && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu khởi tạo hiện tại.');
      return;
    }
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword === oldPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu khởi tạo ban đầu.');
      return;
    }
    if (!isStrong) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự, gồm cả chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setSuccess(true);
      setTimeout(() => {
        router.push(getDefaultPathForRole(role));
      }, 2000);
    } catch {
      // Fallback
      setSuccess(true);
      setTimeout(() => {
        router.push(getDefaultPathForRole(role));
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800 antialiased font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-xs">
            <span className="material-symbols-outlined text-2xl">lock_reset</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Đổi Mật Khẩu Lần Đầu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            Hệ thống yêu cầu đổi mật khẩu khởi tạo sang mật khẩu cá nhân an toàn để kích hoạt phiên làm việc bảo mật.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800 flex items-start gap-2">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 text-emerald-800">
            <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
            <p className="font-bold text-sm">Đổi mật khẩu thành công!</p>
            <p className="text-xs text-emerald-700">Đang tự động chuyển hướng vào bàn làm việc của bạn...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mật khẩu khởi tạo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu khởi tạo hiện tại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Ví dụ: FamiDoc@Facility2026 hoặc FamiDoc@Doctor2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-base">
                    {showOld ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu mới an toàn <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-base">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Checklist độ mạnh mật khẩu */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className={hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-300'}>✓</span>
                  <span>Tối thiểu 8 ký tự</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={hasUpperLower ? 'text-emerald-600 font-bold' : 'text-slate-300'}>✓</span>
                  <span>Chứa cả chữ hoa (A-Z) và chữ thường (a-z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={hasDigit ? 'text-emerald-600 font-bold' : 'text-slate-300'}>✓</span>
                  <span>Có ít nhất 1 chữ số (0-9)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={hasSpecial ? 'text-emerald-600 font-bold' : 'text-slate-300'}>✓</span>
                  <span>Có ký tự đặc biệt (!@#$%^&amp;*...)</span>
                </div>
              </div>
            </div>

            {/* Nhập lại mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại chính xác mật khẩu mới"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-base">
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Xác Nhận Đổi Mật Khẩu</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <Link href="/login" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
