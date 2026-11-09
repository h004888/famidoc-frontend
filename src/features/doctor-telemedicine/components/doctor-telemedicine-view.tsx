'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  senderName: string;
  text: string;
  time: string;
  attachment?: {
    name: string;
    size: string;
    type: 'image' | 'pdf';
  };
}

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-01',
    sender: 'patient',
    senderName: 'Anh Quân (Con trai)',
    text: 'Dạ chào Bác sĩ Nghĩa, sáng nay bố em đo huyết áp lúc 7:00 là 135/85, em gửi ảnh màn hình máy đo Omron cho bác sĩ xem nhé ạ.',
    time: '14:18',
    attachment: {
      name: 'Ket-qua-do-Omron-14h15.jpg',
      size: '1.2 MB',
      type: 'image',
    },
  },
  {
    id: 'msg-02',
    sender: 'doctor',
    senderName: 'PGS.TS Nguyễn Trọng Nghĩa',
    text: 'Chào gia đình, tôi đã nhận được ảnh. Chỉ số 135/85 mmHg ở độ tuổi 78 của cụ là rất khả quan, nhịp tim 76 đều đặn. Tôi đang theo dõi tiếp qua camera đây.',
    time: '14:20',
  },
];

export function DoctorTelemedicineView() {
  const router = useRouter();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'notes' | 'chat'>('vitals');
  const [quickNote, setQuickNote] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [showEndConsultModal, setShowEndConsultModal] = useState(false);
  const [screenShareToast, setScreenShareToast] = useState<string | null>(null);
  const [saveNoteToast, setSaveNoteToast] = useState<string | null>(null);
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'doctor',
      senderName: 'PGS.TS Nguyễn Trọng Nghĩa',
      text: newChatMessage.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, msg]);
    setNewChatMessage('');
  };

  const handleCaptureSnapshot = () => {
    setSnapshotToast('Đã chụp ảnh chứng từ lâm sàng từ camera bệnh nhân và lưu vào hồ sơ EMR!');
    setTimeout(() => setSnapshotToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Realtime Feedback Toasts */}
        <div className="space-y-2">
          {screenShareToast && (
            <div
              role="status"
              className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#2E37A4] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">screen_share</span>
                <span>{screenShareToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setScreenShareToast(null)}
                className="text-[#2E37A4] hover:opacity-80 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {saveNoteToast && (
            <div
              role="status"
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                <span>{saveNoteToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveNoteToast(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {snapshotToast && (
            <div
              role="status"
              className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-sky-600">add_a_photo</span>
                <span>{snapshotToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setSnapshotToast(null)}
                className="text-sky-700 hover:text-sky-900 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Floating Page Header & Consultation Info */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-[#2E37A4] border border-indigo-100">
                <span className="material-symbols-outlined text-[15px]">videocam</span>
                Bác Sĩ Gia Đình FamiDoc
              </span>
              <span>/</span>
              <span className="text-slate-700">Phòng Khám Từ Xa Telehealth</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                WebRTC E2EE 256-bit Bảo Mật Y Tế
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-[#2E37A4] border border-indigo-200 shadow-2xs">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                Bản Quyền FamiDoc Telemedicine
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center shadow-md ring-4 ring-[#2E37A4]/10 shrink-0">
                <span className="material-symbols-outlined text-[24px]">telepresence</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Phòng Khám Trực Tuyến Telehealth
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums bg-indigo-50 text-[#2E37A4] border border-indigo-200">
                    Phòng #TELE-88219
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Bệnh nhân: <strong className="text-slate-800">Nguyễn Văn Phúc (78 tuổi)</strong> • Hộ: FAM-88219 • Bác sĩ tư vấn: <strong className="text-slate-800">PGS.TS Nguyễn Trọng Nghĩa</strong>
                </p>
              </div>
            </div>

            {/* Room Actions & Timer */}
            <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 text-xs sm:text-sm tabular-nums font-bold text-slate-800 flex items-center gap-2 border border-slate-200/80">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-600 uppercase text-[10px] tracking-wider font-bold">REC</span>
                <span>00:14:32</span>
              </div>

              <Link
                href="/doctor/encounters?patientId=PT-01&encounterId=TELE-88219"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E37A4] hover:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">clinical_notes</span>
                <span>Kê Đơn Thuốc &amp; Ký Số EMR</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Video Consultation Stage & Clinical Patient Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* MAIN VIDEO SCREEN STAGE (7 COLS)                                          */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800/90 flex flex-col justify-between relative min-h-[480px] sm:min-h-[540px]">
              {/* Top HUD Bar inside Video */}
              <div className="p-4 sm:p-5 flex items-center justify-between text-white text-xs z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white font-bold backdrop-blur-md flex items-center gap-1.5 shadow-2xs">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    WebRTC E2EE 256-bit
                  </span>
                  <span className="bg-slate-900/80 border border-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md text-emerald-400 font-semibold tabular-nums flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Độ trễ: 18ms (0% drop)
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md text-slate-300 text-[11px] font-medium hidden sm:flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">home_health</span>
                  Hộ FAM-88219 (Q.5, TP.HCM)
                </div>
              </div>

              {/* Simulated Patient Video Canvas */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="text-center space-y-4 max-w-sm">
                  {/* Patient Visual Avatar */}
                  <div className="relative inline-block">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-slate-800 to-slate-700 border-4 border-slate-600/70 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-2xl mx-auto ring-4 ring-[#2E37A4]/30">
                      VP
                    </div>
                    {/* Active Voice Wave Pulse */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                      Đang nói
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg sm:text-xl tracking-tight">
                      Cụ Nguyễn Văn Phúc (78 tuổi)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Đang kết nối cùng Bác sĩ PGS.TS Nguyễn Trọng Nghĩa qua thiết bị FamiDoc Home Station
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] backdrop-blur-xs">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400">high_quality</span>
                    Video HD 1080p • 60 FPS
                  </div>
                </div>
              </div>

              {/* Doctor Pip Video Stream (Bottom Right Floating) */}
              <div className="absolute bottom-24 right-4 sm:right-5 w-40 sm:w-48 h-32 sm:h-36 bg-slate-900/95 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl z-20 flex flex-col justify-between p-3 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Bạn (Bác sĩ)
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-white/70">
                    {isMicOn ? 'mic' : 'mic_off'}
                  </span>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center font-bold text-sm mx-auto shadow-xs">
                    TN
                  </div>
                </div>

                <div className="text-[10px] text-white truncate font-medium text-center bg-black/40 py-0.5 px-1 rounded">
                  PGS.TS Nguyễn Trọng Nghĩa
                </div>
              </div>

              {/* Floating Bottom Control Bar */}
              <div className="p-4 sm:p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center gap-3 sm:gap-4 z-20">
                {/* Mic Button */}
                <button
                  type="button"
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isMicOn
                      ? 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                  title={isMicOn ? 'Tắt Micro' : 'Bật Micro'}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {isMicOn ? 'mic' : 'mic_off'}
                  </span>
                </button>

                {/* Camera Button */}
                <button
                  type="button"
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isCameraOn
                      ? 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                  title={isCameraOn ? 'Tắt Camera' : 'Bật Camera'}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {isCameraOn ? 'videocam' : 'videocam_off'}
                  </span>
                </button>

                {/* Screen Share Button */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isScreenSharing;
                    setIsScreenSharing(next);
                    setScreenShareToast(
                      next ? 'Đang chia sẻ màn hình hồ sơ xét nghiệm cho bệnh nhân...' : 'Đã dừng chia sẻ màn hình.'
                    );
                    setTimeout(() => setScreenShareToast(null), 3000);
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isScreenSharing
                      ? 'bg-[#2E37A4] text-white ring-2 ring-white/50'
                      : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                  }`}
                  title="Chia sẻ hồ sơ bệnh án"
                >
                  <span className="material-symbols-outlined text-[22px]">screen_share</span>
                </button>

                {/* Snapshot Button (Clinical Photo) */}
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="w-12 h-12 rounded-2xl bg-white/15 text-white hover:bg-white/25 border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-md"
                  title="Chụp ảnh lâm sàng lưu EMR"
                >
                  <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={() => setShowEndConsultModal(true)}
                  className="px-5 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">call_end</span>
                  <span className="hidden sm:inline">Kết Thúc Ca Khám</span>
                </button>
              </div>
            </div>

            {/* Quick Helper Banner below video */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2E37A4] text-[18px]">verified</span>
                <span>Cuộc gọi được lưu trữ mã hóa tuân thủ theo tiêu chuẩn Thông tư Bộ Y Tế.</span>
              </div>
              <span className="text-slate-400 font-medium">Bảo mật E2EE</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT SIDEBAR: LIVE CLINICAL DOSSIER & WORKSPACE (5 COLS)                  */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Right Panel Tabs */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-1.5">
                {(
                  [
                    { key: 'vitals', label: 'Sinh Hiệu IoT', icon: 'ecg' },
                    { key: 'notes', label: 'Ghi Chú EMR', icon: 'edit_note' },
                    { key: 'chat', label: 'Tin Nhắn & Tệp', icon: 'chat' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === tab.key
                        ? 'bg-white text-[#2E37A4] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab 1: Vitals & Patient Clinical Highlights */}
              {activeTab === 'vitals' && (
                <div className="p-5 sm:p-6 space-y-5">
                  {/* IoT Live Vitals Matrix */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#2E37A4] text-[18px]">sensors</span>
                        Đo Lường Trực Tiếp (Omron Live)
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Đang kết nối
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                          Huyết áp
                        </span>
                        <div className="text-base sm:text-lg font-bold text-[#2E37A4] tabular-nums">
                          135/85 <span className="text-xs font-normal text-slate-500">mmHg</span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-medium block">
                          Hơi cao nhẹ (Độ 1)
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                          SpO2 Máu
                        </span>
                        <div className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums">
                          98 <span className="text-xs font-normal text-slate-500">%</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium block">
                          Bão hòa tối ưu
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                          Nhịp tim
                        </span>
                        <div className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                          76 <span className="text-xs font-normal text-slate-500">bpm</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium block">
                          Nhịp xoang đều
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                          Đường huyết
                        </span>
                        <div className="text-base sm:text-lg font-bold text-amber-700 tabular-nums">
                          5.6 <span className="text-xs font-normal text-slate-500">mmol/L</span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium block">
                          Kiểm soát ổn định
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Allergy Alert Box */}
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-rose-950">
                      <span className="material-symbols-outlined text-[17px] text-rose-600">emergency</span>
                      <span>Tiền sử dị ứng thuốc nghiêm trọng:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-800">
                      Dị ứng nhóm <strong>Penicillin / Beta-lactam</strong> và <strong>Hải sản có vỏ</strong>. Tuyệt đối không kê Amoxicillin hoặc Cephalosporin thế hệ 1.
                    </p>
                  </div>

                  {/* Patient Clinical Background Summary */}
                  <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Đơn thuốc đang dùng hàng ngày:
                    </span>
                    <ul className="space-y-1.5 text-slate-600">
                      <li className="flex items-center justify-between">
                        <span>• Amlor (Amlodipine) 5mg</span>
                        <span className="font-semibold text-slate-800">1 viên sáng</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>• Glucophage (Metformin) 500mg</span>
                        <span className="font-semibold text-slate-800">1 viên tối</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href="/doctor/encounters?patientId=PT-01&encounterId=TELE-88219"
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-600">open_in_new</span>
                    Xem Bệnh Án Điện Tử Chi Tiết
                  </Link>
                </div>
              )}

              {/* Tab 2: In-Call SOAP Quick Notes */}
              {activeTab === 'notes' && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Ghi Chú Nhanh Bác Sĩ (In-Call Notes)
                    </span>
                    <span className="text-[11px] text-slate-400">Tự động đồng bộ EMR</span>
                  </div>

                  {/* Quick Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      'Hoa mắt buổi sáng',
                      'Không đau ngực',
                      'Huyết áp kiểm soát tốt',
                      'Khuyên giảm muối',
                      'Tái khám sau 30 ngày',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setQuickNote((prev) => (prev ? `${prev} • ${chip}.` : `${chip}.`));
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={6}
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Ghi nhận triệu chứng lâm sàng phát hiện qua video, thắc mắc của bệnh nhân, dặn dò điều chỉnh thuốc..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all leading-relaxed"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (quickNote.trim()) {
                        setSaveNoteToast('Đã lưu ghi chú lâm sàng vào hồ sơ bệnh án EMR!');
                        setQuickNote('');
                        setTimeout(() => setSaveNoteToast(null), 3500);
                      }
                    }}
                    className="w-full py-2.5 bg-[#2E37A4] hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Lưu Vào Bệnh Án EMR
                  </button>
                </div>
              )}

              {/* Tab 3: In-Call Chat & Attachments */}
              {activeTab === 'chat' && (
                <div className="p-4 sm:p-5 flex flex-col h-[400px] justify-between">
                  <div className="overflow-y-auto space-y-3 pr-1 text-xs">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl max-w-[85%] ${
                          msg.sender === 'doctor'
                            ? 'ml-auto bg-indigo-50 border border-indigo-100 text-[#2E37A4]'
                            : 'mr-auto bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-[11px]">{msg.senderName}</span>
                          <span className="text-[10px] text-slate-400 tabular-nums">{msg.time}</span>
                        </div>
                        <p className="leading-snug text-slate-700">{msg.text}</p>

                        {msg.attachment && (
                          <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">image</span>
                              <span className="text-[11px] font-medium text-slate-800 truncate">
                                {msg.attachment.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">{msg.attachment.size}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <input
                      type="text"
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder="Gửi tin nhắn hoặc dặn dò cho gia đình..."
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2.5 bg-[#2E37A4] hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL KẾT THÚC CA KHÁM TELEHEALTH */}
      {showEndConsultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Kết Thúc Ca Khám Telehealth
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bệnh nhân: <strong className="text-slate-800">Nguyễn Văn Phúc (Phòng #TELE-88219)</strong>
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bạn có muốn kết thúc phiên gọi video trực tuyến và chuyển thẳng sang màn hình <strong>Kê đơn thuốc điện tử chuẩn 1NF &amp; Ký số EMR Viettel-CA</strong> cho bệnh nhân này không?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConsultModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tiếp tục tư vấn
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndConsultModal(false);
                  router.push('/doctor/encounters?patientId=PT-01&encounterId=TELE-88219');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Chuyển Sang Kê Đơn EMR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
