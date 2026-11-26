'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { EncounterItem, EncounterPatient } from '@/lib/api/encounters.api';

export interface MemberCompletionSummary {
  patientId: string;
  patientName: string;
  attendanceStatus: 'PLANNED' | 'EXAMINED' | 'ABSENT';
  icd10Code?: string;
  icd10Diagnosis?: string;
  prescriptionSummary?: string;
}

export interface VisitCompletionSummaryProps {
  encounter: EncounterItem;
  members: EncounterPatient[];
  memberSummaries: MemberCompletionSummary[];
}

export function VisitCompletionSummary({
  encounter,
  members,
  memberSummaries,
}: VisitCompletionSummaryProps) {
  const summaryByPatient = new Map(memberSummaries.map((s) => [s.patientId, s]));
  const participants = encounter.participants ?? [];
  const emrs = encounter.clinicalEmrs ?? [];

  const rows = members.map((m) => {
    const local = summaryByPatient.get(m.id);
    const participant = participants.find((p) => p.patientId === m.id);
    const emr = emrs.find((e) => e.patientId === m.id);

    const attendanceStatus =
      participant?.attendanceStatus ?? local?.attendanceStatus ?? 'PLANNED';
    const absenceReason = participant?.absenceReason ?? null;

    let statusLabel = 'Chờ khám';
    if (attendanceStatus === 'ABSENT') {
      statusLabel = absenceReason ? `Vắng — ${absenceReason}` : 'Vắng mặt';
    } else if (attendanceStatus === 'EXAMINED' || emr?.isFinalized) {
      statusLabel = 'Đã chốt hồ sơ';
    }

    let prescriptionSummary = local?.prescriptionSummary;
    if (!prescriptionSummary) {
      if (attendanceStatus === 'ABSENT' || attendanceStatus === 'PLANNED') {
        prescriptionSummary = 'Không phát sinh đơn thuốc';
      } else if (emr?.prescriptions) {
        prescriptionSummary =
          emr.prescriptions.length > 0
            ? `${emr.prescriptions.length} đơn thuốc`
            : 'Không kê đơn thuốc';
      } else {
        prescriptionSummary = 'Không rõ';
      }
    }

    return {
      patientId: m.id,
      patientName: m.fullName,
      attendanceStatus,
      statusLabel,
      icd10Code: local?.icd10Code ?? '',
      icd10Diagnosis: local?.icd10Diagnosis ?? '',
      prescriptionSummary,
    };
  });

  return (
    <div className="space-y-4">
      <Card className="p-5 border border-emerald-200 bg-emerald-50/50 space-y-2">
        <div className="flex items-center gap-2 text-emerald-800">
          <CheckCircle2 className="w-5 h-5" />
          <h2 className="text-lg font-bold">Đã hoàn tất ca khám tại nhà</h2>
        </div>
        <p className="text-xs text-emerald-900">
          {encounter.familyConfirmedArrivalAt
            ? 'Gia đình đã xác nhận bác sĩ có mặt. Toàn bộ hồ sơ khám đã được chuyển sang trạng thái Hoàn tất.'
            : 'Hồ sơ bệnh án đã được gửi tới gia đình. Hệ thống đã gửi thông báo nhắc gia đình xác nhận 1 chạm trong vòng 48 giờ.'}
        </p>
      </Card>

      <Card className="overflow-hidden border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900">
            Tổng hợp kết quả khám từng thành viên
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((item) => (
            <div
              key={item.patientId}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{item.patientName}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {item.statusLabel}
                  </Badge>
                </div>
                {item.attendanceStatus === 'EXAMINED' && item.icd10Diagnosis && (
                  <p className="text-slate-600">
                    Chẩn đoán:{' '}
                    <strong>
                      {item.icd10Code ? `${item.icd10Code} — ` : ''}
                      {item.icd10Diagnosis}
                    </strong>
                  </p>
                )}
              </div>
              <div className="text-slate-700 font-medium">
                {item.prescriptionSummary}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-start">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/doctor/timetable">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            ◄ Quay về Lịch trực &amp; Ca khám
          </Link>
        </Button>
      </div>
    </div>
  );
}
