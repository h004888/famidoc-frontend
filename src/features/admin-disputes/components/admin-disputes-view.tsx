'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  severity: 'urgent' | 'standard';
  status: 'pending_hearing' | 'resolved_warning' | 'resolved_reassign' | 'resolved_dismissed';
  slaHoursLeft: number;
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
    remedyCategory: 'Cảnh cáo & Yêu cầu hoàn trả phí thu sai',
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
    remedyCategory: 'Tư vấn bổ sung EMR',
    evidence: {
      telehealthLogDuration: 'WebRTC video call 24 phút lưu trên hệ thống',
      soapSignedDate: 'Phiếu SOAP mã 1NF đã ký số SHA-256',
    },
    severity: 'standard',
    status: 'resolved_reassign',
    slaHoursLeft: 0,
  },
];

export function AdminDisputesView() {
  const [cases, setCases] = useState<DisputeCase[]>(INITIAL_DISPUTES);
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  const [rulingDecision, setRulingDecision] = useState<'warning' | 'reassign' | 'dismiss'>('warning');
  const [rulingReason, setRulingReason] = useState('');

  const handleOpenHearing = (item: DisputeCase) => {
    setSelectedCase(item);
    setRulingReason('');
    setRulingDecision('warning');
  };

  const handleExecuteRuling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    let newStatus: DisputeCase['status'] = 'resolved_warning';
    if (rulingDecision === 'reassign') newStatus = 'resolved_reassign';
    if (rulingDecision === 'dismiss') newStatus = 'resolved_dismissed';

    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id ? { ...c, status: newStatus, slaHoursLeft: 0 } : c
      )
    );

    toast.success(
      `Đã ban hành Quyết định xử lý Trọng tài (chế tài phi tài chính BF-06) cho vụ việc ${selectedCase.id}`
    );
    setSelectedCase(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Trọng tài Sự cố & Phân xử Khiếu nại (BF-06 & GB-12)"
          description="Phán quyết độc lập dựa trên nhật ký hệ thống GPS, EMR SOAP và cam kết dịch vụ (Chế tài phi tài chính: Cảnh cáo, Đổi bác sĩ, Đình chỉ)"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border-rose-200 gap-1.5 tabular-nums">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>{cases.filter((c) => c.status === 'pending_hearing').length} ca chờ mở phiên xử</span>
              </Badge>
            </div>
          }
        />

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <Card
              key={c.id}
              className={`rounded-2xl py-5 shadow-xs transition-all ${
                c.status === 'pending_hearing'
                  ? 'border-slate-300 bg-white ring-1 ring-slate-200'
                  : 'border-slate-200 bg-white/80'
              }`}
            >
              <CardContent className="flex h-full flex-col justify-between px-5">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-xs font-bold text-slate-400">{c.id}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          c.severity === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.severity === 'urgent' ? 'Khẩn (SLA <6h)' : 'Tiêu chuẩn'}
                      </Badge>
                    </div>

                    {c.status === 'pending_hearing' && (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1 tabular-nums">
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
                    <span className="text-slate-500">Hình thức xử lý:</span>
                    <span className="font-bold text-primary">{c.remedyCategory}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {c.status === 'pending_hearing' && (
                      <Badge variant="outline" className="text-[11px] font-semibold text-amber-700 bg-amber-50 border-amber-200">
                        Chờ ra phán quyết
                      </Badge>
                    )}
                    {c.status === 'resolved_warning' && (
                      <Badge variant="secondary" className="text-[11px] font-semibold text-amber-800 bg-amber-100">
                        Đã cảnh cáo kỷ luật
                      </Badge>
                    )}
                    {c.status === 'resolved_reassign' && (
                      <Badge variant="outline" className="text-[11px] font-semibold text-primary bg-blue-50 border-blue-200">
                        Đã đổi Bác sĩ quản nhiệm
                      </Badge>
                    )}
                    {c.status === 'resolved_dismissed' && (
                      <Badge variant="secondary" className="text-[11px] font-semibold text-slate-600 bg-slate-100">
                        Đã bác bỏ
                      </Badge>
                    )}
                  </div>

                  {c.status === 'pending_hearing' ? (
                    <Button
                      size="xs"
                      onClick={() => handleOpenHearing(c)}
                      className="rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">gavel</span>
                      <span>Mở phiên xử</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        toast.info(`Đang mở biên bản phán quyết điện tử có dấu kiểm toán cho vụ việc ${c.id}...`)
                      }
                      className="rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Xem án quyết
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog: Phiên xử trọng tài & Phán quyết */}
        <Dialog open={Boolean(selectedCase)} onOpenChange={(open) => !open && setSelectedCase(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 sm:max-w-lg">
            {selectedCase && (
              <>
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span className="material-symbols-outlined text-rose-600 text-[22px]">gavel</span>
                    <span>Hội đồng Trọng tài FamiDoc Pro (BF-06)</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Xem xét chứng cứ nhật ký khách quan và ban hành án quyết
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleExecuteRuling} className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-900 tabular-nums">{selectedCase.id}</span>
                      <span className="font-bold text-primary">
                        {selectedCase.remedyCategory}
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
                    <Label className="block text-xs font-bold text-slate-700 mb-2">
                      Lựa chọn Chế tài Phán quyết Phi tài chính (Quy định GB-12 &amp; BF-06):
                    </Label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 p-2.5 border rounded-xl text-xs cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="ruling"
                          checked={rulingDecision === 'warning'}
                          onChange={() => setRulingDecision('warning')}
                          className="mt-0.5 accent-primary"
                        />
                        <div>
                          <div className="font-bold text-slate-900">Cảnh cáo vi phạm &amp; Trừ điểm SLA Bác sĩ</div>
                          <div className="text-slate-500">Ghi nhận biên bản vi phạm kỷ luật gửi Cơ sở Y tế chủ quản</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 border rounded-xl text-xs cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="ruling"
                          checked={rulingDecision === 'reassign'}
                          onChange={() => setRulingDecision('reassign')}
                          className="mt-0.5 accent-primary"
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
                          className="mt-0.5 accent-primary"
                        />
                        <div>
                          <div className="font-bold text-slate-900">Bác bỏ khiếu nại (Không có vi phạm)</div>
                          <div className="text-slate-500">Bác sĩ thực hiện đúng chuẩn chuyên môn và thời gian thỏa thuận</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ruling-reason" className="text-xs font-semibold text-slate-700">
                      Căn cứ phán quyết (Ghi vào biên bản pháp lý) <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="ruling-reason"
                      required
                      rows={3}
                      placeholder="Ghi rõ lý do căn cứ vào dữ liệu định vị, EMR hoặc điều khoản hợp đồng..."
                      value={rulingReason}
                      onChange={(e) => setRulingReason(e.target.value)}
                      className="rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <DialogFooter className="border-t border-slate-100 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedCase(null)}
                      className="rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">gavel</span>
                      <span>Ban hành Án quyết</span>
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

