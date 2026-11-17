'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DoctorRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('ThS.BS');
  const [specialty, setSpecialty] = useState('Y học gia đình');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cchn, setCchn] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
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
      setError('Bác sĩ cần đồng ý với Quy chế chuyên môn & Chuẩn y đức FamiDoc.');
      return;
    }

    setLoading(true);

    try {
      await authApi.registerRepresentative({
        email: email.trim(),
        password,
        confirmPassword,
        fullName: `${title} ${fullName.trim()}`,
        phone: phone.trim(),
        acceptTerms: agreeTerms,
      });

      toast.success('Gửi hồ sơ đăng ký Bác sĩ thành công! Vui lòng xác thực mã OTP gửi về email.');
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      console.warn('Lỗi đăng ký Bác sĩ:', err);
      const msg = err instanceof Error ? err.message : 'Không thể gửi hồ sơ bác sĩ. Vui lòng kiểm tra lại thông tin.';
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

      {/* Thông báo quy trình 2 cấp */}
      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
        <span className="material-symbols-outlined text-[16px] text-emerald-700 shrink-0 mt-0.5">verified_user</span>
        <div>
          <strong>Quy chuẩn Thẩm định CSDL Quốc gia:</strong> Sau khi đăng ký, bác sĩ sẽ nộp file scan Chứng chỉ hành nghề (CCHN) tại Cổng chuyên môn để Hội đồng Y khoa thẩm định trước khi mở tiếp nhận bệnh nhân.
        </div>
      </div>

      {/* Học hàm/học vị + Họ tên */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="doc-title" className="text-xs font-bold text-slate-700">
            Học hàm/học vị
          </Label>
          <select
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-11 text-xs rounded-xl border border-slate-200 bg-white px-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="BS">BS</option>
            <option value="BSCKI">BS.CKI</option>
            <option value="BSCKII">BS.CKII</option>
            <option value="ThS.BS">ThS.BS</option>
            <option value="TS.BS">TS.BS</option>
            <option value="PGS.TS">PGS.TS</option>
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="doc-name" className="text-xs font-bold text-slate-700">
            Họ và tên Bác sĩ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="doc-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ví dụ: Lê Hoàng Nam"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Chuyên khoa chính */}
        <div className="space-y-1.5">
          <Label htmlFor="doc-specialty" className="text-xs font-bold text-slate-700">
            Chuyên khoa <span className="text-red-500">*</span>
          </Label>
          <Input
            id="doc-specialty"
            type="text"
            required
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Y học gia đình"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>

        {/* Số CCHN */}
        <div className="space-y-1.5">
          <Label htmlFor="doc-cchn" className="text-xs font-bold text-slate-700">
            Số CCHN <span className="text-red-500">*</span>
          </Label>
          <Input
            id="doc-cchn"
            type="text"
            required
            value={cchn}
            onChange={(e) => setCchn(e.target.value)}
            placeholder="007612/BYT"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200 tabular-nums"
          />
        </div>

        {/* Số năm kinh nghiệm */}
        <div className="space-y-1.5">
          <Label htmlFor="doc-exp" className="text-xs font-bold text-slate-700">
            Kinh nghiệm (năm) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="doc-exp"
            type="number"
            min="0"
            max="60"
            required
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            placeholder="5"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="doc-email" className="text-xs font-bold text-slate-700">
            Email công vụ / liên hệ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="doc-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dr.nam@famidoc.vn"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>

        {/* Số điện thoại */}
        <div className="space-y-1.5">
          <Label htmlFor="doc-phone" className="text-xs font-bold text-slate-700">
            Số điện thoại di động <span className="text-red-500">*</span>
          </Label>
          <Input
            id="doc-phone"
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
          <Label htmlFor="doc-pass" className="text-xs font-bold text-slate-700">
            Mật khẩu cá nhân an toàn <span className="text-red-500">*</span>
          </Label>
          <Input
            id="doc-pass"
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
          <Label htmlFor="doc-repass" className="text-xs font-bold text-slate-700">
            Xác nhận mật khẩu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="doc-repass"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Cam kết điều khoản chuyên môn */}
      <div className="flex items-start space-x-2 pt-1">
        <Checkbox
          id="doc-terms"
          checked={agreeTerms}
          onCheckedChange={(checked) => setAgreeTerms(Boolean(checked))}
          className="mt-0.5"
        />
        <label htmlFor="doc-terms" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
          Tôi cam kết các thông tin về CCHN là hoàn toàn chính xác, tuân thủ Luật Khám bệnh, chữa bệnh và cam kết định mức y tế tối đa 150 hộ gia đình.
        </label>
      </div>

      {/* Nút Gửi hồ sơ */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 transition-all cursor-pointer mt-2"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Đang ghi nhận hồ sơ Bác sĩ...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5">
            <span>Gửi Hồ Sơ Gia Nhập Mạng Lưới Bác Sĩ</span>
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
        )}
      </Button>
    </form>
  );
}
