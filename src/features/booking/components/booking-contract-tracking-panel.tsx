'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DocumensoSigningEmbed,
  openSignedPdf,
} from '@/features/four-party-contract';
import type { BackendSignerRole, MedicalContractDetailDto } from '@/lib/api';

export interface BookingContractTrackingPanelProps {
  contract: MedicalContractDetailDto;
  /** Làm mới tiến độ thủ công (nút duy nhất của trang, không lặp trong khung ký). */
  isRefreshing: boolean;
  onRefresh: () => void;
  onProceedPayment: () => void;
}

/** Các trạng thái backend coi như hợp đồng đã dừng/không còn chờ ký. */
const TERMINATED_STATUSES = new Set(['EXPIRED', 'TERMINATED']);
const TOTAL_REQUIRED_SIGNERS = 4;

/**
 * Định dạng mốc thời gian sang ngày giờ Việt Nam; trả `null` khi chuỗi không hợp lệ
 * để nơi gọi tự quyết định fallback.
 */
export function formatVietnameseDateTime(value?: string | null): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(timestamp));
}

function formatAmount(value?: string | number): string | null {
  if (value === undefined || value === null || value === '') return null;
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return null;
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
}

function signingStateOf(contract: MedicalContractDetailDto) {
  const signedRoles = new Set<BackendSignerRole>(
    (contract.signatures ?? []).map((signature) => signature.signerRole)
  );
  const signedCount = signedRoles.size;
  const hasAllFourSignatures = signedCount >= TOTAL_REQUIRED_SIGNERS;
  const status = contract.contractStatus;
  const isActive = status === 'ACTIVE';
  const isTerminated = TERMINATED_STATUSES.has(status);
  const isPaymentReady = status === 'PENDING_PAYMENT' && hasAllFourSignatures;
  const isAwaitingSignatures = !isActive && !isTerminated && !isPaymentReady;

  return {
    signedRoles,
    isActive,
    isTerminated,
    isPaymentReady,
    isAwaitingSignatures,
    hasAllFourSignatures,
    signedCount,
  };
}

export function isAwaitingBookingSignatures(
  contract: MedicalContractDetailDto | null | undefined
): boolean {
  if (!contract) return false;
  return signingStateOf(contract).isAwaitingSignatures;
}

interface PartyDescriptor {
  role: BackendSignerRole;
  partyCode: string;
  title: string;
  /** Tên thật của bên ký, ưu tiên dữ liệu hợp đồng thay vì mô tả chung. */
  name?: string;
  description: string;
}

function buildParties(contract: MedicalContractDetailDto): PartyDescriptor[] {
  const familyRepresentative =
    contract.familyUnit?.representativeUser?.fullName?.trim() ||
    contract.familyUnit?.representativeUser?.email?.trim();
  const facilityName = contract.facility?.facilityName?.trim();
  const doctorName =
    contract.doctor?.doctorName?.trim() ||
    contract.doctor?.user?.fullName?.trim();

  return [
    {
      role: 'FAMILY_REP',
      partyCode: 'Bên A',
      title: 'Đại diện Hộ gia đình',
      name: familyRepresentative,
      description: 'Ký xác nhận gói chăm sóc, thành viên và điều khoản hợp đồng.',
    },
    {
      role: 'HEALTHCARE_FACILITY',
      partyCode: 'Bên B',
      title: 'Cơ sở y tế',
      name: facilityName,
      description: 'Xác nhận bảo trợ chuyên môn và cơ sở vật chất.',
    },
    {
      role: 'ASSIGNED_DOCTOR',
      partyCode: 'Bên C',
      title: 'Bác sĩ gia đình phụ trách',
      name: doctorName,
      description: 'Chấp thuận tiếp nhận theo dõi sức khỏe hộ gia đình.',
    },
    {
      role: 'ADMIN',
      partyCode: 'Bên D',
      title: 'Nền tảng FamiDoc',
      name: 'Nền tảng FamiDoc',
      description: 'Kiểm soát hợp đồng điện tử và lưu trữ hồ sơ.',
    },
  ];
}

function resolveStatusLabel(state: ReturnType<typeof signingStateOf>): string {
  if (state.isActive) return 'Đang hiệu lực';
  if (state.isTerminated) return 'Đã kết thúc';
  if (state.isPaymentReady) return 'Sẵn sàng thanh toán';
  if (state.signedRoles.has('FAMILY_REP')) {
    const remaining = Math.max(0, TOTAL_REQUIRED_SIGNERS - state.signedCount);
    return `Đang chờ ${remaining} bên còn lại (${state.signedCount}/${TOTAL_REQUIRED_SIGNERS})`;
  }
  return 'Đang chờ đại diện hộ gia đình ký';
}

const STATUS_TONE: Record<'active' | 'payment' | 'waiting' | 'closed', string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  payment: 'border-primary/25 bg-primary/10 text-primary',
  waiting: 'border-amber-200 bg-amber-50 text-amber-800',
  closed: 'border-slate-200 bg-slate-100 text-slate-600',
};

function statusToneOf(
  state: ReturnType<typeof signingStateOf>
): keyof typeof STATUS_TONE {
  if (state.isActive) return 'active';
  if (state.isTerminated) return 'closed';
  if (state.isPaymentReady) return 'payment';
  return 'waiting';
}

function PartyProgressCard({
  party,
  signed,
  canSign,
  signedAt,
}: {
  party: PartyDescriptor;
  signed: boolean;
  canSign: boolean;
  signedAt?: string | null;
}) {
  return (
    <li
      data-testid={`booking-party-${party.role}`}
      data-signed={signed ? 'true' : 'false'}
      className={cn(
        'rounded-xl border p-3.5 space-y-1.5',
        signed
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{party.partyCode}</p>
          <p className="break-words text-sm font-bold text-slate-900">
            {party.name || party.title}
          </p>
          {party.name && party.name !== party.title && (
            <p className="text-xs text-slate-600">{party.title}</p>
          )}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold',
            signed
              ? 'bg-emerald-100 text-emerald-800'
              : canSign
                ? 'bg-amber-50 text-amber-800'
                : 'bg-slate-100 text-slate-600'
          )}
        >
          {signed ? 'Đã ký' : canSign ? 'Chờ ký' : 'Chờ Bên A'}
        </span>
      </div>
      {signed && signedAt && (
        <p className="text-xs text-emerald-800">
          Ký lúc <span className="font-semibold">{signedAt}</span>
        </p>
      )}
      <p className="text-xs leading-relaxed text-slate-600">{party.description}</p>
    </li>
  );
}

/** Lấy thời điểm ký (đã định dạng `vi-VN`) theo vai trò từ danh sách chữ ký. */
function buildSignedAtByRole(
  contract: MedicalContractDetailDto
): Map<BackendSignerRole, string | null> {
  const map = new Map<BackendSignerRole, string | null>();
  for (const signature of contract.signatures ?? []) {
    map.set(signature.signerRole, formatVietnameseDateTime(signature.signedAt));
  }
  return map;
}

/**
 * Cột chính của `/booking/tracking` sau khi Bên A đã ký xong: thay khung nhúng
 * Documenso bằng bảng theo dõi tiến độ 2 giai đoạn (Bên A hoàn tất -> 3 bên ký song song).
 */
function PostFamilySigningCard({
  parties,
  state,
  signedAtByRole,
  familySignedAt,
}: {
  parties: PartyDescriptor[];
  state: ReturnType<typeof signingStateOf>;
  signedAtByRole: Map<BackendSignerRole, string | null>;
  familySignedAt: string | null;
}) {
  const totalParties = TOTAL_REQUIRED_SIGNERS;
  const progressPercent = Math.min(
    100,
    Math.round((state.signedCount / totalParties) * 100)
  );
  const familyParty = parties.find((party) => party.role === 'FAMILY_REP');
  const parallelParties = parties.filter((party) => party.role !== 'FAMILY_REP');
  const parallelSignedCount = parallelParties.filter((party) =>
    state.signedRoles.has(party.role)
  ).length;

  return (
    <section
      data-testid="booking-post-family-signing-card"
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
        <span
          aria-hidden="true"
          className="material-symbols-outlined shrink-0 text-[22px] text-emerald-700"
        >
          verified
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-emerald-900 sm:text-base">
            Đại diện hộ gia đình (Bên A) đã ký thành công
          </h2>
          <p
            data-testid="booking-post-family-signed-at"
            className="text-xs leading-relaxed text-emerald-800 sm:text-sm"
          >
            {familySignedAt
              ? `Ghi nhận chữ ký số lúc ${familySignedAt}.`
              : 'Đã ghi nhận chữ ký số hợp đồng.'}{' '}
            Hợp đồng sẽ sẵn sàng thanh toán ngay khi đủ 4/4 bên ký.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">Tiến độ ký 4 bên</p>
          <span
            role="status"
            aria-atomic="true"
            data-testid="booking-post-signing-progress"
            className="text-xs font-semibold tabular-nums text-slate-700"
          >
            Đã ký {state.signedCount}/{totalParties} bên ({progressPercent}%)
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalParties}
          aria-valuenow={state.signedCount}
          aria-label="Tiến độ ký hợp đồng 4 bên"
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {familyParty && (
        <div
          data-testid="booking-post-signing-stage-1"
          className="space-y-2"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Giai đoạn 1 · Đại diện hộ gia đình (Đã hoàn tất)
          </p>
          <ul className="space-y-2">
            <li
              data-testid={`booking-post-signing-party-${familyParty.role}`}
              data-signed="true"
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-emerald-700"
                >
                  check_circle
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold text-emerald-800">
                    {familyParty.partyCode} · Bạn
                  </p>
                  <p className="break-words text-sm font-bold text-slate-900">
                    {familyParty.name || familyParty.title}
                  </p>
                  {familyParty.name && familyParty.name !== familyParty.title && (
                    <p className="text-xs text-slate-600">{familyParty.title}</p>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  Đã ký
                </span>
                {familySignedAt && (
                  <p className="mt-1 text-xs tabular-nums text-emerald-900">
                    {familySignedAt}
                  </p>
                )}
              </div>
            </li>
          </ul>
        </div>
      )}

      <div
        data-testid="booking-post-signing-stage-2"
        className="space-y-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Giai đoạn 2 · Các bên đang ký song song
          </p>
          <span className="text-xs font-semibold tabular-nums text-amber-800">
            {parallelSignedCount}/{parallelParties.length} hoàn tất
          </span>
        </div>
        <ul className="space-y-2.5">
          {parallelParties.map((party) => {
            const signed = state.signedRoles.has(party.role);
            const signedAt = signedAtByRole.get(party.role) ?? null;
            return (
              <li
                key={party.role}
                data-testid={`booking-post-signing-party-${party.role}`}
                data-signed={signed ? 'true' : 'false'}
                className={cn(
                  'flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3.5',
                  signed
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'material-symbols-outlined mt-0.5 shrink-0 text-[18px]',
                      signed ? 'text-emerald-700' : 'text-amber-600'
                    )}
                  >
                    {signed ? 'check_circle' : 'schedule'}
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-slate-500">
                      {party.partyCode}
                    </p>
                    <p className="break-words text-sm font-bold text-slate-900">
                      {party.name || party.title}
                    </p>
                    {party.name && party.name !== party.title && (
                      <p className="text-xs text-slate-600">{party.title}</p>
                    )}
                    <p className="text-xs leading-relaxed text-slate-600">
                      {party.description}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold',
                      signed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-50 text-amber-800'
                    )}
                  >
                    {signed ? 'Đã ký' : 'Đang chờ ký'}
                  </span>
                  {signed && signedAt && (
                    <p className="mt-1 text-xs tabular-nums text-emerald-900">
                      {signedAt}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/**
 * Giao diện Bước 2 `/booking/tracking` tách khỏi Dashboard: dùng trọn container
 * `max-w-7xl` của shell, bố cục 2 cột, không breadcrumb/hotline Dashboard.
 */
export function BookingContractTrackingPanel({
  contract,
  isRefreshing,
  onRefresh,
  onProceedPayment,
}: BookingContractTrackingPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const state = signingStateOf(contract);
  const [clock, setClock] = useState(() => Date.now());
  const [serverOffset, setServerOffset] = useState(() => {
    const serverTime = Date.parse(contract.serverTime ?? '');
    return Number.isFinite(serverTime) ? serverTime - Date.now() : 0;
  });
  const refreshedDeadline = useRef<string | null>(null);
  const deadline = state.isAwaitingSignatures ? contract.signingDeadlineAt : null;
  const deadlineMs = deadline ? Date.parse(deadline) : NaN;
  const remaining = Number.isFinite(deadlineMs)
    ? Math.max(0, Math.ceil((deadlineMs - clock - serverOffset) / 1000))
    : null;
  const isPastDeadline = remaining === 0;
  useEffect(() => {
    const now = Date.now();
    const serverTime = Date.parse(contract.serverTime ?? '');
    setServerOffset(Number.isFinite(serverTime) ? serverTime - now : 0);
    setClock(now);
  }, [contract.id, contract.serverTime]);
  useEffect(() => {
    if (!deadline || isPastDeadline) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline, isPastDeadline]);
  useEffect(() => {
    if (!deadline || !isPastDeadline) return;
    const key = `${contract.id}:${deadline}`;
    if (refreshedDeadline.current === key) return;
    refreshedDeadline.current = key;
    onRefresh();
  }, [contract.id, deadline, isPastDeadline, onRefresh]);
  /** Hợp đồng có bản Documenso để tải PDF đã ký (đủ 4/4 chữ ký mới tải được). */
  const hasDocumensoPdf = Boolean(
    (contract.documensoItemId || contract.signedPdfUrl) &&
      (state.isActive || state.hasAllFourSignatures)
  );
  const parties = buildParties(contract);
  const statusLabel = resolveStatusLabel(state);
  const statusTone = statusToneOf(state);
  const createdAt = formatVietnameseDateTime(contract.createdAt);
  const contractCode = contract.contractNumber || contract.id;
  const packageName =
    contract.billingSnapshot?.package?.name ||
    contract.servicePackage?.packageName ||
    'Gói chăm sóc gia đình';
  const packagePrice = formatAmount(
    contract.billingSnapshot?.pricing?.totalPriceVnd ?? contract.totalAmount
  );
  /** Pha hậu ký Bên A: Bên A đã ký nhưng hợp đồng chưa đủ 4/4 chữ ký. */
  const isPostFamilySigning =
    state.isAwaitingSignatures && state.signedRoles.has('FAMILY_REP');
  const signedAtByRole = buildSignedAtByRole(contract);
  const familySignedAt = signedAtByRole.get('FAMILY_REP') ?? null;
  const pageTitle = isPostFamilySigning
    ? 'Theo dõi tiến độ ký hợp đồng 4 bên'
    : 'Ký hợp đồng điện tử 4 bên';
  const pageDescription = isPostFamilySigning
    ? 'Đại diện hộ gia đình đã ký xong. Trang tự kiểm tra tiến độ các bên còn lại và cập nhật ngay khi họ hoàn tất.'
    : 'Đại diện hộ gia đình ký trước, sau đó cơ sở y tế, bác sĩ phụ trách và nền tảng FamiDoc ký song song. Trang tự cập nhật khi các bên hoàn tất.';

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopyCode = useCallback(() => {
    void navigator.clipboard?.writeText(contractCode);
    setCopied(true);
  }, [contractCode]);

  const handleViewSignedPdf = useCallback(async () => {
    setIsOpeningPdf(true);
    setPdfError(null);
    try {
      await openSignedPdf(contract.id);
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : 'Không thể tải tệp PDF đã ký từ máy chủ. Vui lòng thử lại.'
      );
    } finally {
      setIsOpeningPdf(false);
    }
  }, [contract.id]);

  const viewSignedPdfButton = hasDocumensoPdf ? (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleViewSignedPdf()}
        disabled={isOpeningPdf}
        data-testid="booking-view-signed-pdf"
        className={cn(
          'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50',
          state.isActive
            ? 'border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100'
            : 'border border-primary/30 bg-white text-primary hover:bg-primary/10'
        )}
      >
        <span className="material-symbols-outlined text-[18px]">
          {isOpeningPdf ? 'progress_activity' : 'picture_as_pdf'}
        </span>
        <span>{isOpeningPdf ? 'Đang mở PDF...' : 'Xem PDF đã ký 4 bên'}</span>
      </button>
      {pdfError && (
        <div
          role="alert"
          data-testid="booking-view-signed-pdf-error"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
        >
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span className="min-w-0 flex-1">{pdfError}</span>
          <button
            type="button"
            onClick={() => void handleViewSignedPdf()}
            disabled={isOpeningPdf}
            data-testid="booking-view-signed-pdf-retry"
            className="inline-flex cursor-pointer items-center rounded-md border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div data-testid="booking-tracking-panel" className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {pageTitle}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            {pageDescription}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="booking-tracking-status"
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold',
              STATUS_TONE[statusTone]
            )}
          >
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            data-testid="booking-tracking-refresh"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <span
              className={cn(
                'material-symbols-outlined text-[16px]',
                isRefreshing && 'animate-spin'
              )}
            >
              refresh
            </span>
            <span>{isRefreshing ? 'Đang cập nhật...' : 'Cập nhật tiến độ'}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {deadline && remaining !== null && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Hạn ký: {formatVietnameseDateTime(deadline)} (giờ Việt Nam)</p>
              <p>
                {isPastDeadline
                  ? 'Đã hết thời gian ký. Hệ thống đang xác nhận kết quả.'
                  : `Còn ${Math.floor(remaining / 3600)} giờ ${Math.floor((remaining % 3600) / 60)} phút ${remaining % 60} giây.`}
              </p>
            </div>
          )}
          {state.isAwaitingSignatures && !isPostFamilySigning && !isPastDeadline && (
            <DocumensoSigningEmbed
              contractId={contract.id}
              hideHeaderSyncButton
              onSyncCompleted={() => onRefresh()}
            />
          )}

          {isPostFamilySigning && (
            <PostFamilySigningCard
              parties={parties}
              state={state}
              signedAtByRole={signedAtByRole}
              familySignedAt={familySignedAt}
            />
          )}

          {state.isPaymentReady && (
            <div
              data-testid="booking-tracking-payment-ready"
              className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                  <h2 className="text-base font-bold text-slate-900">
                    Đã đủ 4/4 chữ ký
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  Cả bốn bên đã ký kết. Thanh toán VietQR để kích hoạt gói và mở khóa
                  quản lý thành viên gia đình.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onProceedPayment}
                  data-testid="booking-proceed-payment"
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  <span>Thanh toán VietQR ngay</span>
                </button>
                {viewSignedPdfButton}
              </div>
            </div>
          )}

          {state.isActive && (
            <div
              data-testid="booking-tracking-active"
              className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-emerald-700">
                    verified
                  </span>
                  <h2 className="text-base font-bold text-emerald-900">
                    Gói chăm sóc gia đình đang có hiệu lực
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-emerald-800">
                  Hợp đồng 4 bên đã được kích hoạt. Bạn có thể khai báo hồ sơ thành viên
                  và bắt đầu sử dụng dịch vụ.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/family/members"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  <span className="material-symbols-outlined text-[18px]">group_add</span>
                  <span>Quản lý thành viên</span>
                </Link>
                <Link
                  href="/family/subscription/contract"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  <span>Xem bản sao hợp đồng</span>
                </Link>
              </div>
              {viewSignedPdfButton}
            </div>
          )}

          {state.isTerminated && (
            <div
              data-testid="booking-tracking-terminated"
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
            >
              <h2 className="text-base font-bold text-slate-900">
                Hợp đồng này đã kết thúc
              </h2>
              {contract.terminationReason && (
                <p className="text-sm text-slate-700">{contract.terminationReason}</p>
              )}
              <p className="text-sm leading-relaxed text-slate-600">
                Hợp đồng không còn hiệu lực để tiếp tục ký hoặc thanh toán. Vui lòng chọn
                bác sĩ và gói chăm sóc mới nếu bạn muốn đăng ký lại.
              </p>
              <Link
                href="/doctors"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>Chọn bác sĩ &amp; gói chăm sóc</span>
              </Link>
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mã hợp đồng
              </span>
              <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span
                  data-testid="booking-tracking-contract-code"
                  className="min-w-0 break-all text-sm font-bold text-slate-900"
                >
                  {contractCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  data-testid="booking-tracking-copy-contract-code"
                  aria-label="Sao chép mã hợp đồng"
                  className="inline-flex min-h-9 shrink-0 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {copied ? 'Đã chép ✓' : 'Sao chép'}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Khởi tạo:{' '}
                <span data-testid="booking-tracking-created-at" className="font-semibold text-slate-700">
                  {createdAt ?? 'Đang cập nhật'}
                </span>
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-xs">
              <div>
                <dt className="text-slate-500">Gói chăm sóc</dt>
                <dd className="text-sm font-semibold text-slate-900">{packageName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Giá trị gói</dt>
                <dd className="text-sm font-semibold tabular-nums text-primary">
                  {packagePrice ?? 'Đang cập nhật'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Số thành viên</dt>
                <dd className="text-sm font-semibold tabular-nums text-slate-900">
                  {contract.memberCount ?? 'Đang cập nhật'}
                </dd>
              </div>
            </dl>
          </section>

          {isPostFamilySigning ? (
            <section
              data-testid="booking-post-signing-next-step"
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h2 className="text-sm font-bold text-slate-900">
                Bước tiếp theo
              </h2>
              <ol className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2.5 text-emerald-800">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-emerald-600"
                  >
                    check_circle
                  </span>
                  <span className="font-semibold">Gia đình ký hợp đồng</span>
                </li>
                <li className="flex items-start gap-2.5 text-amber-900">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-amber-600"
                  >
                    pending
                  </span>
                  <span className="font-semibold">
                    3 bên còn lại ký song song
                  </span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-500">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-slate-400"
                  >
                    radio_button_unchecked
                  </span>
                  <span>Thanh toán VietQR &amp; kích hoạt gói</span>
                </li>
              </ol>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  data-testid="booking-view-signed-pdf-locked"
                  className="inline-flex min-h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[16px]"
                  >
                    lock
                  </span>
                  <span>Bản PDF đã ký 4 bên (chờ đủ 4/4)</span>
                </button>
                <p className="text-xs leading-relaxed text-slate-500">
                  Tự động mở khóa sau khi đủ 4/4 chữ ký điện tử.
                </p>
              </div>

              <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-slate-500"
                >
                  info
                </span>
                <span>
                  Bạn có thể đóng trang này. FamiDoc sẽ gửi email ngay khi đủ 4/4 chữ ký.
                </span>
              </p>
            </section>
          ) : (
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Tiến trình 4 bên</h2>
                <span
                  data-testid="booking-tracking-signed-count"
                  className="text-xs font-semibold tabular-nums text-slate-500"
                >
                  Đã ký {state.signedCount}/4
                </span>
              </div>
              <ul className="space-y-2.5">
                {parties.map((party) => (
                  <PartyProgressCard
                    key={party.role}
                    party={party}
                    signed={state.signedRoles.has(party.role)}
                    canSign={state.signedRoles.has('FAMILY_REP')}
                    signedAt={signedAtByRole.get(party.role) ?? null}
                  />
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
