'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pill,
  Users,
} from 'lucide-react';
import { DashboardPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { PrescriptionForm } from '@/features/doctor-encounters/components/prescription-form';
import {
  medicalBooksApi,
  type BookDocument,
  type BookFamily,
  type BookMember,
  type BookVisit,
  type BookVisitDetail,
} from '@/lib/api/medical-books.api';
import { prescriptionErrorMessage } from '@/lib/api/prescriptions.api';
import { BookDocumentUpload } from './book-document-upload';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});
const confirmationFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});
const visitTypes: Record<string, string> = {
  HOME_VISIT: 'Tại nhà',
  TELEHEALTH: 'Từ xa',
  FACILITY_VISIT: 'Tại cơ sở y tế',
};
const relations: Record<string, string> = {
  SELF: 'Đại diện',
  SPOUSE: 'Vợ / chồng',
  CHILD: 'Con',
  PARENT: 'Cha / mẹ',
  RELATIVE: 'Người thân',
  OTHER: 'Thành viên',
};
const paper = 'min-w-0 rounded-2xl border border-slate-200 bg-white';
const choice =
  'w-full rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-slate-50 aria-pressed:border-teal-200 aria-pressed:bg-teal-50 disabled:opacity-60';

function dateLabel(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? 'Chưa có ngày'
    : dateFormat.format(value);
}

function visitLabel(visit: Pick<BookVisit, 'scheduledDate' | 'scheduledTime'>) {
  const time = /(?:^|T)(\d{2}:\d{2})/.exec(visit.scheduledTime)?.[1];
  return [dateLabel(visit.scheduledDate), time].filter(Boolean).join(' · ');
}

function useBookQuery<T>(request: (signal: AbortSignal) => Promise<T>) {
  const [attempt, retry] = useState(0);
  const [result, setResult] = useState<{
    request: typeof request;
    attempt: number;
    data?: T;
    error?: string;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    request(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ request, attempt, data });
      },
      (error) => {
        if (!controller.signal.aborted) {
          setResult({
            request,
            attempt,
            error: prescriptionErrorMessage(
              error,
              'Không tải được dữ liệu. Vui lòng thử lại.',
            ),
          });
        }
      },
    );
    return () => controller.abort();
  }, [request, attempt]);

  const reload = () => retry((value) => value + 1);
  return {
    ...(result?.request === request && result.attempt === attempt
      ? result
      : null),
    reload,
  };
}

function QueryStatus({
  error,
  retry,
  label,
}: {
  error?: string;
  retry: () => void;
  label: string;
}) {
  return error ? (
    <div className="space-y-3 text-sm">
      <p role="alert" className="text-red-800">
        {error}
      </p>
      <Button type="button" size="sm" variant="outline" onClick={retry}>
        Tải lại
      </Button>
    </div>
  ) : (
    <p role="status" className="text-sm text-slate-600">
      {label}
    </p>
  );
}

function Pager({
  page,
  next,
  disabled,
  change,
  label,
}: {
  page: number;
  next?: boolean;
  disabled: boolean;
  change: (page: number) => void;
  label: string;
}) {
  if (page === 1 && !next) return null;
  return (
    <nav
      aria-label={label}
      className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3"
    >
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="Trang trước"
        disabled={disabled || page === 1}
        onClick={() => change(page - 1)}
      >
        <ChevronLeft size={16} />
      </Button>
      <span className="text-xs tabular-nums text-slate-600">Trang {page}</span>
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="Trang sau"
        disabled={disabled || !next}
        onClick={() => change(page + 1)}
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
}

export function MedicalBookView({
  doctor,
  initialPatientId,
}: {
  doctor: boolean;
  initialPatientId?: string;
}) {
  const [familyPage, setFamilyPage] = useState(1);
  const [familyId, setFamilyId] = useState('');
  const [pending, setPending] = useState(false);
  const request = useCallback(
    (signal: AbortSignal) => medicalBooksApi.families(familyPage, signal),
    [familyPage],
  );
  const query = useBookQuery(request);
  const families = query.data?.items ?? [];
  const family =
    families.find((item) => item.id === familyId) ??
    (!doctor
      ? families[0]
      : !familyId && initialPatientId
        ? families.find((item) => item.members.some((member) => member.id === initialPatientId))
        : undefined);

  return (
    <DashboardPageShell
      className="bg-[#f3f6f5]"
      containerClassName="max-w-[1500px]"
    >
      <header className="relative overflow-hidden rounded-2xl bg-[#143b38] px-5 py-6 text-white sm:px-8 sm:py-8">
        <BookOpen
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-7 size-40 rotate-12 text-white/10 sm:right-9 sm:size-48"
        />
        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {doctor ? 'Sổ khám và kê đơn' : 'Sổ khám gia đình'}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-teal-50/90">
            {doctor
              ? 'Chọn gia đình và thành viên để xem lịch sử hoặc ghi nhận lần khám.'
              : 'Xem lần khám, đơn thuốc và tài liệu y tế của từng thành viên.'}
          </p>
        </div>
      </header>

      <div
        className={
          doctor
            ? 'grid items-start gap-4 xl:grid-cols-[250px_minmax(0,1fr)]'
            : 'space-y-4'
        }
      >
        {doctor && (
          <aside
            className={`${paper} space-y-3 p-3 sm:p-4`}
            aria-label="Danh sách gia đình"
          >
            <h2 className="flex items-center gap-2 px-1 font-semibold">
              <Users size={18} className="text-teal-700" aria-hidden="true" />{' '}
              Gia đình phụ trách
            </h2>
            {!query.data && (
              <QueryStatus
                error={query.error}
                retry={query.reload}
                label="Đang tải gia đình…"
              />
            )}
            {query.data && families.length === 0 && (
              <p className="px-1 text-sm text-slate-600">
                Chưa có gia đình trong danh sách.
              </p>
            )}
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-1">
              {families.map((item) => (
                <li key={item.id} className="min-w-0">
                  <button
                    type="button"
                    disabled={pending}
                    aria-pressed={item.id === family?.id}
                    className={choice}
                    onClick={() => setFamilyId(item.id)}
                  >
                    <span className="block break-words text-sm font-semibold">
                      {item.representativeName}
                    </span>
                    <span className="block text-xs text-slate-600">
                      {item.members.length} thành viên
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Pager
              page={familyPage}
              next={query.data?.hasNextPage}
              disabled={pending}
              change={setFamilyPage}
              label="Phân trang gia đình"
            />
          </aside>
        )}

        {family ? (
          <FamilyBook
            key={family.id}
            family={family}
            doctor={doctor}
            initialPatientId={initialPatientId}
            pending={pending}
            setPending={setPending}
          />
        ) : (
          <section className={`${paper} p-5 sm:p-7`}>
            {!doctor && !query.data ? (
              <QueryStatus
                error={query.error}
                retry={query.reload}
                label="Đang tải sổ khám…"
              />
            ) : (
              <p className="text-sm text-slate-600">
                {doctor
                  ? 'Chọn một gia đình để mở sổ khám.'
                  : 'Chưa tìm thấy hồ sơ gia đình.'}
              </p>
            )}
          </section>
        )}
      </div>
    </DashboardPageShell>
  );
}

function FamilyBook({
  family,
  doctor,
  initialPatientId,
  pending,
  setPending,
}: {
  family: BookFamily;
  doctor: boolean;
  initialPatientId?: string;
  pending: boolean;
  setPending: (value: boolean) => void;
}) {
  const [patientId, setPatientId] = useState(initialPatientId ?? '');
  const member = family.members.find((item) => item.id === patientId);
  return (
    <div className="min-w-0 space-y-4">
      <section
        className={`${paper} space-y-4 p-4 sm:p-5`}
        aria-label="Thành viên trong gia đình"
      >
        <div>
          <p className="text-xs font-semibold text-slate-600">Đại diện hộ</p>
          <h2 className="mt-1 break-words text-xl font-semibold">
            {family.representativeName}
          </h2>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
          {family.members.map((item) => (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                disabled={pending}
                aria-pressed={item.id === member?.id}
                className={`${choice} border-slate-200`}
                onClick={() => setPatientId(item.id)}
              >
                <span className="block break-words text-sm font-semibold">
                  {item.fullName}
                </span>
                <span className="block break-words text-xs text-slate-600">
                  {relations[item.relationshipToHead] ??
                    item.relationshipToHead}{' '}
                  · {dateLabel(item.dateOfBirth)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {member ? (
        <MemberBook
          key={member.id}
          familyId={family.id}
          member={member}
          doctor={doctor}
          pending={pending}
          setPending={setPending}
        />
      ) : (
        <p className={`${paper} p-5 text-sm text-slate-600`}>
          {family.members.length
            ? 'Chọn thành viên để xem các lần khám.'
            : 'Chưa có thành viên trong sổ khám.'}
        </p>
      )}
    </div>
  );
}

function MemberBook({
  familyId,
  member,
  doctor,
  pending,
  setPending,
}: {
  familyId: string;
  member: BookMember;
  doctor: boolean;
  pending: boolean;
  setPending: (value: boolean) => void;
}) {
  const [tab, setTab] = useState<'visits' | 'documents'>('visits');
  return (
    <section
      className={`${paper} space-y-4 p-3 sm:p-5`}
      aria-label={`Sổ khám của ${member.fullName}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold">
            {member.fullName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ngày sinh {dateLabel(member.dateOfBirth)}
          </p>
        </div>
        <div
          className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1"
          role="group"
          aria-label="Nội dung sổ khám"
        >
          {(['visits', 'documents'] as const).map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              aria-pressed={tab === key}
              className="rounded-lg aria-pressed:bg-white aria-pressed:text-teal-900 aria-pressed:shadow-xs"
              onClick={() => setTab(key)}
            >
              {key === 'visits' ? 'Lần khám' : 'Tài liệu'}
            </Button>
          ))}
        </div>
      </div>
      {tab === 'documents' ? (
        <MemberDocuments
          familyId={familyId}
          patientId={member.id}
          doctor={doctor}
          setPending={setPending}
        />
      ) : (
        <VisitPages
          familyId={familyId}
          patientId={member.id}
          doctor={doctor}
          pending={pending}
          setPending={setPending}
        />
      )}
    </section>
  );
}

function MemberDocuments({
  familyId,
  patientId,
  doctor,
  setPending,
}: {
  familyId: string;
  patientId: string;
  doctor: boolean;
  setPending: (value: boolean) => void;
}) {
  const [downloading, setDownloading] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const request = useCallback(
    (signal: AbortSignal) =>
      medicalBooksApi.documents(familyId, patientId, signal),
    [familyId, patientId],
  );
  const query = useBookQuery(request);

  async function download(record: BookDocument) {
    setDownloading(record.id);
    setDownloadError('');
    try {
      const blob = await medicalBooksApi.downloadDocument(
        familyId,
        patientId,
        record.id,
      );
      const url = URL.createObjectURL(blob);
      const extension =
        blob.type === 'application/pdf'
          ? '.pdf'
          : blob.type === 'image/png'
            ? '.png'
            : '.jpg';
      const link = document.createElement('a');
      link.href = url;
      link.download = record.documentName.endsWith(extension)
        ? record.documentName
        : record.documentName + extension;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(
        prescriptionErrorMessage(error, 'Chưa tải được tệp. Vui lòng thử lại.'),
      );
    } finally {
      setDownloading('');
    }
  }

  return (
    <div className="space-y-4">
      {!doctor && (
        <BookDocumentUpload
          familyId={familyId}
          patientId={patientId}
          onUploaded={query.reload}
          setPending={setPending}
        />
      )}
      {!query.data && (
        <QueryStatus
          error={query.error}
          retry={query.reload}
          label="Đang tải tài liệu…"
        />
      )}
      {query.data?.length === 0 && (
        <p className="p-2 text-sm text-slate-600">
          Chưa có tài liệu y tế do gia đình cung cấp.
        </p>
      )}
      {downloadError && (
        <p role="alert" className="text-sm text-red-800">
          {downloadError}
        </p>
      )}
      <ul className="divide-y divide-slate-100">
        {query.data?.map((document) => {
          const href =
            document.fileUrl &&
            URL.canParse(document.fileUrl) &&
            ['https:', 'http:'].includes(new URL(document.fileUrl).protocol)
              ? document.fileUrl
              : null;
          return (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText
                  size={18}
                  className="shrink-0 text-teal-700"
                  aria-hidden="true"
                />
                <span className="break-words font-medium">
                  {document.documentName}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                {dateLabel(document.recordedDate)}
                {document.downloadAvailable && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Tải tài liệu ${document.documentName}`}
                    disabled={Boolean(downloading)}
                    onClick={() => download(document)}
                  >
                    {downloading === document.id ? 'Đang tải…' : 'Tải tệp'}
                  </Button>
                )}
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Mở tài liệu ${document.documentName}`}
                    className="font-semibold text-teal-800 underline underline-offset-4"
                  >
                    Mở tài liệu
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VisitPages({
  familyId,
  patientId,
  doctor,
  pending,
  setPending,
}: {
  familyId: string;
  patientId: string;
  doctor: boolean;
  pending: boolean;
  setPending: (value: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const [visitId, setVisitId] = useState('');
  const request = useCallback(
    (signal: AbortSignal) =>
      medicalBooksApi.visits(familyId, patientId, page, signal),
    [familyId, patientId, page],
  );
  const query = useBookQuery(request);
  const visits = query.data?.items ?? [];
  const visit = visits.find((item) => item.id === visitId) ?? visits[0];
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(155px,200px)_minmax(0,1fr)]">
      <div className="space-y-2 lg:border-r lg:border-slate-200 lg:pr-3">
        <h3 className="flex items-center gap-2 px-1 text-sm font-semibold">
          <CalendarDays
            size={17}
            className="text-teal-700"
            aria-hidden="true"
          />{' '}
          Lịch sử khám
        </h3>
        {!query.data && (
          <QueryStatus
            error={query.error}
            retry={query.reload}
            label="Đang tải lịch sử…"
          />
        )}
        {query.data && !visits.length && (
          <p className="px-1 py-2 text-sm text-slate-600">
            {doctor
              ? 'Chưa có lần khám đủ điều kiện ghi nhận.'
              : 'Chưa có lần khám được bác sĩ xác nhận.'}
          </p>
        )}
        <ul className="space-y-1" aria-label="Các lần khám">
          {visits.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={choice}
                aria-pressed={visit?.id === item.id}
                disabled={pending}
                onClick={() => setVisitId(item.id)}
              >
                <span className="block text-sm font-semibold tabular-nums">
                  {visitLabel(item)}
                </span>
                <span className="block text-xs text-slate-600">
                  {visitTypes[item.encounterType] ?? 'Buổi khám'}
                </span>
                {doctor && !item.isFinalized && (
                  <span className="mt-1 block text-xs font-medium text-amber-800">
                    Chờ xác nhận
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <Pager
          page={page}
          next={query.data?.hasNextPage}
          disabled={pending}
          change={setPage}
          label="Phân trang lịch sử khám"
        />
      </div>
      {visit && (
        <VisitPage
          key={visit.id}
          id={visit.id}
          patientId={patientId}
          doctor={doctor}
          onConfirmed={query.reload}
          setPending={setPending}
        />
      )}
    </div>
  );
}

export function DoctorBookVisitView({ id, patientId }: { id: string; patientId?: string }) {
  return (
    <DashboardPageShell containerClassName="max-w-4xl">
      <Link href="/doctor/encounters" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">
        <ChevronLeft size={16} aria-hidden="true" /> Về sổ khám
      </Link>
      <VisitPage id={id} patientId={patientId} doctor />
    </DashboardPageShell>
  );
}

function VisitPage({
  id,
  patientId,
  doctor,
  onConfirmed,
  setPending,
}: {
  id: string;
  patientId?: string;
  doctor: boolean;
  onConfirmed?: () => void;
  setPending?: (value: boolean) => void;
}) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);
  const request = useCallback(
    (signal: AbortSignal) =>
      selectedPatientId
        ? medicalBooksApi.visit(id, signal, selectedPatientId)
        : medicalBooksApi.visit(id, signal),
    [id, selectedPatientId],
  );
  const query = useBookQuery(request);
  const visit = query.data;
  if (!visit)
    return (
      <QueryStatus
        error={query.error}
        retry={query.reload}
        label="Đang mở trang khám…"
      />
    );
  if (patientId && !selectedPatientId && visit.patient.id !== patientId)
    return (
      <p role="alert" className="text-sm text-red-800">
        Trang khám không thuộc thành viên đang mở.
      </p>
    );
  const visitParticipants = visit.participants ?? [];
  return (
    <article className="min-w-0 space-y-4">
      {doctor && visitParticipants.length > 1 && (
        <div
          aria-label="Chọn thành viên trong buổi khám gia đình"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-teal-100 bg-white p-3"
        >
          <span className="text-xs font-semibold text-slate-600">
            Thành viên trong buổi khám:
          </span>
          {visitParticipants.map((member) => {
            const active = member.id === visit.patient.id;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedPatientId(member.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-teal-800 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {member.fullName}
              </button>
            );
          })}
        </div>
      )}
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-teal-100 bg-[#f0f7f4] p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">
            Lần khám {visitLabel(visit)}
          </h3>
          <p className="mt-1 break-words text-sm text-slate-700">
            {visit.patient.fullName} · {visit.doctorName}
          </p>
        </div>
        {visit.isFinalized && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal-900">
            <CheckCircle2 size={15} aria-hidden="true" /> Đã xác nhận
          </span>
        )}
      </header>
      {visit.exam && <ReadVisit visit={visit} />}
      {doctor && !visit.isFinalized && (
        <PrescriptionForm
          visit={visit}
          onPendingChange={setPending}
          onConfirmed={onConfirmed ?? query.reload}
        />
      )}
    </article>
  );
}

function ReadVisit({ visit }: { visit: BookVisitDetail }) {
  const exam = visit.exam;
  if (!exam) return null;
  const prescription = visit.prescription;
  return (
    <>
      <section className={`${paper} space-y-3 p-4 sm:p-5`}>
        <h4 className="font-semibold">Thông tin khám</h4>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            ['Lý do khám', exam.chiefComplaint],
            ['Kết quả thăm khám', exam.clinicalFindings],
            [
              'Chẩn đoán',
              [exam.icd10Code, exam.icd10Diagnosis].filter(Boolean).join(' · '),
            ],
            ['Kế hoạch điều trị', exam.treatmentPlan],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs font-semibold text-slate-600">{label}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">
                {value || '—'}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      {prescription && (
        <section className={`${paper} space-y-3 p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 font-semibold">
              <Pill size={18} className="text-teal-700" aria-hidden="true" />{' '}
              Đơn thuốc
            </h4>
            {prescription.status !== 'ISSUED' && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                {prescription.status === 'CANCELLED' ? 'Đã hủy' : 'Đã hết hạn'}
              </span>
            )}
          </div>
          <ul className="divide-y divide-slate-200">
            {prescription.details.map((line) => (
              <li key={line.id} className="space-y-1 py-2.5 text-sm">
                <p className="break-words font-semibold">
                  {line.medicationName}
                  {line.strength ? ` · ${line.strength}` : ''}
                </p>
                <p className="break-words text-slate-700">
                  {[
                    line.dosage,
                    line.administrationRoute,
                    line.frequency,
                    `${line.durationDays} ngày`,
                    `${line.quantity} ${line.unit}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
          {prescription.instructions && (
            <p className="whitespace-pre-wrap break-words rounded-lg bg-teal-50 p-3 text-sm text-teal-950">
              {prescription.instructions}
            </p>
          )}
        </section>
      )}
      {visit.isFinalized && (
        <footer className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          Bác sĩ xác nhận: <strong>{visit.doctorName}</strong>
          {visit.finalizedAt && (
            <span className="block text-xs text-teal-900">
              {confirmationFormat.format(new Date(visit.finalizedAt))}
            </span>
          )}
        </footer>
      )}
    </>
  );
}
