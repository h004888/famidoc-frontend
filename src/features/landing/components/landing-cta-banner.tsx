'use client';

import React, { useState } from 'react';
import { submitConsultationLeadAction } from '../actions/submit-consultation-lead';
import type { LandingPackageItem } from '../types';

export interface LandingCtaBannerProps {
  packages?: LandingPackageItem[];
}

export function LandingCtaBanner({ packages = [] }: LandingCtaBannerProps = {}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredPackageId, setPreferredPackageId] = useState<string>(packages[0]?.id ?? '');
  const [healthNeeds, setHealthNeeds] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanPhone = phone.replace(/[\s.-]/g, '');
    setIsPending(true);

    const res = await submitConsultationLeadAction({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email.trim(),
      healthNeeds: healthNeeds.trim(),
      preferredPackageId: preferredPackageId || undefined,
    });

    setIsPending(false);

    if (res.success) {
      const ticketNote = res.ticketId ? ` (Mã tiếp nhận: ${res.ticketId})` : '';
      setMessage({
        text: `Đăng ký thành công${ticketNote}! Bác sĩ cố vấn trưởng sẽ liên lạc với gia đình bạn trong 15 phút.`,
        isError: false,
      });
      setFullName('');
      setPhone('');
      setEmail('');
      setHealthNeeds('');
    } else {
      const firstFieldError = res.errors
        ? Object.values(res.errors).flat().find(Boolean)
        : undefined;
      setMessage({
        text:
          firstFieldError ||
          res.message ||
          'Vui lòng kiểm tra lại thông tin gửi tới bác sĩ.',
        isError: true,
      });
    }
  };

  return (
    <section className="relative py-20 bg-gradient-to-br from-[#00258b] via-[#0037c1] to-[#0046c0] text-white overflow-hidden">
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-blue-100 text-xs font-semibold">
              <span className="material-symbols-outlined text-sm text-blue-200">verified</span>
              <span>Đồng Hành Sức Khỏe Y Học Gia Đình 24/7</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white drop-shadow-xs">
              Trao Gửi Sức Khỏe Gia Đình Cho Bác Sĩ Tận Tâm Hôm Nay
            </h2>

            <p className="text-base text-blue-100 leading-relaxed font-normal">
              Đăng ký để nhận tư vấn từ Bác sĩ Trưởng ban chuyên môn. Chúng tôi sẽ phân bổ bác sĩ gia đình phù hợp nhất với vị trí và tiền sử sức khỏe của gia đình bạn.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = 'tel:19008821';
                }}
                className="px-6 py-3.5 rounded-lg bg-white hover:bg-slate-100 text-[#0037c1] font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2.5 transition-all cursor-pointer"
                aria-label="Hotline: 1900 8821"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span>Hotline: 1900 8821</span>
              </button>

              <div className="text-xs text-blue-100 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15">
                <span className="material-symbols-outlined text-emerald-300 text-base">timer</span>
                <span>Phản hồi nhanh trong 15 phút</span>
              </div>
            </div>
          </div>

          {/* Right: Clean Clinical Intake Form */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border border-white/60 shadow-2xl">
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
                  role="status"
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
                  <label
                    htmlFor="cta-fullname"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Họ và tên người đại diện
                  </label>
                  <input
                    id="cta-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:border-[#0037c1] focus:ring-2 focus:ring-[#0037c1]/20 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="cta-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Số điện thoại liên hệ
                    </label>
                    <input
                      id="cta-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0912345678"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:border-[#0037c1] focus:ring-2 focus:ring-[#0037c1]/20 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cta-email"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Email nhận phản hồi
                    </label>
                    <input
                      id="cta-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ví dụ: an.nguyen@famidoc.vn"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:border-[#0037c1] focus:ring-2 focus:ring-[#0037c1]/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cta-package"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Gói dịch vụ quan tâm
                  </label>
                  <select
                    id="cta-package"
                    value={preferredPackageId}
                    onChange={(e) => setPreferredPackageId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:border-[#0037c1] focus:ring-2 focus:ring-[#0037c1]/20 transition-all outline-none"
                  >
                    <option value="">Tư vấn chọn gói phù hợp nhất</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.packageName} ({pkg.durationMonths} Tháng • Tối đa {pkg.maxMembers} người)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cta-health-needs"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nhu cầu chăm sóc sức khỏe gia đình
                  </label>
                  <textarea
                    id="cta-health-needs"
                    required
                    rows={2}
                    value={healthNeeds}
                    onChange={(e) => setHealthNeeds(e.target.value)}
                    placeholder="Ví dụ: Gia đình có bố mẹ lớn tuổi cần theo dõi huyết áp định kỳ tại nhà."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 text-sm focus:border-[#0037c1] focus:ring-2 focus:ring-[#0037c1]/20 transition-all outline-none resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3.5 rounded-lg bg-[#0037c1] hover:bg-[#00258b] text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
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
