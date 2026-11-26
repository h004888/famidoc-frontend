'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Home,
  Info,
  Lock,
  Pill,
  QrCode,
  ShieldCheck,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import { DashboardPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { PrescriptionForm } from '@/features/doctor-encounters/components/prescription-form';
import { FamilyPrescriptionPanel } from '@/features/doctor-encounters/components/family-prescription-panel';
import { downloadBookDocument } from './download-book-document';
import { HealthTimeline } from './health-timeline';
import {
  medicalBooksApi,
  type BookDocument,
  type BookFamily,
  type BookMember,
  type BookVisit,
  type BookVisitDetail,
} from '@/lib/api/medical-books.api';
import {
  prescriptionErrorMessage,
  prescriptionsApi,
} from '@/lib/api/prescriptions.api';
import { BookDocumentUpload } from './book-document-upload';
import { PrescriptionContextSummary } from './prescription-context-summary';
import { NationalPrescriptionDialog } from './national-prescription-dialog';
import { PrescriptionValidityNotice } from './prescription-validity-notice';
import { buildNationalPrescriptionPayload } from '@/lib/national-prescription';

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
  const [familyListOpen, setFamilyListOpen] = useState(true);
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
        ? families.find((item) =>
            item.members.some((member) => member.id === initialPatientId),
          )
        : undefined);

  return (
    <DashboardPageShell
      className="bg-[#f4f7f6]"
      containerClassName="w-full max-w-full px-2 sm:px-4 lg:px-6"
    >
      {/* Header lâm sàng tinh gọn & hiện đại - Tối ưu chiều dọc cho bác sĩ và gia đình */}
      <header
        className={`relative flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white shadow-sm sm:px-6 sm:py-5 ${
          doctor
            ? 'bg-gradient-to-r from-[#0d3430] via-[#14423d] to-[#1d5750]'
            : 'bg-primary'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${
              doctor
                ? 'bg-teal-500/20 text-teal-200 border-teal-400/30'
                : 'bg-white/15 text-white border-white/20'
            }`}
          >
            <BookOpen size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {doctor ? 'Sổ khám và kê đơn điện tử' : 'Sổ khám gia đình'}
              </h1>
              {doctor && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck size={13} aria-hidden="true" /> Mô phỏng đơn
                  ngoại trú
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-teal-50/90 truncate sm:text-sm">
              {doctor
                ? 'Ghi sổ khám, kê đơn từng người và tổng hợp đơn theo gia đình.'
                : 'Theo dõi lịch sử khám bệnh, đơn thuốc điện tử và tài liệu y khoa từng thành viên.'}
            </p>
          </div>
        </div>

        {doctor && family && (
          <div className="hidden md:flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-teal-100 border border-white/10">
            <Users size={14} className="text-teal-300" aria-hidden="true" />
            <span>Đang mở sổ hộ:</span>
            <strong className="text-white font-semibold truncate max-w-[180px]">
              {family.representativeName}
            </strong>
          </div>
        )}
      </header>

      <div className="space-y-4">
        {/* Khối Gia đình phụ trách (Ảnh 1) - Thanh chọn đóng lên / mở xuống thông minh */}
        {doctor && (
          <aside
            className={`${paper} overflow-hidden shadow-xs transition-all`}
            aria-label="Danh sách gia đình"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 p-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                  <Users size={16} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Gia đình phụ trách
                    </h2>
                    {query.data && (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-900">
                        {families.length} hộ
                      </span>
                    )}
                  </div>
                  {family && (
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      Hộ đang chọn:{' '}
                      <strong className="text-teal-950 font-semibold">
                        {family.representativeName}
                      </strong>{' '}
                      ({family.members.length} thành viên)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold text-teal-900 border-teal-200 bg-white hover:bg-teal-50"
                  onClick={() => setFamilyListOpen((prev) => !prev)}
                  aria-expanded={familyListOpen}
                >
                  {familyListOpen ? (
                    <>
                      <ChevronUp size={15} />
                      Đóng lên (Thu gọn)
                    </>
                  ) : (
                    <>
                      <ChevronDown size={15} />
                      Đổi gia đình (Mở xuống)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Nội dung danh sách gia đình (khi mở xuống) */}
            <div className={familyListOpen ? 'p-3 sm:p-4 space-y-3' : 'hidden'}>
              {!query.data && (
                <QueryStatus
                  error={query.error}
                  retry={query.reload}
                  label="Đang tải danh sách gia đình…"
                />
              )}
              {query.data && families.length === 0 && (
                <p className="px-1 text-sm text-slate-600">
                  Chưa có gia đình nào được phân công.
                </p>
              )}
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {families.map((item) => {
                  const isSelected = item.id === family?.id;
                  return (
                    <li key={item.id} className="min-w-0">
                      <button
                        type="button"
                        disabled={pending}
                        aria-pressed={isSelected}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/80 shadow-xs ring-1 ring-teal-500/30'
                            : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setFamilyId(item.id);
                        }}
                      >
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {item.representativeName}
                        </span>
                        <span className="block text-xs text-slate-600 mt-1">
                          {item.members.length} thành viên
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Pager
                page={familyPage}
                next={query.data?.hasNextPage}
                disabled={pending}
                change={setFamilyPage}
                label="Phân trang gia đình"
              />
            </div>
          </aside>
        )}

        {/* Khối Sổ khám & Kê đơn (Ảnh 2) - Kéo sát sang cạnh sidebar bên trái */}
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
          <section className={`${paper} p-6 sm:p-8 text-center`}>
            {!doctor && !query.data ? (
              <QueryStatus
                error={query.error}
                retry={query.reload}
                label="Đang tải sổ khám…"
              />
            ) : (
              <div className="space-y-2">
                <Users className="mx-auto size-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">
                  {doctor
                    ? 'Vui lòng chọn một gia đình phụ trách ở danh sách trên để mở sổ khám.'
                    : 'Chưa tìm thấy hồ sơ sổ khám gia đình.'}
                </p>
              </div>
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
  const [mode, setMode] = useState<'book' | 'family-prescription'>('book');
  const [familyPanelOpened, setFamilyPanelOpened] = useState(false);
  const [membersOpen, setMembersOpen] = useState(true);
  const effectivePatientId =
    patientId || (!doctor ? (family.members[0]?.id ?? '') : '');
  const member = family.members.find((item) => item.id === effectivePatientId);
  return (
    <div className="min-w-0 space-y-4">
      {doctor && (
        <div
          role="group"
          aria-label="Sổ khám và đơn gia đình"
          className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs"
        >
          <Button
            type="button"
            disabled={pending}
            variant={mode === 'book' ? 'default' : 'ghost'}
            className={
              mode === 'book'
                ? 'bg-teal-700 hover:bg-teal-800 text-white font-medium'
                : 'text-slate-700'
            }
            onClick={() => setMode('book')}
          >
            Sổ khám từng người
          </Button>
          <Button
            type="button"
            disabled={pending}
            variant={mode === 'family-prescription' ? 'default' : 'ghost'}
            className={
              mode === 'family-prescription'
                ? 'bg-teal-700 hover:bg-teal-800 text-white font-medium'
                : 'text-slate-700'
            }
            onClick={() => {
              setFamilyPanelOpened(true);
              setMode('family-prescription');
            }}
          >
            Kê đơn gia đình
          </Button>
        </div>
      )}
      {doctor && familyPanelOpened && (
        <div hidden={mode !== 'family-prescription'}>
          <FamilyPrescriptionPanel
            family={family}
            setPending={setPending}
            active={mode === 'family-prescription'}
          />
        </div>
      )}
      <div hidden={mode !== 'book'} className="space-y-4">
        {/* Khối Thành viên gia đình (Ảnh 2 top) - Thanh chọn thành viên đóng lên / mở xuống linh hoạt */}
        <section
          className={`${paper} overflow-hidden shadow-2xs`}
          aria-label="Thành viên trong gia đình"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 p-3 sm:px-5 sm:py-3.5">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                Hồ sơ gia đình
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="break-words text-base sm:text-lg font-bold text-slate-900">
                  {family.representativeName}
                </h2>
                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs text-slate-700">
                  {family.members.length} thành viên
                </span>
              </div>
              {member && !membersOpen && (
                <p className="mt-1 text-xs text-teal-800 font-medium flex items-center gap-1.5">
                  <UserCheck size={14} className="text-teal-700" />
                  Đang chọn:{' '}
                  <strong className="text-teal-950 font-semibold">
                    {member.fullName}
                  </strong>{' '}
                  (
                  {relations[member.relationshipToHead] ??
                    member.relationshipToHead}
                  )
                </p>
              )}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-semibold text-teal-900 border-teal-200 bg-white hover:bg-teal-50"
              onClick={() => setMembersOpen((prev) => !prev)}
              aria-expanded={membersOpen}
            >
              {membersOpen ? (
                <>
                  <ChevronUp size={15} />
                  Đóng lên (Thu gọn)
                </>
              ) : (
                <>
                  <ChevronDown size={15} />
                  Chọn thành viên khác (Mở xuống)
                </>
              )}
            </Button>
          </div>

          {/* Khi mở xuống: Hiển thị lưới thẻ thành viên chi tiết */}
          {membersOpen ? (
            <div className="p-3 sm:p-4">
              <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {family.members.map((item) => {
                  const isSelected = item.id === member?.id;
                  return (
                    <li key={item.id} className="min-w-0">
                      <button
                        type="button"
                        disabled={pending}
                        aria-pressed={isSelected}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/80 shadow-2xs ring-1 ring-teal-500/30'
                            : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                        }`}
                        onClick={() => setPatientId(item.id)}
                      >
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {item.fullName}
                        </span>
                        <span className="block truncate text-xs text-slate-600 mt-1">
                          {relations[item.relationshipToHead] ??
                            item.relationshipToHead}{' '}
                          · {dateLabel(item.dateOfBirth)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            /* Khi đóng lên: Vẫn render danh sách các button thành viên dạng thanh cuộn ngang mượt mà */
            <div className="px-3 py-2 sm:px-5 border-t border-slate-100 overflow-x-auto">
              <ul className="flex items-center gap-2 whitespace-nowrap py-1">
                {family.members.map((item) => {
                  const isSelected = item.id === member?.id;
                  return (
                    <li key={item.id} className="shrink-0">
                      <button
                        type="button"
                        disabled={pending}
                        aria-pressed={isSelected}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80'
                        }`}
                        onClick={() => setPatientId(item.id)}
                      >
                        {item.fullName} (
                        {relations[item.relationshipToHead] ??
                          item.relationshipToHead}
                        )
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
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
    </div>
  );
}

const MEMBER_TABS = {
  timeline: 'Dòng thời gian',
  visits: 'Lần khám',
  documents: 'Tài liệu',
} as const;

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
  const [tab, setTab] = useState<keyof typeof MEMBER_TABS>('visits');
  const [timelineVisitId, setTimelineVisitId] = useState<string | null>(null);
  const [encounterMode, setEncounterMode] = useState<
    'TELEHEALTH' | 'HOME_VISIT'
  >('HOME_VISIT');

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
          {(Object.keys(MEMBER_TABS) as Array<keyof typeof MEMBER_TABS>).map(
            (key) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                aria-pressed={tab === key}
                className="rounded-lg aria-pressed:bg-white aria-pressed:text-teal-900 aria-pressed:shadow-xs"
                onClick={() => {
                  setTab(key);
                  setTimelineVisitId(null);
                }}
              >
                {MEMBER_TABS[key]}
              </Button>
            ),
          )}
        </div>
      </div>

      {doctor && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50/70 via-slate-50 to-sky-50/60 p-3 sm:p-4">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              Chế độ khám & Kê đơn
            </span>
            <p className="text-sm font-medium text-slate-800">
              Chọn hình thức thăm khám để ghi sổ và liên thông đơn thuốc
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={encounterMode === 'TELEHEALTH' ? 'default' : 'outline'}
              className={
                encounterMode === 'TELEHEALTH'
                  ? 'gap-1.5 bg-sky-700 font-medium text-white hover:bg-sky-800'
                  : 'gap-1.5 border-sky-300 text-sky-900 hover:bg-sky-50'
              }
              onClick={() => setEncounterMode('TELEHEALTH')}
            >
              <Video size={16} aria-hidden="true" />
              Khám Online (Telehealth)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={encounterMode === 'HOME_VISIT' ? 'default' : 'outline'}
              className={
                encounterMode === 'HOME_VISIT'
                  ? 'gap-1.5 bg-teal-700 font-medium text-white hover:bg-teal-800'
                  : 'gap-1.5 border-teal-300 text-teal-900 hover:bg-teal-50'
              }
              onClick={() => setEncounterMode('HOME_VISIT')}
            >
              <Home size={16} aria-hidden="true" />
              Khám Tại Nhà (In-Home)
            </Button>
          </div>
        </div>
      )}

      {tab === 'timeline' ? (
        <div className="space-y-4">
          <div hidden={Boolean(timelineVisitId)}>
            <HealthTimeline
              familyId={familyId}
              patientId={member.id}
              onOpenVisit={setTimelineVisitId}
            />
          </div>
          {timelineVisitId && (
            <div className="space-y-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setTimelineVisitId(null)}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Quay lại dòng thời gian
              </Button>
              <VisitPage
                key={timelineVisitId}
                id={timelineVisitId}
                patientId={member.id}
                doctor={doctor}
                setPending={setPending}
              />
            </div>
          )}
        </div>
      ) : tab === 'documents' ? (
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
      await downloadBookDocument(
        familyId,
        patientId,
        record.id,
        record.documentName,
      );
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

export function DoctorBookVisitView({
  id,
  patientId,
}: {
  id: string;
  patientId?: string;
}) {
  return (
    <DashboardPageShell containerClassName="max-w-4xl">
      <Link
        href="/doctor/encounters"
        className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline"
      >
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
  const [replacementFor, setReplacementFor] = useState<string | null>(null);
  const activePatientId = selectedPatientId ?? patientId;
  const request = useCallback(
    (signal: AbortSignal) =>
      activePatientId
        ? medicalBooksApi.visit(id, signal, activePatientId)
        : medicalBooksApi.visit(id, signal),
    [id, activePatientId],
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
  if (activePatientId && visit.patient.id !== activePatientId)
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
                onClick={() => {
                  setReplacementFor(null);
                  setSelectedPatientId(member.id);
                }}
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
      {doctor &&
        visit.prescription &&
        visit.prescription.status !== 'CANCELLED' &&
        !visit.prescription.replacedBy && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setReplacementFor((current) =>
                  current === visit.prescription!.id
                    ? null
                    : visit.prescription!.id,
                )
              }
            >
              {replacementFor === visit.prescription.id
                ? 'Đóng phần kê đơn thay thế'
                : 'Kê đơn thay thế'}
            </Button>
            {replacementFor === visit.prescription.id && (
              <PrescriptionForm
                key={`replace-${visit.prescription.id}`}
                visit={visit}
                isReplacement
                onPendingChange={setPending}
                onConfirmed={() => {
                  setReplacementFor(null);
                  query.reload();
                  onConfirmed?.();
                }}
              />
            )}
          </div>
        )}
      {visit.prescriptionHistory?.map((previous) => (
        <details
          key={previous.id}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <summary className="cursor-pointer font-semibold">
            Xem bản đơn cũ · {dateLabel(previous.prescribedDate)} ·{' '}
            {previous.prescriptionCode}
          </summary>
          <div className="mt-4">
            <ReadVisit visit={{ ...visit, prescription: previous }} />
          </div>
        </details>
      ))}
      {doctor && (!visit.isFinalized || !visit.prescription) && (
        <PrescriptionForm
          key={`${visit.id}-${visit.patient.id}-${visit.isFinalized ? 'prescribe' : 'record'}`}
          visit={visit}
          onPendingChange={setPending}
          onConfirmed={() => {
            query.reload();
            onConfirmed?.();
          }}
        />
      )}
    </article>
  );
}

function ReadVisit({ visit: currentVisit }: { visit: BookVisitDetail }) {
  const [nationalDialogOpen, setNationalDialogOpen] = useState(false);
  const [showSoftDeleteNotice, setShowSoftDeleteNotice] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const snapshot = currentVisit.prescription?.recordSnapshot;
  const visit = snapshot
    ? {
        ...currentVisit,
        patient: { ...currentVisit.patient, ...snapshot.patient },
        doctorName: snapshot.doctorName,
        facility: snapshot.facility,
        exam: snapshot.exam,
      }
    : currentVisit;
  const exam = visit.exam;
  if (!exam) return null;
  const prescription = visit.prescription;
  const ctx = prescription?.clinicalContext;

  const nationalSyncData = prescription
    ? buildNationalPrescriptionPayload({
        prescriptionSeed: prescription.id || prescription.prescriptionCode,
        prescriptionStatus: prescription.status,
        prescribedAt: prescription.prescribedDate,
        validUntil: prescription.validUntil ?? undefined,
        encounterType:
          visit.encounterType === 'TELEHEALTH' ? 'TELEHEALTH' : 'HOME_VISIT',
        patientName: visit.patient.fullName,
        patientDob: visit.patient.dateOfBirth,
        patientGender: visit.patient.gender,
        weightKg: ctx?.weightKg,
        ageMonths: ctx?.ageMonths,
        citizenId: ctx?.citizenId,
        identityDocument: ctx?.identityDocument,
        insuranceNumber: ctx?.insuranceNumber,
        ethnicity: ctx?.ethnicity,
        patientAddress: ctx?.address,
        patientPhone: ctx?.phone,
        caregiverName: ctx?.caregiverName,
        conclusion: ctx?.conclusion,
        precautions: ctx?.precautions,
        treatmentMode: ctx?.treatmentMode,
        followUpDays: ctx?.followUpDays,
        doctorName: visit.doctorName,
        facilityName: visit.facility?.facilityName,
        facilityAddress: visit.facility?.address ?? undefined,
        icd10Code: exam.icd10Code,
        diagnosis: exam.icd10Diagnosis,
        treatmentPlan: exam.treatmentPlan,
        instructions: prescription.instructions ?? undefined,
        drugs: (prescription.details || []).map((d) => ({
          medicationCode: d.medicationCode ?? undefined,
          activeIngredient: d.activeIngredient ?? undefined,
          medicationName: d.medicationName,
          strength: d.strength ?? undefined,
          administrationRoute: d.administrationRoute ?? undefined,
          dosage: d.dosage ?? undefined,
          frequency: d.frequency ?? undefined,
          quantity: d.quantity,
          unit: d.unit,
          durationDays: d.durationDays,
        })),
      }).syncResult
    : null;

  const genderLabel =
    ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' } as Record<string, string>)[
      visit.patient.gender ?? ''
    ] || 'Chưa có thông tin';

  return (
    <>
      <section className={`${paper} space-y-3 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <h4 className="font-semibold text-slate-900">
            Thông tin khám lâm sàng
          </h4>
          {visit.isFinalized && !prescription && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
              <Info size={13} /> Đã khám · Chưa kê đơn (Có thể bổ sung đơn bên
              dưới)
            </span>
          )}
        </div>
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
        <section
          aria-label="Đơn thuốc điện tử đã lưu"
          className={`${paper} space-y-4 p-4 sm:p-6`}
        >
          {/* Phần đầu tờ đơn chuẩn mẫu Đơn thuốc điện tử Bộ Y tế */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3.5 text-xs sm:text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                Tên đơn vị ·{' '}
                {visit.facility?.facilityName || 'Chưa có thông tin cơ sở y tế'}
              </p>
              <p className="text-xs text-slate-600">
                Địa chỉ · {visit.facility?.address || 'Chưa có thông tin'}
              </p>
              <p className="text-xs text-slate-600">
                Điện thoại đơn vị / bác sĩ ·{' '}
                {visit.facility?.phone || 'Chưa có thông tin'}
              </p>
              <p className="text-[11px] text-slate-500">
                Mã CSYT liên thông · Chờ tích hợp
              </p>
            </div>

            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {prescription.status !== 'ISSUED' ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 border border-amber-200">
                    {prescription.status === 'CANCELLED'
                      ? 'Đã thu hồi / Hủy'
                      : 'Đã hết hạn'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 border border-teal-200">
                    <ShieldCheck size={14} className="text-teal-700" />
                    Bản lưu đơn mô phỏng
                  </span>
                )}
                {nationalSyncData && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs font-semibold text-teal-900 border-teal-300 bg-teal-50/50 hover:bg-teal-100/70"
                    onClick={() => setNationalDialogOpen(true)}
                  >
                    <QrCode size={14} /> Xem mẫu QĐ 808 &amp; JSON
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Mã lưu đơn ·{' '}
                <strong className="tabular-nums text-slate-900">
                  {prescription.prescriptionCode}
                </strong>
              </p>
              <p className="text-xs text-slate-600">
                Ngày kê đơn ·{' '}
                {prescription.prescribedDate
                  ? dateLabel(prescription.prescribedDate)
                  : 'Bản cũ chưa ghi nhận ngày kê'}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    setDownloadError('');
                    await prescriptionsApi.downloadRecord(prescription.id);
                  } catch (failure) {
                    setDownloadError(
                      prescriptionErrorMessage(
                        failure,
                        'Chưa tải được bản lưu. Vui lòng thử lại.',
                      ),
                    );
                  }
                }}
              >
                Tải bản lưu đơn thuốc (JSON)
              </Button>
              {downloadError && (
                <p role="alert" className="text-sm text-red-700">
                  {downloadError}
                </p>
              )}
              {!prescription.recordSnapshot && (
                <p className="text-xs text-slate-600">
                  Bản lưu cũ: thông tin hồ sơ hiển thị theo dữ liệu hiện tại.
                </p>
              )}
              {nationalSyncData && (
                <p className="text-[11px] tabular-nums text-teal-900">
                  Mã đơn mô phỏng (14 ký tự):{' '}
                  <strong>{nationalSyncData.ma_don_thuoc_quoc_gia}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Tiêu đề giữa tờ đơn */}
          <div className="space-y-1 text-center">
            <h4 className="flex items-center justify-center gap-2 text-lg font-bold tracking-wide text-slate-900 sm:text-xl">
              <Pill size={18} className="text-teal-700" aria-hidden="true" />
              ĐƠN THUỐC
            </h4>
            <p className="text-xs text-slate-600">
              Loại đơn: <strong>Đơn thuốc thường (-c)</strong> ·{' '}
              {visitTypes[visit.encounterType] ?? 'Buổi khám'} ·{' '}
              {ctx?.treatmentMode === 'INPATIENT' ? 'Nội trú' : 'Ngoại trú'}
            </p>
            <PrescriptionValidityNotice
              status={prescription.status}
              validUntil={
                prescription.validUntil ??
                nationalSyncData?.raw_payload.thoi_han_don_thuoc
              }
              className="text-[11px] font-semibold text-amber-800"
            />
          </div>

          {/* Thông tin hành chính người bệnh & Chẩn đoán ICD-10 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3 text-sm">
            <dl className="grid gap-2.5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Họ tên người bệnh</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {visit.patient.fullName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Ngày sinh</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {dateLabel(visit.patient.dateOfBirth)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Giới tính</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {genderLabel}
                </dd>
              </div>
              <div className="sm:col-span-3 border-t border-slate-200/80 pt-2">
                <dt className="text-xs text-slate-500">
                  Chẩn đoán (Mã ICD-10)
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {[exam.icd10Code, exam.icd10Diagnosis]
                    .filter(Boolean)
                    .join(' · ')}
                </dd>
              </div>
            </dl>
            <PrescriptionContextSummary
              context={prescription.clinicalContext}
            />
            {(prescription.replaces || prescription.replacedBy) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <p>
                  {prescription.replacedBy
                    ? `Đơn đã được thay thế bởi ${prescription.replacedBy.prescriptionCode}. Không sử dụng bản cũ này.`
                    : `Đơn này thay thế ${prescription.replaces?.prescriptionCode}.`}
                </p>
                {prescription.replacementReason && (
                  <p>Lý do: {prescription.replacementReason}</p>
                )}
              </div>
            )}
          </div>

          {/* Bảng danh mục thuốc điện tử chuẩn đánh số STT */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[540px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                  <th className="px-3 py-2.5 w-10 text-center">STT</th>
                  <th className="px-3 py-2.5">
                    Tên thuốc · Hàm lượng · Hoạt chất
                  </th>
                  <th className="px-3 py-2.5">
                    Cách dùng (Liều · Đường dùng · Tần suất)
                  </th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">
                    Số lượng
                  </th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">
                    Đã bán
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {prescription.details.map((line, index) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-600 tabular-nums align-top">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <p className="break-words font-semibold text-slate-900">
                        {line.medicationName}
                        {line.strength ? ` · ${line.strength}` : ''}
                      </p>
                      {(line.medicationCode || line.activeIngredient) && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[line.medicationCode, line.activeIngredient]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 align-top">
                      <p className="break-words">
                        {[
                          line.dosage,
                          line.administrationRoute,
                          line.frequency,
                          `${line.durationDays} ngày`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums align-top">
                      {String(line.quantity).padStart(2, '0')} {line.unit}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-500 whitespace-nowrap align-top">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {prescription.instructions && (
            <p className="whitespace-pre-wrap break-words rounded-xl bg-teal-50/80 p-3 text-sm text-teal-950 border border-teal-100">
              <strong>Lời dặn:</strong> {prescription.instructions}
            </p>
          )}

          {/* Chân trang đơn thuốc & Ô chờ chữ ký số / ID bác sĩ */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-3.5 text-xs text-slate-600">
            <div className="max-w-md space-y-1">
              <p>
                • Khám lại khi có biểu hiện bất thường. Mang theo đơn khi tái
                khám.
              </p>
              <PrescriptionValidityNotice
                status={prescription.status}
                validUntil={
                  prescription.validUntil ??
                  nationalSyncData?.raw_payload.thoi_han_don_thuoc
                }
              />
            </div>
            <div className="min-w-48 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 text-center">
              <p className="font-semibold text-slate-800">Bác sĩ khám bệnh</p>
              <p className="mt-1 font-bold text-slate-900">
                {visit.doctorName}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Chữ ký số &amp; mã định danh bác sĩ: Chờ tích hợp
              </p>
            </div>
          </div>

          {/* Quy chế pháp lý và cơ chế Soft Delete theo Luật KCB 2023 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Lock size={13} className="text-slate-500" />
                Bản lưu nội bộ · Giữ lịch sử các phiên bản
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-amber-800 hover:bg-amber-50"
                onClick={() => setShowSoftDeleteNotice((prev) => !prev)}
              >
                {showSoftDeleteNotice
                  ? 'Ẩn thông tin'
                  : 'Cách lưu và thay thế đơn'}
              </Button>
            </div>
            {showSoftDeleteNotice && (
              <div className="space-y-1 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                <p>
                  • Đơn đã lưu được giữ nguyên nội dung. Khi cần thay đổi thuốc,
                  bác sĩ kê đơn mới và ghi lý do thay thế.
                </p>
                <p>
                  • Bản cũ được đánh dấu đã thay thế, vẫn xem lại được cùng bản
                  mới và nhật ký thao tác. Đây là mô phỏng theo Thông tư
                  26/2025/TT-BYT; phần liên thông và ký số đang chờ tích hợp.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {visit.isFinalized && (
        <footer className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          Bác sĩ xác nhận: <strong>{visit.doctorName}</strong>
          {visit.finalizedAt && (
            <span className="block text-xs text-teal-900 mt-0.5">
              Thời gian xác nhận:{' '}
              {confirmationFormat.format(new Date(visit.finalizedAt))}
            </span>
          )}
        </footer>
      )}

      {/* Modal xem mô phỏng gói dữ liệu đơn thuốc Quốc gia QĐ 808/QĐ-BYT */}
      {nationalSyncData && nationalDialogOpen && (
        <NationalPrescriptionDialog
          open={nationalDialogOpen}
          onOpenChange={setNationalDialogOpen}
          syncResult={nationalSyncData}
          prescriptionStatus={prescription!.status}
        />
      )}
    </>
  );
}
