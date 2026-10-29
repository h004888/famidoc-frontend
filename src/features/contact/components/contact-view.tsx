'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';

interface InquiryFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  packageInterest: string;
  notes: string;
  agreedConsent: boolean;
}

const INITIAL_FORM: InquiryFormData = {
  fullName: '',
  phoneNumber: '',
  email: '',
  packageInterest: 'Gói Chăm Sóc Sức Khỏe Gia Đình Toàn Diện',
  notes: '',
  agreedConsent: true,
};

export function ContactView() {
  const [formData, setFormData] = useState<InquiryFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inquiryCode, setInquiryCode] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof InquiryFormData, string>>>({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const validate = (): boolean => {
    const errors: Partial<Record<keyof InquiryFormData, string>> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn.';
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại.';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\s+/g, ''))) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ (Vui lòng nhập 10 chữ số).';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!formData.agreedConsent) {
      errors.agreedConsent = 'Bạn cần đồng ý với điều khoản và chính sách bảo mật.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      const randomCode = 'FMD-' + Math.floor(100000 + Math.random() * 900000);
      setInquiryCode(randomCode);
    }, 600);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      setNewsletterSubmitted(true);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#232323] font-sans antialiased flex flex-col justify-between">
      {/* 1. Header (Shared Medsev Landing Header) */}
      <LandingHeader />

      <main className="flex-1">
        {/* 2. Medsev Page Title Area (.page-title-area.page-title-five) */}
        <section
          className="relative bg-cover bg-center py-24 sm:py-32 text-center text-white"
          style={{ backgroundImage: "url('/images/medsev/contact/1.jpg')" }}
        >
          {/* Cobalt Blue Overlay (Matching Medsev #0046c0 / 75%) */}
          <div className="absolute inset-0 bg-[#0046c0]/75" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-xs">
              Liên Hệ &amp; Tư Vấn
            </h1>

            {/* Medsev Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center justify-center gap-2 text-sm text-blue-100 font-medium"
            >
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-base">home</span>
                Trang chủ
              </Link>
              <span className="text-blue-200">/</span>
              <span className="text-white font-semibold">Liên hệ</span>
            </nav>
          </div>
        </section>

        {/* 3. Medsev Location Area (.location-area & .location-wrap) */}
        <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 lg:-mt-24">
          <div
            className="bg-white rounded-2xl shadow-[0_0_25px_0_rgba(0,0,0,0.08)] border border-slate-100 p-8 sm:p-12 lg:p-14 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/medsev/home-one/3.png')" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
              {/* Location Column */}
              <div className="text-center md:text-left space-y-3">
                <div className="w-[75px] h-[75px] rounded-full bg-[#0046c0] text-white flex items-center justify-center text-3xl mx-auto md:mx-0 shadow-md">
                  <span className="material-symbols-outlined text-3xl">location_on</span>
                </div>
                <h3 className="text-2xl font-semibold text-[#232323]">Địa Chỉ</h3>
                <div className="text-sm text-[#4a6f8a] leading-relaxed space-y-2">
                  <p>
                    <strong className="text-slate-800 font-medium">TP. Hồ Chí Minh:</strong>
                    <br />
                    Tầng 8, Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1
                  </p>
                  <p>
                    <strong className="text-slate-800 font-medium">Hà Nội:</strong>
                    <br />
                    Tầng 6, Tháp Hà Nội, 49 Hai Bà Trưng, Hoàn Kiếm
                  </p>
                </div>
              </div>

              {/* Email Column */}
              <div className="text-center md:text-left space-y-3">
                <div className="w-[75px] h-[75px] rounded-full bg-[#0046c0] text-white flex items-center justify-center text-3xl mx-auto md:mx-0 shadow-md">
                  <span className="material-symbols-outlined text-3xl">mail</span>
                </div>
                <h3 className="text-2xl font-semibold text-[#232323]">Email</h3>
                <div className="text-sm text-[#4a6f8a] leading-relaxed space-y-1.5">
                  <p>
                    <a href="mailto:hotro@famidoc.vn" className="hover:text-[#0046c0] transition-colors block">
                      hotro@famidoc.vn
                    </a>
                  </p>
                  <p>
                    <a href="mailto:tuvan@famidoc.vn" className="hover:text-[#0046c0] transition-colors block">
                      tuvan@famidoc.vn
                    </a>
                  </p>
                  <p>
                    <a href="mailto:cskh@famidoc.vn" className="hover:text-[#0046c0] transition-colors block">
                      cskh@famidoc.vn
                    </a>
                  </p>
                </div>
              </div>

              {/* Phone Column */}
              <div className="text-center md:text-left space-y-3">
                <div className="w-[75px] h-[75px] rounded-full bg-[#0046c0] text-white flex items-center justify-center text-3xl mx-auto md:mx-0 shadow-md">
                  <span className="material-symbols-outlined text-3xl">call</span>
                </div>
                <h3 className="text-2xl font-semibold text-[#232323]">Điện Thoại</h3>
                <div className="text-sm text-[#4a6f8a] leading-relaxed space-y-1.5">
                  <p>
                    <a href="tel:19008821" className="text-lg font-bold text-[#0046c0] hover:underline block">
                      1900 8821 (Toàn quốc)
                    </a>
                  </p>
                  <p>
                    <a href="tel:02873008821" className="hover:text-[#0046c0] transition-colors block">
                      +84 (028) 7300 8821 (TP.HCM)
                    </a>
                  </p>
                  <p>
                    <a href="tel:02473008821" className="hover:text-[#0046c0] transition-colors block">
                      +84 (024) 7300 8821 (Hà Nội)
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Medsev Drop Area (.drop-area) */}
        <section className="pt-20 lg:pt-28 pb-16 lg:pb-24">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden shadow-[0_0_30px_0_rgba(0,0,0,0.06)] border border-slate-100">
              {/* Left Column: Contact Form (.drop-left & .drop-img) */}
              <div
                className="lg:col-span-7 bg-cover bg-center p-8 sm:p-12 lg:p-16 relative"
                style={{ backgroundImage: "url('/images/medsev/contact/2.png')" }}
              >
                <div className="max-w-xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-[#232323] mb-4 leading-tight">
                    Để lại thông tin hoặc câu hỏi cần tư vấn y tế.
                  </h2>
                  <p className="text-sm text-[#4a6f8a] mb-8 leading-relaxed">
                    Bác sĩ chuyên khoa FamiDoc sẽ liên hệ lại qua điện thoại trong vòng 15 phút để tư vấn phác đồ và giải đáp thắc mắc sức khỏe của gia đình bạn.
                  </p>

                  {isSubmitted ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 sm:p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                      </div>
                      <h3 className="text-xl font-bold text-emerald-900">Gửi Yêu Cầu Thành Công!</h3>
                      <p className="text-sm text-emerald-700 leading-relaxed max-w-md mx-auto">
                        Cảm ơn bạn đã tin tưởng FamiDoc. Mã yêu cầu tư vấn của bạn là:{' '}
                        <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                          {inquiryCode}
                        </span>
                        . Bác sĩ điều phối sẽ gọi lại số điện thoại{' '}
                        <strong className="text-emerald-900">{formData.phoneNumber}</strong> trong thời gian sớm nhất.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData(INITIAL_FORM);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0046c0] hover:underline cursor-pointer pt-2"
                      >
                        <span className="material-symbols-outlined text-base">refresh</span>
                        Gửi câu hỏi hoặc yêu cầu khác
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Name Input */}
                        <div>
                          <input
                            type="text"
                            name="name"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Họ và tên của bạn *"
                            className={`w-full h-[50px] px-5 rounded-md bg-white border border-slate-200 shadow-[0_0_15px_0_rgba(221,221,221,0.64)] focus:outline-hidden focus:border-[#0046c0] text-sm text-[#232323] placeholder:text-[#4a6f8a] transition-all ${
                              formErrors.fullName ? 'border-rose-500' : ''
                            }`}
                          />
                          {formErrors.fullName && (
                            <p className="text-xs text-rose-500 mt-1 pl-1">{formErrors.fullName}</p>
                          )}
                        </div>

                        {/* Email Input */}
                        <div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Địa chỉ Email"
                            className={`w-full h-[50px] px-5 rounded-md bg-white border border-slate-200 shadow-[0_0_15px_0_rgba(221,221,221,0.64)] focus:outline-hidden focus:border-[#0046c0] text-sm text-[#232323] placeholder:text-[#4a6f8a] transition-all ${
                              formErrors.email ? 'border-rose-500' : ''
                            }`}
                          />
                          {formErrors.email && (
                            <p className="text-xs text-rose-500 mt-1 pl-1">{formErrors.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Phone Input */}
                        <div>
                          <input
                            type="tel"
                            name="phone_number"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="Số điện thoại di động *"
                            className={`w-full h-[50px] px-5 rounded-md bg-white border border-slate-200 shadow-[0_0_15px_0_rgba(221,221,221,0.64)] focus:outline-hidden focus:border-[#0046c0] text-sm text-[#232323] placeholder:text-[#4a6f8a] transition-all ${
                              formErrors.phoneNumber ? 'border-rose-500' : ''
                            }`}
                          />
                          {formErrors.phoneNumber && (
                            <p className="text-xs text-rose-500 mt-1 pl-1">{formErrors.phoneNumber}</p>
                          )}
                        </div>

                        {/* Subject / Service Selection */}
                        <div>
                          <select
                            name="packageInterest"
                            value={formData.packageInterest}
                            onChange={(e) => setFormData({ ...formData, packageInterest: e.target.value })}
                            aria-label="Chọn dịch vụ hoặc gói y tế quan tâm"
                            className="w-full h-[50px] px-4 rounded-md bg-white border border-slate-200 shadow-[0_0_15px_0_rgba(221,221,221,0.64)] focus:outline-hidden focus:border-[#0046c0] text-sm text-[#232323] transition-all cursor-pointer"
                          >
                            <option value="Gói Chăm Sóc Sức Khỏe Gia Đình Toàn Diện">
                              Gói Sức Khỏe Gia Đình Toàn Diện
                            </option>
                            <option value="Gói Bác Sĩ Gia Đình Cao Cấp (VIP Care)">
                              Gói Bác Sĩ Gia Đình Cao Cấp (VIP Care)
                            </option>
                            <option value="Gói Chăm Sóc Người Cao Tuổi & Bệnh Mạn Tính">
                              Gói Chăm Sóc Người Cao Tuổi &amp; Mạn Tính
                            </option>
                            <option value="Gói Chăm Sóc Mẹ & Bé Sơ Sinh Toàn Diện">
                              Gói Chăm Sóc Mẹ &amp; Bé Sơ Sinh
                            </option>
                            <option value="Đặt Lịch Khám & Lấy Máu Tại Nhà">
                              Đặt Lịch Khám &amp; Lấy Máu Tại Nhà
                            </option>
                            <option value="Khác - Ý Kiến & Hỏi Đáp Chung">
                              Khác - Ý Kiến &amp; Hỏi Đáp Chung
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Message Textarea */}
                      <div>
                        <textarea
                          name="message"
                          rows={4}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Nội dung cần tư vấn hoặc tình trạng sức khỏe hiện tại của các thành viên trong gia đình..."
                          className="w-full p-4 sm:p-5 rounded-md bg-white border border-slate-200 shadow-[0_0_15px_0_rgba(221,221,221,0.64)] focus:outline-hidden focus:border-[#0046c0] text-sm text-[#232323] placeholder:text-[#4a6f8a] transition-all resize-y"
                        />
                      </div>

                      {/* Terms & Privacy Consent */}
                      <div className="space-y-1">
                        <label className="flex items-start gap-2.5 text-xs text-[#4a6f8a] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.agreedConsent}
                            onChange={(e) => setFormData({ ...formData, agreedConsent: e.target.checked })}
                            className="mt-0.5 rounded border-slate-300 text-[#0046c0] focus:ring-[#0046c0] cursor-pointer"
                          />
                          <span>
                            Tôi đồng ý với{' '}
                            <Link href="/terms" className="text-[#0046c0] hover:underline font-medium">
                              Điều khoản dịch vụ
                            </Link>{' '}
                            và cam kết bảo mật hồ sơ y tế theo{' '}
                            <Link href="/privacy" className="text-[#0046c0] hover:underline font-medium">
                              Chính sách bảo mật FamiDoc
                            </Link>
                            .
                          </span>
                        </label>
                        {formErrors.agreedConsent && (
                          <p className="text-xs text-rose-500 pl-6">{formErrors.agreedConsent}</p>
                        )}
                      </div>

                      {/* Submit Button (.drop-btn) */}
                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center justify-center gap-2 font-semibold text-[15px] text-white bg-[#0046c0] hover:bg-[#4a6f8a] px-9 py-3.5 rounded transition-all duration-300 shadow-sm disabled:opacity-70 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="material-symbols-outlined text-lg animate-spin">
                                progress_activity
                              </span>
                              <span>Đang gửi thông tin...</span>
                            </>
                          ) : (
                            <>
                              <span>Gửi Yêu Cầu Tư Vấn</span>
                              <span className="material-symbols-outlined text-base">send</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Column: Speciality Emergency Area (.speciality-right-three & .speciality-emergency) */}
              <div
                className="lg:col-span-5 relative min-h-[440px] lg:min-h-full bg-cover bg-center flex items-end p-6 sm:p-10"
                style={{ backgroundImage: "url('/images/medsev/home-two/4.jpg')" }}
              >
                {/* Dark Vignette Overlay for Image Contrast */}
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

                {/* Floating Emergency Box (.speciality-emergency) */}
                <div className="relative z-10 w-full bg-[#0046c0] text-white p-6 sm:p-8 rounded-xl shadow-2xl flex items-center gap-5">
                  {/* Diamond Icon (.speciality-icon) */}
                  <div className="w-12 h-12 bg-white flex items-center justify-center transform rotate-45 shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-[#0046c0] text-2xl transform -rotate-45 font-bold">
                      call
                    </span>
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg sm:text-xl text-white tracking-wide">
                      Tổng Đài Cấp Cứu 24/7
                    </h3>
                    <a
                      href="tel:19008821"
                      className="text-2xl sm:text-3xl font-bold font-mono text-white hover:text-blue-100 transition-colors block"
                    >
                      1900 8821
                    </a>
                    <p className="text-xs text-blue-100 pt-0.5">
                      Điều phối bác sĩ cấp cứu &amp; xe cứu thương tại nhà
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Medsev Google Map Embed (#map) */}
        <section className="w-full">
          <iframe
            id="map"
            title="Trung tâm điều phối Y tế FamiDoc"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.424167419728!2d106.70014237586866!3d10.778786959149202!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f46755ab06b%3A0xc33118d09575191b!2sVincom%20Center%20Dong%20Khoi!5e0!3m2!1svi!2svn!4v1711200000000!5m2!1svi!2svn"
            className="w-full h-[450px] sm:h-[500px] border-0 block grayscale-15 hover:grayscale-0 transition-all duration-500"
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>

        {/* 6. Medsev Newsletter Area (.newsletter-area) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-30 pb-16">
          <div className="bg-white rounded-xl shadow-[0_0_20px_0_rgba(221,221,221,0.67)] p-8 sm:p-12 border border-slate-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-2">
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#232323]">
                  Đăng Ký Nhận Bản Tin Y Học Gia Đình
                </h2>
                <p className="text-sm text-[#676767] leading-relaxed max-w-xl">
                  Nhận các cẩm nang chăm sóc sức khỏe dự phòng, cảnh báo dịch tễ theo mùa và các chính sách ưu đãi thành viên mới từ FamiDoc.
                </p>
              </div>

              <div className="lg:col-span-5">
                {newsletterSubmitted ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg">
                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                    <span>Cảm ơn bạn đã đăng ký nhận bản tin sức khỏe FamiDoc!</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="relative">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Nhập địa chỉ email của bạn..."
                      required
                      className="w-full h-[65px] pl-5 pr-36 rounded-lg border border-[#0046c0] text-sm text-[#232323] placeholder:text-[#676767] focus:outline-hidden focus:border-[#111111] transition-all"
                    />
                    <button
                      type="submit"
                      className="absolute top-2 right-2 h-[49px] px-6 bg-[#0046c0] hover:bg-[#111111] text-white text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center"
                    >
                      Đăng Ký
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Shared Footer */}
      <LandingFooter />
    </div>
  );
}
