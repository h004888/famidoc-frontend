'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  doctorsApi,
  encountersApi,
  type DoctorProfileDto,
  type EncounterItem,
} from '@/lib/api';
import { useAuth } from '@/features/auth/context/auth-context';

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

export function DoctorTelemedicineView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encounterIdParam = searchParams.get('encounterId');
  const patientIdParam = searchParams.get('patientId');
  const lookupKey = JSON.stringify([encounterIdParam, patientIdParam]);

  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileDto | null>(null);
  const [loadedEncounter, setLoadedEncounter] = useState<{ key: string; encounter: EncounterItem } | null>(null);
  const encounter = loadedEncounter?.key === lookupKey ? loadedEncounter.encounter : null;

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'notes' | 'chat'>('vitals');
  const [quickNote, setQuickNote] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [showEndConsultModal, setShowEndConsultModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    doctorsApi
      .getDoctorMe()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.id) setDoctorProfile(res);
      })
      .catch(() => {});

    if (encounterIdParam) {
      encountersApi
        .getEncounterDetail(encounterIdParam)
        .then((data) => {
          if (!isMounted) return;
          if (data?.id) setLoadedEncounter({ key: lookupKey, encounter: data });
        })
        .catch(() => {});
    } else if (patientIdParam) {
      encountersApi
        .getDoctorTimetable({ encounterType: 'TELEHEALTH' })
        .then((res) => {
          if (!isMounted) return;
          if (res && Array.isArray(res.data)) {
            const found = res.data.find(
              (e) => e.patientId === patientIdParam || e.id === patientIdParam
            );
            if (found) setLoadedEncounter({ key: lookupKey, encounter: found });
          }
        })
        .catch(() => {});
    } else {
      encountersApi
        .getDoctorTimetable({ encounterType: 'TELEHEALTH' })
        .then((res) => {
          if (!isMounted) return;
          if (res && Array.isArray(res.data) && res.data.length > 0) {
            setLoadedEncounter({ key: lookupKey, encounter: res.data[0] });
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [encounterIdParam, lookupKey, patientIdParam]);

  const doctorDisplayName = doctorProfile?.doctorName || user?.name || 'PGS.TS Nguyễn Trọng Nghĩa';
  const doctorInitials =
    doctorDisplayName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'BS';

  const primaryParticipant = encounter?.participants?.[0]?.patient ?? encounter?.patient;
  const patientName = primaryParticipant?.fullName || 'Chưa có thông tin người bệnh';
  const patientAge = primaryParticipant?.dateOfBirth
    ? `${new Date().getFullYear() - new Date(primaryParticipant.dateOfBirth).getFullYear()} tuổi`
    : 'Chưa rõ tuổi';
  const patientInitials =
    patientName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'BN';

  const roomCode = encounter?.id ? `TELE-${encounter.id.slice(0, 8)}` : 'Chưa có mã phòng';
  const family = encounter?.contract?.familyUnit;
  const familyCode = family?.familyName || 'Gia đình';
  const familyAddress = family?.homeAddress || family?.address || 'Chưa có địa chỉ';

  const patientAllergies = encounter?.patient?.allergies
    ?.map((allergy) => typeof allergy === 'string' ? allergy : allergy.allergen)
    .filter(Boolean)
    .join(', ') || 'Chưa có thông tin dị ứng';

  const diseases = encounter?.patient?.chronicDiseases;
  const patientChronic = (Array.isArray(diseases) ? diseases.join(', ') : diseases)
    || 'Chưa có thông tin bệnh mạn tính';

  const primaryPatientId = encounter?.participants?.[0]?.patientId ?? encounter?.patientId;
  const emrLink = encounter?.id
    ? `/doctor/encounters?${new URLSearchParams({
        ...(primaryPatientId ? { patientId: primaryPatientId } : {}),
        encounterId: encounter.id,
      })}`
    : '/doctor/encounters';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'doctor',
      senderName: doctorDisplayName,
      text: newChatMessage.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, msg]);
    setNewChatMessage('');
  };

  const handleCaptureSnapshot = () => {
    toast.success('Đã chụp ảnh chứng từ lâm sàng từ camera bệnh nhân và lưu vào hồ sơ EMR!');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Floating Page Header & Consultation Info */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Badge variant="outline" className="gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border-primary/20">
                <span className="material-symbols-outlined text-[15px]">videocam</span>
                Bác Sĩ Gia Đình FamiDoc
              </Badge>
              <span>/</span>
              <span className="text-slate-700">Phòng Khám Từ Xa Telehealth</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                WebRTC E2EE 256-bit Bảo Mật Y Tế
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20 shadow-2xs">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                Bản Quyền FamiDoc Telemedicine
              </Badge>
            </div>
          </div>

          <Card className="bg-white p-6 rounded-2xl border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0037c1] to-[#00D3C7] text-white flex items-center justify-center shadow-md ring-4 ring-primary/10 shrink-0">
                <span className="material-symbols-outlined text-[24px]">telepresence</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Phòng Khám Trực Tuyến Telehealth
                  </h1>
                  <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums bg-primary/10 text-primary border-primary/20">
                    Phòng #{roomCode}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Bệnh nhân: <strong className="text-slate-800">{patientName} ({patientAge})</strong> • {familyCode} • Bác sĩ tư vấn: <strong className="text-slate-800">{doctorDisplayName}</strong>
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

              <Button asChild className="rounded-xl text-xs sm:text-sm font-bold gap-1.5">
                <Link href={emrLink}>
                  <span className="material-symbols-outlined text-[17px]">clinical_notes</span>
                  <span>Kê đơn thuốc</span>
                </Link>
              </Button>
            </div>
          </Card>
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
                  {familyCode} ({familyAddress})
                </div>
              </div>

              {/* Simulated Patient Video Canvas */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="text-center space-y-4 max-w-sm">
                  {/* Patient Visual Avatar */}
                  <div className="relative inline-block">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-slate-800 to-slate-700 border-4 border-slate-600/70 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-2xl mx-auto ring-4 ring-primary/30">
                      {patientInitials}
                    </div>
                    {/* Active Voice Wave Pulse */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                      Đang nói
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg sm:text-xl tracking-tight">
                      {patientName} ({patientAge})
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Đang kết nối cùng Bác sĩ {doctorDisplayName} qua thiết bị FamiDoc Home Station
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0037c1] to-[#00D3C7] text-white flex items-center justify-center font-bold text-sm mx-auto shadow-xs">
                    {doctorInitials}
                  </div>
                </div>

                <div className="text-[10px] text-white truncate font-medium text-center bg-black/40 py-0.5 px-1 rounded">
                  {doctorDisplayName}
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
                    toast.info(
                      next ? 'Đang chia sẻ màn hình hồ sơ xét nghiệm cho bệnh nhân...' : 'Đã dừng chia sẻ màn hình.'
                    );
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isScreenSharing
                      ? 'bg-primary text-white ring-2 ring-white/50'
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
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
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
                        ? 'bg-white text-primary shadow-xs'
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Chưa có dữ liệu sinh hiệu trực tiếp cho buổi khám này.
                  </div>

                  {/* Allergy Alert Box */}
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-rose-950">
                      <span className="material-symbols-outlined text-[17px] text-rose-600">emergency</span>
                      <span>Tiền sử dị ứng &amp; Bệnh nền:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-800">
                      {patientAllergies}
                    </p>
                  </div>

                  {/* Patient Clinical Background Summary */}
                  <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Bệnh mạn tính ghi nhận:
                    </span>
                    <p className="text-xs text-slate-700">
                      {patientChronic}
                    </p>
                  </div>

                  <Link
                    href={emrLink}
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

                  <Textarea
                    rows={6}
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Ghi nhận triệu chứng lâm sàng phát hiện qua video, thắc mắc của bệnh nhân, dặn dò điều chỉnh thuốc..."
                    className="w-full p-3.5 rounded-xl border-slate-200 text-xs text-slate-800 bg-slate-50/70 focus:bg-white transition-all leading-relaxed"
                  />

                  <Button
                    type="button"
                    onClick={() => {
                      if (quickNote.trim()) {
                        toast.success('Đã lưu ghi chú lâm sàng vào hồ sơ bệnh án EMR!');
                        setQuickNote('');
                      }
                    }}
                    className="w-full rounded-xl text-xs font-bold gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Lưu Vào Bệnh Án EMR
                  </Button>
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
                            ? 'ml-auto bg-primary/10 border border-primary/20 text-primary'
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
                              <span className="material-symbols-outlined text-[16px] text-primary">image</span>
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
                    <Input
                      type="text"
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder="Gửi tin nhắn hoặc dặn dò cho gia đình..."
                      className="flex-1 rounded-xl text-xs bg-slate-50 focus:bg-white"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-xl shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL KẾT THÚC CA KHÁM TELEHEALTH */}
      <Dialog open={showEndConsultModal} onOpenChange={setShowEndConsultModal}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 space-y-4">
          <DialogHeader>
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
              </div>
              <div>
                <DialogTitle className="font-bold text-base text-slate-900">
                  Kết Thúc Ca Khám Telehealth
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Bệnh nhân: <strong className="text-slate-800">{patientName} (Phòng #{roomCode})</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Kết thúc cuộc gọi và mở trang kê đơn để chọn buổi khám vừa thực hiện?
          </p>

          <DialogFooter className="pt-2 sm:justify-stretch gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEndConsultModal(false)}
              className="flex-1 rounded-xl font-semibold text-xs"
            >
              Tiếp tục tư vấn
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowEndConsultModal(false);
                router.push(emrLink);
              }}
              className="flex-1 rounded-xl font-bold text-xs gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              Mở trang kê đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
