'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
    instructions: 'Uống 1 viên vào lúc 08:00 sáng mỗi ngày sau bữa ăn',
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
  const [signSuccessMessage, setSignSuccessMessage] = useState<string | null>(null);

  // New drug input state
  const [drugName, setDrugName] = useState('');
  const [drugDosage, setDrugDosage] = useState('');
  const [drugInstructions, setDrugInstructions] = useState('');

  // Clinical Override for Penicillin Allergy Modal State (Replaces prompt)
  const [pendingAllergyDrug, setPendingAllergyDrug] = useState<{
    drug: PrescriptionItem;
    reason: string;
  } | null>(null);
  const [allergyOverrideError, setAllergyOverrideError] = useState<string | null>(null);

  // Interactive notes state
  const [subjectiveNote, setSubjectiveNote] = useState(
    'Bệnh nhân 78 tuổi có tiền sử tăng huyết áp và đái tháo đường typ 2 hơn 10 năm. 2 ngày gần đây thấy hoa mắt nhẹ khi thức dậy buổi sáng, không tức ngực, không khó thở khi gắng sức. Ăn uống bình thường, tuân thủ uống thuốc đều.'
  );
  const [objectiveExam, setObjectiveExam] = useState(
    'Thể trạng tiếp xúc tốt, niêm mạc hồng hào. Tim đều T1, T2 rõ, không âm thổi bệnh lý. Phổi thông khí tốt, không ran. Khớp gối 2 bên không sưng nóng đỏ, ấn đau nhẹ khe khớp gối phải.'
  );
  const [adviceNote, setAdviceNote] = useState(
    'Tiếp tục chế độ ăn giảm muối (< 5g/ngày). Vận động đi bộ nhẹ nhàng 20 phút mỗi chiều. Tái khám sau 30 ngày hoặc liên hệ ngay nếu huyết áp đo tại nhà > 150 mmHg.'
  );

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
      instructions: drugInstructions || 'Uống theo chỉ định của bác sĩ',
    };

    // Kiểm tra an toàn dị ứng & tương tác thuốc (MSG22 & GB-10)
    const lowerName = drugName.toLowerCase();
    if (lowerName.includes('penicillin') || lowerName.includes('amoxicillin') || lowerName.includes('augmentin')) {
      // Mở modal cảnh báo lâm sàng chuyên dụng (Không dùng prompt thô)
      setPendingAllergyDrug({
        drug: newDrug,
        reason: '',
      });
      setAllergyOverrideError(null);
      return;
    }

    setPrescriptions([...prescriptions, newDrug]);
    setDrugName('');
    setDrugDosage('');
    setDrugInstructions('');
  };

  const handleConfirmAllergyOverride = () => {
    if (!pendingAllergyDrug) return;
    if (!pendingAllergyDrug.reason.trim()) {
      setAllergyOverrideError('Bác sĩ vui lòng ghi rõ lý do ghi đè lâm sàng (Clinical Override Reason) trước khi xác nhận.');
      return;
    }

    const drugWithOverride: PrescriptionItem = {
      ...pendingAllergyDrug.drug,
      instructions: `${pendingAllergyDrug.drug.instructions} [Ghi đè lâm sàng: ${pendingAllergyDrug.reason}]`,
    };

    setPrescriptions([...prescriptions, drugWithOverride]);
    setPendingAllergyDrug(null);
    setAllergyOverrideError(null);
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
      setSignSuccessMessage('Đã khóa mã hóa bệnh án EMR và hoàn tất Ký số điện tử HSM Viettel-CA!');
      setTimeout(() => setSignSuccessMessage(null), 6000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Sign Success Notification */}
        {signSuccessMessage && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px] text-emerald-600">verified</span>
              <span>{signSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSignSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Top Breadcrumb & Quick Actions Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-[#2E37A4] border border-indigo-100">
                <span className="material-symbols-outlined text-[15px]">clinical_notes</span>
                Hồ Sơ Bệnh Án Điện Tử (EMR)
              </span>
              <span>/</span>
              <span className="text-slate-700">Phiếu Khám Lâm Sàng Chuẩn SOAP</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Phiên Khám Trực Tuyến &amp; Đồng Bộ IoT
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-[#2E37A4] border border-indigo-200 shadow-2xs">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                Chữ Ký Số HSM Viettel-CA
              </span>
            </div>
          </div>

          {/* Patient Profile Card (Airy, Clinical Prestige) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4.5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-[#2E37A4]/10">
                  VP
                </div>
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white"
                  title="Bệnh nhân đang kết nối trực tuyến"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Nguyễn Văn Phúc
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    78 tuổi • Nam
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums bg-indigo-50 text-[#2E37A4] border border-indigo-200">
                    Mã ca: ENC-88219-01
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Hộ gia đình: <strong className="text-slate-700">FAM-88219</strong></span>
                  <span>•</span>
                  <span>BHYT: <strong className="text-slate-700 tabular-nums">GD 4 79 01 23891024</strong> (100%)</span>
                  <span>•</span>
                  <span>BS phụ trách: <strong className="text-slate-700">PGS.TS Nguyễn Trọng Nghĩa</strong></span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
              <Link
                href="/doctor/telemedicine"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                <span>Phòng Gọi Telehealth</span>
              </Link>

              <button
                type="button"
                onClick={handleDigitalSign}
                disabled={isSigned || isSigning}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed ${
                  isSigned
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-[#2E37A4] hover:bg-indigo-800 text-white'
                }`}
              >
                {isSigning ? (
                  <span>Đang chứng thực HSM...</span>
                ) : isSigned ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Đã Ký Số Viettel-CA</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>Khóa EMR &amp; Ký Số HSM</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Allergy Danger Alert Strip (Clinical Safety Shield) */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-rose-50/90 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">emergency</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-rose-950 uppercase tracking-wide">Cảnh Báo Dị Ứng Thuốc Lâm Sàng:</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-200/80 text-rose-800 font-bold">
                  Penicillin / Beta-lactam
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-semibold">
                  Hải sản có vỏ
                </span>
              </div>
              <p className="text-rose-700 text-[11px] mt-0.5 font-medium">
                Hệ thống tự động kích hoạt chốt chặn kê đơn (Rule MSG22 &amp; GB-10). Cần ghi đè lâm sàng bắt buộc nếu chỉ định nhóm thuốc này.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-white px-3 py-1 rounded-full border border-rose-200 self-start sm:self-auto shrink-0 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Mức độ nguy cơ: Cao
          </span>
        </div>

        {/* 4 Pillars of SOAP Grid (7 cols Left / 5 cols Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: S (Subjective) - O (Objective) - A (Assessment)              */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* S - Subjective */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 text-[#2E37A4] border border-indigo-200 flex items-center justify-center text-xs font-bold shrink-0">
                    S
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                      Subjective: Bệnh Sử &amp; Triệu Chứng Cơ Năng
                    </h2>
                    <p className="text-[11px] text-slate-500">Ghi nhận trực tiếp từ lời kể bệnh nhân &amp; người nhà</p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">Khám định kỳ tháng 11/2026</span>
              </div>

              {/* Quick Symptom Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gợi ý triệu chứng:</span>
                {[
                  'Hoa mắt sáng sớm',
                  'Không tức ngực',
                  'Không khó thở',
                  'Ăn ngủ bình thường',
                  'Tuân thủ thuốc đều',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!subjectiveNote.includes(tag)) {
                        setSubjectiveNote((prev) => `${prev} • ${tag}.`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={subjectiveNote}
                onChange={(e) => setSubjectiveNote(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all"
              />
            </div>

            {/* O - Objective */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 text-[#2E37A4] border border-indigo-200 flex items-center justify-center text-xs font-bold shrink-0">
                    O
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                      Objective: Dấu Hiệu Sinh Tồn &amp; Khám Thực Thể
                    </h2>
                    <p className="text-[11px] text-slate-500">Khám lâm sàng kết hợp đo lường thiết bị IoT</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đồng bộ từ Omron HEM-7361T
                </span>
              </div>

              {/* Vitals Matrix - 4 High-End Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Huyết áp</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Độ 1 nhẹ" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">135/85</span>
                    <span className="text-[11px] text-slate-400 font-medium">mmHg</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold block">Hơi cao nhẹ (Độ 1)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhịp tim</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bình thường" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">76</span>
                    <span className="text-[11px] text-slate-400 font-medium">bpm</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Nhịp xoang đều</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SpO2</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Tốt" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums">98</span>
                    <span className="text-[11px] text-slate-400 font-medium">%</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Bão hòa tối ưu</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cân nặng</span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500" title="BMI 22.5" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">65.0</span>
                    <span className="text-[11px] text-slate-400 font-medium">kg</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-semibold block">BMI: 22.5 (Chuẩn)</span>
                </div>
              </div>

              {/* Physical Exam Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Ghi nhận khám tuần hoàn, hô hấp &amp; cơ xương khớp:
                </label>
                <textarea
                  rows={3}
                  value={objectiveExam}
                  onChange={(e) => setObjectiveExam(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all"
                />
              </div>
            </div>

            {/* A - Assessment */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 text-[#2E37A4] border border-indigo-200 flex items-center justify-center text-xs font-bold shrink-0">
                    A
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                      Assessment: Chẩn Đoán Xác Định &amp; Mã Bệnh ICD-10
                    </h2>
                    <p className="text-[11px] text-slate-500">Phân loại theo danh mục bệnh tật quốc tế phiên bản 10</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-[#2E37A4] bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  Chuẩn hóa BHYT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chẩn đoán chính:</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-[#2E37A4]">
                      Ưu tiên 1
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 font-bold text-xs text-[#2E37A4] tabular-nums">
                      I10
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      Tăng huyết áp vô căn (nguyên phát)
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chẩn đoán kèm theo:</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Mãn tính
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold text-xs text-slate-700 tabular-nums">
                      E11.9
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      Đái tháo đường type 2 không biến chứng
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: P (Plan) - 1NF Prescription & Signatures                     */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 text-[#2E37A4] border border-indigo-200 flex items-center justify-center text-xs font-bold shrink-0">
                    P
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                      Plan: Đơn Thuốc Chuẩn 1NF
                    </h2>
                    <p className="text-[11px] text-slate-500">Kê đơn điện tử liên thông Cổng Dược Quốc Gia</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  An toàn tương tác ✓
                </span>
              </div>

              {/* Prescription Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Danh mục thuốc đã kê ({prescriptions.length}):
                  </span>
                  <span className="text-[11px] text-slate-400">Thời hạn: 30 ngày dùng</span>
                </div>

                {prescriptions.map((rx, idx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2 relative group hover:border-slate-300 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveDrug(rx.id)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Xóa thuốc khỏi đơn"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>

                    <div className="flex items-start gap-2.5 pr-6">
                      <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold tabular-nums shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {rx.name} <span className="font-semibold text-slate-500">({rx.dosage})</span>
                        </div>
                        <div className="text-[11px] text-[#2E37A4] font-semibold tabular-nums mt-0.5">
                          Số lượng: {rx.quantity} {rx.unit} • {rx.route}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-snug pl-7 bg-white/70 p-2 rounded-lg border border-slate-100">
                      {rx.instructions}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Drug Mini-Form */}
              <form onSubmit={handleAddDrug} className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2E37A4] text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Thêm thuốc từ Dược thư Quốc gia
                  </span>
                  <span className="text-[10px] text-slate-400">Kiểm tra dị ứng tự động</span>
                </div>

                {/* Quick Prescribe Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { name: 'Amlodipine', dose: '5mg', inst: 'Uống 1 viên vào 08:00 sáng' },
                    { name: 'Metformin', dose: '500mg', inst: 'Uống 1 viên sau ăn tối' },
                    { name: 'Atorvastatin', dose: '10mg', inst: 'Uống 1 viên buổi tối trước ngủ' },
                    { name: 'Amoxicillin', dose: '500mg', inst: 'Uống 1 viên x 2 lần/ngày' },
                  ].map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => {
                        setDrugName(sample.name);
                        setDrugDosage(sample.dose);
                        setDrugInstructions(sample.inst);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-indigo-200/80 text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      + {sample.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Tên biệt dược / Hoạt chất:
                    </label>
                    <input
                      type="text"
                      required
                      value={drugName}
                      onChange={(e) => setDrugName(e.target.value)}
                      placeholder="vd: Amlodipine, Panadol..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Hàm lượng:
                    </label>
                    <input
                      type="text"
                      value={drugDosage}
                      onChange={(e) => setDrugDosage(e.target.value)}
                      placeholder="vd: 5mg, 500mg..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Hướng dẫn sử dụng &amp; Liều dùng:
                  </label>
                  <input
                    type="text"
                    value={drugInstructions}
                    onChange={(e) => setDrugInstructions(e.target.value)}
                    placeholder="vd: Uống 1 viên vào 08:00 sáng sau ăn..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#2E37A4] hover:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Thêm vào đơn thuốc 1NF
                </button>
              </form>

              {/* Clinical Care Advice */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Lời dặn dò chế độ dinh dưỡng &amp; Vận động:
                </label>
                <textarea
                  rows={3}
                  value={adviceNote}
                  onChange={(e) => setAdviceNote(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all"
                />
              </div>

              {/* Status & HSM Signature Box */}
              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Trạng thái bệnh án EMR:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      isSigned
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-[#2E37A4] border border-indigo-200'
                    }`}
                  >
                    {isSigned ? '✓ Đã khóa mã hóa (Read-only)' : 'Bản nháp đang mở'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Chữ ký số Bác sĩ:</span>
                  <span className="tabular-nums text-slate-800 font-semibold">
                    {isSigned ? 'PGS.TS Nguyễn Trọng Nghĩa (Viettel-CA)' : 'Chưa ký điện tử'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL CẢNH BÁO AN TOÀN DƯỢC LÂM SÀNG (MSG22 / GB-10) */}
        {pendingAllergyDrug && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">emergency</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-800">
                    [CẢNH BÁO AN TOÀN DƯỢC MSG22 / GB-10]
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xung đột dị ứng nghiêm trọng nhóm kháng sinh Penicillin
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2 leading-relaxed">
                <p>
                  Thuốc <strong>&quot;{pendingAllergyDrug.drug.name}&quot;</strong> thuộc nhóm dị ứng đã được ghi nhận trong hồ sơ tiền sử của bệnh nhân <strong>Nguyễn Văn Phúc</strong>!
                </p>
                <p className="text-[11px] text-rose-700 bg-white/70 p-2.5 rounded-xl border border-rose-200/60 font-medium">
                  Khuyến nghị Dược lâm sàng: Nên lựa chọn nhóm kháng sinh thay thế an toàn hơn (như Macrolide, Quinolone...) trừ khi có chỉ định hồi sức bắt buộc.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Lý do ghi đè lâm sàng bắt buộc (Clinical Override Reason):
                </label>
                <textarea
                  rows={2}
                  value={pendingAllergyDrug.reason}
                  onChange={(e) => {
                    setPendingAllergyDrug({
                      ...pendingAllergyDrug,
                      reason: e.target.value,
                    });
                    if (allergyOverrideError) setAllergyOverrideError(null);
                  }}
                  placeholder="Ghi rõ cơ sở lâm sàng, chỉ định đặc biệt hoặc kết quả test lẩy da âm tính..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {allergyOverrideError && (
                  <p role="alert" className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {allergyOverrideError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setPendingAllergyDrug(null);
                    setAllergyOverrideError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy chỉ định (Khuyên dùng)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllergyOverride}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Xác nhận ghi đè lâm sàng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
