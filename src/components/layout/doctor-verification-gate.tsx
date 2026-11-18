'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { doctorsApi, type DoctorProfileDto } from '@/lib/api/doctors.api';

export const DOCTOR_GATE_REFRESH_EVENT = 'famidoc:doctor-gate-refresh';

export function isDoctorRole(role: string | null | undefined): boolean {
  return role === 'DOCTOR';
}

function normalizePath(pathname: string | null | undefined): string {
  return (pathname ?? '').split('?')[0].replace(/\/+$/, '') || '/';
}

/**
 * Các tuyến `/doctor`, `/doctor/contracts*`, `/doctor/timetable*`, `/doctor/encounters*`,
 * `/doctor/telemedicine*` bị khóa khi bác sĩ chưa hoàn tất thẩm định 2 cấp (`ACTIVE`).
 * Cho phép `/doctor/verification*`, `/doctor/credentials*`, `/doctor/profile*`, `/doctor/login`.
 */
export function isRestrictedDoctorPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = normalizePath(pathname);
  if (
    normalized === '/doctor/verification' ||
    normalized.startsWith('/doctor/verification/') ||
    normalized === '/doctor/credentials' ||
    normalized.startsWith('/doctor/credentials/') ||
    normalized === '/doctor/profile' ||
    normalized.startsWith('/doctor/profile/') ||
    normalized === '/doctor/login'
  ) {
    return false;
  }
  return normalized === '/doctor' || normalized.startsWith('/doctor/');
}

export function isDoctorProfileActive(profile: DoctorProfileDto | null): boolean {
  if (!profile) return false;
  return profile.onboardingStatus === 'ACTIVE';
}

export interface DoctorVerificationGateContextValue {
  hasProvider: boolean;
  doctorProfile: DoctorProfileDto | null;
  isLoadingDoctorGate: boolean;
  isRefreshingDoctorGate: boolean;
  doctorGateError: string | null;
  isDoctorVerified: boolean;
  isDoctorLocked: boolean;
  refreshDoctorGate: (options?: { silent?: boolean }) => Promise<void>;
}

const DEFAULT_DOCTOR_GATE_CONTEXT: DoctorVerificationGateContextValue = {
  hasProvider: false,
  doctorProfile: null,
  isLoadingDoctorGate: false,
  isRefreshingDoctorGate: false,
  doctorGateError: null,
  isDoctorVerified: false,
  isDoctorLocked: false,
  refreshDoctorGate: async () => {},
};

const DoctorVerificationGateContext = createContext<DoctorVerificationGateContextValue>(
  DEFAULT_DOCTOR_GATE_CONTEXT,
);

export function useDoctorVerificationGate() {
  return useContext(DoctorVerificationGateContext);
}

function useDoctorVerificationGateInternal(
  enabled: boolean,
): DoctorVerificationGateContextValue {
  const { role, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isDoctor = isAuthenticated && isDoctorRole(role);

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileDto | null>(null);
  const [isLoadingDoctorGate, setIsLoadingDoctorGate] = useState<boolean>(false);
  const [isRefreshingDoctorGate, setIsRefreshingDoctorGate] = useState<boolean>(false);
  const [doctorGateError, setDoctorGateError] = useState<string | null>(null);

  const refreshDoctorGate = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled || !isDoctor) {
        setDoctorProfile(null);
        setDoctorGateError(null);
        setIsLoadingDoctorGate(false);
        setIsRefreshingDoctorGate(false);
        return;
      }

      const silent = options?.silent ?? false;
      if (silent) {
        setIsRefreshingDoctorGate(true);
      } else {
        setIsLoadingDoctorGate(true);
      }
      setDoctorGateError(null);
      try {
        const profile = await doctorsApi.getDoctorMe();
        setDoctorProfile(profile);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể kiểm tra trạng thái thẩm định hồ sơ bác sĩ.';
        setDoctorGateError(message);
      } finally {
        if (silent) {
          setIsRefreshingDoctorGate(false);
        } else {
          setIsLoadingDoctorGate(false);
        }
      }
    },
    [enabled, isDoctor],
  );

  useEffect(() => {
    if (!enabled || authLoading) return;
    if (!isDoctor) {
      setDoctorProfile(null);
      setDoctorGateError(null);
      setIsLoadingDoctorGate(false);
      setIsRefreshingDoctorGate(false);
      return;
    }

    let active = true;
    setIsLoadingDoctorGate(true);
    doctorsApi
      .getDoctorMe()
      .then((profile) => {
        if (!active) return;
        setDoctorProfile(profile);
        setDoctorGateError(null);
      })
      .catch((error) => {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể kiểm tra trạng thái thẩm định hồ sơ bác sĩ.';
        setDoctorGateError(message);
      })
      .finally(() => {
        if (active) {
          setIsLoadingDoctorGate(false);
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, authLoading, isDoctor, user?.id]);

  useEffect(() => {
    if (!enabled || !isDoctor || typeof window === 'undefined') return;
    const handleRefresh = () => {
      void refreshDoctorGate({ silent: true });
    };
    window.addEventListener(DOCTOR_GATE_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(DOCTOR_GATE_REFRESH_EVENT, handleRefresh);
    };
  }, [enabled, isDoctor, refreshDoctorGate]);

  const effectiveProfile = enabled && isDoctor ? doctorProfile : null;
  const isDoctorVerified = enabled && isDoctor && isDoctorProfileActive(effectiveProfile);
  const isDoctorLocked =
    enabled &&
    isDoctor &&
    !authLoading &&
    !isLoadingDoctorGate &&
    effectiveProfile !== null &&
    !isDoctorVerified;

  return {
    hasProvider: enabled,
    doctorProfile: effectiveProfile,
    isLoadingDoctorGate: enabled && isDoctor ? authLoading || isLoadingDoctorGate : false,
    isRefreshingDoctorGate: enabled && isDoctor ? isRefreshingDoctorGate : false,
    doctorGateError: enabled && isDoctor ? doctorGateError : null,
    isDoctorVerified,
    isDoctorLocked,
    refreshDoctorGate,
  };
}

export function useDoctorVerificationGateState(): DoctorVerificationGateContextValue {
  const ctx = useDoctorVerificationGate();
  const local = useDoctorVerificationGateInternal(!ctx.hasProvider);
  return ctx.hasProvider ? ctx : local;
}

export function DoctorVerificationGateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useDoctorVerificationGateInternal(true);
  return (
    <DoctorVerificationGateContext.Provider value={value}>
      {children}
    </DoctorVerificationGateContext.Provider>
  );
}

export function DoctorVerificationGateGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    doctorProfile,
    isLoadingDoctorGate,
    isRefreshingDoctorGate,
    doctorGateError,
    isDoctorVerified,
    refreshDoctorGate,
  } = useDoctorVerificationGateState();

  const isDoctor = isAuthenticated && isDoctorRole(role);
  const isRestricted = isDoctor && isRestrictedDoctorPath(pathname);

  const currentPath = pathname ?? null;
  const [settledPathname, setSettledPathname] = useState<string | null>(currentPath);
  const isPathnameChanging = settledPathname !== currentPath;
  const willRefreshOnPathnameChange =
    isPathnameChanging && isDoctor && !authLoading && !isDoctorVerified;

  const shouldBlock =
    isRestricted &&
    !authLoading &&
    !isLoadingDoctorGate &&
    !isRefreshingDoctorGate &&
    !willRefreshOnPathnameChange &&
    doctorProfile !== null &&
    !isDoctorVerified;

  useEffect(() => {
    if (settledPathname === currentPath) return;
    if (isDoctor && !authLoading && !isDoctorVerified) {
      let active = true;
      void refreshDoctorGate({ silent: true }).finally(() => {
        if (active) {
          setSettledPathname(currentPath);
        }
      });
      return () => {
        active = false;
      };
    }
    return undefined;
  }, [
    settledPathname,
    currentPath,
    isDoctor,
    authLoading,
    isDoctorVerified,
    refreshDoctorGate,
  ]);

  useEffect(() => {
    if (shouldBlock) {
      router.replace('/doctor/verification');
    }
  }, [shouldBlock, router]);

  if (!isRestricted) {
    return <>{children}</>;
  }

  if (
    authLoading ||
    isLoadingDoctorGate ||
    (doctorProfile === null && !doctorGateError) ||
    ((isRefreshingDoctorGate || willRefreshOnPathnameChange) && !isDoctorVerified)
  ) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center p-6"
        data-testid="doctor-gate-loading"
      >
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            Đang kiểm tra trạng thái thẩm định CCHN
          </h2>
          <p className="text-sm text-slate-600">
            Hệ thống đang xác minh tiến trình phê duyệt 2 cấp của Bác sĩ...
          </p>
        </div>
      </div>
    );
  }

  if (doctorGateError && doctorProfile === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">error_outline</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Không thể xác minh trạng thái hồ sơ Bác sĩ
            </h2>
            <p className="text-sm text-slate-600">{doctorGateError}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => void refreshDoctorGate()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Thử kiểm tra lại
            </button>
            <Link
              href="/doctor/verification"
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Đến trang Xác thực CCHN
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (shouldBlock) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center p-6"
        data-testid="doctor-gate-blocked"
      >
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">
              Tài khoản Bác sĩ đang chờ hoàn tất thẩm định 2 cấp
            </h2>
            <p className="text-sm text-slate-600">
              {doctorProfile?.rejectionReason
                ? `Hồ sơ cần bổ sung: "${doctorProfile.rejectionReason}". Đang chuyển bạn đến trang Xác thực CCHN để cập nhật lại.`
                : doctorProfile?.onboardingStatus === 'FACILITY_VERIFIED'
                  ? 'Cơ sở y tế đã duyệt Cấp 1. Hồ sơ đang chờ Quản trị viên FamiDoc hậu kiểm Cấp 2 để kích hoạt quyền khám bệnh.'
                  : doctorProfile?.onboardingStatus === 'PENDING_FACILITY_REVIEW'
                    ? 'Hồ sơ 3 chứng chỉ đã nộp và đang chờ Cơ sở y tế thẩm định Cấp 1.'
                    : 'Vui lòng tải lên đủ 3 chứng chỉ bắt buộc (CCHN, Bằng chuyên môn, Chứng chỉ Y học gia đình) để mở khóa cổng lâm sàng.'}
            </p>
          </div>
          <Link
            href="/doctor/verification"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Nộp / Theo dõi Hồ sơ CCHN
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
