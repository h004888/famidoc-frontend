'use client';

import React, { useState, useEffect } from 'react';
import { reviewsApi, type ComplaintItem } from '@/lib/api';

interface DisputeCase {
  id: string;
  familyId: string;
  familyHead: string;
  respondent: string; // Doctor or Facility
  incidentType: 'late_arrival' | 'clinical_issue' | 'pricing_escrow' | 'attitude';
  description: string;
  remedyCategory: string;
  evidence: {
    gpsVerifiedTime?: string;
    telehealthLogDuration?: string;
    soapSignedDate?: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'pending_hearing' | 'resolved_warning' | 'resolved_reassign' | 'resolved_dismissed';
  slaHoursLeft: number;
  refundAmount?: number;
}

const INITIAL_DISPUTES: DisputeCase[] = [
  {
    id: 'ARB-2026-001',
    familyId: 'Hộ FAM-88219 (Quận 5)',
    familyHead: 'Bà Trần Thị Lan',
    respondent: 'BS. Hoàng Gia Bảo / BV ĐH Y Dược',
    incidentType: 'late_arrival',
    description: 'Bác sĩ đến trễ hơn 45 phút so với giờ hẹn khám tại nhà mà không thông báo trước. Gia đình đề nghị lập biên bản và đổi bác sĩ quản nhiệm.',
    remedyCategory: 'Chế tài phi tài chính (BF-06)',
    evidence: {
      gpsVerifiedTime: 'GPS check-in lúc 15:47 (Lịch hẹn 15:00)',
      soapSignedDate: 'Chưa có phiếu khám',
    },
    severity: 'HIGH',
    status: 'pending_hearing',
    slaHoursLeft: 4.5,
  },
  {
    id: 'ARB-2026-002',
    familyId: 'Hộ FAM-44012 (Quận 10)',
    familyHead: 'Ông Lê Minh Quân',
    respondent: 'Phòng khám Đa khoa Quốc tế',
    incidentType: 'pricing_escrow',
    description: 'Thu thêm 350.000 đ tiền kim lấy máu và găng tay y tế sai quy định hợp đồng trọn gói đã cam kết.',
    remedyCategory: 'Cảnh cáo & Yêu cầu hoàn trả phí thu sai',
    evidence: {
      telehealthLogDuration: 'Tư vấn trước khám 12 phút',
      soapSignedDate: 'Phiếu SOAP đã khóa lúc 10:30',
    },
    severity: 'MEDIUM',
    status: 'pending_hearing',
    slaHoursLeft: 16.0,
    refundAmount: 350000,
  },
  {
    id: 'ARB-2026-003',
    familyId: 'Hộ FAM-11029 (Bình Thạnh)',
    familyHead: 'Chị Nguyễn Thu Hà',
    respondent: 'BS.CKII Trần Thanh Mai',
    incidentType: 'clinical_issue',
    description: 'Thắc mắc về chỉ định xét nghiệm men gan tăng cao nhưng bác sĩ chưa giải thích cặn kẽ toa thuốc điều trị.',
    remedyCategory: 'Tư vấn bổ sung EMR',
    evidence: {
      telehealthLogDuration: 'WebRTC video call 24 phút lưu trên hệ thống',
      soapSignedDate: 'Phiếu SOAP mã 1NF đã ký số SHA-256',
    },
    severity: 'LOW',
    status: 'resolved_reassign',
    slaHoursLeft: 0,
  },
  {
    id: 'ARB-2026-004',
    familyId: 'Hộ FAM-99104 (TP. Thủ Đức)',
    familyHead: 'Anh Vũ Hoàng Long',
    respondent: 'Bác sĩ trực cấp cứu / Phòng khám Đa khoa',
    incidentType: 'clinical_issue',
    description: 'Bác sĩ không xử lý kịp thời phản ứng thuốc kháng sinh của bệnh nhân cao tuổi, cần can thiệp mức độ khẩn cấp.',
    remedyCategory: 'Hội đồng chuyên môn viện can thiệp khẩn cấp',
    evidence: {
      soapSignedDate: 'Hồ sơ cấp cứu bệnh viện Chợ Rẫy',
    },
    severity: 'CRITICAL',
    status: 'pending_hearing',
    slaHoursLeft: 1.5,
  },
];

export function AdminDisputesView() {
  const [cases, setCases] = useState<DisputeCase[]>(INITIAL_DISPUTES);
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('ALL');
  const [rulingDecision, setRulingDecision] = useState<'warning' | 'reassign' | 'dismiss'>('warning');
  const [rulingReason, setRulingReason] = useState('');
  const [refundInput, setRefundInput] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    let isMounted = true;
    reviewsApi
      .listComplaints()
      .then((items) => {
        if (!isMounted) return;
        if (Array.isArray(items) && items.length > 0) {
          const mapped: DisputeCase[] = items.map((c: any) => ({
            id: c.id,
            familyId: `Hợp đồng #${c.contractId || 'FMD-2026'}`,
            familyHead: c.title || 'Đại diện gia đình',
            respondent: 'Bác sĩ / Cơ sở y tế liên kết',
            incidentType: 'clinical_issue',
            description: c.description,
            remedyCategory: 'Thẩm tra Hội đồng Trọng tài',
            evidence: {
              soapSignedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Đang đối soát',
            },
            severity: (c.severityLevel || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            status: c.status === 'RESOLVED' ? 'resolved_warning' : 'pending_hearing',
            slaHoursLeft: c.status === 'RESOLVED' ? 0 : 8,
            refundAmount: c.compensationAmountVnd || 0,
          }));
          setCases(mapped);
        }
      })
      .catch((err) => {
        console.warn('Complaints fetch fallback:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenHearing = (item: DisputeCase) => {
    setSelectedCase(item);
    setRulingReason('');
    setRefundInput(item.refundAmount ? String(item.refundAmount) : '0');
    setRulingDecision('warning');
  };

  const handleExecuteRuling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setIsSubmitting(true);
    try {
      await reviewsApi.resolveComplaint(selectedCase.id, {
        resolutionNotes: rulingReason,
        compensationAmountVnd: Number(refundInput) || 0,
      });
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
    }

    let newStatus: DisputeCase['status'] = 'resolved_warning';
    if (rulingDecision === 'reassign') newStatus = 'resolved_reassign';
    if (rulingDecision === 'dismiss') newStatus = 'resolved_dismissed';

    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id ? { ...c, status: newStatus, slaHoursLeft: 0, refundAmount: Number(refundInput) || 0 } : c
      )
    );

    setNotification(`Đã ban hành phán quyết và giải quyết tranh chấp vụ việc ${selectedCase.id}!`);
    setSelectedCase(null);
    setTimeout(() => setNotification(''), 4000);
  };

  const filteredCases = cases.filter((c) => {
    if (selectedSeverity === 'ALL') return true;
    return c.severity === selectedSeverity;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Trọng tài Sự cố &amp; Phân xử Khiếu nại (BF-06 &amp; GB-12)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Phán quyết độc lập dựa trên nhật ký hệ thống GPS, EMR SOAP và cam kết dịch vụ (Chế tài phi tài chính &amp; Bồi hoàn quỹ Escrow)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              <span>{cases.filter((c) => c.status === 'pending_hearing').length} ca chờ mở phiên xử</span>
            </span>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedSeverity === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-rose-700 text-white'
                    : sev === 'HIGH'
                    ? 'bg-orange-600 text-white'
                    : sev === 'MEDIUM'
                    ? 'bg-amber-600 text-white'
                    : sev === 'LOW'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#2E37A4] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{sev === 'ALL' ? 'Tất cả mức độ' : sev}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {sev === 'ALL' ? cases.length : cases.filter((c) => c.severity === sev).length}
              </span>
            </button>
          ))}
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>{notification}</span>
          </div>
        )}

        {/* Disputes Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredCases.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                c.status === 'pending_hearing'
                  ? c.severity === 'CRITICAL'
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : 'border-amber-200'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 tabular-nums">#{c.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : c.severity === 'HIGH'
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : c.severity === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    Mức độ: {c.severity}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      c.status === 'pending_hearing'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {c.status === 'pending_hearing' ? `Chờ xử lý (SLA còn ${c.slaHoursLeft}h)` : 'Đã phân xử'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{c.familyHead} · {c.familyId}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>Đối tượng phản ánh: <strong className="text-slate-700">{c.respondent}</strong></span>
                  {c.refundAmount ? (
                    <span className="text-rose-600 font-bold">Yêu cầu hoàn trả: {c.refundAmount.toLocaleString('vi-VN')} đ</span>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {c.status === 'pending_hearing' ? (
                  <button
                    onClick={() => handleOpenHearing(c)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                    <span>Mở phiên xử lý</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">
                    Đã hoàn tất
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Phiên xử trọng tài & Phán quyết giải ngân Escrow */}
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-[22px]">gavel</span>
                  <h3 className="font-bold text-slate-900 text-base">Hội đồng Trọng tài FamiDoc (BF-06)</h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleExecuteRuling} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Vụ việc #{selectedCase.id}</span>
                    <span className="font-bold text-rose-700">Mức độ {selectedCase.severity}</span>
                  </div>
                  <div>Nguyên đơn: <strong>{selectedCase.familyHead}</strong></div>
                  <div>Bị đơn: <strong>{selectedCase.respondent}</strong></div>
                  <p className="pt-1 text-slate-700 italic border-t border-slate-200">
                    &quot;{selectedCase.description}&quot;
                  </p>
                </div>

                {/* Ruling Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Lựa chọn Chế tài Phán quyết:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 border rounded-xl text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="ruling"
                        checked={rulingDecision === 'warning'}
                        onChange={() => setRulingDecision('warning')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Cảnh cáo vi phạm &amp; Trừ điểm SLA Bác sĩ/CSYT</div>
                        <div className="text-slate-500">Ghi nhận biên bản vi phạm kỷ luật gửi Cơ sở Y tế chủ quản</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 border rounded-xl text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="ruling"
                        checked={rulingDecision === 'reassign'}
                        onChange={() => setRulingDecision('reassign')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Điều chuyển Bác sĩ Quản nhiệm khác</div>
                        <div className="text-slate-500">Chỉ định bác sĩ mới cùng chuyên khoa phụ trách hộ gia đình</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 border rounded-xl text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="ruling"
                        checked={rulingDecision === 'dismiss'}
                        onChange={() => setRulingDecision('dismiss')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Bác bỏ khiếu nại (Không có vi phạm)</div>
                        <div className="text-slate-500">Bác sĩ thực hiện đúng chuẩn chuyên môn và thời gian thỏa thuận</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Refund amount input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số tiền hoàn trả từ Quỹ Ký Quỹ Escrow (VND, nếu có)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={refundInput}
                    onChange={(e) => setRefundInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm tabular-nums focus:ring-2 focus:ring-rose-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Căn cứ phán quyết (Ghi vào biên bản pháp lý) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ghi rõ lý do căn cứ vào dữ liệu định vị, EMR SOAP hoặc điều khoản hợp đồng..."
                    value={rulingReason}
                    onChange={(e) => setRulingReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedCase(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                    <span>{isSubmitting ? 'Đang ban hành...' : 'Ban hành Án quyết'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}