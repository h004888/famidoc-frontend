'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/components/layout';

interface InquiryFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  city: string;
  district: string;
  packageInterest: string;
  memberCount: string;
  preferredCallTime: string;
  notes: string;
  agreedConsent: boolean;
}

const INITIAL_FORM: InquiryFormData = {
  fullName: '',
  phoneNumber: '',
  email: '',
  city: 'Hà Nội',
  district: '',
  packageInterest: 'toan-dien',
  memberCount: '3-4',
  preferredCallTime: '15-mins',
  notes: '',
  agreedConsent: true,
};

export function ContactView() {
  const [formData, setFormData] = useState<InquiryFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inquiryCode, setInquiryCode] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof InquiryFormData, string>>>({});

  const validate = (): boolean => {
    const errors: Partial<Record<keyof InquiryFormData, string>> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn.';
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại.';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\s+/g, ''))) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ (Vui lòng nhập số điện thoại Việt Nam 10 chữ số).';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!formData.agreedConsent) {
      errors.agreedConsent = 'Bạn cần đồng ý với điều khoản bảo mật dữ liệu y tế.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Giả lập gửi API tư vấn
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      const randomCode = 'FMD-' + Math.floor(100000 + Math.random() * 900000);
      setInquiryCode(randomCode);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased flex flex-col justify-between">
      {/* 1. Shared Header */}
      <PublicHeader />

      <main className="flex-1 pt-24 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-[#475569]">
            <Link href="/" className="hover:text-[#2563eb] transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              Trang chủ
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#0f172a] font-semibold">Liên hệ & Tư vấn y tế</span>
          </nav>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white p-6 sm:p-10 shadow-lg">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs">
                <span className="material-symbols-outlined text-[14px] text-blue-300">support_agent</span>
                Bộ phận Tiếp nhận & Điều phối Y tế Gia đình
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
                Đăng Ký Tư Vấn Gói Chăm Sóc Sức Khỏe Gia Đình
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Đội ngũ bác sĩ chuyên khoa FamiDoc Pro sẽ chủ động liên hệ trong vòng 15 phút để lắng nghe nhu cầu sức khỏe của từng thành viên, tư vấn phác đồ dự phòng và gói dịch vụ tối ưu nhất.
              </p>
            </div>

            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/3 top-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>

        {/* Main Grid: Contact Info + Form */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (5 cols): Direct Contacts & Office Addresses */}
            <div className="lg:col-span-5 space-y-6">
              {/* Emergency Hotline Card */}
              <div className="bg-linear-to-br from-[#2563eb] to-[#1d4ed8] text-white p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-xs">
                    <span className="material-symbols-outlined text-2xl text-white">ring_volume</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Tổng đài Y tế Trực tuyến 24/7</h3>
                    <p className="text-xs text-blue-100">Cấp cứu y tế gia đình & Điều phối khẩn</p>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/15 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-blue-100">Hotline toàn quốc:</span>
                    <a href="tel:19006868" className="text-xl sm:text-2xl font-black tracking-wider text-white hover:underline">
                      1900 6868
                    </a>
                  </div>
                  <div className="text-[11px] text-blue-100 flex items-center justify-between border-t border-white/10 pt-2">
                    <span>• Phím 1: Cấp cứu & Bác sĩ tại nhà</span>
                    <span>• Phím 2: Tư vấn đăng ký gói</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-blue-100">
                  <span className="material-symbols-outlined text-[16px] text-emerald-300">verified</span>
                  <span>Túc trực 24/7 cả ngày Lễ, Tết và ngoài giờ hành chính</span>
                </div>
              </div>

              {/* Office Locations */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2563eb] text-[20px]">domain</span>
                  Văn phòng & Trung tâm Điều phối
                </h3>

                <div className="space-y-4 text-xs sm:text-sm text-[#475569]">
                  {/* Ha Noi */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-[#0f172a]">
                      <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                      Trụ sở miền Bắc & Phòng khám mẫu
                    </div>
                    <p className="text-xs leading-relaxed text-[#334155]">
                      Tầng 6, Tòa nhà Y Dược, 128 Hai Bà Trưng, Phường Cửa Nam, Hoàn Kiếm, Hà Nội
                    </p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                      <span>Điện thoại: (024) 7300 6868</span>
                      <span>•</span>
                      <span>Giờ đón tiếp: 08:00 - 18:00</span>
                    </div>
                  </div>

                  {/* TP HCM */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-[#0f172a]">
                      <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                      Trụ sở miền Nam & Trung tâm Điều phối
                    </div>
                    <p className="text-xs leading-relaxed text-[#334155]">
                      Tầng 8, Vincom Center, 72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                    </p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                      <span>Điện thoại: (028) 7300 6868</span>
                      <span>•</span>
                      <span>Giờ đón tiếp: 08:00 - 18:00</span>
                    </div>
                  </div>

                  {/* Email & Support */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                    <div className="flex items-center gap-2 text-[#1e40af]">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      <span>Email giải đáp chuyên môn:</span>
                    </div>
                    <a href="mailto:tuvan@famidoc.vn" className="font-semibold text-[#2563eb] hover:underline">
                      tuvan@famidoc.vn
                    </a>
                  </div>
                </div>
              </div>

              {/* Security & HIPAA Commitment */}
              <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-[#475569] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#0f172a]">
                  <span className="material-symbols-outlined text-[18px] text-[#10b981]">encrypted</span>
                  Cam kết Bảo mật Hồ sơ Y khoa (HIPAA Compliance)
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Mọi thông tin liên hệ và tình trạng bệnh lý của các thành viên gia đình được mã hóa đầu cuối 256-bit, tuân thủ nghiêm ngặt Luật Khám bệnh, chữa bệnh Việt Nam và tiêu chuẩn bảo mật dữ liệu sức khỏe quốc tế.
                </p>
              </div>
            </div>

            {/* Right Column (7 cols): Inquiry Lead Submission Form */}
            <div className="lg:col-span-7">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
                {isSubmitted ? (
                  /* Form Submission Success State */
                  <div className="py-8 text-center space-y-5">
                    <div className="w-16 h-16 bg-emerald-50 text-[#10b981] border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
                      <span className="material-symbols-outlined text-3xl">check_circle</span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                        Đăng Ký Tư Vấn Thành Công!
                      </h3>
                      <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
                        Cảm ơn bạn đã gửi yêu cầu đến <strong>FamiDoc Pro</strong>. Bác sĩ phụ trách khu vực sẽ liên hệ qua số điện thoại <strong>{formData.phoneNumber}</strong> trong thời gian sớm nhất.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-xs text-left space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mã yêu cầu tư vấn:</span>
                        <span className="font-mono font-bold text-[#2563eb]">{inquiryCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Người đăng ký:</span>
                        <span className="font-semibold text-[#0f172a]">{formData.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Khu vực:</span>
                        <span className="font-semibold text-[#0f172a]">{formData.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Thời gian cam kết liên hệ:</span>
                        <span className="font-semibold text-[#10b981]">
                          {formData.preferredCallTime === '15-mins'
                            ? 'Trong vòng 15 phút tới'
                            : formData.preferredCallTime === 'working-hours'
                            ? 'Trong giờ hành chính hôm nay'
                            : 'Buổi tối sau 18:00'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                      <Link
                        href="/packages"
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs text-center"
                      >
                        Khám phá chi tiết các gói chăm sóc
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData(INITIAL_FORM);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-[#0f172a] rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                      >
                        Gửi thêm yêu cầu khác
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active Form */
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">
                        Biểu mẫu Nhận Đề Xuất Phác Đồ & Báo Giá
                      </h2>
                      <p className="text-xs text-[#475569] mt-1">
                        Điền thông tin gia đình bạn dưới đây, chuyên gia y tế gia đình FamiDoc sẽ phân tích và phản hồi ngay.
                      </p>
                    </div>

                    {/* Step 1: Contact details */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-[#2563eb] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center text-[11px] font-bold">1</span>
                        Thông tin người đại diện gia đình
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#475569] mb-1">
                            Họ và tên của bạn <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => {
                              setFormData({ ...formData, fullName: e.target.value });
                              if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: undefined });
                            }}
                            placeholder="Ví dụ: Nguyễn Văn An"
                            className={`w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-lg border ${
                              formErrors.fullName ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'
                            } focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]`}
                          />
                          {formErrors.fullName && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.fullName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#475569] mb-1">
                            Số điện thoại nhận tư vấn <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                              setFormData({ ...formData, phoneNumber: e.target.value });
                              if (formErrors.phoneNumber) setFormErrors({ ...formErrors, phoneNumber: undefined });
                            }}
                            placeholder="0912 345 678"
                            className={`w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-lg border ${
                              formErrors.phoneNumber ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'
                            } focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]`}
                          />
                          {formErrors.phoneNumber && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.phoneNumber}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#475569] mb-1">
                            Email (để nhận hợp đồng & phác đồ mẫu)
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                              setFormData({ ...formData, email: e.target.value });
                              if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                            }}
                            placeholder="nguyenvanan@gmail.com"
                            className={`w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-lg border ${
                              formErrors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'
                            } focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]`}
                          />
                          {formErrors.email && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#475569] mb-1">
                            Tỉnh / Thành phố sinh sống <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                          >
                            <option value="Hà Nội">Hà Nội (Nội thành & Ngoại thành)</option>
                            <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                            <option value="Đà Nẵng">Đà Nẵng</option>
                            <option value="Hải Phòng">Hải Phòng</option>
                            <option value="Cần Thơ">Cần Thơ</option>
                            <option value="Khác">Tỉnh thành khác (Tư vấn Telehealth)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Family & Service Needs */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-[#2563eb] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center text-[11px] font-bold">2</span>
                        Nhu cầu chăm sóc sức khỏe gia đình
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#475569] mb-1">
                            Gói dịch vụ đang quan tâm
                          </label>
                          <select
                            value={formData.packageInterest}
                            onChange={(e) => setFormData({ ...formData, packageInterest: e.target.value })}
                            className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                          >
                            <option value="toan-dien">Gói Gia đình Toàn diện (Phổ biến nhất)</option>
                            <option value="co-ban">Gói Cá nhân / Cơ bản</option>
                            <option value="nguoi-cao-tuoi">Gói Người cao tuổi & Bệnh mạn tính</option>
                            <option value="vip">Gói VIP Concierge & Bác sĩ riêng</option>
                            <option value="tu-van-them">Chưa rõ, cần bác sĩ tư vấn lựa chọn</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#475569] mb-1">
                            Số lượng thành viên cần theo dõi
                          </label>
                          <select
                            value={formData.memberCount}
                            onChange={(e) => setFormData({ ...formData, memberCount: e.target.value })}
                            className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                          >
                            <option value="1-2">1 - 2 thành viên (Vợ chồng / Độc thân)</option>
                            <option value="3-4">3 - 4 thành viên (Gia đình tiêu chuẩn có con nhỏ)</option>
                            <option value="5+">5+ thành viên (Tam đại đồng đường có ông bà)</option>
                          </select>
                        </div>
                      </div>

                      {/* Preferred Call Time */}
                      <div>
                        <label className="block text-xs font-semibold text-[#475569] mb-1">
                          Thời gian thuận tiện để bác sĩ liên hệ
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: '15-mins', label: 'Trong 15 phút', desc: 'Ngay tức thì' },
                            { id: 'working-hours', label: 'Giờ hành chính', desc: '08:00 - 17:30' },
                            { id: 'evening', label: 'Buổi tối', desc: 'Sau 18:00' },
                          ].map((t) => (
                            <label
                              key={t.id}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 transition-all ${
                                formData.preferredCallTime === t.id
                                  ? 'border-[#2563eb] bg-blue-50/50 text-[#2563eb] font-semibold'
                                  : 'border-slate-200 bg-white text-[#475569] hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="preferredCallTime"
                                value={t.id}
                                checked={formData.preferredCallTime === t.id}
                                onChange={(e) => setFormData({ ...formData, preferredCallTime: e.target.value })}
                                className="text-[#2563eb] focus:ring-[#2563eb]"
                              />
                              <div>
                                <div>{t.label}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{t.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Notes / Health conditions */}
                      <div>
                        <label className="block text-xs font-semibold text-[#475569] mb-1">
                          Tình trạng sức khỏe gia đình hoặc yêu cầu chuyên khoa riêng (nếu có)
                        </label>
                        <textarea
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Ví dụ: Ông bà có tiền sử tiểu đường và cao huyết áp, bé nhỏ 2 tuổi hay ốm vặt đường hô hấp..."
                          className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                        />
                      </div>
                    </div>

                    {/* Terms & Consent */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agreedConsent}
                          onChange={(e) => {
                            setFormData({ ...formData, agreedConsent: e.target.checked });
                            if (formErrors.agreedConsent) setFormErrors({ ...formErrors, agreedConsent: undefined });
                          }}
                          className="mt-0.5 rounded-sm border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                        />
                        <span className="text-[11px] text-[#475569] leading-relaxed">
                          Tôi đồng ý cho phép chuyên gia y tế của FamiDoc liên hệ tư vấn qua số điện thoại đã cung cấp và hiểu rằng dữ liệu được bảo mật theo tiêu chuẩn an toàn y tế.
                        </span>
                      </label>
                      {formErrors.agreedConsent && (
                        <p className="text-[11px] text-red-500">{formErrors.agreedConsent}</p>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-6 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Đang chuyển thông tin đến bác sĩ phụ trách...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            <span>Gửi Yêu Cầu Nhận Tư Vấn Miễn Phí</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Quick FAQ Section */}
          <div className="mt-16 pt-12 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-xl font-bold text-[#0f172a]">
                Câu hỏi thường gặp về việc đăng ký & tư vấn
              </h2>
              <p className="text-xs text-[#475569] mt-1">
                Giải đáp nhanh các thắc mắc trước khi bạn quyết định đồng hành cùng Bác sĩ gia đình FamiDoc
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2563eb] text-[18px]">help</span>
                  Việc tư vấn ban đầu có mất phí không?
                </h4>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Hoàn toàn <strong>MIỄN PHÍ 100%</strong>. Bác sĩ trưởng phụ trách sẽ gọi điện lắng nghe tình trạng gia đình và lập bản đồ chăm sóc sức khỏe mẫu trước khi bạn ký hợp đồng gói.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2563eb] text-[18px]">help</span>
                  Bác sĩ có đến tận nhà thăm khám không?
                </h4>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Có. Tùy thuộc vào gói dịch vụ, bác sĩ sẽ đến nhà định kỳ mỗi tháng/quý với đầy đủ vali trang thiết bị xét nghiệm nhanh, máy đo điện tim và siêu âm xách tay.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2563eb] text-[18px]">help</span>
                  Nếu gia đình cần đổi bác sĩ phụ trách?
                </h4>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Bạn có quyền yêu cầu đổi bác sĩ gia đình bất kỳ lúc nào nếu cảm thấy phong cách chăm sóc chưa tương thích, FamiDoc sẽ điều phối bác sĩ mới trong vòng 24 giờ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Shared Footer */}
      <PublicFooter />
    </div>
  );
}

