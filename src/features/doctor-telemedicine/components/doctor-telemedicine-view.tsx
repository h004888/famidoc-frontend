'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DoctorNav } from '@/components/layout';

export function DoctorTelemedicineView() {
  const router = useRouter();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [quickNote, setQuickNote] = useState('');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <DoctorNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Room Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#0f172a]">
                  Phòng Khám Trực Tuyến Telehealth (Chuẩn WebRTC Y Tế)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-[#2563eb] border border-blue-200">
                  Phòng #TELE-88219
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Mã hóa đầu cuối (E2EE) • Bệnh nhân: <strong className="text-[#0f172a]">Nguyễn Văn Phúc (78 tuổi)</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-mono font-bold text-[#0f172a] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-red-500 animate-pulse">timer</span>
              <span>Thời gian: 00:14:32</span>
            </div>
            <Link
              href="/doctor/encounters"
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Kê đơn thuốc &amp; Ký số EMR
            </Link>
          </div>
        </div>

        {/* Video Consultation Stage & Clinical Patient Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Video Screen (8 cols) */}
          <div className="lg:col-span-8 bg-[#0f172a] rounded-3xl overflow-hidden shadow-lg border border-slate-800 flex flex-col justify-between relative min-h-[460px] sm:min-h-[520px]">
            {/* Top Bar inside Video */}
            <div className="p-4 flex items-center justify-between text-white text-xs z-10 bg-linear-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/80 text-white font-bold backdrop-blur-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  WebRTC E2EE 256-bit
                </span>
                <span className="bg-white/20 px-2 py-1 rounded-md backdrop-blur-xs">Đường truyền: Rất tốt (18ms)</span>
              </div>
              <div className="bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs text-slate-300">
                Gia đình FAM-88219 (Q.1, TP.HCM)
              </div>
            </div>

            {/* Simulated Patient Video Stream */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-6xl shadow-xl mx-auto">
                  👨‍🦳
                </div>
                <div className="text-white font-bold text-base">Bác Nguyễn Văn Phúc (78 tuổi)</div>
                <p className="text-xs text-slate-400">Đang trò chuyện cùng Bác sĩ Nghĩa...</p>
              </div>
            </div>

            {/* Doctor Pip Video Stream (Bottom Right Floating) */}
            <div className="absolute bottom-20 right-4 w-36 sm:w-44 h-28 sm:h-32 bg-slate-800 rounded-2xl border-2 border-white/30 overflow-hidden shadow-2xl z-20 flex flex-col justify-between p-2">
              <div className="text-right">
                <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-xs">
                  Bạn (Bác sĩ)
                </span>
              </div>
              <div className="text-center text-3xl">👨‍⚕️</div>
              <div className="text-[10px] text-white truncate font-semibold">PGS.TS Nguyễn Trọng Nghĩa</div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 bg-linear-to-t from-black/80 to-transparent flex items-center justify-center gap-3 z-10">
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isMicOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'
                }`}
                title={isMicOn ? 'Tắt mic' : 'Bật mic'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isMicOn ? 'mic' : 'mic_off'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isCameraOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'
                }`}
                title={isCameraOn ? 'Tắt camera' : 'Bật camera'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isCameraOn ? 'videocam' : 'videocam_off'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsScreenSharing(!isScreenSharing);
                  alert(isScreenSharing ? 'Đã dừng chia sẻ màn hình.' : 'Đang chia sẻ màn hình hồ sơ xét nghiệm cho bệnh nhân...');
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isScreenSharing ? 'bg-[#2563eb] text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Chia sẻ hồ sơ bệnh án"
              >
                <span className="material-symbols-outlined text-[20px]">screen_share</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có muốn kết thúc ca tư vấn trực tuyến và chuyển sang ký đơn thuốc?')) {
                    router.push('/doctor/encounters');
                  }
                }}
                className="px-5 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">call_end</span>
                <span>Kết thúc ca khám</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Clinical Dossier (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Realtime Vitals Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2563eb] text-[18px]">ecg</span>
                Sinh Hiệu Thời Gian Thực (IoT Live)
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Huyết áp:</span>
                  <span className="font-bold text-[#2563eb] text-sm">135/85 mmHg</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">SpO2:</span>
                  <span className="font-bold text-emerald-600 text-sm">98%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Nhịp tim:</span>
                  <span className="font-bold text-[#0f172a] text-sm">76 bpm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Đường huyết:</span>
                  <span className="font-bold text-amber-700 text-sm">5.6 mmol/L</span>
                </div>
              </div>
            </div>

            {/* Allergy Warning */}
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Tiền sử dị ứng:
              </div>
              <p className="text-[11px] leading-snug">
                Dị ứng Penicillin &amp; Hải sản. Tuyệt đối không kê Amoxicillin / Cephalosporin.
              </p>
            </div>

            {/* In-Call Quick Note Pad */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider block">
                Ghi Chú Nhanh Trong Cuộc Gọi (In-Call Notes)
              </span>
              <textarea
                rows={4}
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Ghi nhận triệu chứng, giải đáp thắc mắc của bệnh nhân, dặn dò điều chỉnh thuốc..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#334155] bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2563eb]"
              />
              <button
                type="button"
                onClick={() => {
                  alert('Đã lưu ghi chú vào hồ sơ bệnh án EMR!');
                  setQuickNote('');
                }}
                className="w-full py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-colors"
              >
                Lưu vào Bệnh án EMR
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


