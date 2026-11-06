'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface MemberHealthData {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar: string;
  status: 'good' | 'warning';
  statusText: string;
  bp: string;
  bpStatus: string;
  spo2: string;
  heartRate: string;
  glucose: string;
  glucoseStatus: string;
  medicines: {
    id: string;
    name: string;
    time: string;
    status: 'taken' | 'pending';
  }[];
  upcomingVisit?: {
    doctor: string;
    specialty: string;
    hospital: string;
    time: string;
    date: string;
    mode: 'home' | 'telehealth';
    note: string;
  };
}

const FAMILY_MEMBERS_DATA: Record<string, MemberHealthData> = {
  'mem-01': {
    id: 'mem-01',
    name: 'Nguyễn Văn Phúc',
    relation: 'Ông nội',
    age: 78,
    avatar: '👨‍🦳',
    status: 'warning',
    statusText: 'Huyết áp cần chú ý nhẹ',
    bp: '135/85',
    bpStatus: 'Hơi cao • Cần uống thuốc đều',
    spo2: '98%',
    heartRate: '76 lần/phút',
    glucose: '6.8 mmol/L',
    glucoseStatus: 'Ổn định sau ăn',
    medicines: [
      { id: 'med-1', name: 'Amlodipine 5mg (Hạ huyết áp)', time: '08:00 Sáng mỗi ngày', status: 'taken' },
      { id: 'med-2', name: 'Metformin 500mg (Đường huyết)', time: 'Sau bữa ăn tối', status: 'pending' },
    ],
    upcomingVisit: {
      doctor: 'PGS.TS Nguyễn Trọng Nghĩa',
      specialty: 'Bác sĩ Gia đình & Tim mạch',
      hospital: 'BV Đại học Y Dược TP.HCM',
      date: 'Thứ Hai, 27/10/2026',
      time: '09:30 Sáng',
      mode: 'home',
      note: 'Khám định kỳ tại nhà: đo điện tim ECG và lấy máu xét nghiệm đường huyết.',
    },
  },
  'mem-02': {
    id: 'mem-02',
    name: 'Trần Thị Mai',
    relation: 'Mẹ',
    age: 42,
    avatar: '👩',
    status: 'good',
    statusText: 'Sức khỏe rất tốt',
    bp: '115/75',
    bpStatus: 'Huyết áp lý tưởng',
    spo2: '99%',
    heartRate: '72 lần/phút',
    glucose: '5.2 mmol/L',
    glucoseStatus: 'Bình thường',
    medicines: [
      { id: 'med-3', name: 'Canxi & Vitamin D3 hữu cơ', time: 'Sau bữa sáng', status: 'taken' },
    ],
    upcomingVisit: {
      doctor: 'ThS.BS Võ Thị Phương Thảo',
      specialty: 'Tư vấn Sản Phụ Khoa',
      hospital: 'BV Từ Dũ',
      date: 'Thứ Bảy, 08/11/2026',
      time: '14:00 Chiều',
      mode: 'telehealth',
      note: 'Tư vấn trực tuyến qua video Telehealth.',
    },
  },
  'mem-03': {
    id: 'mem-03',
    name: 'Nguyễn Minh Quân',
    relation: 'Con trai',
    age: 12,
    avatar: '👦',
    status: 'good',
    statusText: 'Khỏe mạnh, năng động',
    bp: '105/65',
    bpStatus: 'Chuẩn lứa tuổi',
    spo2: '100%',
    heartRate: '82 lần/phút',
    glucose: '4.8 mmol/L',
    glucoseStatus: 'Bình thường',
    medicines: [
      { id: 'med-4', name: 'Xịt mũi thảo dược FamiCare', time: 'Buổi sáng & tối khi trời lạnh', status: 'taken' },
    ],
    upcomingVisit: {
      doctor: 'BS.CKII Trần Mai Phương',
      specialty: 'Chuyên gia Nhi & Dinh dưỡng',
      hospital: 'BV Nhi Đồng 1',
      date: 'Thứ Tư, 29/10/2026',
      time: '19:30 Tối',
      mode: 'telehealth',
      note: 'Tư vấn phác đồ dinh dưỡng và dị ứng hô hấp trẻ nhỏ.',
    },
  },
};

export function FamilyDashboardView() {
  const [selectedMemberId, setSelectedMemberId] = useState('mem-01');
  const [membersData, setMembersData] = useState(FAMILY_MEMBERS_DATA);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [newBp, setNewBp] = useState('120/80');
  const [newGlucose, setNewGlucose] = useState('5.6');

  const currentMember = membersData[selectedMemberId] || membersData['mem-01'];

  const toggleMedicineStatus = (medId: string) => {
    setMembersData((prev) => {
      const updated = { ...prev };
      const member = { ...updated[selectedMemberId] };
      member.medicines = member.medicines.map((m) =>
        m.id === medId
          ? { ...m, status: m.status === 'taken' ? 'pending' : 'taken' }
          : m
      );
      updated[selectedMemberId] = member;
      return updated;
    });
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    setMembersData((prev) => {
      const updated = { ...prev };
      const member = { ...updated[selectedMemberId] };
      member.bp = newBp;
      member.glucose = `${newGlucose} mmol/L`;
      updated[selectedMemberId] = member;
      return updated;
    });
    alert(`Đã ghi nhận chỉ số sức khỏe mới cho ${currentMember.name}!`);
    setShowVitalsModal(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">

      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. LỜI CHÀO GẦN GŨI & NÚT HÀNH ĐỘNG 1 CHẠM */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Chào gia đình Ông Phúc! 👋
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Gói Toàn Diện VIP
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Bác sĩ riêng phụ trách: <strong className="text-slate-800">PGS.TS Nguyễn Trọng Nghĩa (BV ĐH Y Dược)</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Link
              href="/family/appointments"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>Đặt lịch bác sĩ</span>
            </Link>

            <Link
              href="/doctor/telemedicine"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-[#2E37A4] border border-[#2E37A4]/20 rounded-2xl text-xs sm:text-sm font-bold transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">videocam</span>
              <span>Gọi bác sĩ</span>
            </Link>

            <a
              href="tel:19006868"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-2xl text-xs sm:text-sm font-bold transition-all"
              title="Tổng đài y tế cấp cứu khẩn cấp 24/7"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>SOS 1900 6868</span>
            </a>
          </div>
        </div>

        {/* 2. CHỌN NGƯỜI THÂN TRONG NHÀ (DẠNG THẺ TO, RÕ RÀNG, DỄ BẤM) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">
              Chọn người thân để xem sức khỏe:
            </span>
            <Link
              href="/family/members"
              className="text-xs font-bold text-[#2E37A4] hover:underline flex items-center gap-1"
            >
              <span>Xem hồ sơ</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {Object.values(membersData).map((m) => {
              const isSelected = m.id === selectedMemberId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`p-4 rounded-3xl border text-left transition-all cursor-pointer relative ${isSelected
                      ? 'bg-white border-[#2E37A4] shadow-md ring-2 ring-[#2E37A4]/20'
                      : 'bg-white/80 hover:bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-1 bg-slate-50 rounded-2xl">{m.avatar}</span>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-500">{m.relation} ({m.age} tuổi)</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#2E37A4] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Huyết áp gần nhất:</span>
                    <span className="font-bold font-mono text-[#2E37A4] bg-blue-50 px-2 py-0.5 rounded-lg">
                      {m.bp} mmHg
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. KHỐI CHỈ SỐ SỨC KHỎE HÔM NAY CỦA NGƯỜI ĐƯỢC CHỌN */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentMember.avatar}</span>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Chỉ Số Sức Khỏe Hôm Nay: {currentMember.name}
                </h3>
                <p className="text-xs text-slate-500">{currentMember.statusText}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVitalsModal(true)}
              className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">add_circle</span>
              <span>Ghi nhanh số đo hôm nay</span>
            </button>
          </div>

          {/* 4 Cards Chỉ Số To Rõ Ràng */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Huyết Áp */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">❤️ Huyết áp</span>
                <span className="text-[10px] text-slate-400">mmHg</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{currentMember.bp}</div>
              <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                {currentMember.bpStatus}
              </div>
            </div>

            {/* Oxy SpO2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">🫁 Oxy máu (SpO2)</span>
                <span className="text-[10px] text-slate-400">%</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{currentMember.spo2}</div>
              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                Rất tốt
              </div>
            </div>

            {/* Nhịp Tim */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">💓 Nhịp tim</span>
                <span className="text-[10px] text-slate-400">nhịp/phút</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{currentMember.heartRate.split(' ')[0]}</div>
              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                Nhịp đều ổn định
              </div>
            </div>

            {/* Đường Huyết */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">🩸 Đường huyết</span>
                <span className="text-[10px] text-slate-400">mmol/L</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{currentMember.glucose.split(' ')[0]}</div>
              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                {currentMember.glucoseStatus}
              </div>
            </div>
          </div>
        </div>

        {/* 4. LỊCH KHÁM TIẾP THEO & NHẮC UỐNG THUỐC HÔM NAY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột 1: Lịch Khám Tiếp Theo */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2E37A4]">event_available</span>
                <span>Lịch Hẹn Khám Sắp Tới</span>
              </h3>
              <Link href="/family/appointments" className="text-xs font-bold text-[#2E37A4] hover:underline">
                Xem tất cả lịch &rarr;
              </Link>
            </div>

            {currentMember.upcomingVisit ? (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#2E37A4] uppercase tracking-wide block">
                      {currentMember.upcomingVisit.mode === 'home' ? '🏠 Bác sĩ đến nhà khám' : '💻 Khám Telehealth Video'}
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 mt-0.5">
                      {currentMember.upcomingVisit.time} • {currentMember.upcomingVisit.date}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Đã xác nhận
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>Bác sĩ: <strong>{currentMember.upcomingVisit.doctor}</strong> ({currentMember.upcomingVisit.specialty})</div>
                  <div>Đơn vị: <strong>{currentMember.upcomingVisit.hospital}</strong></div>
                  <p className="text-[11px] text-slate-500 italic mt-1">&quot;{currentMember.upcomingVisit.note}&quot;</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Link
                    href="/family/appointments"
                    className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-700 transition-colors"
                  >
                    Đổi ngày giờ khám
                  </Link>
                  <Link
                    href="/doctor/telemedicine"
                    className="flex-1 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold text-center transition-colors"
                  >
                    Phòng khám Video
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                <p className="text-xs text-slate-500">Chưa có lịch hẹn nào sắp tới cho {currentMember.name}.</p>
                <Link
                  href="/family/appointments"
                  className="inline-block px-4 py-2 bg-[#2E37A4] text-white text-xs font-bold rounded-xl"
                >
                  Đặt lịch khám mới
                </Link>
              </div>
            )}
          </div>

          {/* Cột 2: Nhắc Uống Thuốc Hôm Nay */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2E37A4]">medication</span>
                <span>Nhắc Thuốc Hôm Nay: {currentMember.name}</span>
              </h3>
              <span className="text-xs text-slate-400">Bấm để đánh dấu đã uống</span>
            </div>

            <div className="space-y-2.5">
              {currentMember.medicines.map((med) => (
                <div
                  key={med.id}
                  onClick={() => toggleMedicineStatus(med.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${med.status === 'taken'
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                >
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{med.name}</span>
                    </div>
                    <div className="text-slate-500">{med.time}</div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${med.status === 'taken'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-amber-100 text-amber-800'
                      }`}
                  >
                    {med.status === 'taken' ? '✓ Đã uống' : 'Chờ uống'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Hạn mức gói còn lại:</span>
              <strong className="text-slate-800">Còn 3 lượt tại nhà • 18 lượt video</strong>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL GHI NHANH SỐ ĐO SỨC KHỎE */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Ghi Số Đo: {currentMember.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Huyết áp (mmHg)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 120/80"
                  value={newBp}
                  onChange={(e) => setNewBp(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đường huyết (mmol/L)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 5.6"
                  value={newGlucose}
                  onChange={(e) => setNewGlucose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-bold"
                >
                  Lưu số đo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
