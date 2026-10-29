'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface DoctorItem {
  id: string;
  name: string;
  role: string;
  ratingText: string;
  bio: string;
  cchn: string;
  badge: string;
  fee: string;
  avatar: string;
}

const DOCTORS: DoctorItem[] = [
  {
    id: 'DOC-01',
    name: 'PGS.TS Nguyễn Trọng Nghĩa',
    role: 'Trưởng khoa Nội tổng quát & Y học gia đình',
    ratingText: '5.0 (480+ đánh giá) • 24 năm KN',
    bio: 'Nguyên Trưởng khoa Khám bệnh BV Đại học Y Dược TP.HCM. Chuyên gia đầu ngành về quản lý tăng huyết áp và đái tháo đường typ 2 tại gia đình.',
    cchn: 'CCHN: 004128/BYT',
    badge: 'Lịch trống hôm nay',
    fee: '350.000đ',
    avatar: '/images/medsev/home-one/doctor/1.jpg',
  },
  {
    id: 'DOC-02',
    name: 'BSCKII Trần Mai Phương',
    role: 'Chuyên gia Nhi & Dinh dưỡng phát triển',
    ratingText: '4.9 (620+ đánh giá) • 18 năm KN',
    bio: 'Từng công tác tại BV Nhi Đồng 1. Cố vấn phác đồ phát triển thể chất và miễn dịch cho trẻ từ sơ sinh đến vị thành niên.',
    cchn: 'CCHN: 009821/BYT',
    badge: 'Bác sĩ gia đình yêu thích',
    fee: '300.000đ',
    avatar: '/images/medsev/home-one/doctor/2.jpg',
  },
  {
    id: 'DOC-03',
    name: 'ThS.BS Lê Hoàng Nam',
    role: 'Trưởng Ban Hội Chẩn Lão Khoa & Tim Mạch',
    ratingText: 'CCHN Cấp bởi Bộ Y Tế • 22 năm KN',
    bio: 'Anh Lê Hoàng Nam - Chuyên gia hội chẩn cấp cao, chuyên sâu điều trị bệnh đa cơ quan ở người cao tuổi, tối ưu hóa phác đồ sử dụng thuốc an toàn tại nhà.',
    cchn: 'CCHN: 007612/BYT',
    badge: 'Tư vấn chuyên sâu',
    fee: '400.000đ',
    avatar: '/images/medsev/home-one/doctor/3.jpg',
  },
];

const TIME_SLOTS = [
  '08:30 - 09:30 (Sáng)',
  '10:00 - 11:00 (Sáng)',
  '14:00 - 15:00 (Chiều)',
  '16:30 - 17:30 (Chiều)',
  '19:00 - 20:00 (Tối)',
];

export function LandingDoctors() {
  const [bookedDoctor, setBookedDoctor] = useState<string | null>(null);
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<DoctorItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [phone, setPhone] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  const handleBooking = (docName: string) => {
    setBookedDoctor(docName);
    const targetDoc = DOCTORS.find((d) => d.name === docName);
    if (targetDoc) {
      setSelectedDoctorForModal(targetDoc);
      setModalSuccess(false);
    }
    setTimeout(() => {
      setBookedDoctor(null);
    }, 4500);
  };

  const handleConfirmModalBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess(true);
    setTimeout(() => {
      setSelectedDoctorForModal(null);
      setModalSuccess(false);
      setPhone('');
    }, 2000);
  };

  return (
    <section id="bac-si" className="py-20 bg-slate-50 border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
            <span className="sr-only">ĐỘI NGŨ CHUYÊN GIA HÀNG ĐẦU</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Bác Sĩ Tiêu Biểu &amp; Trưởng Khoa Quản Nhiệm
            </h2>
            <p className="text-sm text-slate-600">
              Đội ngũ bác sĩ giàu y đức, chứng chỉ hành nghề chính quy và tận tâm đồng hành dài lâu cùng gia đình.
            </p>
          </div>

          <Link
            href="/doctors"
            className="text-xs sm:text-sm font-semibold text-[#0046c0] hover:text-[#003899] flex items-center gap-1.5 py-1 group"
          >
            <span>Xem toàn bộ 1.200+ bác sĩ</span>
            <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Success Alert if booked */}
        {bookedDoctor && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2 animate-fade-in shadow-xs">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>Đã ghi nhận yêu cầu đặt lịch với {bookedDoctor}. Trợ lý y tế sẽ gọi xác nhận trong 5 phút.</span>
          </div>
        )}

        {/* Faculty Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DOCTORS.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default"
            >
              {/* Doctor Portrait Header */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={doc.avatar}
                  alt={doc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded bg-white/95 text-slate-700 text-[11px] font-medium border border-slate-200 shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {doc.badge}
                  </span>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {doc.cchn}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors">
                    {doc.name}
                  </h3>
                  <div className="text-xs font-semibold text-[#0046c0]">
                    {doc.role}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1 font-normal">
                    {doc.bio}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                      <span>{doc.ratingText}</span>
                    </span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{doc.fee}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/doctors"
                      className="py-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Hồ sơ chi tiết</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleBooking(doc.name)}
                      className="py-2.5 rounded bg-[#0046c0] hover:bg-[#003899] active:scale-[0.98] text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-base">calendar_month</span>
                      <span>Đặt lịch khám</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Quick Booking Modal Popup */}
      {selectedDoctorForModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDoctorForModal(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedDoctorForModal.avatar}
                  alt={selectedDoctorForModal.name}
                  className="w-12 h-12 rounded-full object-cover border border-blue-200"
                />
                <div>
                  <div className="text-xs text-slate-500">{selectedDoctorForModal.cchn}</div>
                  <h4 className="text-base font-bold text-slate-900">{selectedDoctorForModal.name}</h4>
                  <div className="text-xs text-[#0046c0] font-medium">{selectedDoctorForModal.role}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctorForModal(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            {modalSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">check</span>
                </div>
                <h5 className="text-base font-bold text-slate-900">Đặt Lịch Hẹn Thành Công!</h5>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Yêu cầu khám cùng <strong>{selectedDoctorForModal.name}</strong> vào khung giờ{' '}
                  <strong>{selectedSlot}</strong> đã được lưu. Trợ lý y tế sẽ liên hệ số {phone || 'của bạn'} để hoàn tất hồ sơ.
                </p>
                <div className="pt-2">
                  <span className="inline-block text-[11px] text-slate-400 font-mono">Mã cuộc hẹn: #FMD-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmModalBooking} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Chọn Khung Giờ Khám Trống Hôm Nay
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 rounded text-xs text-left transition-all cursor-pointer ${
                          selectedSlot === slot
                            ? 'bg-[#0046c0] text-white font-medium shadow-xs'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Điện Thoại Nhận Xác Nhận (SMS &amp; Call)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full h-10 px-3 text-xs border border-slate-300 rounded-md focus:border-[#0046c0] focus:ring-1 focus:ring-[#0046c0] outline-none"
                  />
                </div>

                <div className="p-3 rounded bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Phí khám dự kiến:</span>
                  <span className="font-bold text-[#0046c0] text-sm">{selectedDoctorForModal.fee}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorForModal(null)}
                    className="flex-1 h-10 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded bg-[#0046c0] hover:bg-[#003899] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Xác Nhận Hẹn Khám
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
