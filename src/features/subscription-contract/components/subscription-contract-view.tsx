'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ContractSigningWizard } from './contract-signing-wizard';

export function SubscriptionContractView() {
  const [activeTab, setActiveTab] = useState<'contract' | 'benefits' | 'upgrade'>('contract');
  const [isSigningWizardOpen, setIsSigningWizardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Quản Lý Gói Dịch Vụ &amp; Hợp Đồng Điện Tử 4 Bên
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                Hợp đồng có hiệu lực pháp lý
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Hợp đồng cung cấp dịch vụ bác sĩ gia đình số <strong>FMD-HD-88219/2026</strong> xác thực ký số điện tử theo Luật Giao dịch điện tử &amp; Bộ Y Tế.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsSigningWizardOpen(true)}
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              <span>Ký Hợp Đồng Mới (SCR-15)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setToastMessage('Đang tải file hợp đồng PDF có chứng thư ký số HSM TSA...');
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#0f172a] border border-slate-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-red-500">picture_as_pdf</span>
              <span>Tải bản PDF hợp đồng</span>
            </button>
            <Link
              href="/family/billing"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f172a] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Lịch sử thanh toán</span>
            </Link>
          </div>
        </div>

        {/* Current Active Package Card Overview */}
        <div className="bg-linear-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px] text-blue-300">verified</span>
                Gói đang sử dụng: GIA ĐÌNH TOÀN DIỆN (3 Tháng)
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Chăm Sóc Y Tế Toàn Diện 4 Thành Viên
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Bác sĩ quản nhiệm riêng phụ trách theo dõi sinh hiệu, thăm khám tại nhà định kỳ, lấy mẫu xét nghiệm tận nơi và liên kết ưu tiên Fast-Track khi nhập viện tuyến đầu.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100 pt-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Thời hạn hợp đồng:</span>
                  <span className="font-bold text-white">01/01/2026 - 31/12/2026</span>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <span className="text-slate-400 block text-[10px]">Tình trạng:</span>
                  <span className="font-bold text-emerald-300">Đang kích hoạt (Còn 65 ngày)</span>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <span className="text-slate-400 block text-[10px]">Định danh hộ:</span>
                  <span className="font-bold text-white tabular-nums">FAM-88219</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 space-y-3">
              <span className="text-xs font-bold text-blue-200 block uppercase tracking-wider">
                Hạn Mức Quyền Lợi Kỳ Này
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between py-1">
                    <span>Khám tại nhà:</span>
                    <strong className="text-white">Còn 3 / 5 lượt</strong>
                  </div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between py-1">
                    <span>Tư vấn Telehealth:</span>
                    <strong className="text-white">Còn 18 / 20 lượt</strong>
                  </div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between py-1">
                    <span>Xét nghiệm máu định kỳ:</span>
                    <strong className="text-white">Đã dùng 1 / 2 đợt</strong>
                  </div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
              </div>

              <Link
                href="/packages"
                className="block text-center w-full py-2 bg-white text-[#0f172a] hover:bg-blue-50 font-bold rounded-xl text-xs transition-colors shadow-xs mt-3"
              >
                Gia hạn hoặc Đổi gói khám
              </Link>
            </div>
          </div>

          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'contract', label: 'Văn bản Hợp đồng 4 Bên & Chữ ký số', icon: 'history_edu' },
            { id: 'benefits', label: 'Chi tiết quyền lợi & Quy chế sử dụng', icon: 'rule' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as 'contract' | 'benefits')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === t.id
                ? 'bg-[#2563eb] text-white shadow-xs'
                : 'text-[#475569] hover:bg-slate-100'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: 4-PARTY CONTRACT DOCUMENT & DIGITAL SIGNATURES */}
        {activeTab === 'contract' && (
          <div className="space-y-6">
            {/* 4 Parties Signatures Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Party A */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2563eb]">
                    BÊN A: ĐẠI DIỆN HỘ
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0f172a]">Nguyễn Văn An</h4>
                  <p className="text-[11px] text-slate-400">CCCD: 001092003891</p>
                  <p className="text-[11px] text-[#475569] mt-1">Chủ hộ gia đình FAM-88219</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-[#03864b] space-y-0.5">
                  <div className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">done_all</span>
                    ĐÃ KÝ ĐIỆN TỬ
                  </div>
                  <div>Xác thực OTP: 0912 345 678</div>
                  <div className="text-[10px] text-slate-400">09:15 01/01/2026</div>
                </div>
              </div>

              {/* Party B */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    BÊN B: BÁC SĨ QUẢN NHIỆM
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0f172a]">PGS.TS Nguyễn Trọng Nghĩa</h4>
                  <p className="text-[11px] text-slate-400">CCHN: 004128/BYT</p>
                  <p className="text-[11px] text-[#475569] mt-1">Bác sĩ Trưởng khoa phụ trách</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-[#03864b] space-y-0.5">
                  <div className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">done_all</span>
                    KÝ SỐ VIETTEL-CA
                  </div>
                  <div>Chứng thư: 5402 8812 CA</div>
                  <div className="text-[10px] text-slate-400">09:40 01/01/2026</div>
                </div>
              </div>

              {/* Party C */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                    BÊN C: BV ĐỐI TÁC
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0f172a]">BV Đại học Y Dược TP.HCM</h4>
                  <p className="text-[11px] text-slate-400">Tuyến: Trung Ương</p>
                  <p className="text-[11px] text-[#475569] mt-1">Bảo trợ hội chẩn &amp; Fast-Track</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-[#03864b] space-y-0.5">
                  <div className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">done_all</span>
                    KÝ SỐ VNPT-CA
                  </div>
                  <div>Tổ chức: UMC-HCMC-CA</div>
                  <div className="text-[10px] text-slate-400">10:05 01/01/2026</div>
                </div>
              </div>

              {/* Party D */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    BÊN D: FAMIDOC PRO
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0f172a]">FamiDoc Healthcare Corp</h4>
                  <p className="text-[11px] text-slate-400">MST: 0317892182</p>
                  <p className="text-[11px] text-[#475569] mt-1">Đơn vị vận hành nền tảng y tế</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-[#03864b] space-y-0.5">
                  <div className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">done_all</span>
                    DẤU THỜI GIAN TSA
                  </div>
                  <div>Mã khóa: SHA-256 EMR-SAFE</div>
                  <div className="text-[10px] text-slate-400">10:10 01/01/2026</div>
                </div>
              </div>
            </div>

            {/* Contract Body Viewer */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="text-center border-b border-slate-100 pb-5 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </span>
                <p className="text-xs font-semibold text-slate-500">Độc lập - Tự do - Hạnh phúc</p>
                <h3 className="text-lg sm:text-xl font-bold text-[#0f172a] pt-2">
                  HỢP ĐỒNG ĐIỆN TỬ CUNG CẤP DỊCH VỤ BÁC SĨ GIA ĐÌNH &amp; CHĂM SÓC SỨC KHỎE
                </h3>
                <p className="text-xs tabular-nums text-[#2563eb]">Số HĐ: FMD-HD-88219/2026</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#334155] leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#0f172a] text-xs uppercase mb-1">
                    ĐIỀU 1: PHẠM VI DỊCH VỤ &amp; QUYỀN LỢI ĐƯỢC HƯỞNG
                  </h4>
                  <p>
                    Bên B (Bác sĩ quản nhiệm) và Bên D (FamiDoc Pro) cam kết cung cấp gói chăm sóc sức khỏe gia đình trọn gói cho 4 thành viên thuộc hộ Bên A, bao gồm: 5 lượt thăm khám trực tiếp tại tư gia trong năm, 20 lượt tư vấn trực tuyến Telehealth, lập hồ sơ bệnh án điện tử EHR trọn đời và lấy mẫu xét nghiệm định kỳ tại nhà.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#0f172a] text-xs uppercase mb-1">
                    ĐIỀU 2: BẢO LÃNH VIỆN PHÍ &amp; FAST-TRACK TUYẾN ĐẦU
                  </h4>
                  <p>
                    Bên C (Bệnh viện đối tác) tiếp nhận bệnh nhân của Bên A theo luồng ưu tiên Fast-Track khi có giấy chuyển tuyến điện tử của Bên B; miễn giảm thời gian chờ đợi tại khoa Khám bệnh và hỗ trợ thanh toán bảo hiểm y tế theo quy định của Pháp luật.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#0f172a] text-xs uppercase mb-1">
                    ĐIỀU 3: BẢO MẬT DỮ LIỆU BỆNH ÁN &amp; TIÊU CHUẨN HIPAA
                  </h4>
                  <p>
                    Toàn bộ hồ sơ bệnh án, thông tin sinh hiệu IoT, hình ảnh chẩn đoán và đơn thuốc được mã hóa bảo mật theo tiêu chuẩn HIPAA và ISO 27799:2016 Y tế. Bên D cam kết tuyệt đối không chia sẻ dữ liệu y khoa cá nhân cho bất kỳ bên thứ ba nào nếu không có sự đồng thuận bằng văn bản của Bên A.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <span>Hợp đồng được lưu trữ an toàn trên mạng lưới điện toán đám mây FamiDoc Vault.</span>
                <button
                  type="button"
                  onClick={() => {
                    setToastMessage('Đang tạo bản in hợp đồng điện tử có đóng dấu...');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="font-bold text-[#2563eb] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>In bản sao hợp đồng</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BENEFITS & POLICY */}
        {activeTab === 'benefits' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb]">rule</span>
                Quy Chế Sử Dụng Lượt Khám Tại Nhà
              </h4>
              <ul className="text-xs text-[#475569] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#2563eb] font-bold">•</span>
                  <span>Lượt khám được phân bổ dùng chung linh hoạt cho mọi thành viên trong hộ gia đình.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2563eb] font-bold">•</span>
                  <span>Cần đặt trước tối thiểu 03 tiếng trong giờ hành chính hoặc đặt lịch hẹn khẩn cấp qua Hotline 1900 6868.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2563eb] font-bold">•</span>
                  <span>Bác sĩ mang theo bộ vali trang thiết bị: Máy đo điện tim 3 cần, máy siêu âm xách tay, kit test nhanh cúm/tiểu đường.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">health_and_safety</span>
                Chính Sách Đổi Bác Sĩ &amp; Quy Chế Vòng Đời Hợp Đồng (GB-12 &amp; BF-06)
              </h4>
              <ul className="text-xs text-[#475569] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Gia đình có quyền yêu cầu điều chuyển Bác sĩ quản nhiệm khác qua trung tâm điều phối CSYT nếu chuyên khoa chưa tương thích.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Quy định GB-12: Hệ thống ghi nhận lý do chấm dứt và đóng quyền truy cập dịch vụ, phiên bản này không thực hiện hoàn tiền hay bồi thường tài chính trực tiếp trên ứng dụng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Quy định BF-06 &amp; BR-06: Mỗi hộ duy trì duy nhất 1 hợp đồng Active. Số lượt khám chưa sử dụng không cộng dồn sang gói mới; việc nâng cấp/gia hạn tạo hợp đồng kế tiếp độc lập sau khi hợp đồng hiện tại đáo hạn.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Sequential 4-Party Digital Contract Signing Wizard (SCR-15 / Wireframe III.5.1) */}
      {isSigningWizardOpen && (
        <ContractSigningWizard
          packageName="Gói Gia Đình Toàn Diện VIP (12 Tháng)"
          packagePrice="9.600.000 đ"
          doctorName="BS. CKII Lê Hoàng Nam"
          onClose={() => setIsSigningWizardOpen(false)}
        />
      )}

      {/* Accessible Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}


