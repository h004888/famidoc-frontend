'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, Clock, Phone, Stethoscope, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FamilyVisitConfirmModal } from '@/features/appointments/components/family-visit-confirm-modal';
import type { EncounterItem } from '@/lib/api/encounters.api';
import {
  canFamilyConfirmAttendance,
  deriveDualLaneState,
  getFamilyVisitStepper,
} from '@/lib/encounter-dual-lane';

export interface FamilyTodayVisitCardProps {
  encounter: EncounterItem;
  now?: Date;
  onUpdated: () => void;
}

export function FamilyTodayVisitCard({
  encounter,
  now,
  onUpdated,
}: FamilyTodayVisitCardProps) {
  const [modalMode, setModalMode] = useState<'ARRIVED' | 'NO_SHOW' | null>(null);
  const currentNow = now ?? new Date();
  const state = deriveDualLaneState(encounter, currentNow);
  const canConfirm = canFamilyConfirmAttendance(encounter, currentNow);
  const stepper = getFamilyVisitStepper(encounter, currentNow);

  const doctorName =
    encounter.doctor?.doctorName || encounter.doctor?.user?.name || 'Bác sĩ phụ trách';
  const doctorPhone = encounter.doctor?.user?.phone;
  const scheduledTime = encounter.scheduledTime || '08:00';
  const isHomeVisit = String(encounter.encounterType || '').toUpperCase() === 'HOME_VISIT';

  return (
    <>
      <Card className="rounded-2xl border-2 border-teal-200 bg-teal-50/40 p-5 shadow-xs sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Thăm khám hôm nay</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-900">
              <CalendarClock className="h-3.5 w-3.5" />
              {scheduledTime} • {isHomeVisit ? 'Khám tại nhà' : 'Khám trực tuyến'}
            </span>
          </div>

          <ol
            aria-label="Tiến trình ca khám"
            className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-white p-3 sm:grid-cols-3"
          >
            {stepper.map((step, index) => (
              <li key={step.key} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    step.status === 'done'
                      ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white'
                      : step.status === 'current'
                        ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white'
                        : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-500'
                  }
                >
                  {step.status === 'done' ? '✓' : index + 1}
                </span>
                <span
                  className={
                    step.status === 'upcoming'
                      ? 'text-slate-500'
                      : 'font-semibold text-slate-900'
                  }
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <Stethoscope className="h-4 w-4 text-teal-700" />
              <span>Bác sĩ: {doctorName}</span>
            </div>
            {doctorPhone && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Phone className="h-4 w-4" />
                <span>SĐT: {doctorPhone}</span>
              </div>
            )}
          </div>

          {state.reconciledStatus === 'DISPUTED' ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm font-medium text-amber-900">
              Gia đình đã báo sự cố bác sĩ không đến. Bộ phận Vận hành đang kiểm tra và liên hệ xử
              lý.
            </div>
          ) : state.familyConfirmed && state.hasFinalizedRecord ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                <span>Bác sĩ đã gửi hồ sơ &amp; đơn thuốc cho gia đình.</span>
              </div>
              <Link
                href="/family/prescriptions"
                className="inline-flex h-9 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Xem kết quả khám &amp; Đơn thuốc
              </Link>
            </div>
          ) : state.familyConfirmed ? (
            <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sm font-medium text-sky-900">
              <Clock className="h-4 w-4 shrink-0 text-sky-700" />
              <span>Gia đình đã xác nhận. Đang chờ bác sĩ gửi kết quả khám &amp; đơn thuốc.</span>
            </div>
          ) : !canConfirm ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-700">
              <p className="font-medium text-slate-900">
                Gia đình chưa cần thao tác gì lúc này.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Nút xác nhận sẽ tự động hiện ra từ lúc {scheduledTime}.
              </p>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-teal-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                Việc gia đình cần làm: Bác sĩ có đến khám hôm nay không?
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  className="h-auto justify-start gap-2 bg-emerald-700 py-3 text-left text-white hover:bg-emerald-800"
                  onClick={() => setModalMode('ARRIVED')}
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>Bác sĩ ĐÃ ĐẾN khám</span>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-auto justify-start gap-2 border-red-300 py-3 text-left text-red-700 hover:bg-red-50"
                  onClick={() => setModalMode('NO_SHOW')}
                >
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>Bác sĩ KHÔNG ĐẾN</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <FamilyVisitConfirmModal
        open={modalMode !== null}
        mode={modalMode ?? 'ARRIVED'}
        encounter={encounter}
        onClose={() => setModalMode(null)}
        onCompleted={() => {
          setModalMode(null);
          onUpdated();
        }}
      />
    </>
  );
}
