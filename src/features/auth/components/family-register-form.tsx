'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FamilyRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ & Chính sách bảo mật y tế.');
      return;
    }

    setLoading(true);

    try {
      await authApi.registerRepresentative({
        email: email.trim(),
        password,
        confirmPassword,
        fullName: fullName.trim(),
        phone: phone.trim(),
        acceptTerms: agreeTerms,
      });

      toast.success('Đăng ký tài khoản gia đình thành công! Vui lòng nhập mã OTP gửi tới email.');
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      console.warn('Lỗi đăng ký gia đình:', err);
      const msg = err instanceof Error ? err.message : 'Không thể đăng ký tài khoản. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 text-red-900 py-2.5">
          <AlertDescription className="text-xs font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
            <span>{error}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Họ tên chủ hộ */}
      <div className="space-y-1.5">
        <Label htmlFor="fam-name" className="text-xs font-bold text-slate-700">
          Họ và tên Đại diện hộ gia đình <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fam-name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn An"
          className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="fam-email" className="text-xs font-bold text-slate-700">
            Địa chỉ Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fam-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="an.nguyen@gmail.com"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>

        {/* Số điện thoại */}
        <div className="space-y-1.5">
          <Label htmlFor="fam-phone" className="text-xs font-bold text-slate-700">
            Số điện thoại di động <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fam-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mật khẩu */}
        <div className="space-y-1.5">
          <Label htmlFor="fam-pass" className="text-xs font-bold text-slate-700">
            Mật khẩu mới <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fam-pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>

        {/* Nhập lại mật khẩu */}
        <div className="space-y-1.5">
          <Label htmlFor="fam-repass" className="text-xs font-bold text-slate-700">
            Xác nhận mật khẩu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fam-repass"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Cam kết điều khoản */}
      <div className="flex items-start space-x-2 pt-1">
        <Checkbox
          id="terms-agree"
          checked={agreeTerms}
          onCheckedChange={(checked) => setAgreeTerms(Boolean(checked))}
          className="mt-0.5"
        />
        <label htmlFor="terms-agree" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
          Tôi cam kết là Đại diện Hộ gia đình và đồng ý với{' '}
          <Link href="/terms" target="_blank" className="text-[#0046c0] font-semibold hover:underline">
            Điều khoản dịch vụ
          </Link>{' '}
          &amp;{' '}
          <Link href="/privacy" target="_blank" className="text-[#0046c0] font-semibold hover:underline">
            Chính sách bảo mật hồ sơ bệnh án
          </Link>
          .
        </label>
      </div>

      {/* Nút Đăng ký */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold bg-[#0046c0] hover:bg-[#003899] text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer mt-2"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Đang khởi tạo tài khoản...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5">
            <span>Đăng Ký Tài Khoản Gia Đình</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </div>
        )}
      </Button>
    </form>
  );
}
