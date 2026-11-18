'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LandingHeader } from '@/features/landing/components/landing-header';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import {
  getLandingFamilyGateStatusLabel,
  resolveLandingFamilyGateState,
  useLandingFamilyGate,
} from '@/features/landing/hooks/use-landing-family-gate';
import { useAuth, getDefaultPathForRole } from '@/features/auth/context/auth-context';
import type { FamilyGateStatusDto } from '@/lib/api/contracts.api';

export interface ActivationStep {
  index: number;
  title: string;
  description: string;
  state: 'done' | 'current' | 'upcoming';
}

/**
 * Lộ trình kích hoạt 3 bước theo trạng thái cổng hợp đồng gia đình.
 * `currentStepIndex` là bước đang thực hiện (0-based).
 */
export function resolveActivationSteps(): { index: number; title: string; description: string }[] {
  return [
    {
      index: 0,
      title: 'Chọn Bác sĩ & Gói',
      description: 'Xem bảng giá, chọn gói phù hợp và bác sĩ gia đình phụ trách.',
    },
    {
      index: 1,
      title: 'Ký Hợp đồng 4 bên',
      description: 'Đại diện gia đình, cơ sở y tế, bác sĩ và nền tảng ký số trên Documenso.',
    },
    {
      index: 2,
      title: 'Thanh toán VietQR',
      description: 'Quét mã VietQR để kích hoạt gói và mở khóa không gian chăm sóc gia đình.',
    },
  ];
}

/**
 * Xác định bước đang thực hiện theo trạng thái cổng hợp đồng.
 */
export function resolveCurrentActivationStep(
  state: 'inactive' | 'pending_signature' | 'pending_payment' | 'active' | 'loading' | 'error'
): number {
  switch (state) {
    case 'pending_signature':
      return 1;
    case 'pending_payment':
      return 2;
    case 'active':
      return 3;
    default:
      return 0;
  }
}

function stepVisualState(stepIndex: number, currentStepIndex: number): ActivationStep['state'] {
  if (stepIndex < currentStepIndex) return 'done';
  if (stepIndex === currentStepIndex) return 'current';
  return 'upcoming';
}

export function formatGateValue(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : 'Chưa cập nhật';
}

const PREPARATION_ITEMS: {
  key: 'representativeName' | 'emergencyPhone' | 'homeAddress';
  label: string;
  icon: string;
}[] = [
  { key: 'representativeName', label: 'Đại diện/Chủ hộ', icon: 'person' },
  { key: 'emergencyPhone', label: 'Điện thoại liên hệ khẩn cấp', icon: 'emergency' },
  { key: 'homeAddress', label: 'Địa chỉ khám tại nhà', icon: 'home_pin' },
];

const UNLOCKED_FEATURES = [
  {
    icon: 'monitor_heart',
    title: 'Bảng Sức khỏe Gia đình',
    description: 'Theo dõi chỉ số sinh hiệu hằng ngày và cảnh báo sức khỏe của từng thành viên.',
  },
  {
    icon: 'event_available',
    title: 'Đặt lịch Home Visit & Telehealth',
    description: 'Chủ động hẹn bác sĩ khám tại nhà hoặc tư vấn video 24/7.',
  },
  {
    icon: 'group',
    title: 'Quản lý thành viên & hồ sơ EHR',
    description: 'Lưu trữ bệnh án điện tử và quản lý BHYT cho cả hộ gia đình.',
  },
  {
    icon: 'receipt_long',
    title: 'Hóa đơn & biên lai VietQR',
    description: 'Tra cứu giao dịch, gia hạn gói và tải biên lai điện tử.',
  },
];

export interface PreActivationFamilyHubProps {
  /** Trạng thái cổng hợp đồng do nơi gọi cung cấp (mặc định tự lấy qua hook). */
  gateStatus?: FamilyGateStatusDto | null;
  /** Cho phép test bỏ qua điều hướng tự động. */
  disableRedirect?: boolean;
}

export function PreActivationFamilyHub({
  gateStatus: providedGateStatus,
  disableRedirect = false,
}: PreActivationFamilyHubProps = {}) {
  const router = useRouter();
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const familyGate = useLandingFamilyGate({ enabled: providedGateStatus === undefined });

  const gateStatus = providedGateStatus !== undefined ? providedGateStatus : familyGate.gateStatus;
  const effectiveHasActiveContract = Boolean(gateStatus?.hasActiveContract);
  const isFamily = familyGate.isFamily;
  const pendingContract = gateStatus?.pendingContract ?? null;

  // Điều hướng theo tính hợp lệ của người xem trang `/onboarding`.
  useEffect(() => {
    if (disableRedirect || authLoading) return;

    if (!isAuthenticated) {
      router.replace('/login?redirect=/onboarding');
      return;
    }

    if (!isFamily) {
      router.replace(getDefaultPathForRole(role));
      return;
    }

    if (effectiveHasActiveContract) {
      router.replace('/family');
    }
  }, [
    authLoading,
    disableRedirect,
    effectiveHasActiveContract,
    isAuthenticated,
    isFamily,
    role,
    router,
  ]);

  /**
   * Trạng thái hiển thị: ưu tiên payload do nơi gọi truyền vào (SSR/test),
   * ngược lại dùng kết quả hook (tải/lỗi đều fallback an toàn về chưa kích hoạt).
   */
  const state =
    providedGateStatus !== undefined
      ? resolveLandingFamilyGateState(providedGateStatus, { isLoading: false, hasError: false })
      : familyGate.state;
  const statusLabel =
    providedGateStatus !== undefined
      ? getLandingFamilyGateStatusLabel(state)
      : familyGate.statusLabel;
  const currentStepIndex = resolveCurrentActivationStep(state);
  const steps = resolveActivationSteps();

  const contractQuery = pendingContract?.id
    ? `?contractId=${encodeURIComponent(pendingContract.id)}`
    : '';

  const nextAction = (() => {
    if (state === 'pending_payment') {
      return {
        href: `/booking/payment${contractQuery}`,
        label: 'Thanh toán kích hoạt gói',
        icon: 'qr_code_2',
        hint: 'Hợp đồng đã đủ 4 chữ ký và đang chờ thanh toán VietQR để kích hoạt.',
      };
    }
    if (state === 'pending_signature') {
      return {
        href: `/booking/tracking${contractQuery}`,
        label: 'Tiếp tục ký hợp đồng',
        icon: 'draw',
        hint: 'Hợp đồng 4 bên đang chờ chữ ký. Theo dõi tiến trình để hoàn tất.',
      };
    }
    if (state === 'active') {
      return {
        href: '/family',
        label: 'Vào Bảng Sức khỏe Gia đình',
        icon: 'family_restroom',
        hint: 'Gói chăm sóc của bạn đã được kích hoạt.',
      };
    }
    return {
      href: '/doctors',
      label: 'Chọn bác sĩ & gói chăm sóc',
      icon: 'stethoscope',
      hint: 'Bắt đầu bằng việc chọn bác sĩ gia đình và gói chăm sóc phù hợp.',
    };
  })();

  const representiveName = formatGateValue(gateStatus?.familyUnit?.representativeName);
  const familyUnitValues: Record<'representativeName' | 'emergencyPhone' | 'homeAddress', string> = {
    representativeName: representiveName,
    emergencyPhone: formatGateValue(gateStatus?.familyUnit?.emergencyPhone),
    homeAddress: formatGateValue(gateStatus?.familyUnit?.homeAddress),
  };
  const hasIncompleteProfile = PREPARATION_ITEMS.some(
    ({ key }) => familyUnitValues[key] === 'Chưa cập nhật'
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      <LandingHeader />

      <main className="flex-1 pb-16">
        {/* Hero */}
        <section className="relative bg-[#0046c0] text-white overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-[#0046c0] via-[#0046c0] to-[#003899]" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">home_health</span>
              <span>Không gian chuẩn bị gia đình</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Chào bạn, hãy hoàn tất 3 bước để mở khóa chăm sóc sức khỏe gia đình
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              Đại diện hộ gia đình cần chọn bác sĩ, ký hợp đồng 4 bên và thanh toán VietQR. Sau khi
              hợp đồng ACTIVE, toàn bộ không gian theo dõi sức khỏe sẽ được mở khóa.
            </p>
            {isFamily && state !== 'loading' && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Trạng thái hiện tại: {statusLabel}</span>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-20 space-y-6">
          {/* Lộ trình 3 bước */}
          <section
            aria-label="Lộ trình kích hoạt 3 bước"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7"
          >
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              Lộ trình kích hoạt gói chăm sóc
            </h2>
            <ol className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map((step) => {
                const visual = stepVisualState(step.index, currentStepIndex);
                return (
                  <li
                    key={step.index}
                    data-step-state={visual}
                    className={`rounded-xl border p-4 space-y-1.5 ${
                      visual === 'current'
                        ? 'border-[#0046c0] bg-blue-50/60 ring-1 ring-[#0046c0]/30'
                        : visual === 'done'
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          visual === 'current'
                            ? 'bg-[#0046c0] text-white'
                            : visual === 'done'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {visual === 'done' ? (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        ) : (
                          step.index + 1
                        )}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{step.title}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Thẻ hành động tiếp theo */}
            <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0046c0] text-[22px]">
                  flag_circle
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Bước tiếp theo của bạn
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{nextAction.hint}</p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link
                  href={nextAction.href}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0046c0] hover:bg-[#003899] px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">{nextAction.icon}</span>
                  <span>{nextAction.label}</span>
                </Link>
                <Link
                  href="/doctors/matching"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>Ghép nối bác sĩ phù hợp</span>
                </Link>
                <Link
                  href="/packages"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  <span>Xem bảng giá gói</span>
                </Link>
              </div>

              {pendingContract?.id && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] sm:text-xs text-amber-900">
                  Hợp đồng <strong>{pendingContract.contractNumber}</strong> ·{' '}
                  {pendingContract.contractStatus === 'PENDING_PAYMENT'
                    ? 'chờ thanh toán'
                    : 'đang chờ ký 4 bên'}
                  {typeof pendingContract.memberCount === 'number'
                    ? ` · ${pendingContract.memberCount} thành viên`
                    : ''}
                </div>
              )}

              {state === 'error' && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] sm:text-xs text-slate-600">
                  Chưa thể xác minh trạng thái hợp đồng. Bạn vẫn có thể bắt đầu chọn bác sĩ và gói
                  chăm sóc; hệ thống sẽ cập nhật lại khi kết nối thành công.
                </p>
              )}
            </section>

            {/* Hồ sơ chuẩn bị trước */}
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0046c0] text-[22px]">
                    assignment_ind
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                    Hồ sơ chuẩn bị trước
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500">
                  {gateStatus?.patientCount ?? 0} thành viên
                </span>
              </div>

              <dl className="space-y-2.5">
                {PREPARATION_ITEMS.map(({ key, label, icon }) => {
                  const value = familyUnitValues[key];
                  const isMissing = value === 'Chưa cập nhật';
                  return (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                    >
                      <dt className="flex items-start gap-2 text-[11px] sm:text-xs font-medium text-slate-600">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 mt-0.5">
                          {icon}
                        </span>
                        <span>{label}</span>
                      </dt>
                      <dd
                        className={`text-[11px] sm:text-xs text-right max-w-[55%] ${
                          isMissing ? 'text-amber-700 font-semibold' : 'text-slate-900 font-semibold'
                        }`}
                      >
                        {value}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                {hasIncompleteProfile
                  ? 'Một số thông tin hồ sơ chưa cập nhật. Bổ sung trước khi ký hợp đồng để tránh gián đoạn khám tại nhà.'
                  : 'Hồ sơ đã sẵn sàng. Bạn có thể cập nhật BHYT và thông tin liên hệ bất kỳ lúc nào.'}
              </p>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#0046c0]/30 bg-blue-50 px-3 py-2 text-[11px] sm:text-xs font-semibold text-[#0046c0] hover:bg-blue-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  <span>Cập nhật hồ sơ &amp; BHYT</span>
                </Link>
                <Link
                  href="/notifications"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] sm:text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">notifications</span>
                  <span>Trung tâm thông báo</span>
                </Link>
              </div>
            </section>
          </div>

          {/* Tính năng mở khóa sau khi kích hoạt */}
          <section
            aria-label="Tính năng mở khóa sau khi kích hoạt"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0046c0] text-[22px]">lock_open</span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                Sẽ được mở khóa sau khi hợp đồng ACTIVE
              </h2>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {UNLOCKED_FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                >
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#0046c0] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{feature.icon}</span>
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900">{feature.title}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
