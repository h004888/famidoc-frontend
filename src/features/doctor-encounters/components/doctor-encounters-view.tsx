'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DoctorNav } from '@/components/layout';

interface PrescriptionItem {
  id: string;
  name: string;
  activeIngredient: string;
  dosage: string;
  route: string;
  quantity: number;
  unit: string;
  instructions: string;
}

const DEFAULT_PRESCRIPTIONS: PrescriptionItem[] = [
  {
    id: 'rx-01',
    name: 'Amlor (Amlodipine)',
    activeIngredient: 'Amlodipine besylate',
    dosage: '5mg',
    route: 'Đường uống',
    quantity: 30,
    unit: 'Viên',
    instructions: 'Uống 1 viên vào lúc 08:00 sáng mỗi ngày, sau bữa ăn',
  },
  {
    id: 'rx-02',
    name: 'Glucophage (Metformin)',
    activeIngredient: 'Metformin hydrochloride',
    dosage: '500mg',
    route: 'Đường uống',
    quantity: 30,
    unit: 'Viên',
    instructions: 'Uống 1 viên ngay sau bữa ăn tối',
  },
];

export function DoctorEncountersView() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(DEFAULT_PRESCRIPTIONS);
  const [isSigned, setIsSigned] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // New drug input state
  const [drugName, setDrugName] = useState('');
  const [drugDosage, setDrugDosage] = useState('');
  const [drugInstructions, setDrugInstructions] = useState('');

  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName.trim()) return;

    const newDrug: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      name: drugName,
      activeIngredient: drugName,
      dosage: drugDosage || '1 viên',
      route: 'Đường uống',
      quantity: 30,
      unit: 'Viên',
      instructions: drugInstructions || 'Uống theo chỉ định',
    };

    setPrescriptions([...prescriptions, newDrug]);
    setDrugName('');
    setDrugDosage('');
    setDrugInstructions('');
  };

  const handleRemoveDrug = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const handleDigitalSign = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setIsSigned(true);
      alert('Đã khóa mã hóa bệnh án EMR và hoàn tất Ký số điện tử HSM Viettel-CA!');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <DoctorNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Patient Identity Top Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl shrink-0">
              👨‍🦳
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-[#0f172a]">
                  Phiếu Khám Lâm Sàng Điện Tử (Chuẩn SOAP &amp; EMR)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563eb] border border-blue-200">
                  Mã ca: ENC-88219-01
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Bệnh nhân: <strong className="text-[#0f172a]">Nguyễn Văn Phúc (78 tuổi)</strong> • Hộ: FAM-88219 • BHYT: GD4790123891024
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Link
              href="/doctor/telemedicine"
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              <span>Mở phòng gọi video</span>
            </Link>
            <button
              type="button"
              onClick={handleDigitalSign}
              disabled={isSigned || isSigning}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                isSigned
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white'
              }`}
            >
              {isSigning ? (
                <span>Đang chứng thực HSM...</span>
              ) : isSigned ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Đã Ký Số Viettel-CA</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>Khóa EMR &amp; Ký số HSM</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Allergy Danger Alert Strip */}
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-[18px]">warning</span>
            <span>
              <strong>CẢNH BÁO DỊ ỨNG THUỐC BỆNH NHÂN:</strong> Tiền sử dị ứng kháng sinh nhóm <strong>Penicillin / Beta-lactam</strong> và Hải sản có vỏ.
            </span>
          </div>
          <span className="text-[11px] font-bold text-red-700 bg-white px-2 py-0.5 rounded border border-red-200">
            Hạn chế tuyệt đối
          </span>
        </div>

        {/* 4 Pillars of SOAP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): S - O - A Note Pads */}
          <div className="lg:col-span-7 space-y-5">
            {/* S - Subjective */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <label className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center text-[11px] font-bold">S</span>
                  Subjective: Bệnh sử &amp; Triệu chứng cơ năng
                </label>
                <span className="text-[11px] text-slate-400">Ghi nhận từ lời kể bệnh nhân</span>
              </div>
              <textarea
                rows={3}
                defaultValue="Bệnh nhân 78 tuổi có tiền sử tăng huyết áp và đái tháo đường typ 2 hơn 10 năm. 2 ngày gần đây thấy hoa mắt nhẹ khi thức dậy buổi sáng, không tức ngực, không khó thở khi gắng sức. Ăn uống bình thường, tuân thủ thuốc đều."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-[#334155] leading-relaxed bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            {/* O - Objective */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <label className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center text-[11px] font-bold">O</span>
                  Objective: Khám thực thể &amp; Dấu hiệu sinh tồn
                </label>
                <span className="text-[11px] text-emerald-600 font-semibold">Đồng bộ từ IoT Omron</span>
              </div>

              {/* Vitals Input Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Huyết áp:</span>
                  <input
                    type="text"
                    defaultValue="135/85 mmHg"
                    className="font-bold text-[#0f172a] bg-transparent border-0 p-0 text-xs focus:ring-0"
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Nhịp tim:</span>
                  <input
                    type="text"
                    defaultValue="76 bpm"
                    className="font-bold text-[#0f172a] bg-transparent border-0 p-0 text-xs focus:ring-0"
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">SpO2:</span>
                  <input
                    type="text"
                    defaultValue="98%"
                    className="font-bold text-emerald-600 bg-transparent border-0 p-0 text-xs focus:ring-0"
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Cân nặng:</span>
                  <input
                    type="text"
                    defaultValue="65.0 kg"
                    className="font-bold text-[#0f172a] bg-transparent border-0 p-0 text-xs focus:ring-0"
                  />
                </div>
              </div>

              <textarea
                rows={2}
                defaultValue="Thể trạng tiếp xúc tốt, niêm mạc hồng hào. Tim đều T1, T2 rõ, không âm thổi bệnh lý. Phổi thông khí tốt, không ran. Khớp gối 2 bên không sưng nóng đỏ, ấn đau nhẹ khe khớp gối phải."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-[#334155] leading-relaxed bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            {/* A - Assessment */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <label className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center text-[11px] font-bold">A</span>
                  Assessment: Chẩn đoán xác định &amp; Phân loại mã ICD-10
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Chẩn đoán chính (Mã ICD-10):</span>
                  <input
                    type="text"
                    defaultValue="[I10] Tăng huyết áp vô căn (nguyên phát)"
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold text-[#2563eb] bg-blue-50/30 text-xs"
                  />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Chẩn đoán kèm theo:</span>
                  <input
                    type="text"
                    defaultValue="[E11.9] Đái tháo đường type 2 không biến chứng"
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-semibold text-[#0f172a] bg-slate-50 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): P - Plan & 1NF Prescription Table */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <label className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center text-[11px] font-bold">P</span>
                  Plan: Đơn Thuốc Số Chuẩn 1NF
                </label>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  An toàn tương tác thuốc ✓
                </span>
              </div>

              {/* Prescription Items List */}
              <div className="space-y-2">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveDrug(rx.id)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                    <div className="font-bold text-[#0f172a] flex items-center gap-1.5">
                      <span>{rx.name}</span>
                      <span className="text-slate-400 font-normal">({rx.dosage})</span>
                    </div>
                    <div className="text-[11px] text-[#2563eb] font-mono">
                      Số lượng: {rx.quantity} {rx.unit} • {rx.route}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {rx.instructions}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Drug Mini-Form */}
              <form onSubmit={handleAddDrug} className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2 text-xs">
                <span className="font-bold text-[#2563eb] block text-[11px]">
                  + Thêm thuốc từ Dược thư Quốc gia
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={drugName}
                    onChange={(e) => setDrugName(e.target.value)}
                    placeholder="Tên thuốc / Biệt dược..."
                    className="p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  <input
                    type="text"
                    value={drugDosage}
                    onChange={(e) => setDrugDosage(e.target.value)}
                    placeholder="Hàm lượng (vd: 10mg)..."
                    className="p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={drugInstructions}
                  onChange={(e) => setDrugInstructions(e.target.value)}
                  placeholder="Cách dùng: Uống 1 viên sau ăn..."
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-[#2563eb] text-white rounded-lg font-semibold text-xs hover:bg-[#1d4ed8]"
                >
                  Thêm vào đơn thuốc
                </button>
              </form>

              {/* Clinical Care Advice */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[#0f172a]">Lời dặn dò của Bác sĩ gia đình:</span>
                <textarea
                  rows={2}
                  defaultValue="Tiếp tục chế độ ăn giảm muối (< 5g/ngày). Vận động đi bộ nhẹ nhàng 20 phút mỗi chiều. Tái khám sau 30 ngày hoặc liên hệ ngay nếu huyết áp đo tại nhà > 150 mmHg."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#334155] bg-slate-50"
                />
              </div>

              {/* Status Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái bệnh án:</span>
                  <span className="font-bold text-[#2563eb]">
                    {isSigned ? 'Đã khóa mã hóa (Read-only)' : 'Bản nháp đang mở'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chữ ký số Bác sĩ:</span>
                  <span className="font-mono text-[#03864b] font-bold">
                    {isSigned ? 'PGS.TS Nguyễn Trọng Nghĩa (Viettel-CA)' : 'Chưa ký'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

