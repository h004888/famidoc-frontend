import React from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { BookVisitDetail } from '@/lib/api/medical-books.api';

export function MemberVisitRecordView({
  detail,
  onBackToOverview,
}: {
  detail: BookVisitDetail;
  onBackToOverview?: () => void;
}) {
  const finalizedText = detail.finalizedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(new Date(detail.finalizedAt))
    : null;

  return (
    <div className="space-y-4">
      {onBackToOverview && (
        <Button type="button" variant="ghost" size="sm" onClick={onBackToOverview}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách thành viên
        </Button>
      )}
      <Card className="p-4 sm:p-5 border border-slate-200 bg-white space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Hồ sơ khám: {detail.patient.fullName}
            </h2>
            {finalizedText && (
              <p className="text-slate-500">Đã chốt lúc {finalizedText}</p>
            )}
          </div>
          {detail.isFinalized && (
            <Badge className="bg-emerald-600 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Đã chốt hồ sơ (Chỉ xem)
            </Badge>
          )}
        </div>

        {detail.exam ? (
          <div className="space-y-2">
            <div>
              <span className="text-slate-500">Lý do khám: </span>
              <strong className="text-slate-900">{detail.exam.chiefComplaint || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Kết quả thăm khám: </span>
              <strong className="text-slate-900">{detail.exam.clinicalFindings || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Chẩn đoán: </span>
              <strong className="text-slate-900">
                {detail.exam.icd10Code} — {detail.exam.icd10Diagnosis}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Kế hoạch điều trị: </span>
              <strong className="text-slate-900">{detail.exam.treatmentPlan || '—'}</strong>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Chưa có nội dung khám.</p>
        )}

        {detail.vitals && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="font-semibold text-slate-800">Chỉ số sinh hiệu</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
              {detail.vitals.systolicBp != null && (
                <span>HA tâm thu: {detail.vitals.systolicBp}</span>
              )}
              {detail.vitals.diastolicBp != null && (
                <span>HA tâm trương: {detail.vitals.diastolicBp}</span>
              )}
              {detail.vitals.heartRate != null && (
                <span>Nhịp tim: {detail.vitals.heartRate}</span>
              )}
              {detail.vitals.temperature != null && (
                <span>Nhiệt độ: {detail.vitals.temperature}°C</span>
              )}
              {detail.vitals.spo2 != null && <span>SpO2: {detail.vitals.spo2}%</span>}
              {detail.vitals.respiratoryRate != null && (
                <span>Nhịp thở: {detail.vitals.respiratoryRate}</span>
              )}
              {detail.vitals.weightKg != null && (
                <span>Cân nặng: {detail.vitals.weightKg} kg</span>
              )}
            </div>
          </div>
        )}

        {detail.prescription && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
            <div className="font-semibold text-slate-800">
              Đơn thuốc ({detail.prescription.prescriptionCode})
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              {detail.prescription.details.map((d, idx) => (
                <li key={idx}>
                  {d.medicationName} {d.strength} — {d.dosage}, {d.frequency}, {d.durationDays} ngày ({d.quantity} {d.unit})
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
