'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { updateContractStep } from '@/lib/contract-workflow-storage';

interface MemberItem {
  id: string;
  name: string;
  age: number;
  relation: string;
  chronic?: string;
  selected: boolean;
}

interface ContractSigningWizardProps {
  packageName?: string;
  packagePrice?: string;
  doctorName?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

const DEFAULT_MEMBERS: MemberItem[] = [
  { id: 'm-1', name: 'Nguyễn Văn Phúc', age: 78, relation: 'Ông nội', chronic: 'Tăng HA G2, ĐTĐ T2', selected: true },
  { id: 'm-2', name: 'Nguyễn Văn An', age: 42, relation: 'Chủ hộ (Đại diện)', chronic: 'Khỏe mạnh / Gout nhẹ', selected: true },
  { id: 'm-3', name: 'Trần Thu Hà', age: 38, relation: 'Vợ', chronic: 'Dị ứng Penicillin', selected: true },
  { id: 'm-4', name: 'Bé Nguyễn Minh An', age: 6, relation: 'Con trai', chronic: 'Tiêm chủng đủ', selected: true },
];

export function ContractSigningWizard({
  packageName = 'Gói Toàn Diện Gia Đình (12 Tháng)',
  packagePrice = '9.600.000 đ',
  doctorName = 'BS. CKII Lê Hoàng Nam',
  onClose,
  onSuccess,
}: ContractSigningWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [members, setMembers] = useState<MemberItem[]>(DEFAULT_MEMBERS);
  const [otpCode, setOtpCode] = useState('0988');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignedComplete, setIsSignedComplete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedMembersCount = members.filter((m) => m.selected).length;

  const toggleMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleVerifyOtp = () => {
    if (otpCode.length >= 4) {
      setIsOtpVerified(true);
      setFormError(null);
    } else {
      setFormError('Vui lòng nhập mã OTP (ít nhất 4 ký tự) gửi tới số điện thoại đại diện hộ.');
    }
  };

  const handleExecuteSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpVerified) {
      setFormError('Vui lòng bấm nút Xác thực mã OTP trước khi ký số.');
      return;
    }
    if (!agreedTerms) {
      setFormError('Vui lòng tích chọn đồng ý với các điều khoản hợp đồng và chính sách y tế.');
      return;
    }

    setFormError(null);
    setIsSigning(true);
    setTimeout(() => {
      updateContractStep('PENDING_ADMIN_SIGN', {
        familySigned: true,
        familySignedAt: new Date().toLocaleString('vi-VN'),
        familySignerName: 'Nguyễn Văn An (Đại diện Hộ)',
      });
      setIsSigning(false);
      setIsSignedComplete(true);
      if (onSuccess) onSuccess();
    }, 1500);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent
        showCloseButton={Boolean(onClose)}
        className="sm:max-w-4xl rounded-3xl p-0 overflow-hidden max-h-[95vh] flex flex-col text-slate-900 font-sans gap-0"
      >
        {/* Wizard Header */}
        <DialogHeader className="bg-gradient-to-r from-[#0037c1] to-[#1d4ed8] text-white p-5 sm:p-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-200 font-semibold tracking-wide uppercase">
                <span className="material-symbols-outlined text-[16px] text-[#00D3C7]">verified</span>
                <span>Hợp Đồng Y Tế Điện Tử 4 Bên • Chuẩn Bộ Y Tế</span>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold mt-1 tracking-tight text-white">
                Gia Hạn &amp; Ký Hợp Đồng Chăm Sóc Bác Sĩ Gia Đình
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-100 mt-0.5">
                Gói dịch vụ: <span className="font-semibold text-white">{packageName}</span> • Mã hộ: <span className="font-bold tabular-nums text-white">#FAM-88219</span>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Badge className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20">
                Ký số bảo mật
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* 4-Step Progress Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-3.5">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { num: 1, label: 'Thành viên' },
              { num: 2, label: 'Bác sĩ' },
              { num: 3, label: 'Quyền lợi' },
              { num: 4, label: 'Ký số & Thanh toán' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
                  step === s.num
                    ? 'font-bold text-primary bg-primary/10 border border-primary/20'
                    : step > s.num
                    ? 'font-semibold text-emerald-700'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step === s.num
                      ? 'bg-primary text-primary-foreground'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="truncate">Bước {s.num}: {s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: SELECT MEMBERS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Bước 1: Chọn Thành Viên Thụ Hưởng Gói (Tối đa 4-6 người)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hồ sơ sức khỏe của từng thành viên sẽ được khởi tạo EHR độc lập và kết nối bảo trợ y tế liên tục.
                  </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border-primary/20">
                  Đã chọn: {selectedMembersCount} người
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      m.selected
                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{m.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {m.age} tuổi
                        </span>
                      </div>
                      <div className="text-slate-500 font-medium">Quan hệ: {m.relation}</div>
                      {m.chronic && (
                        <div className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded inline-block">
                          {m.chronic}
                        </div>
                      )}
                    </div>
                    <Checkbox
                      checked={m.selected}
                      onCheckedChange={() => toggleMember(m.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={selectedMembersCount === 0}
                  className="rounded-xl text-xs sm:text-sm font-bold gap-1.5"
                >
                  <span>Tiếp tục chọn Bác sĩ</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DOCTOR */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  Bước 2: Bác Sĩ Gia Đình Quản Nhiệm &amp; CSYT Bảo Trợ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm soát giới hạn tiếp nhận (Panel Cap &lt;= 30 hộ theo BR-04) để đảm bảo chất lượng can thiệp tận nhà.
                </p>
              </div>

              <div className="bg-white border-2 border-primary p-5 rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center">
                      LN
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{doctorName}</span>
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                      </h4>
                      <p className="text-xs text-slate-500">Chuyên khoa Tim mạch &amp; Y học Gia đình</p>
                      <p className="text-[11px] text-primary font-semibold">Bệnh viện Đại học Y Dược TP.HCM</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Panel Cap: Còn 6 / 30 hộ (Sẵn sàng)
                    </span>
                    <div className="text-[11px] text-slate-400 mt-1">SLA cấp cứu: Có mặt &lt; 30 phút</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Quay lại
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-xl text-xs sm:text-sm font-bold gap-1.5"
                >
                  <span>Xem Quyền lợi &amp; Định mức</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW BENEFITS & POLICIES */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  Bước 3: Chi Tiết Quyền Lợi &amp; Định Mức Khám Gói (12 Tháng)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Định mức dịch vụ chăm sóc định kỳ cho {selectedMembersCount} thành viên trong hộ.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-1">
                  <span className="font-bold text-primary uppercase block">12 Lượt Khám Tại Nhà</span>
                  <p className="text-slate-600">Bác sĩ mang máy đo ECG, sinh hiệu và xét nghiệm tận giường bệnh.</p>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-1">
                  <span className="font-bold text-emerald-800 uppercase block">Tư Vấn Telehealth 24/7</span>
                  <p className="text-slate-600">Video call WebRTC mã hóa P2P không giới hạn số lượt trong kỳ.</p>
                </div>
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-1">
                  <span className="font-bold text-amber-800 uppercase block">Hồ Sơ EHR &amp; Cảnh Báo IoT</span>
                  <p className="text-slate-600">Lưu trữ trọn đời theo chuẩn ISO 27799 và Bộ Y Tế.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">Quy chế sử dụng dịch vụ (GB-12 &amp; BF-06):</span>
                <ul className="space-y-1 text-slate-600 list-disc pl-4">
                  <li>Mỗi gia đình chỉ duy trì tối đa 1 hợp đồng bác sĩ gia đình có hiệu lực tại một thời điểm (BR-06).</li>
                  <li>Đổi giờ khám cần thông báo trước tối thiểu 4 tiếng (CFG-07).</li>
                  <li>Số lượt khám không được bảo lưu cộng dồn sang gói mới khi hết hạn hợp đồng.</li>
                  <li>Bản phát hành này không hỗ trợ hoàn tiền hoặc bồi thường tài chính trực tiếp trên app.</li>
                </ul>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Quay lại
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(4)}
                  className="rounded-xl text-xs sm:text-sm font-bold gap-1.5"
                >
                  <span>Chuyển sang Ký số &amp; Ký quỹ</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: SIGN ELECTRONIC CONTRACT & PAY VIETQR */}
          {step === 4 && !isSignedComplete && (
            <form onSubmit={handleExecuteSign} className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  Bước 4: Ký Số Điện Tử (E-Signature) &amp; Xác Thực OTP Hợp Đồng 4 Bên
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác nhận ràng buộc pháp lý giữa Đại diện gia đình, Bác sĩ quản nhiệm, Cơ sở y tế và Nền tảng FamiDoc.
                </p>
              </div>

              {/* Legal Contract Preview Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 max-h-48 overflow-y-auto">
                <div className="font-bold text-slate-900 text-center uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — ĐỘC LẬP TỰ DO HẠNH PHÚC
                </div>
                <div className="font-bold text-center text-primary">
                  HỢP ĐỒNG ĐIỆN TỬ DỊCH VỤ BÁC SĨ GIA ĐÌNH BẢO CHỨNG 4 BÊN #FMD-2026-REGR821
                </div>
                <p>
                  <strong>Bên A (Gia đình):</strong> Nguyễn Văn An (Chủ hộ) • Bảo vệ 04 thành viên.
                </p>
                <p>
                  <strong>Bên B (Cơ sở y tế bảo trợ):</strong> Bệnh viện Đại học Y Dược TP.HCM.
                </p>
                <p>
                  <strong>Bên C (Bác sĩ chuyên môn):</strong> {doctorName} (BV Đại học Y Dược TP.HCM).
                </p>
                <p>
                  <strong>Bên D (Vận hành nền tảng):</strong> FamiDoc Healthcare Corporation (Phí công nghệ 15% CFG-03).
                </p>
                <p className="text-slate-500 italic">
                  Các bên cam kết tuân thủ Luật Khám bệnh, chữa bệnh 2023, Luật Giao dịch điện tử 2023 và quy chuẩn bảo mật hồ sơ sức khỏe y tế ISO 27799.
                </p>
              </div>

              {/* OTP & Signature Area */}
              <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
                <span className="font-bold text-xs text-slate-800 uppercase block">
                  Khu vực Ký điện tử (E-Signature &amp; Smart OTP)
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-0.5 text-xs">
                    <div className="tabular-nums font-bold text-slate-900">Người ký: NGUYỄN VĂN AN (Đại diện chủ hộ)</div>
                    <div className="text-[11px] text-slate-400">Khóa ký số điện tử SHA-256 / Viettel-CA OTP Token</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Mã OTP"
                      className="w-24 h-8 px-2 py-1 text-center tabular-nums font-bold rounded-lg bg-slate-50 text-xs"
                    />
                    <Button
                      type="button"
                      size="xs"
                      onClick={handleVerifyOtp}
                      className={
                        isOtpVerified
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                          : 'font-bold'
                      }
                    >
                      {isOtpVerified ? 'Đã xác thực OTP ✓' : 'Xác thực'}
                    </Button>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                  <Checkbox
                    checked={agreedTerms}
                    onCheckedChange={(checked) => {
                      setAgreedTerms(checked === true);
                      if (formError) setFormError(null);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    Tôi xác nhận là đại diện hợp pháp của các thành viên trên, đã đọc, hiểu rõ toàn bộ Điều khoản Hợp đồng 4 Bên và đồng ý ký kết bằng phương thức điện tử có giá trị pháp lý tương đương văn bản.
                  </span>
                </label>
              </div>

              {formError && (
                <Alert role="alert" variant="destructive" className="rounded-xl bg-red-50 border-red-200 text-xs text-red-700">
                  <AlertDescription className="flex items-center gap-2 text-red-700">
                    <span className="material-symbols-outlined text-[16px] shrink-0 text-red-500">error</span>
                    <span>{formError}</span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Pricing & Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tổng thanh toán ({packageName}):</span>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums text-primary">{packagePrice}</div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSigning || !isOtpVerified || !agreedTerms}
                    className="flex-1 sm:flex-none rounded-xl text-xs sm:text-sm font-bold gap-2"
                  >
                    {isSigning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang đóng dấu ký số TSA...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">edit_document</span>
                        <span>Ký Hợp Đồng &amp; Mở Cổng VietQR</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* SIGNED SUCCESS & VIETQR PAYMENT TRIGGER (BF-05) */}
          {isSignedComplete && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Ký Hợp Đồng Điện Tử 4 Bên Thành Công!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hợp đồng #FMD-2026-REGR821 đã được ký số hợp pháp. Vui lòng hoàn tất thanh toán VietQR trong vòng 15 phút (CFG-05) để kích hoạt toàn bộ quyền lợi.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-2.5">
                <div className="text-xs text-slate-500">Mã hóa đơn: <strong>INV-FMD-REGR821</strong></div>
                <div className="text-lg font-bold tabular-nums text-primary">{packagePrice}</div>
                <div className="flex flex-col gap-2 pt-1">
                  <Button asChild className="w-full rounded-xl text-xs font-bold">
                    <Link href="/family/subscription/tracking">
                      Theo dõi tiến độ ký kết 4 bên
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full rounded-xl text-xs font-bold">
                    <Link href="/family/billing">
                      Mở Mã VietQR Thanh Toán Ngay
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

