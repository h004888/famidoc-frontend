'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useContractWorkflow,
  updateContractStep,
  resetContractWorkflow,
} from '@/lib/contract-workflow-storage';

export function DoctorContractsView() {
  const contract = useContractWorkflow();
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [agreedEthics, setAgreedEthics] = useState(false);

  const handleExecuteDoctorSign = () => {
    if (!agreedEthics) return;
    setSigning(true);
    setTimeout(() => {
      updateContractStep('PENDING_PAYMENT', {
        doctorSigned: true,
        doctorSignedAt: new Date().toLocaleString('vi-VN'),
        doctorSignerName: 'BS.CKII Trần Thanh Mai',
        doctorCchn: '004128/HCM',
      });
      setSigning(false);
      setShowSignModal(false);
      toast.success(
        `Đã ký số cam kết phụ trách Hộ ${contract.familyId}! Hợp đồng chuyển sang trạng thái chờ Gia đình thanh toán VietQR (SCR-36).`
      );
    }, 1200);
  };

  const handleResetDemo = () => {
    resetContractWorkflow();
    toast.success('Đã reset dữ liệu luồng hợp đồng về trạng thái mẫu!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 font-sans">
      {/* Header Màn hình SCR-16 Bác sĩ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="material-symbols-outlined text-[17px]">stethoscope</span>
            <span>BS.CKII Trần Thanh Mai • CCHN: 004128/HCM • Màn hình SCR-16</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Hợp Đồng Phụ Trách Sức Khỏe Gia Đình &amp; Ký Cam Kết Y Đức
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tiếp nhận phân công từ BV Đại học Y Dược, xem xét hồ sơ bệnh án ban đầu của gia đình và ký số điện tử (Bên D)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            className="rounded-xl text-xs font-semibold gap-1.5"
            title="Đặt lại trạng thái mẫu để test lại từ đầu"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">restart_alt</span>
            <span>Reset Demo</span>
          </Button>
          <Button asChild size="sm" className="rounded-xl text-xs font-semibold gap-1.5">
            <Link href="/doctor/encounters">
              <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
              <span>Bàn khám SOAP</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tiến trình 4 Bên Real-time */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Tiến trình Ký số 4 Bên ({contract.contractCode})
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              contract.doctorSigned
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
            }`}
          >
            {contract.doctorSigned ? 'Bác Sĩ Đã Hoàn Tất Ký Số ✓' : 'Đang Chờ Bác Sĩ Ký Chấp Thuận (Bên D)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Party A */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">1. Đại diện Gia đình</span>
              <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">{contract.familyHeadName}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{contract.familySignedAt || 'Đã ký OTP'}</div>
          </div>

          {/* Party B */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">2. Nền tảng FamiDoc</span>
              <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">Ban Quản Trị Hệ Thống</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{contract.adminSignedAt || 'Đã duyệt SmartCA'}</div>
          </div>

          {/* Party C */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">3. Bệnh viện ĐHYD</span>
              <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">GS.TS Nguyễn Văn H.</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{contract.facilitySignedAt || 'Đã phân công BS'}</div>
          </div>

          {/* Party D */}
          <div
            className={`p-3.5 rounded-xl border ${
              contract.doctorSigned
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-primary bg-primary/5 ring-2 ring-primary/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">4. Bác sĩ Phụ trách (Bạn)</span>
              <span
                className={`material-symbols-outlined text-[18px] ${
                  contract.doctorSigned ? 'text-emerald-600' : 'text-blue-600 animate-spin'
                }`}
              >
                {contract.doctorSigned ? 'check_circle' : 'progress_activity'}
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">BS.CKII Trần Thanh Mai</div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {contract.doctorSigned ? `${contract.doctorSignedAt}` : 'Chờ bạn ký số Bên D'}
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết Hồ sơ Gia đình & Nhiệm vụ Chuyên môn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Bệnh án Tóm tắt Gia đình cần theo dõi */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hồ Sơ Lâm Sàng Khởi Đầu (Baseline Clinical Profile)
                </h3>
                <p className="text-xs text-slate-500">
                  Hộ gia đình {contract.familyHeadName} • Địa chỉ: {contract.familyAddress}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                4 Thành viên
              </span>
            </div>

            <div className="space-y-4">
              {contract.members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {member.name.charAt(0)}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-900">{member.name}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5">
                          ({member.relation} • {new Date().getFullYear() - member.birthYear} tuổi • {member.gender})
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                      CCCD/GKS: {member.cccdOrBhyt}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-700 pl-9 space-y-1.5">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <div className="text-slate-500 text-[11px] font-semibold">Tiền sử &amp; Bệnh nền ghi nhận:</div>
                      <div className="text-slate-900 font-medium mt-0.5">{member.baselineMedicalHistory}</div>
                    </div>

                    {member.allergies && member.allergies !== 'Không ghi nhận' && member.allergies !== 'Không' && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[#ba1a1a] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] shrink-0">warning</span>
                        <span className="font-semibold text-xs">
                          Cảnh báo dị ứng lâm sàng (CDS GB-10): {member.allergies}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột Phải: Cam kết SLA & Ký số Bác sĩ */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Quyền Lợi Gói &amp; Cam Kết SLA Bác Sĩ Gia Đình
            </h3>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                  home_health
                </span>
                <div>
                  <div className="font-bold text-slate-900">4 Lượt Thăm Khám Tại Nhà / Năm</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Mang theo bộ thiết bị IoT đo ECG, siêu âm xách tay và lấy mẫu xét nghiệm định kỳ tận nơi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80">
                <span className="material-symbols-outlined text-teal-700 text-[18px] shrink-0 mt-0.5">
                  videocam
                </span>
                <div>
                  <div className="font-bold text-slate-900">18 Lượt Tư Vấn Video Telehealth 24/7</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Hỗ trợ qua WebRTC chất lượng HD, tư vấn triệu chứng khẩn cấp, kê đơn điện tử quốc gia.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80">
                <span className="material-symbols-outlined text-purple-700 text-[18px] shrink-0 mt-0.5">
                  sos
                </span>
                <div>
                  <div className="font-bold text-slate-900">SLA Phản Ứng Khẩn Cấp &lt; 15 Phút</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Hỗ trợ sơ cấp cứu ban đầu và điều phối xe cấp cứu chuyển viện tuyến trên nếu xảy ra biến cố đột ngột.
                  </p>
                </div>
              </div>
            </div>

            {/* Trạng thái Ký số */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {contract.doctorSigned ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                    <span>Bạn đã ký số chấp thuận phụ trách hộ gia đình!</span>
                  </div>
                  <span className="text-[11px] text-emerald-700">{contract.doctorSignedAt}</span>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => setShowSignModal(true)}
                  className="w-full py-3 h-auto rounded-xl text-xs sm:text-sm font-bold shadow-md gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">draw</span>
                  <span>Ký Số Chấp Thuận Phụ Trách (Bên D - Bác Sĩ)</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ký Số Bác Sĩ Phụ Trách */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base font-bold">
              <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
              <span>Ký Cam Kết Chuyên Môn Bác Sĩ Gia Đình</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 text-xs text-slate-700 space-y-3">
            <Card className="p-3 bg-slate-50 border-slate-200/70 rounded-xl space-y-1 shadow-none">
              <div className="text-slate-500">Bác sĩ ký cam kết:</div>
              <div className="font-bold text-slate-900 text-sm">BS.CKII Trần Thanh Mai</div>
              <div className="text-slate-600 text-[11px]">Chứng chỉ hành nghề số: <strong>004128/HCM</strong></div>
              <div className="text-slate-600 text-[11px]">Hộ tiếp nhận: <strong>{contract.familyHeadName} (#{contract.familyId})</strong></div>
            </Card>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-700">gavel</span>
                <span>Cam kết trách nhiệm y đức &amp; pháp lý:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800 leading-relaxed">
                <li>Tuân thủ tuyệt đối quy chế chuyên môn theo Thông tư 04/2022/TT-BYT.</li>
                <li>Cập nhật đầy đủ hồ sơ bệnh án EMR sau mỗi lần thăm khám hoặc tư vấn video.</li>
                <li>Không từ chối cấp cứu, duy trì đường dây nóng thường trực đối với các thành viên trong hộ.</li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
              <Checkbox
                checked={agreedEthics}
                onCheckedChange={(checked) => setAgreedEthics(checked === true)}
                className="mt-0.5"
              />
              <span className="text-[11px] text-slate-700 font-medium">
                Tôi đã đọc kỹ hồ sơ lâm sàng của hộ, tự nguyện tiếp nhận và chấp thuận thực hiện nghĩa vụ Bác sĩ Gia đình phụ trách.
              </span>
            </label>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSignModal(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Hủy bỏ
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleExecuteDoctorSign}
              disabled={!agreedEthics || signing}
              className="rounded-xl text-xs font-bold gap-2"
            >
              {signing ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang ký số CCHN...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">draw</span>
                  <span>Xác Nhận Ký Số (Bên D)</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
