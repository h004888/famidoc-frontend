'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FacilityRegisterForm() {
  const [facilityName, setFacilityName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError('Đơn vị cần đồng ý với Quy chế Hợp tác Cơ sở Y tế Nền tảng B2B.');
      return;
    }

    setLoading(true);

    try {
      await facilitiesApi.registerFacility({
        facilityName: facilityName.trim(),
        representativeName: representativeName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      setIsSuccess(true);
      toast.success('Gửi hồ sơ đăng ký CSYT thành công! Quản trị viên FamiDoc sẽ thẩm định và cấp tài khoản qua email.');
    } catch (err: unknown) {
      console.warn('Lỗi đăng ký CSYT:', err);
      const msg = err instanceof Error ? err.message : 'Không thể gửi hồ sơ đăng ký CSYT. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200">
          ✓
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900">
            Hồ sơ Hợp tác B2B đã được tiếp nhận!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Hồ sơ của <strong>{facilityName}</strong> đã được chuyển tới Hội đồng Thẩm định Quản trị viên FamiDoc.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2 max-w-md mx-auto">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-600">mail</span>
            <span>Quy trình cấp tài khoản (Flow 2.1):</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            1. Quản trị viên duyệt Cấp 1 và tự động cấp mật khẩu khởi tạo{' '}
            <code className="bg-white px-1 py-0.5 rounded border font-bold text-blue-700">FamiDoc@Facility2026</code>.
          </p>
          <p className="text-[11px] leading-relaxed">
            2. Thông tin đăng nhập sẽ được gửi tới hòm thư <strong>{email}</strong>.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/facility/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-bold transition-all shadow-md"
          >
            <span>Đến Trang Đăng Nhập Cổng CSYT</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

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

      {/* Thông báo chính sách Flow 2.1 */}
      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
        <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">domain_verification</span>
        <div>
          <strong>Đăng ký sơ bộ đối tác:</strong> Chưa cần mật khẩu ban đầu. Quản trị viên sẽ xác minh pháp lý và cấp tài khoản Portal chính thức qua email.
        </div>
      </div>

      {/* Tên cơ sở y tế */}
      <div className="space-y-1.5">
        <Label htmlFor="fac-name" className="text-xs font-bold text-slate-700">
          Tên pháp nhân Bệnh viện / Phòng khám đa khoa <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fac-name"
          type="text"
          required
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
          placeholder="Ví dụ: Bệnh viện Đa khoa Quốc tế An Sinh"
          className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
        />
      </div>

      {/* Người đại diện */}
      <div className="space-y-1.5">
        <Label htmlFor="fac-rep" className="text-xs font-bold text-slate-700">
          Họ và tên Người đại diện pháp luật / Đầu mối liên hệ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fac-rep"
          type="text"
          required
          value={representativeName}
          onChange={(e) => setRepresentativeName(e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn Tuấn (Giám đốc / Trưởng phòng Kế hoạch)"
          className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="fac-email" className="text-xs font-bold text-slate-700">
            Email cơ quan / tiếp nhận tài khoản <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fac-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@ansinhhospital.vn"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>

        {/* Số điện thoại */}
        <div className="space-y-1.5">
          <Label htmlFor="fac-phone" className="text-xs font-bold text-slate-700">
            Số điện thoại đầu mối / Hotline <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fac-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0987654321"
            className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Địa chỉ trụ sở */}
      <div className="space-y-1.5">
        <Label htmlFor="fac-addr" className="text-xs font-bold text-slate-700">
          Địa chỉ trụ sở chính thức <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fac-addr"
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ví dụ: 123 Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội"
          className="h-11 text-xs sm:text-sm rounded-xl border-slate-200"
        />
      </div>

      {/* Cam kết điều khoản */}
      <div className="flex items-start space-x-2 pt-1">
        <Checkbox
          id="fac-terms"
          checked={agreeTerms}
          onCheckedChange={(checked) => setAgreeTerms(Boolean(checked))}
          className="mt-0.5"
        />
        <label htmlFor="fac-terms" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
          Đơn vị cam kết các thông tin khai báo là hoàn toàn chính xác, tuân thủ Luật Khám bệnh, chữa bệnh và đồng ý tham gia mạng lưới cơ sở y tế đối tác của FamiDoc.
        </label>
      </div>

      {/* Nút Gửi đăng ký */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold bg-[#00258b] hover:bg-[#001c66] text-white shadow-md shadow-blue-900/20 transition-all cursor-pointer mt-2"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Đang gửi hồ sơ đăng ký hợp tác...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5">
            <span>Gửi Hồ Sơ Đăng Ký Đối Tác CSYT</span>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </div>
        )}
      </Button>
    </form>
  );
}
