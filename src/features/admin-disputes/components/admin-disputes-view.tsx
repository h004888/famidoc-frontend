'use client';

import React, { useState } from 'react';
import { AdminNav } from '@/components/layout';

interface DisputeCase {
  id: string;
  familyId: string;
  familyHead: string;
  respondent: string; // Doctor or Facility
  incidentType: 'late_arrival' | 'clinical_issue' | 'pricing_escrow' | 'attitude';
  description: string;
  escrowAmount: number;
  evidence: {
    gpsVerifiedTime?: string;
    telehealthLogDuration?: string;
    soapSignedDate?: string;
  };
  severity: 'urgent' | 'standard';
  status: 'pending_hearing' | 'resolved_refund_full' | 'resolved_refund_partial' | 'resolved_dismissed';
  slaHoursLeft: number;
}

const INITIAL_DISPUTES: DisputeCase[] = [
  {
    id: 'ARB-2026-001',
    familyId: 'Hộ FAM-88219 (Quận 5)',
    familyHead: 'Bà Trần Thị Lan',
    respondent: 'BS. Hoàng Gia Bảo / BV ĐH Y Dược',
    incidentType: 'late_arrival',
    description: 'Bác sĩ đến trễ hơn 45 phút so với giờ hẹn khám tại nhà mà không thông báo trước. Gia đình yêu cầu hủy gói và hoàn 100% tiền tạm giữ.',
    escrowAmount: 1200000,
    evidence: {
      gpsVerifiedTime: 'GPS check-in lúc 15:47 (Lịch hẹn 15:00)',
      soapSignedDate: 'Chưa có phiếu khám',
    },
    severity: 'urgent',
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
    escrowAmount: 850000,
    evidence: {
      telehealthLogDuration: 'Tư vấn trước khám 12 phút',
      soapSignedDate: 'Phiếu SOAP đã khóa lúc 10:30',
    },
    severity: 'standard',
    status: 'pending_hearing',
    slaHoursLeft: 16.0,
  },
  {
    id: 'ARB-2026-003',
    familyId: 'Hộ FAM-11029 (Bình Thạnh)',
    familyHead: 'Chị Nguyễn Thu Hà',
    respondent: 'BS.CKII Trần Thanh Mai',
    incidentType: 'clinical_issue',
    description: 'Thắc mắc về chỉ định xét nghiệm men gan tăng cao nhưng bác sĩ chưa giải thích cặn kẽ toa thuốc điều trị.',
    escrowAmount: 650000,
    evidence: {
      telehealthLogDuration: 'WebRTC video call 24 phút lưu trên hệ thống',
      soapSignedDate: 'Phiếu SOAP mã 1NF đã ký số SHA-256',
    },
    severity: 'standard',
    status: 'resolved_refund_partial',
    slaHoursLeft: 0,
  },
];

export function AdminDisputesView() {
  const [cases, setCases] = useState<DisputeCase[]>(INITIAL_DISPUTES);
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  const [rulingDecision, setRulingDecision] = useState<'refund_full' | 'refund_partial' | 'dismiss'>('refund_full');
  const [rulingReason, setRulingReason] = useState('');
  const [notification, setNotification] = useState('');

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleOpenHearing = (item: DisputeCase) => {
    setSelectedCase(item);
    setRulingReason('');
    setRulingDecision('refund_full');
  };

  const handleExecuteRuling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    let newStatus: DisputeCase['status'] = 'resolved_refund_full';
    if (rulingDecision === 'refund_partial') newStatus = 'resolved_refund_partial';
    if (rulingDecision === 'dismiss') newStatus = 'resolved_dismissed';

    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id ? { ...c, status: newStatus, slaHoursLeft: 0 } : c
      )
    );

    setNotification(`Đã ban hành Phán quyết Trọng tài cho vụ việc ${selectedCase.id}`);
    setSelectedCase(null);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <AdminNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Trọng tài Sự cố &amp; Phân xử Tranh chấp Escrow
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Phán quyết độc lập dựa trên nhật ký hệ thống GPS, EMR SOAP và kiểm soát quỹ tiền ký quỹ đảm bảo
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              <span>{cases.filter((c) => c.status === 'pending_hearing').length} ca chờ mở phiên xử</span>
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>{notification}</span>
          </div>
        )}

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                c.status === 'pending_hearing'
                  ? 'border-slate-300 ring-1 ring-slate-200'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{c.id}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        c.severity === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.severity === 'urgent' ? 'Khẩn (SLA <6h)' : 'Tiêu chuẩn'}
                    </span>
                  </div>

                  {c.status === 'pending_hearing' && (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">timer</span>
                      {c.slaHoursLeft}h còn lại
                    </span>
                  )}
                </div>

                <h2 className="text-sm font-bold text-slate-900 mt-2">{c.familyHead}</h2>
                <div className="text-xs text-slate-500 font-medium">{c.familyId}</div>

                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800">
                    Bị khiếu nại: <span className="text-slate-900">{c.respondent}</span>
                  </div>
                  <p className="line-clamp-2 mt-1">{c.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Tiền Escrow tạm giữ:</span>
                  <span className="font-bold text-indigo-700">{formatVND(c.escrowAmount)}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {c.status === 'pending_hearing' && (
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Chờ ra phán quyết
                    </span>
                  )}
                  {c.status === 'resolved_refund_full' && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Đã hoàn tiền 100%
                    </span>
                  )}
                  {c.status === 'resolved_refund_partial' && (
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Đã hòa giải 50%
                    </span>
                  )}
                  {c.status === 'resolved_dismissed' && (
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Đã bác bỏ
                    </span>
                  )}
                </div>

                {c.status === 'pending_hearing' ? (
                  <button
                    onClick={() => handleOpenHearing(c)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px]">gavel</span>
                    <span>Mở phiên xử</span>
                  </button>
                ) : (
                  <button
                    onClick={() => alert(`Xem biên bản phán quyết ${c.id}`)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100"
                  >
                    Xem án quyết
                  </button>
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
                  <h3 className="font-bold text-slate-900 text-base">Hội đồng Trọng tài FamiDoc Pro</h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleExecuteRuling} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">{selectedCase.id}</span>
                    <span className="font-bold text-indigo-700">
                      Escrow: {formatVND(selectedCase.escrowAmount)}
                    </span>
                  </div>
                  <div>Nguyên đơn: <strong>{selectedCase.familyHead}</strong> ({selectedCase.familyId})</div>
                  <div>Bị đơn: <strong>{selectedCase.respondent}</strong></div>
                  <p className="pt-1 text-slate-700 italic border-t border-slate-200">
                    &quot;{selectedCase.description}&quot;
                  </p>
                </div>

                {/* Evidence Log */}
                <div className="border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                    Chứng cứ Dữ liệu Hệ thống Khách quan (Audit Log):
                  </span>
                  {selectedCase.evidence.gpsVerifiedTime && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="material-symbols-outlined text-blue-500 text-[16px]">pin_drop</span>
                      <span>{selectedCase.evidence.gpsVerifiedTime}</span>
                    </div>
                  )}
                  {selectedCase.evidence.telehealthLogDuration && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="material-symbols-outlined text-purple-500 text-[16px]">videocam</span>
                      <span>{selectedCase.evidence.telehealthLogDuration}</span>
                    </div>
                  )}
                  {selectedCase.evidence.soapSignedDate && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                      <span>{selectedCase.evidence.soapSignedDate}</span>
                    </div>
                  )}
                </div>

                {/* Ruling Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Lựa chọn Phán quyết Trọng tài &amp; Giải ngân Escrow:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 border rounded-xl text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="ruling"
                        checked={rulingDecision === 'refund_full'}
                        onChange={() => setRulingDecision('refund_full')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Hoàn tiền 100% cho Gia đình</div>
                        <div className="text-slate-500">Phạt vi phạm cam kết SLA đối với Bác sĩ/Bệnh viện</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 border rounded-xl text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="ruling"
                        checked={rulingDecision === 'refund_partial'}
                        onChange={() => setRulingDecision('refund_partial')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Hòa giải hoàn 50% &amp; Khám bù</div>
                        <div className="text-slate-500">Lỗi khách quan thời tiết/giao thông, hỗ trợ cả hai bên</div>
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
                        <div className="font-bold text-slate-900">Bác bỏ khiếu nại - Giải ngân 100% CSYT</div>
                        <div className="text-slate-500">Bác sĩ thực hiện đúng quy trình chuyên môn y tế</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Căn cứ phán quyết (Ghi vào biên bản pháp lý) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ghi rõ lý do căn cứ vào dữ liệu định vị, EMR hoặc điều khoản hợp đồng..."
                    value={rulingReason}
                    onChange={(e) => setRulingReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedCase(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                    <span>Ban hành Án quyết</span>
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

