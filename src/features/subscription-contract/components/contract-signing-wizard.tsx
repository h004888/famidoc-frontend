'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col text-slate-900 font-sans">
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-200 font-semibold tracking-wide uppercase">
              <span className="material-symbols-outlined text-[16px] text-[#00D3C7]">verified</span>
              <span>Hợp Đồng Y Tế Điện Tử 4 Bên • Chuẩn Bộ Y Tế</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-1 tracking-tight text-white">
              Gia Hạn &amp; Ký Hợp Đồng Chăm Sóc Bác Sĩ Gia Đình
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Gói dịch vụ: <span className="font-semibold text-white">{packageName}</span> • Mã hộ: <span className="font-bold tabular-nums text-white">#FAM-88219</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20">
              Ký số bảo mật
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

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
                    ? 'font-bold text-[#2563eb] bg-blue-50/80 border border-blue-200'
                    : step > s.num
                    ? 'font-semibold text-emerald-700'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step === s.num
                      ? 'bg-[#2563eb] text-white'
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
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563eb] border border-blue-200">
                  Đã chọn: {selectedMembersCount} người
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      m.selected
                        ? 'border-[#2563eb] bg-blue-50/40 shadow-xs ring-1 ring-[#2563eb]/20'
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
                    <input
                      type="checkbox"
                      checked={m.selected}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 text-[#2563eb] rounded"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={selectedMembersCount === 0}
                  className="px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Tiếp tục chọn Bác sĩ</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
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

              <div className="bg-white border-2 border-[#2563eb] p-5 rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-[#2563eb] font-bold text-base flex items-center justify-center">
                      LN
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{doctorName}</span>
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                      </h4>
                      <p className="text-xs text-slate-500">Chuyên khoa Tim mạch &amp; Y học Gia đình</p>
                      <p className="text-[11px] text-blue-700 font-semibold">Bệnh viện Đại học Y Dược TP.HCM</p>
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
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Xem Quyền lợi &amp; Định mức</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
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
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-1">
                  <span className="font-bold text-blue-800 uppercase block">12 Lượt Khám Tại Nhà</span>
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
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Chuyển sang Ký số &amp; Ký quỹ</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
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
                <div className="font-bold text-center text-[#2563eb]">
                  HỢP ĐỒNG ĐIỆN TỬ DỊCH VỤ BÁC SĨ GIA ĐÌNH BẢO CHỨNG 4 BÊN #FMD-2026-REGR821
                </div>
                <p>
                  <strong>Bên A (Gia đình):</strong> Nguyễn Văn An (Chủ hộ) • Bảo vệ 04 thành viên.
                </p>
                <p>
                  <strong>Bên B (Bác sĩ chuyên môn):</strong> {doctorName} (BV Đại học Y Dược TP.HCM).
                </p>
                <p>
                  <strong>Bên C (Cơ sở y tế bảo trợ):</strong> Bệnh viện Đại học Y Dược TP.HCM.
                </p>
                <p>
                  <strong>Bên D (Vận hành nền tảng):</strong> FamiDoc Healthcare Corporation (Phí công nghệ 15% CFG-03).
                </p>
                <p className="text-slate-500 italic">
                  Các bên cam kết tuân thủ Luật Khám bệnh, chữa bệnh 2023, Luật Giao dịch điện tử 2023 và quy chuẩn bảo mật hồ sơ sức khỏe y tế ISO 27799.
                </p>
              </div>

              {/* OTP & Signature Area */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                <span className="font-bold text-xs text-slate-800 uppercase block">
                  Khu vực Ký điện tử (E-Signature &amp; Smart OTP)
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-0.5 text-xs">
                    <div className="tabular-nums font-bold text-slate-900">Người ký: NGUYỄN VĂN AN (Đại diện chủ hộ)</div>
                    <div className="text-[11px] text-slate-400">Khóa ký số điện tử SHA-256 / Viettel-CA OTP Token</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Mã OTP"
                      className="w-24 px-2 py-1 text-center tabular-nums font-bold border rounded-lg bg-slate-50 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        isOtpVerified
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
                      }`}
                    >
                      {isOtpVerified ? 'Đã xác thực OTP ✓' : 'Xác thực'}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      if (formError) setFormError(null);
                    }}
                    className="mt-0.5 rounded text-[#2563eb]"
                  />
                  <span>
                    Tôi xác nhận là đại diện hợp pháp của các thành viên trên, đã đọc, hiểu rõ toàn bộ Điều khoản Hợp đồng 4 Bên và đồng ý ký kết bằng phương thức điện tử có giá trị pháp lý tương đương văn bản.
                  </span>
                </label>
              </div>

              {formError && (
                <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] shrink-0 text-red-500">error</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Pricing & Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tổng thanh toán ({packageName}):</span>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#2563eb]">{packagePrice}</div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isSigning || !isOtpVerified || !agreedTerms}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </button>
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

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-xs mx-auto space-y-2">
                <div className="text-xs text-slate-500">Mã hóa đơn: <strong>INV-FMD-REGR821</strong></div>
                <div className="text-lg font-bold tabular-nums text-[#2563eb]">{packagePrice}</div>
                <Link
                  href="/family/billing"
                  className="block w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Mở Mã VietQR Thanh Toán Ngay
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

