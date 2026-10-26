'use client';

import React, { useState } from 'react';
import { submitConsultationLeadAction } from '../actions/submit-consultation-lead';
import { PackageInterest } from '../types';

export function LandingCtaBanner() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [packageInterest, setPackageInterest] = useState<PackageInterest>('FAMILY');
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanPhone = phoneNumber.replace(/[\s.-]/g, '');
    const vietnamesePhoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
    if (!vietnamesePhoneRegex.test(cleanPhone)) {
      setMessage({
        text: 'Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).',
        isError: true,
      });
      return;
    }

    setIsPending(true);

    const res = await submitConsultationLeadAction({
      fullName: fullName.trim() || 'Khách hàng quan tâm',
      phoneNumber: cleanPhone,
      packageInterest,
      notes: 'Đăng ký tư vấn từ trang chủ',
    });

    setIsPending(false);

    if (res.success) {
      setMessage({
        text: 'Đăng ký thành công! Bác sĩ cố vấn trưởng sẽ liên lạc với gia đình bạn trong 15 phút.',
        isError: false,
      });
      setFullName('');
      setPhoneNumber('');
    } else {
      setMessage({
        text: res.message || 'Vui lòng kiểm tra lại thông tin gửi tới bác sĩ.',
        isError: true,
      });
    }
  };

  return (
    <>
      {/* SECTION 06: TIÊU CHUẨN AN TOÀN BẢO MẬT */}
      <section className="py-12 bg-[#faf8ff] border-t border-[#c4c5d7]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-bold text-[#747686] uppercase tracking-widest">
            TIÊU CHUẨN AN TOÀN BẢO MẬT DỮ LIỆU Y TẾ QUỐC TẾ &amp; VIỆT NAM
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-80 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 font-bold text-sm text-[#0037c1]">
              <span className="material-symbols-filled text-xl text-[#0037c1]">shield</span>
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-sm text-[#0037c1]">
              <span className="material-symbols-outlined text-xl text-[#0037c1]">dataset</span>
              <span>HL7 FHIR v4.0</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-sm text-[#0037c1]">
              <span className="material-symbols-outlined text-xl text-[#0037c1]">verified</span>
              <span>ISO 27799:2016 Y Tế</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-sm text-[#0037c1]">
              <span className="material-symbols-outlined text-xl text-[#0037c1]">fingerprint</span>
              <span>VNeID Đề án 06</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-sm text-[#0037c1]">
              <span className="material-symbols-outlined text-xl text-[#0037c1]">vpn_key</span>
              <span>Ký số HSM Viettel/VNPT</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 07: CTA BANNER & QUICK SUBSCRIPTION */}
      <section
        id="tu-van"
        className="relative py-20 bg-gradient-to-r from-[#001355] via-[#00258b] to-[#0037c1] text-white overflow-hidden scroll-mt-20"
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#fa8c16]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#52c41a]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#ffdcc3] text-xs font-semibold border border-white/20">
              <span className="material-symbols-filled text-sm">health_and_safety</span>
              <span>Trao Gửi Sức Khỏe Gia Đình Cho Bác Sĩ Tận Tâm Hôm Nay</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Hãy Để FamiDoc Pro Đồng Hành Chăm Sóc Những Người Thân Yêu Nhất Của Bạn
            </h2>

            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto">
              Đăng ký ngay hôm nay để nhận buổi kiểm tra sức khỏe tổng quát ban đầu tại nhà miễn phí và
              14 ngày trải nghiệm trọn bộ dịch vụ Trợ lý AI Bác sĩ gia đình.
            </p>

            {/* Quick Consultation Form */}
            <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/20 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Họ và tên..."
                    className="w-full sm:w-1/2 h-12 px-4 rounded-xl text-xs sm:text-sm bg-white text-[#131b2f] placeholder-[#747686] border-0 focus:ring-2 focus:ring-[#fa8c16]"
                  />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Số điện thoại (10 chữ số)..."
                    className="w-full sm:w-1/2 h-12 px-4 rounded-xl text-xs sm:text-sm bg-white text-[#131b2f] placeholder-[#747686] border-0 focus:ring-2 focus:ring-[#fa8c16]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <select
                    value={packageInterest}
                    onChange={(e) => setPackageInterest(e.target.value as PackageInterest)}
                    className="w-full sm:flex-1 h-12 px-4 rounded-xl text-xs sm:text-sm bg-white text-[#131b2f] border-0 focus:ring-2 focus:ring-[#fa8c16]"
                  >
                    <option value="BASIC">Gói Chăm Sóc Cơ Bản (850k/tháng)</option>
                    <option value="FAMILY">Gói Gia Đình Toàn Diện (1.850k/tháng)</option>
                    <option value="ELDERLY">Gói Chăm Sóc Người Cao Tuổi (2.450k/tháng)</option>
                    <option value="ROYAL">Gói Gia Đình Hoàng Gia (VIP)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-[#fa8c16] to-[#ff9c2a] hover:from-[#e07b10] hover:to-[#fa8c16] text-white text-xs sm:text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-70"
                  >
                    {isPending ? 'Đang gửi...' : 'Đăng ký tư vấn miễn phí'}
                  </button>
                </div>
              </form>

              {message && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-semibold ${
                    message.isError
                      ? 'bg-red-500/80 text-white'
                      : 'bg-emerald-500/90 text-white'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>

            {/* Hotline Callout Action */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  window.location.href = 'tel:19008821';
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-[#fa8c16]">call</span>
                <span>Hotline: 1900 8821</span>
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-filled text-emerald-400 text-sm">
                  check_circle
                </span>
                Không cam kết ràng buộc
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-filled text-emerald-400 text-sm">
                  check_circle
                </span>
                Hoàn tiền 100% trong 30 ngày
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-filled text-emerald-400 text-sm">
                  check_circle
                </span>
                Hỗ trợ 24/7 toàn quốc
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
