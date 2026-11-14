'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { reviewsApi } from '@/lib/api';

export interface DoctorEncounterReview {
  id: string;
  encounterDate: string;
  encounterType: 'home_visit' | 'telehealth';
  doctorName: string;
  doctorAvatar: string;
  hospital: string;
  memberTreated: string;
  status: 'reviewed' | 'pending';
  overallRating?: number;
  expertiseRating?: number;
  mannerRating?: number;
  punctualityRating?: number;
  reviewComment?: string;
  reviewedAt?: string;
}

export interface FamilyDisputeTicket {
  id: string;
  createdAt: string;
  category: 'late_visit' | 'extra_fee' | 'attitude' | 'prescription_mismatch' | 'technical';
  categoryLabel: string;
  contractCode: string;
  doctorName: string;
  incidentDate: string;
  description: string;
  evidenceFiles: string[];
  status: 'received' | 'investigating' | 'resolved';
  statusLabel: string;
  slaDeadline: string;
  resolutionNote?: string;
}

const INITIAL_ENCOUNTERS: DoctorEncounterReview[] = [
  {
    id: 'enc-01',
    encounterDate: '24/10/2026',
    encounterType: 'home_visit',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    memberTreated: 'Nguyễn Văn Phúc (Ông nội)',
    status: 'pending',
  },
  {
    id: 'enc-02',
    encounterDate: '18/10/2026',
    encounterType: 'telehealth',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    memberTreated: 'Bé Nguyễn Minh An (Con trai)',
    status: 'reviewed',
    overallRating: 5,
    expertiseRating: 5,
    mannerRating: 5,
    punctualityRating: 5,
    reviewComment: 'Bác sĩ giải thích rất kỹ về liều lượng siro hạ sốt và hướng dẫn rửa mũi cho bé rất tận tình.',
    reviewedAt: '18/10/2026 15:45',
  },
  {
    id: 'enc-03',
    encounterDate: '10/10/2026',
    encounterType: 'home_visit',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    memberTreated: 'Trần Thu Hà (Vợ)',
    status: 'reviewed',
    overallRating: 5,
    expertiseRating: 5,
    mannerRating: 5,
    punctualityRating: 5,
    reviewComment: 'Đo điện tim và lấy mẫu xét nghiệm tại nhà nhanh chóng, nhẹ nhàng, bác sĩ lịch sự và đúng giờ.',
    reviewedAt: '10/10/2026 11:20',
  },
];

const INITIAL_DISPUTES: FamilyDisputeTicket[] = [
  {
    id: 'TKT-88219-01',
    createdAt: '12/10/2026 10:15',
    category: 'extra_fee',
    categoryLabel: 'Phát sinh phụ phí ngoài thỏa thuận',
    contractCode: 'CTR-4P-2026-88219',
    doctorName: 'BS. Lâm Sàng Xét Nghiệm Vệ Tinh',
    incidentDate: '11/10/2026',
    description: 'Điều dưỡng vệ tinh yêu cầu gia đình trả thêm 100.000đ tiền kim tiêm chân không khi lấy máu tại nhà, trong khi gói Toàn Diện đã bao gồm 100% vật tư tiêu hao.',
    evidenceFiles: ['Bien_lai_thu_tien_tay_100k.jpg'],
    status: 'resolved',
    statusLabel: 'Đã giải quyết • Đã hoàn tiền',
    slaDeadline: '24 giờ (Đã hoàn tất)',
    resolutionNote: 'FamiDoc đã kiểm tra và xác nhận vật tư nằm trong gói bảo lãnh. Khoản 100.000đ đã được hoàn trực tiếp về ví tài khoản gia đình; cơ sở y tế đã nhắc nhở nhân sự vệ tinh.',
  },
];

export function FamilyFeedbackView() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'disputes'>('reviews');
  const [encounters, setEncounters] = useState<DoctorEncounterReview[]>(INITIAL_ENCOUNTERS);
  const [disputes, setDisputes] = useState<FamilyDisputeTicket[]>(INITIAL_DISPUTES);

  // Modal Review State
  const [selectedEncounterForReview, setSelectedEncounterForReview] = useState<DoctorEncounterReview | null>(null);
  const [ratingOverall, setRatingOverall] = useState<number>(5);
  const [ratingExpertise, setRatingExpertise] = useState<number>(5);
  const [ratingManner, setRatingManner] = useState<number>(5);
  const [ratingPunctuality, setRatingPunctuality] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Modal Dispute State
  const [showCreateDisputeModal, setShowCreateDisputeModal] = useState<boolean>(false);
  const [disputeCategory, setDisputeCategory] = useState<FamilyDisputeTicket['category']>('late_visit');
  const [disputeDate, setDisputeDate] = useState<string>('24/10/2026');
  const [disputeDescription, setDisputeDescription] = useState<string>('');
  const [evidenceFileName, setEvidenceFileName] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenReview = (enc: DoctorEncounterReview) => {
    setSelectedEncounterForReview(enc);
    setRatingOverall(enc.overallRating || 5);
    setRatingExpertise(enc.expertiseRating || 5);
    setRatingManner(enc.mannerRating || 5);
    setRatingPunctuality(enc.punctualityRating || 5);
    setReviewComment(enc.reviewComment || '');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounterForReview) return;

    try {
      await reviewsApi.submitDoctorReview({
        doctorId: selectedEncounterForReview.id,
        rating: ratingOverall,
        comment: reviewComment.trim() || 'Dịch vụ chu đáo, bác sĩ chuyên môn vững vàng.',
      });
    } catch {
      // Fallback
    }

    setEncounters((prev) =>
      prev.map((enc) =>
        enc.id === selectedEncounterForReview.id
          ? {
              ...enc,
              status: 'reviewed',
              overallRating: ratingOverall,
              expertiseRating: ratingExpertise,
              mannerRating: ratingManner,
              punctualityRating: ratingPunctuality,
              reviewComment: reviewComment.trim() || 'Dịch vụ chu đáo, bác sĩ chuyên môn vững vàng.',
              reviewedAt: new Date().toLocaleString('vi-VN'),
            }
          : enc
      )
    );

    setSelectedEncounterForReview(null);
    showToast('Cảm ơn quý gia đình! Đánh giá chất lượng bác sĩ đã được ghi nhận vào hồ sơ SLA.');
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeDescription.trim()) return;

    const categoryMap: Record<FamilyDisputeTicket['category'], string> = {
      late_visit: 'Bác sĩ trễ hẹn / Không đến',
      extra_fee: 'Phát sinh phụ phí ngoài thỏa thuận',
      attitude: 'Thái độ phục vụ chưa phù hợp',
      prescription_mismatch: 'Sai lệch đơn thuốc / y lệnh',
      technical: 'Sự cố kết nối phòng khám Video',
    };

    try {
      await reviewsApi.submitComplaint({
        title: categoryMap[disputeCategory],
        description: disputeDescription.trim(),
        incidentDate: disputeDate,
        severityLevel: 'HIGH',
      });
    } catch {
      // Fallback
    }

    const newTicket: FamilyDisputeTicket = {
      id: `TKT-88219-0${disputes.length + 1}`,
      createdAt: new Date().toLocaleString('vi-VN'),
      category: disputeCategory,
      categoryLabel: categoryMap[disputeCategory],
      contractCode: 'CTR-4P-2026-88219',
      doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
      incidentDate: disputeDate,
      description: disputeDescription.trim(),
      evidenceFiles: evidenceFileName ? [evidenceFileName] : ['Bien_ban_ghi_nhan_su_co.pdf'],
      status: 'received',
      statusLabel: 'Đã tiếp nhận • Đang xử lý SLA 24h',
      slaDeadline: 'Cam kết phản hồi trong 24 giờ',
    };

    setDisputes([newTicket, ...disputes]);
    setShowCreateDisputeModal(false);
    setDisputeDescription('');
    setEvidenceFileName('');
    showToast(`Đã gửi khiếu nại #${newTicket.id} đến Ban Quản Trị FamiDoc & Cơ Sở Y Tế!`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CHÍNH */}
        <header className="space-y-4">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/family" className="hover:text-[#2E37A4] transition-colors">
              Bảng Sức Khỏe Gia Đình
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Đánh Giá &amp; Khiếu Nại</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-[#2E37A4] bg-blue-50/80 border border-blue-200/60">
                  Hộ #FAM-88219
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Bảo Chứng SLA 100% Chất Lượng</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Đánh Giá Bác Sĩ &amp; Trung Tâm Khiếu Nại Dịch Vụ
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Minh bạch chất lượng chăm sóc · Đánh giá trải nghiệm sau mỗi ca khám và tiếp nhận phản ánh, khiếu nại bảo vệ quyền lợi gia đình theo quy chế ký quỹ Escrow 4 bên.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateDisputeModal(true)}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">report_problem</span>
                <span>Gửi khiếu nại dịch vụ</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-3 pt-3 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-[#2E37A4] text-[#2E37A4]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">hotel_class</span>
              <span>Đánh Giá Bác Sĩ Sau Ca Khám ({encounters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disputes')}
              className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'disputes'
                  ? 'border-[#2E37A4] text-[#2E37A4]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">gavel</span>
              <span>Khiếu Nại &amp; Sự Cố Dịch Vụ ({disputes.length})</span>
            </button>
          </div>
        </header>

        {/* 2. TAB 1: ĐÁNH GIÁ BÁC SĨ SAU CA KHÁM */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Banner tóm tắt điểm hài lòng */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                  <span className="material-symbols-outlined text-2xl">star</span>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">4.9 / 5.0</div>
                  <div className="text-xs text-slate-500 mt-0.5">Điểm hài lòng trung bình toàn hộ</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0 border border-blue-200">
                  <span className="material-symbols-outlined text-2xl">medical_services</span>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">
                    {encounters.filter((e) => e.status === 'reviewed').length} / {encounters.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Lượt khám đã gửi phản hồi</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">100%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Bác sĩ đạt tiêu chuẩn SLA y tế</div>
                </div>
              </div>
            </div>

            {/* Danh sách các ca khám cần đánh giá */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">clinical_notes</span>
                <span>Lịch Sử Ca Khám Của Hộ Gia Đình</span>
              </h2>

              <div className="space-y-3">
                {encounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <img
                        src={enc.doctorAvatar}
                        alt={enc.doctorName}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            {enc.doctorName}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-600 font-medium">{enc.hospital}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              enc.encounterType === 'home_visit'
                                ? 'bg-blue-50 text-[#2E37A4] border border-blue-200/80'
                                : 'bg-teal-50 text-teal-700 border border-teal-200/80'
                            }`}
                          >
                            {enc.encounterType === 'home_visit' ? 'Khám tại nhà' : 'Tư vấn Video'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                            <span>Thành viên: <strong>{enc.memberTreated}</strong></span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">calendar_today</span>
                            <span>Ngày khám: {enc.encounterDate}</span>
                          </span>
                        </div>

                        {enc.status === 'reviewed' && enc.reviewComment && (
                          <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                            &quot;{enc.reviewComment}&quot;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {enc.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(enc)}
                          className="px-4 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">rate_review</span>
                          <span>Đánh giá ca khám</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`material-symbols-outlined text-[18px] ${
                                  star <= (enc.overallRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                }`}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenReview(enc)}
                            className="text-xs text-[#2E37A4] hover:underline font-semibold ml-2 cursor-pointer"
                          >
                            Xem / Sửa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB 2: TRUNG TÂM KHIẾU NẠI & BÁO CÁO SỰ CỐ */}
        {activeTab === 'disputes' && (
          <div className="space-y-6">
            {/* Hộp quy trình bảo đảm SLA 3 bước */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#2E37A4] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">security</span>
                <span>Quy trình xử lý khiếu nại y tế &amp; bảo lãnh Escrow 4 bên</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                  <div className="font-bold text-slate-900">1. Tiếp nhận trong 2 giờ</div>
                  <p className="text-slate-600 leading-relaxed">
                    Hệ thống tự động ghi nhận mã ticket và đóng băng số tiền thanh toán trong quỹ Escrow bảo đảm.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                  <div className="font-bold text-slate-900">2. Xác minh cùng CSYT (12h)</div>
                  <p className="text-slate-600 leading-relaxed">
                    Admin FamiDoc đối chiếu hồ sơ GPS di chuyển của bác sĩ hoặc biên lai thu phí vệ sinh y tế.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                  <div className="font-bold text-slate-900">3. Phân xử &amp; Bồi hoàn (24h)</div>
                  <p className="text-slate-600 leading-relaxed">
                    Hoàn tiền trực tiếp hoặc điều chuyển bác sĩ trưởng khoa khác đồng hành theo đúng hợp đồng.
                  </p>
                </div>
              </div>
            </div>

            {/* Danh sách Ticket Khiếu nại */}
            <div className="space-y-3">
              {disputes.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">verified</span>
                  <div className="text-sm font-semibold text-slate-800">Không có khiếu nại nào đang mở</div>
                  <p className="text-xs text-slate-500">Mọi dịch vụ chăm sóc của hộ gia đình đều đang diễn ra đúng cam kết SLA.</p>
                </div>
              ) : (
                disputes.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">#{ticket.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {ticket.categoryLabel}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums">
                        Tạo lúc: {ticket.createdAt} · Mã HĐ: #{ticket.contractCode}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {ticket.description}
                    </p>

                    {ticket.evidenceFiles && ticket.evidenceFiles.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">attach_file</span>
                        <span>Tài liệu đính kèm: </span>
                        {ticket.evidenceFiles.map((f, i) => (
                          <span key={i} className="font-medium text-[#2E37A4] underline">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {ticket.resolutionNote && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Kết quả giải quyết từ Ban Quản Trị:</span>
                        </div>
                        <p className="text-emerald-800 leading-relaxed">{ticket.resolutionNote}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Bác sĩ liên quan: <strong>{ticket.doctorName}</strong></span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{ticket.statusLabel}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ĐÁNH GIÁ BÁC SĨ SAU CA KHÁM */}
      {selectedEncounterForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fade-in text-slate-900">
            <div className="p-5 bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
                  Chất Lượng Chuyên Môn &amp; Y Đức
                </div>
                <h3 className="text-base sm:text-lg font-bold mt-0.5">
                  Đánh Giá Bác Sĩ: {selectedEncounterForReview.doctorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEncounterForReview(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-5 text-xs">
              {/* Chấm sao tổng quan */}
              <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Mức độ hài lòng chung của gia đình về ca khám:
                </label>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingOverall(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-3xl ${
                          star <= ratingOverall ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600 block">
                  {ratingOverall === 5
                    ? 'Rất hài lòng (5/5 sao)'
                    : ratingOverall === 4
                    ? 'Hài lòng (4/5 sao)'
                    : ratingOverall === 3
                    ? 'Bình thường (3/5 sao)'
                    : 'Chưa đạt kỳ vọng'}
                </span>
              </div>

              {/* 3 Tiêu chí chi tiết */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">1. Chuyên môn chẩn đoán &amp; tư vấn:</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingExpertise(s)}
                        className="cursor-pointer"
                      >
                        <span className={`material-symbols-outlined text-[18px] ${s <= ratingExpertise ? 'text-amber-400' : 'text-slate-200'}`}>
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">2. Thái độ tận tâm, lắng nghe:</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingManner(s)}
                        className="cursor-pointer"
                      >
                        <span className={`material-symbols-outlined text-[18px] ${s <= ratingManner ? 'text-amber-400' : 'text-slate-200'}`}>
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">3. Đúng giờ &amp; tác phong chuẩn mực:</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingPunctuality(s)}
                        className="cursor-pointer"
                      >
                        <span className={`material-symbols-outlined text-[18px] ${s <= ratingPunctuality ? 'text-amber-400' : 'text-slate-200'}`}>
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nhận xét văn bản */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhận xét đóng góp ý kiến cho bác sĩ (tùy chọn):
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ví dụ: Bác sĩ đến đúng giờ, khám kỹ và hướng dẫn bài tập phục hồi chức năng rất dễ hiểu..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#2E37A4] outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEncounterForReview(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold shadow-xs cursor-pointer"
                >
                  Gửi đánh giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GỬI KHIẾU NẠI & BÁO CÁO SỰ CỐ */}
      {showCreateDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fade-in text-slate-900">
            <div className="p-5 bg-gradient-to-r from-rose-700 to-rose-600 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-rose-200 font-semibold uppercase tracking-wider">
                  Bảo Vệ Quyền Lợi Khách Hàng
                </div>
                <h3 className="text-base sm:text-lg font-bold mt-0.5">
                  Tạo Phiếu Khiếu Nại Dịch Vụ Y Tế
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateDisputeModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại sự cố / khiếu nại <span className="text-rose-500">*</span>
                </label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value as FamilyDisputeTicket['category'])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:border-rose-500 outline-none"
                >
                  <option value="late_visit">Bác sĩ không đến đúng giờ hẹn / Vắng mặt</option>
                  <option value="extra_fee">Thu thêm phụ phí ngoài hợp đồng quy định</option>
                  <option value="attitude">Thái độ phục vụ chưa tận tâm, thiếu lịch sự</option>
                  <option value="prescription_mismatch">Sai lệch đơn thuốc / y lệnh điều trị</option>
                  <option value="technical">Sự cố phòng khám video Telehealth gián đoạn</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày xảy ra sự cố <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value="2026-10-24"
                  onChange={(e) => setDisputeDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-rose-500 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết sự việc <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Vui lòng cung cấp chi tiết thời gian, địa điểm, tên nhân sự liên quan và nội dung sự việc để Ban kiểm soát xử lý nhanh nhất..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tải lên tài liệu / Hình ảnh bằng chứng (nếu có):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="dispute-evidence-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setEvidenceFileName(file.name);
                    }}
                  />
                  <label
                    htmlFor="dispute-evidence-upload"
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Chọn file từ máy tính</span>
                  </label>
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">
                    {evidenceFileName || 'Chưa chọn tệp'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                Ban Quản Trị FamiDoc cam kết phản hồi kết quả xác minh trong vòng <strong>24 giờ</strong> và áp dụng cơ chế bồi hoàn Escrow thỏa đáng nếu phát hiện lỗi từ đối tác cung cấp dịch vụ.
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateDisputeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Gửi khiếu nại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-fade-in"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
