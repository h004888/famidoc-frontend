'use client';

import { PrescriptionContextSummary } from './prescription-context-summary';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ClipboardList, Pill } from 'lucide-react';
import { patientsApi, type PatientDto } from '@/lib/api/patients.api';
import { DashboardPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  prescriptionErrorMessage,
  prescriptionsApi,
  type FamilyPrescription,
  type FamilyPrescriptionDetail,
  type PrescriptionPage,
} from '@/lib/api/prescriptions.api';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
  timeZone: 'UTC',
});
const dateLabel = (value: string) => dateFormat.format(new Date(value));

function PrescriptionStatus({ record }: { record: FamilyPrescription }) {
  if (record.status === 'CANCELLED') {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800">
        Đã hủy
      </span>
    );
  }
  if (record.status === 'EXPIRED') {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
        Đã hết hạn
      </span>
    );
  }
  return (
    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900">
      {record.hasSignature ? 'Có chữ ký trên bản lưu' : 'Bản lưu chưa ký số'}
    </span>
  );
}

export function FamilyPrescriptionsView({ patientId }: { patientId?: string }) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(patientId);
  const [members, setMembers] = useState<PatientDto[]>([]);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [records, setRecords] =
    useState<PrescriptionPage<FamilyPrescription> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    patientsApi.getFamilyMembers().then((res) => {
      if (Array.isArray(res)) setMembers(res);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    prescriptionsApi.listForFamily(page, selectedPatientId, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setRecords(data);
      },
      (failure) => {
        if (!controller.signal.aborted)
          setError(
            prescriptionErrorMessage(failure, 'Chưa tải được đơn thuốc.'),
          );
      },
    );
    return () => controller.abort();
  }, [page, selectedPatientId, reload]);

  function changePage(next: number) {
    setRecords(null);
    setError('');
    if (page === next) setReload((value) => value + 1);
    else setPage(next);
  }

  return (
    <DashboardPageShell containerClassName="max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-200/70 bg-gradient-to-br from-white to-teal-50 p-5 sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
            <ClipboardList size={23} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Đơn thuốc</h1>
            <p className="mt-1 text-sm text-slate-600">
              Xem đơn và lời dặn bác sĩ đã chia sẻ với bạn.
            </p>
          </div>
        </div>
        {patientId && (
          <Link
            className="text-sm font-semibold text-teal-800 hover:underline"
            href="/family/prescriptions"
          >
            Xem tất cả thành viên
          </Link>
        )}
      </header>

      {members.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc đơn thuốc theo thành viên">
          <Button
            type="button"
            size="sm"
            variant={!selectedPatientId ? 'default' : 'outline'}
            onClick={() => {
              setSelectedPatientId(undefined);
              changePage(1);
            }}
          >
            Tất cả
          </Button>
          {members.map((m) => (
            <Button
              key={m.id}
              type="button"
              size="sm"
              variant={selectedPatientId === m.id ? 'default' : 'outline'}
              onClick={() => {
                setSelectedPatientId(m.id);
                changePage(1);
              }}
            >
              {m.fullName}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <Card className="items-start gap-3 p-5">
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => changePage(page)}
          >
            Tải lại
          </Button>
        </Card>
      )}
      {!records && !error && (
        <div role="status" aria-label="Đang tải danh sách đơn thuốc" className="space-y-3">
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      )}
      {records && records.items.length === 0 && (
        <Card className="items-center gap-3 p-8 text-center">
          <Pill size={23} className="text-teal-700" aria-hidden="true" />
          <h2 className="font-semibold">Chưa có đơn thuốc</h2>
          <p className="text-sm text-slate-600">
            Đơn bác sĩ chia sẻ sẽ xuất hiện tại đây.
          </p>
        </Card>
      )}
      <ul className="space-y-3">
        {records?.items.map((record) => (
          <li key={record.id}>
            <Link
              href={`/family/prescriptions/${record.id}`}
              className="group block rounded-xl border border-slate-200 bg-white p-4 outline-offset-4 transition-colors hover:border-teal-400 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-base font-semibold">
                    {record.patient.fullName}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {record.doctorName} · {dateLabel(record.prescribedDate)}
                  </p>
                </div>
                <PrescriptionStatus record={record} />
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-800 group-hover:underline">
                Xem đơn thuốc <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {(page > 1 || records?.hasNextPage) && (
        <nav
          aria-label="Phân trang đơn thuốc"
          className="flex items-center justify-between gap-3"
        >
          <Button
            type="button"
            variant="outline"
            disabled={page === 1}
            onClick={() => changePage(page - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm text-slate-600">Trang {page}</span>
          <Button
            type="button"
            variant="outline"
            disabled={!records?.hasNextPage}
            onClick={() => changePage(page + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
    </DashboardPageShell>
  );
}

export function FamilyPrescriptionDetailView({ id }: { id: string }) {
  const [record, setRecord] = useState<FamilyPrescriptionDetail | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    prescriptionsApi.familyDetail(id, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setRecord(data);
      },
      (failure) => {
        if (!controller.signal.aborted)
          setError(
            prescriptionErrorMessage(
              failure,
              'Chưa tải được chi tiết đơn thuốc.',
            ),
          );
      },
    );
    return () => controller.abort();
  }, [id, reload]);

  return (
    <DashboardPageShell containerClassName="max-w-4xl">
      <Link
        href="/family/prescriptions"
        className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Danh sách đơn thuốc
      </Link>
      {error && (
        <Card className="items-start gap-3 p-5">
          <h1 className="text-xl font-semibold">Chi tiết đơn thuốc</h1>
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError('');
              setReload((value) => value + 1);
            }}
          >
            Tải lại
          </Button>
        </Card>
      )}
      {!record && !error && (
        <Card role="status" className="p-5 text-sm text-slate-600">
          Đang tải đơn thuốc…
        </Card>
      )}
      {record && (
        <>
          <Card className="gap-4 border-teal-200/70 bg-gradient-to-br from-white to-teal-50 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Chi tiết đơn thuốc
                </h1>
                <p className="mt-2 text-sm text-slate-700">
                  Ngày kê {dateLabel(record.prescribedDate)}
                </p>
              </div>
              <PrescriptionStatus record={record} />
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Người bệnh', record.patient.fullName],
                ['Bác sĩ kê', record.doctorName],
                ['Cơ sở y tế', record.facilityName],
                ['Chẩn đoán', record.diagnosis],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-600">{label}</dt>
                  <dd className="font-semibold text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="break-all text-xs text-slate-600">
              Mã lưu nội bộ {record.prescriptionCode}
            </p>
            <p className="text-sm text-slate-700">
              Hạn lĩnh thuốc:{' '}
              {record.validUntil
                ? dateLabel(record.validUntil)
                : 'Bản cũ chưa ghi nhận'}
            </p>
            {record.replacedBy && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                Đơn này đã được thay thế.{' '}
                <Link
                  href={`/family/prescriptions/${record.replacedBy.id}`}
                  className="font-semibold underline"
                >
                  Xem đơn mới ({record.replacedBy.prescriptionCode})
                </Link>
              </p>
            )}
            <div className="pt-1">
              <Link
                href={`/family/members/${record.patient.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline"
              >
                Xem hồ sơ sức khỏe thành viên →
              </Link>
            </div>
            {record.replaces && (
              <p className="text-sm text-slate-700">
                Thay thế đơn {record.replaces.prescriptionCode}. Lý do:{' '}
                {record.replacementReason}
              </p>
            )}
            {record.recordSnapshot && (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  [
                    'Ngày sinh',
                    dateLabel(record.recordSnapshot.patient.dateOfBirth),
                  ],
                  [
                    'Giới tính',
                    (
                      { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' } as Record<
                        string,
                        string
                      >
                    )[record.recordSnapshot.patient.gender],
                  ],
                  ['Địa chỉ CSYT', record.recordSnapshot.facility.address],
                  [
                    'Điện thoại CSYT / bác sĩ',
                    record.recordSnapshot.facility.phone,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-600">{label}</dt>
                    <dd className="font-medium">
                      {value || 'Chưa có thông tin'}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await prescriptionsApi.downloadRecord(record.id);
                } catch (failure) {
                  setError(
                    prescriptionErrorMessage(
                      failure,
                      'Chưa tải được bản lưu đơn thuốc. Vui lòng thử lại.',
                    ),
                  );
                }
              }}
            >
              Tải bản lưu đơn thuốc (JSON)
            </Button>
            {!record.hasSignature && (
              <p className="text-sm text-slate-700">
                Bản lưu dùng để xem lại chỉ dẫn. Đơn chính thức do cơ sở y tế
                cấp.
              </p>
            )}
          </Card>
          <Card className="gap-2 border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-900">
              Phần 1: Bác sĩ kết luận &amp; dặn dò
            </h2>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Chẩn đoán:</span>{' '}
              {(record as any).exam?.icd10Diagnosis || record.diagnosis || 'Chưa ghi nhận'}
              {(record as any).exam?.icd10Code ? ` (${(record as any).exam.icd10Code})` : ''}
            </p>
            {(record as any).exam?.treatmentPlan && (
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Dặn dò:</span>{' '}
                {(record as any).exam.treatmentPlan}
              </p>
            )}
          </Card>
          <PrescriptionContextSummary context={record.clinicalContext} />
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Pill size={20} className="text-teal-700" aria-hidden="true" />{' '}
              Phần 2: Đơn thuốc điện tử ({record.prescriptionCode})
            </h2>
            {record.details.map((detail) => (
              <Card key={detail.id} className="gap-3 p-4 sm:p-5">
                <h3 className="break-words font-semibold">
                  {detail.medicationName}
                  {detail.strength && ` · ${detail.strength}`}
                </h3>
                {(detail.medicationCode || detail.activeIngredient) && (
                  <p className="text-xs text-slate-600">
                    {[detail.medicationCode, detail.activeIngredient]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    ['Liều mỗi lần', detail.dosage],
                    ['Tần suất và thời điểm dùng', detail.frequency],
                    ['Đường dùng', detail.administrationRoute],
                    ['Thời gian dùng', `${detail.durationDays} ngày`],
                    [
                      'Tổng số lượng',
                      `${String(detail.quantity).padStart(2, '0')} ${detail.unit}`,
                    ],
                  ].map(
                    ([label, value]) =>
                      value && (
                        <div key={label}>
                          <dt className="text-slate-600">{label}</dt>
                          <dd className="break-words font-medium">{value}</dd>
                        </div>
                      ),
                  )}
                </dl>
              </Card>
            ))}
          </section>
          {record.instructions && (
            <Card className="gap-2 border-teal-200 bg-teal-50 p-5">
              <h2 className="text-lg font-semibold text-teal-950">
                Lời dặn của bác sĩ
              </h2>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-teal-950">
                {record.instructions}
              </p>
            </Card>
          )}
        </>
      )}
    </DashboardPageShell>
  );
}
