'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { forgotPasswordSchema } from '../schemas/auth.schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

    const validation = forgotPasswordSchema.safeParse({ contact });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setCountdown(60);
    }, 600);
  };

  return (
    <Card className="w-full max-w-md rounded-2xl border-outline-variant bg-surface-container-lowest py-0 shadow-lg">
      <CardContent className="space-y-6 p-8">
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
        <Alert className="rounded-xl border-[#b7eb8f] bg-[#f6ffed] p-4 text-center">
          <AlertDescription className="space-y-3 text-center">
            <span className="material-symbols-outlined text-3xl text-[#039855]">mark_email_read</span>
            <h4 className="font-bold text-sm text-[#039855]">Mã OTP đã được gửi thành công!</h4>
            <p className="text-xs text-on-surface-variant">
              Vui lòng kiểm tra tin nhắn SMS hoặc hộp thư đến tại <span className="font-semibold text-on-surface">{contact}</span>.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={countdown > 0}
                onClick={() => {
                  setCountdown(60);
                }}
                className="w-full sm:w-auto rounded-lg text-xs font-semibold text-slate-700"
              >
                {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã OTP'}
              </Button>
              <Button asChild size="sm" className="w-full sm:w-auto rounded-lg text-xs font-semibold">
                <Link href="/login">Quay lại Đăng nhập</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-contact" className="text-xs font-semibold text-on-surface">
              Số điện thoại hoặc Email
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[18px]">contact_mail</span>
              </span>
              <Input
                id="forgot-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="0912 345 678 hoặc user@famidoc.vn"
                aria-invalid={Boolean(error)}
                className="h-10.5 rounded-lg bg-surface-container-low pl-10 pr-3 text-sm"
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg font-semibold text-sm shadow-md"
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
          </Button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Quay lại màn hình đăng nhập
            </Link>
          </div>
        </form>
      )}
      </CardContent>
    </Card>
  );
}
