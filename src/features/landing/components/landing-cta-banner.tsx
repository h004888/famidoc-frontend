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
    <section id="dang-ky" className="py-20 bg-slate-900 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Trao Gửi Sức Khỏe Gia Đình Cho Bác Sĩ Tận Tâm Hôm Nay
            </h2>

            <p className="text-base text-slate-300 leading-relaxed font-normal">
              Đăng ký để nhận tư vấn từ Bác sĩ Trưởng ban chuyên môn. Chúng tôi sẽ phân bổ bác sĩ gia đình phù hợp nhất với vị trí và tiền sử sức khỏe của gia đình bạn.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = 'tel:19008821';
                }}
                className="px-6 py-3 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm flex items-center gap-2.5 transition-colors cursor-pointer"
                aria-label="Hotline: 1900 8821"
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>Hotline: 1900 8821</span>
              </button>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
                <span>Phản hồi nhanh trong 15 phút</span>
              </div>
            </div>
          </div>

          {/* Right: Clean Clinical Intake Form */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 rounded-lg p-6 sm:p-8 border border-slate-200">
              <div className="mb-6 space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Đăng Ký Tư Vấn Bác Sĩ Miễn Phí
                </h3>
                <p className="text-xs text-slate-500">
                  Điền thông tin bên dưới, Bác sĩ gia đình sẽ liên hệ trực tiếp hỗ trợ bạn.
                </p>
              </div>

              {message && (
                <div
                  className={`p-3 rounded mb-4 text-xs font-medium flex items-center gap-2 ${
                    message.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {message.isError ? 'error' : 'check_circle'}
                  </span>
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên người đại diện
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full h-11 px-3.5 rounded border border-slate-300 bg-white text-slate-900 text-sm focus:border-[#0046c0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full h-11 px-3.5 rounded border border-slate-300 bg-white text-slate-900 text-sm focus:border-[#0046c0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gói dịch vụ quan tâm
                  </label>
                  <select
                    value={packageInterest}
                    onChange={(e) => setPackageInterest(e.target.value as PackageInterest)}
                    className="w-full h-11 px-3.5 rounded border border-slate-300 bg-white text-slate-900 text-sm focus:border-[#0046c0] outline-none"
                  >
                    <option value="BASIC">Gói Chăm Sóc Cơ Bản (2 thành viên)</option>
                    <option value="FAMILY">Gói Gia Đình Toàn Diện (4 thành viên)</option>
                    <option value="ELDERLY">Gói Chăm Sóc Người Cao Tuổi</option>
                    <option value="ROYAL">Gói Gia Đình Hoàng Gia (VIP)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 rounded bg-[#0046c0] hover:bg-[#003899] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isPending ? (
                      <span>Đang gửi thông tin...</span>
                    ) : (
                      <>
                        <span>Đăng ký tư vấn miễn phí</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
