'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LandingHeader } from '@/features/landing/components/landing-header';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import {
  BookingNavigationProvider,
  useBookingNavigation,
} from './booking-navigation-context';

export interface BookingStepDefinition {
  index: number;
  label: string;
  shortLabel: string;
  href: string;
}

export const BOOKING_STEPS: BookingStepDefinition[] = [
  {
    index: 1,
    label: 'Xác nhận gói',
    shortLabel: 'Xác nhận gói',
    href: '/booking',
  },
  {
    index: 2,
    label: 'Ký hợp đồng 4 bên',
    shortLabel: 'Ký hợp đồng 4 bên',
    href: '/booking/tracking',
  },
  {
    index: 3,
    label: 'Thanh toán VietQR',
    shortLabel: 'Thanh toán VietQR',
    href: '/booking/payment',
  },
];

/**
 * Xác định bước hiện tại (0-based) từ pathname của luồng đặt gói.
 */
export function resolveBookingStepIndex(pathname: string | null | undefined): number {
  const normalized = (pathname ?? '').split('?')[0].replace(/\/+$/, '') || '/booking';
  if (normalized === '/booking/payment' || normalized.startsWith('/booking/payment/')) {
    return 2;
  }
  if (normalized === '/booking/tracking' || normalized.startsWith('/booking/tracking/')) {
    return 1;
  }
  return 0;
}

function withContractId(path: string, contractId?: string): string {
  if (!contractId) return path;
  return `${path}?contractId=${encodeURIComponent(contractId)}`;
}

/**
 * Khung luồng đặt gói dùng chung header/footer công khai và khung `max-w-7xl`,
 * tách thanh tiến trình thành dải riêng có điều hướng lùi theo ngữ cảnh.
 */
export function BookingOnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <BookingNavigationProvider>
      <BookingOnboardingFrame>{children}</BookingOnboardingFrame>
    </BookingNavigationProvider>
  );
}

function BookingOnboardingFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStepIndex = resolveBookingStepIndex(pathname);
  const { state } = useBookingNavigation();
  const { doctorId, contractId, contractStatus } = state;
  const isContractActive = contractStatus === 'ACTIVE';

  const stepTwoHref = withContractId('/booking/tracking', contractId);
  const stepOneHref = withContractId('/booking', contractId);

  /** Đích quay lại của nút `Quay lại` theo bước hiện tại (null = bị khóa). */
  const backTarget: { href: string; label: string } | null = (() => {
    if (currentStepIndex === 0) {
      return {
        href: doctorId ? `/doctors/${encodeURIComponent(doctorId)}` : '/doctors',
        label: doctorId ? 'Quay lại hồ sơ bác sĩ' : 'Quay lại danh mục bác sĩ',
      };
    }
    if (currentStepIndex === 1) {
      return isContractActive
        ? null
        : { href: stepOneHref, label: 'Quay lại bước xác nhận gói' };
    }
    return { href: stepTwoHref, label: 'Quay lại theo dõi ký hợp đồng' };
  })();

  const resolveStepHref = (index: number): string | null => {
    if (index >= currentStepIndex) return null;
    if (index === 0) return isContractActive ? null : stepOneHref;
    if (index === 1) return stepTwoHref;
    return null;
  };

  const currentStep = BOOKING_STEPS[currentStepIndex];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <LandingHeader hideMobileBottomNav />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Chỉ màn hình hẹp (< md): desktop đã có stepper 1 hàng bấm lùi trực tiếp. */}
          <div
            data-testid="booking-compact-back-row"
            className="flex items-center justify-between gap-3 md:hidden"
          >
            {backTarget ? (
              <Link
                href={backTarget.href}
                aria-label={backTarget.label}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Quay lại</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                aria-label="Hợp đồng đã kích hoạt, không thể quay lại bước trước"
                className="inline-flex min-h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-400 opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Quay lại</span>
              </button>
            )}

            {/* Bản gọn cho màn hình nhỏ: chỉ báo Bước N/3 kèm tên bước hiện tại */}
            <span
              data-testid="booking-step-compact"
              aria-live="polite"
              className="text-xs font-semibold text-slate-700 md:hidden"
            >
              Bước {currentStep.index}/3: {currentStep.shortLabel}
            </span>
          </div>

          <nav aria-label="Tiến trình đặt gói" className="hidden md:block">
            <ol className="grid grid-cols-3 gap-2">
              {BOOKING_STEPS.map((step, index) => {
                const isCurrent = index === currentStepIndex;
                const isDone = index < currentStepIndex;
                const href = resolveStepHref(index);
                const stateLabel = isDone ? 'done' : isCurrent ? 'current' : 'pending';
                const content = (
                  <>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isDone ? '✓' : step.index}
                    </span>
                    <span className="truncate">
                      <span className="hidden sm:inline">{step.index}. </span>
                      {step.label}
                    </span>
                  </>
                );
                const itemClass = `flex items-center gap-2 px-2.5 py-2 text-xs ${
                  isCurrent
                    ? 'font-semibold text-primary'
                    : isDone
                      ? 'font-medium text-slate-600'
                      : 'text-slate-500'
                }`;

                return (
                  <li
                    key={step.href}
                    data-testid={`booking-step-${step.index}`}
                    data-step-state={stateLabel}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={itemClass}
                  >
                    {href ? (
                      <Link
                        href={href}
                        aria-label={`Quay lại bước ${step.index}: ${step.label}`}
                        className={`${itemClass} w-full rounded-lg transition-colors hover:bg-slate-100`}
                      >
                        {content}
                      </Link>
                    ) : (
                      <span
                        aria-disabled={!isCurrent && !isDone ? true : undefined}
                        className="flex w-full items-center gap-2"
                      >
                        {content}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      <main className="w-full flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
