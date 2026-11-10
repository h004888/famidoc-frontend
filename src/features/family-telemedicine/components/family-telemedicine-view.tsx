'use client';

import React, { useState, useEffect } from 'react';
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
    senderName: 'Bạn (Người đại diện)',
    text: 'Dạ chào Bác sĩ Nghĩa, sáng nay bố em đo huyết áp lúc 7:00 là 135/85 mmHg, em gửi ảnh kết quả màn hình máy đo Omron cho Bác sĩ xem ạ.',
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
    text: 'Chào gia đình, Bác sĩ đã nhận được ảnh. Chỉ số 135/85 mmHg ở độ tuổi 78 của cụ là rất khả quan. Bác sĩ đang theo dõi tiếp qua camera đây.',
    time: '14:20',
  },
];

export function FamilyTelemedicineView() {
  const router = useRouter();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'vitals' | 'doctor'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [callDuration, setCallDuration] = useState(254); // in seconds
  const [attachmentToast, setAttachmentToast] = useState<string | null>(null);

  // Timer for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      senderName: 'Bạn (Người đại diện)',
      text: newChatMessage.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, msg]);
    setNewChatMessage('');
  };

  const handleUploadPhoto = () => {
    setAttachmentToast('Đã tải ảnh kết quả máy đo huyết áp Omron lên phòng gọi!');
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      senderName: 'Bạn (Người đại diện)',
      text: 'Đã gửi ảnh chỉ số đo thực tế tại nhà.',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      attachment: {
        name: 'Omron-HEM-7120-Snapshot.jpg',
        size: '1.4 MB',
        type: 'image',
      },
    };
    setChatMessages((prev) => [...prev, msg]);
    setTimeout(() => setAttachmentToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* Realtime Toast */}
        {attachmentToast && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{attachmentToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachmentToast(null)}
              className="text-emerald-700 hover:opacity-80 p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Top Session Status Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">videocam</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Phòng Khám Telehealth Trực Tuyến WebRTC
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Kết nối mã hóa E2EE (DTLS-SRTP)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bệnh nhân: <strong className="text-slate-800">Nguyễn Văn Phúc (78 tuổi)</strong> • Ca khám: <span className="tabular-nums font-semibold">#TELE-88219</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold tabular-nums flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-rose-500 animate-pulse">
                fiber_manual_record
              </span>
              <span>Thời gian: {formatDuration(callDuration)}</span>
            </div>

            <a
              href="tel:19008821"
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>Cấp cứu 115</span>
            </a>
          </div>
        </div>

        {/* Main Video & Consultation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Video Stream Viewport (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
              {/* Doctor Video Stream (Main Feed) */}
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1200&auto=format&fit=crop"
                alt="PGS.TS Nguyễn Trọng Nghĩa"
                className="w-full h-full object-cover"
              />

              {/* Doctor Name Overlay */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <div className="font-bold">PGS.TS Nguyễn Trọng Nghĩa</div>
                  <div className="text-[10px] text-slate-300">BV Đại học Y Dược TP.HCM</div>
                </div>
              </div>

              {/* Self Video Stream (Patient PiP Thumbnail) */}
              <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-4/3 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg">
                {isCameraOn ? (
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop"
                    alt="Camera gia đình"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[11px] gap-1 bg-slate-900">
                    <span className="material-symbols-outlined text-[20px]">videocam_off</span>
                    <span>Camera đang tắt</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                  Bạn (Cụ Phúc)
                </div>
              </div>

              {/* Bottom Central Control Bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-xl">
                {/* Mic toggle */}
                <button
                  type="button"
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isMicOn
                      ? 'bg-slate-700/80 hover:bg-slate-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                  title={isMicOn ? 'Tắt Micro' : 'Bật Micro'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isMicOn ? 'mic' : 'mic_off'}
                  </span>
                </button>

                {/* Camera toggle */}
                <button
                  type="button"
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isCameraOn
                      ? 'bg-slate-700/80 hover:bg-slate-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                  title={isCameraOn ? 'Tắt Camera' : 'Bật Camera'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isCameraOn ? 'videocam' : 'videocam_off'}
                  </span>
                </button>

                {/* Send Photo Action */}
                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  className="w-10 h-10 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Gửi ảnh màn hình máy đo cho bác sĩ"
                >
                  <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                </button>

                {/* End call button */}
                <button
                  type="button"
                  onClick={() => setShowEndCallModal(true)}
                  className="px-4 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Rời phòng tư vấn"
                >
                  <span className="material-symbols-outlined text-[18px]">call_end</span>
                  <span className="hidden sm:inline">Rời phòng khám</span>
                </button>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 mt-0.5">
                verified_user
              </span>
              <div>
                <strong className="font-bold">Lưu ý trong ca khám Telehealth:</strong>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  Bác sĩ đang quan sát trực tiếp cử động và nhịp thở của cụ Phúc. Nếu đường truyền mạng bị gián đoạn, hệ thống sẽ tự động kích hoạt kênh chat y khoa dự phòng hoặc chuyển tiếp cuộc gọi thoại khẩn cấp.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Tabs (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[580px]">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-slate-100 bg-slate-50/80 p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white text-[#2E37A4] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Chat y tế</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vitals')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'vitals'
                    ? 'bg-white text-[#2E37A4] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">ecg_heart</span>
                <span>Sinh hiệu</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('doctor')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'doctor'
                    ? 'bg-white text-[#2E37A4] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>Bác sĩ</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full justify-between space-y-3">
                  {/* Messages list */}
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                    {chatMessages.map((msg) => {
                      const isMe = msg.sender === 'patient';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-slate-400 font-semibold mb-1 px-1">
                            {msg.senderName} • {msg.time}
                          </span>
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                              isMe
                                ? 'bg-[#2E37A4] text-white rounded-br-xs'
                                : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                            }`}
                          >
                            <p>{msg.text}</p>
                            {msg.attachment && (
                              <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">image</span>
                                <span className="text-[11px] underline truncate">
                                  {msg.attachment.name} ({msg.attachment.size})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input Form */}
                  <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <input
                      type="text"
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder="Nhắn tin với Bác sĩ Nghĩa..."
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4]"
                    />
                    <button
                      type="submit"
                      className="w-9 h-9 rounded-xl bg-[#2E37A4] hover:bg-indigo-800 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                      title="Gửi tin nhắn"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Huyết áp đo sáng nay (07:00)
                    </span>
                    <div className="text-lg font-bold text-slate-900 tabular-nums flex items-center justify-between">
                      <span>135 / 85 mmHg</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        Hơi cao
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nhịp tim nghỉ ngơi
                    </span>
                    <div className="text-lg font-bold text-slate-900 tabular-nums flex items-center justify-between">
                      <span>76 bpm</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Ổn định
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nồng độ Oxy trong máu SpO2
                    </span>
                    <div className="text-lg font-bold text-slate-900 tabular-nums flex items-center justify-between">
                      <span>98 %</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Bình thường
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Đường huyết mao mạch
                    </span>
                    <div className="text-lg font-bold text-slate-900 tabular-nums flex items-center justify-between">
                      <span>6.2 mmol/L</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Sau ăn 2h
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'doctor' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop"
                      alt="PGS.TS Nguyễn Trọng Nghĩa"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#2E37A4]">
                        Bác Sĩ Quản Nhiệm Hộ
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        PGS.TS Nguyễn Trọng Nghĩa
                      </h4>
                      <p className="text-xs text-slate-500">BV Đại học Y Dược TP.HCM</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số CCHN:</span>
                      <span className="font-bold tabular-nums text-slate-800">004128/BYT-CCHN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chuyên khoa:</span>
                      <span className="font-semibold text-slate-800">Y học Gia đình &amp; Tim mạch</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cam kết SLA:</span>
                      <span className="font-semibold text-emerald-700">Phản hồi &lt; 15 phút</span>
                    </div>
                  </div>

                  <Link
                    href="/family/members/mem-01"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">history_edu</span>
                    <span>Xem Hồ Sơ Bệnh Án Cụ Phúc</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Xác nhận Rời phòng khám */}
        {showEndCallModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">call_end</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Rời Phòng Khám Telehealth</h3>
                  <p className="text-xs text-slate-500">Kết thúc phiên tư vấn trực tuyến</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn rời phòng khám? Bác sĩ sẽ hoàn tất phiếu khám SOAP và cập nhật đơn thuốc mới vào hồ sơ bệnh án của gia đình.
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndCallModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Ở lại phòng khám
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEndCallModal(false);
                    router.push('/family/appointments');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Rời phòng gọi
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
