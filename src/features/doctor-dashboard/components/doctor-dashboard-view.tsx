'use client';

import React, { useState } from 'react';

export function DoctorDashboardView() {
  const [_activeQueue] = useState<'pending' | 'in_progress' | 'signed'>('pending');

  const patients = [
    {
      id: 'PT-01',
      name: 'Nguyễn Văn Phúc (78 tuổi)',
      chiefComplaint: 'Tăng huyết áp định kỳ & xét nghiệm HbA1c',
      triage: 'Cấp độ 2 (Ưu tiên cao)',
      time: '09:00 Hôm nay',
      family: 'Hộ FAM-88219',
      status: 'pending',
    },
    {
      id: 'PT-02',
      name: 'Lê Thu Trang (34 tuổi)',
      chiefComplaint: 'Khám thai định kỳ tuần 28 & tư vấn dinh dưỡng',
      triage: 'Cấp độ 3 (Tiêu chuẩn)',
      time: '10:30 Hôm nay',
      family: 'Hộ FAM-44012',
      status: 'pending',
    },
    {
      id: 'PT-03',
      name: 'Hoàng Anh Dũng (52 tuổi)',
      chiefComplaint: 'Đau khớp gối tái phát sau lao động nặng',
      triage: 'Cấp độ 3 (Tiêu chuẩn)',
      time: '14:00 Hôm nay',
      family: 'Hộ FAM-11983',
      status: 'pending',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Doctor Header Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-sm border-2 border-primary-container">
            BS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-on-surface">Cổng Bác sĩ: Bảng điều khiển Lâm sàng</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] border border-[#b7eb8f] text-[#03864b]">
                CCHN: 004128/BYT
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Bác sĩ trưởng khoa: <span className="font-semibold text-primary">PGS.TS Nguyễn Trọng Nghĩa</span> • Cơ sở: BV Đại học Y Dược
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-outline block">Thu nhập Escrow khả dụng:</span>
            <span className="text-sm font-bold text-primary font-mono">18.450.000đ</span>
          </div>
          <button className="px-4 py-2 bg-primary-container text-white text-xs font-semibold rounded-lg hover:bg-primary shadow-sm transition-colors">
            Yêu cầu Quyết toán
          </button>
        </div>
      </div>

      {/* KPI Clinical Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
          <span className="text-xs text-outline font-medium">Ca khám trong ngày</span>
          <div className="text-2xl font-bold text-primary mt-1">12 ca</div>
          <span className="text-[11px] text-[#03864b]">6 lượt thăm khám tại nhà</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
          <span className="text-xs text-outline font-medium">Đang trong phòng khám</span>
          <div className="text-2xl font-bold text-[#ae5c04] mt-1">3 ca</div>
          <span className="text-[11px] text-outline">Thời gian trung bình 20 phút</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
          <span className="text-xs text-outline font-medium">Chờ ký số HSM</span>
          <div className="text-2xl font-bold text-[#d52c1f] mt-1">5 đơn</div>
          <span className="text-[11px] text-[#d52c1f]">Cần ký trước 18:00</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
          <span className="text-xs text-outline font-medium">Đánh giá chất lượng SLA</span>
          <div className="text-2xl font-bold text-[#03864b] mt-1">4.9 / 5.0</div>
          <span className="text-[11px] text-outline">420+ gia đình phản hồi</span>
        </div>
      </div>

      {/* Main Workspace: Patient Queue & SOAP Note Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue List */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3">
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">queue</span>
              Hàng đợi Bệnh nhân
            </h3>
            <span className="text-xs bg-surface-container px-2 py-0.5 rounded-full font-bold text-primary">
              {patients.length} ca chờ
            </span>
          </div>

          <div className="space-y-3">
            {patients.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-outline-variant bg-surface-container-low hover:border-primary transition-all space-y-2 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{p.name}</h4>
                    <span className="text-[11px] text-primary font-medium">{p.family}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff7e6] text-[#ae5c04] border border-[#ffd591]">
                    {p.triage}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-1">
                  Lý do khám: {p.chiefComplaint}
                </p>
                {/* m-02: Enhanced touch target py-2 px-3 */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-outline-variant">
                  <span className="text-outline font-mono text-[11px]">{p.time}</span>
                  <button className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-container transition-colors min-h-[40px] flex items-center justify-center">
                    Mở Phiếu khám
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick SOAP Note Pad */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3">
            <div>
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">clinical_notes</span>
                Lập Phiếu Khám Điện Tử (Chuẩn SOAP)
              </h3>
              <p className="text-xs text-on-surface-variant">Bệnh nhân: Nguyễn Văn Phúc (78 tuổi)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-mono font-bold text-primary">
                ICD-10: [I10]
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="soap-subjective" className="block text-xs font-bold text-on-surface mb-1">
                S - Subjective (Triệu chứng cơ năng &amp; Tiền sử)
              </label>
              <textarea
                id="soap-subjective"
                rows={2}
                defaultValue="Bệnh nhân thấy hoa mắt nhẹ vào buổi sáng, không đau ngực khó thở, ăn ngủ tạm ổn."
                className="w-full p-2.5 rounded-lg border border-outline-variant text-xs bg-surface-container-low focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="soap-objective" className="block text-xs font-bold text-on-surface mb-1">
                O - Objective (Khám thực thể &amp; Dấu hiệu sinh tồn)
              </label>
              <textarea
                id="soap-objective"
                rows={2}
                defaultValue="HA: 135/85 mmHg, Nhịp tim: 76 bpm, SpO2: 98%, Phổi trong, không ran, phù chân (-)."
                className="w-full p-2.5 rounded-lg border border-outline-variant text-xs bg-surface-container-low focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="soap-assessment" className="block text-xs font-bold text-on-surface mb-1">
                A - Assessment (Chẩn đoán lâm sàng)
              </label>
              <input
                id="soap-assessment"
                type="text"
                defaultValue="Tăng huyết áp nguyên phát độ 1 (ICD-10: I10), Đái tháo đường type 2 (E11.9)"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant text-xs bg-surface-container-low focus:outline-none focus:border-primary font-semibold text-primary"
              />
            </div>

            <div>
              <label htmlFor="soap-plan" className="block text-xs font-bold text-on-surface mb-1">
                P - Plan (Phác đồ &amp; Kê đơn điện tử)
              </label>
              <textarea
                id="soap-plan"
                rows={2}
                defaultValue="Tiếp tục Amlodipine 5mg sáng 1 viên. Theo dõi huyết áp tại nhà 2 lần/ngày. Hẹn khám lại sau 1 tháng."
                className="w-full p-2.5 rounded-lg border border-outline-variant text-xs bg-surface-container-low focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-outline-variant">
              <button className="px-4 py-2 border border-outline-variant text-xs font-semibold rounded-lg hover:bg-surface-container transition-colors">
                Lưu nháp
              </button>
              <button className="px-5 py-2 bg-primary-container hover:bg-primary text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Ký số HSM &amp; Hoàn tất Ca khám
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

