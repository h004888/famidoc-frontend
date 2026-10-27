'use client';

import React, { useState } from 'react';
import { DoctorNav } from '@/components/layout';

export function DoctorVerificationView() {
  const cchnNumber = '004128/BYT-CCHN';
  const issueDate = '15/06/2012';
  const issuingAuthority = 'Cục Quản lý Khám chữa bệnh - Bộ Y Tế';
  const scopeOfPractice = 'Khám bệnh, chữa bệnh Nội khoa & Y học gia đình';
  const selectedHospital = 'BV Đại học Y Dược TP.HCM';
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <DoctorNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Hồ Sơ Y Khoa &amp; Xác Thực Chứng Chỉ Hành Nghề (CCHN)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                Xác thực định danh Bộ Y Tế
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Thẩm định năng lực chuyên môn, văn bằng y khoa và phân quyền điều phối thăm khám tại gia theo quy định của Luật Khám bệnh, chữa bệnh.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUpdateModal(true)}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Nộp bổ sung văn bằng mới</span>
          </button>
        </div>

        {/* Verification Status Banner (3-step pipeline) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Tiến trình thẩm định hồ sơ y khoa
              </span>
              <h3 className="text-base font-bold text-[#0f172a] mt-0.5">
                Hồ sơ đã được phê duyệt toàn diện &amp; Cấp quyền Kê đơn điện tử
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f] flex items-center gap-1.5 self-start sm:self-auto">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Hoạt động hợp pháp 100%
            </span>
          </div>

          {/* 3 Step Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Bước 1: Nộp CCHN &amp; Văn bằng</span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-snug">
                Đã tiếp nhận bản chụp công chứng CCHN số 004128/BYT và Bằng Tiến sĩ Y khoa.
              </p>
              <div className="text-[10px] text-slate-400 pt-1">Hoàn thành ngày 01/01/2026</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Bước 2: BV Đối tác thẩm định</span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-snug">
                Hội đồng Khoa học Bệnh viện ĐH Y Dược TP.HCM đã phê duyệt chuyên môn Trưởng khoa.
              </p>
              <div className="text-[10px] text-slate-400 pt-1">Hoàn thành ngày 02/01/2026</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Bước 3: Cấp Chứng thư Ký số HSM</span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-snug">
                Đã cấp chứng thư số Viettel-CA tích hợp vào hệ thống EMR kê đơn tự động.
              </p>
              <div className="text-[10px] text-slate-400 pt-1">Hiệu lực đến 31/12/2028</div>
            </div>
          </div>
        </div>

        {/* Credentials Detail & Attached Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Credential Fields (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="material-symbols-outlined text-[#2563eb]">badge</span>
              Thông Tin Chứng Chỉ Hành Nghề Bộ Y Tế
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-[11px] block mb-1">Số CCHN Bộ Y Tế:</span>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-sm text-[#2563eb]">
                    {cchnNumber}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block mb-1">Ngày cấp chứng chỉ:</span>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-sm text-[#0f172a]">
                    {issueDate}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Cơ quan có thẩm quyền cấp phép:</span>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-[#0f172a]">
                  {issuingAuthority}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Phạm vi hoạt động chuyên môn được phê duyệt:</span>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-[#0f172a]">
                  {scopeOfPractice}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Cơ sở khám chữa bệnh công tác chính:</span>
                <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 font-bold text-[#2563eb] flex items-center justify-between">
                  <span>{selectedHospital}</span>
                  <span className="text-[10px] text-slate-500 font-normal">Bệnh viện Tuyến 1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Attached Certificates (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="material-symbols-outlined text-[#2563eb]">folder_special</span>
              Văn Bằng &amp; Hồ Sơ Đã Nộp (4)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">picture_as_pdf</span>
                  <div>
                    <span className="font-bold text-[#0f172a] block">Chung_Chi_Hanh_Nghe_BYT_Scan.pdf</span>
                    <span className="text-[10px] text-slate-400">Đã đối chiếu với Cổng tra cứu BYT</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                  Hợp lệ
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">picture_as_pdf</span>
                  <div>
                    <span className="font-bold text-[#0f172a] block">Bang_Tien_Si_Y_Khoa_Paris.pdf</span>
                    <span className="text-[10px] text-slate-400">Đại học Y Paris Descartes (2008)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                  Hợp lệ
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">picture_as_pdf</span>
                  <div>
                    <span className="font-bold text-[#0f172a] block">Quyet_Dinh_Bo_Nhiem_Pho_Giao_Su.pdf</span>
                    <span className="text-[10px] text-slate-400">Hội đồng Chức danh Giáo sư Nhà nước</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                  Hợp lệ
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">picture_as_pdf</span>
                  <div>
                    <span className="font-bold text-[#0f172a] block">Chung_Thu_Ky_So_ViettelCA.cer</span>
                    <span className="text-[10px] text-slate-400">Khóa ký số đơn thuốc điện tử HSM</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                  Hoạt động
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Additional Document Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-[#0f172a]">Nộp Bổ Sung Văn Bằng / Chứng Chỉ Y Khoa</h3>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#475569] mb-1">Loại chứng chỉ / Văn bằng *</label>
                <select className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]">
                  <option>Chứng chỉ đào tạo liên tục (CME)</option>
                  <option>Chứng chỉ Chuyên khoa II</option>
                  <option>Chứng chỉ Siêu âm / Chẩn đoán hình ảnh</option>
                  <option>Văn bằng khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Cơ quan / Bệnh viện cấp *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đại học Y Dược TP.HCM"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Tải file PDF hoặc ảnh chụp scan *</label>
                <input
                  type="file"
                  className="w-full p-2 rounded-lg border border-dashed border-slate-300 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Đã tải lên văn bằng thành công! Hội đồng chuyên môn cơ sở y tế sẽ thẩm định trong vòng 24 giờ.');
                  setShowUpdateModal(false);
                }}
                className="flex-1 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-xs"
              >
                Gửi phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

