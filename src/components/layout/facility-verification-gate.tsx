'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';

export const FACILITY_GATE_REFRESH_EVENT = 'famidoc:facility-gate-refresh';

export function isFacilityRole(role: string | null | undefined): boolean {
  return role === 'FACILITY' || role === 'HEALTHCARE_FACILITY';
}

function normalizePath(pathname: string | null | undefined): string {
  return (pathname ?? '').split('?')[0].replace(/\/+$/, '') || '/';
}

/**
 * Giai đoạn 1: Toàn bộ phân hệ `/facility` và `/facility/*` (ngoại trừ `/facility/legal-profile` và `/facility/login`)
 * bị khóa khi cơ sở y tế chưa được Admin duyệt pháp lý (`ACTIVE`).
 */
export function isRestrictedFacilityPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = normalizePath(pathname);
  if (normalized === '/facility/legal-profile' || normalized.startsWith('/facility/legal-profile/')) {
    return false;
  }
  if (normalized === '/facility/login') {
    return false;
  }
  return normalized === '/facility' || normalized.startsWith('/facility/');
}

/**
 * Giai đoạn 2 (theo sơ đồ Step 8): Khi CSYT đã duyệt pháp lý (`ACTIVE`) nhưng chưa có Hợp đồng B2B `ACTIVE`,
 * chỉ cho phép `/facility`, `/facility/legal-profile`, `/facility/contracts*`; khóa các phân hệ vận hành
 * (`/facility/doctors*`, `/facility/staff*`, `/facility/coordination*`, `/facility/revenue*`).
 * Nếu CSYT từng có HĐ B2B (`hasHistoricalStaffingContract = true`), vẫn mở `/facility/coordination*` và `/facility/revenue*`
 * để bàn giao và tất toán tài chính.
 */
export function isFacilityB2bOperationalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = normalizePath(pathname);
  return (
    normalized === '/facility/doctors' ||
    normalized.startsWith('/facility/doctors/') ||
    normalized === '/facility/staff' ||
    normalized.startsWith('/facility/staff/') ||
    normalized === '/facility/coordination' ||
    normalized.startsWith('/facility/coordination/') ||
    normalized === '/facility/revenue' ||
    normalized.startsWith('/facility/revenue/')
  );
}

export function isFacilityProfileActive(profile: AdminFacilityItem | null): boolean {
  if (!profile) return false;
  return profile.verificationStatus === 'ACTIVE' || profile.status === 'ACTIVE';
}

export function isFacilityB2bActive(profile: AdminFacilityItem | null): boolean {
  if (!profile || !isFacilityProfileActive(profile)) return false;
  return Boolean(profile.hasActiveStaffingContract);
}

export function getFacilityPathLockInfo(
  pathname: string | null | undefined,
  profile: AdminFacilityItem | null,
): { locked: boolean; stage: 'LEGAL' | 'B2B' | null; redirectTo: string } {
  if (!profile) {
    return { locked: false, stage: null, redirectTo: '/facility/legal-profile' };
  }

  if (!isFacilityProfileActive(profile)) {
    const locked = isRestrictedFacilityPath(pathname);
    return {
      locked,
      stage: locked ? 'LEGAL' : null,
      redirectTo: '/facility/legal-profile',
    };
  }

  if (profile.hasActiveStaffingContract) {
    return { locked: false, stage: null, redirectTo: '/facility' };
  }

  const normalized = normalizePath(pathname);
  const isPostTerminationAllowed =
    Boolean(profile.hasHistoricalStaffingContract) &&
    (normalized === '/facility/coordination' ||
      normalized.startsWith('/facility/coordination/') ||
      normalized === '/facility/revenue' ||
      normalized.startsWith('/facility/revenue/'));

  if (isPostTerminationAllowed) {
    return { locked: false, stage: null, redirectTo: '/facility' };
  }

  if (isFacilityB2bOperationalPath(pathname)) {
    return {
      locked: true,
      stage: 'B2B',
      redirectTo: '/facility/contracts',
    };
  }

  return { locked: false, stage: null, redirectTo: '/facility' };
}

export interface FacilityVerificationGateContextValue {
  hasProvider: boolean;
  facilityProfile: AdminFacilityItem | null;
  isLoadingFacilityGate: boolean;
  isRefreshingFacilityGate: boolean;
  facilityGateError: string | null;
  isFacilityVerified: boolean;
  isFacilityB2bReady: boolean;
  isFacilityLocked: boolean;
  isFacilityB2bLocked: boolean;
  refreshFacilityGate: (options?: { silent?: boolean }) => Promise<void>;
}

const DEFAULT_FACILITY_GATE_CONTEXT: FacilityVerificationGateContextValue = {
  hasProvider: false,
  facilityProfile: null,
  isLoadingFacilityGate: false,
  isRefreshingFacilityGate: false,
  facilityGateError: null,
  isFacilityVerified: false,
  isFacilityB2bReady: false,
  isFacilityLocked: false,
  isFacilityB2bLocked: false,
  refreshFacilityGate: async () => {},
};

const FacilityVerificationGateContext = createContext<FacilityVerificationGateContextValue>(
  DEFAULT_FACILITY_GATE_CONTEXT,
);

export function useFacilityVerificationGate() {
  return useContext(FacilityVerificationGateContext);
}

function useFacilityVerificationGateInternal(
  enabled: boolean,
): FacilityVerificationGateContextValue {
  const { role, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isFacility = isAuthenticated && isFacilityRole(role);

  const [facilityProfile, setFacilityProfile] = useState<AdminFacilityItem | null>(null);
  const [isLoadingFacilityGate, setIsLoadingFacilityGate] = useState<boolean>(false);
  const [isRefreshingFacilityGate, setIsRefreshingFacilityGate] = useState<boolean>(false);
  const [facilityGateError, setFacilityGateError] = useState<string | null>(null);

  const refreshFacilityGate = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled || !isFacility) {
        setFacilityProfile(null);
        setFacilityGateError(null);
        setIsLoadingFacilityGate(false);
        setIsRefreshingFacilityGate(false);
        return;
      }

      const silent = options?.silent ?? false;
      if (silent) {
        setIsRefreshingFacilityGate(true);
      } else {
        setIsLoadingFacilityGate(true);
      }
      setFacilityGateError(null);
      try {
        const profile = await facilitiesApi.getMyFacilityProfile();
        setFacilityProfile(profile);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể kiểm tra trạng thái xác thực cơ sở y tế.';
        setFacilityGateError(message);
      } finally {
        if (silent) {
          setIsRefreshingFacilityGate(false);
        } else {
          setIsLoadingFacilityGate(false);
        }
      }
    },
    [enabled, isFacility],
  );

  useEffect(() => {
    if (!enabled || authLoading) return;
    if (!isFacility) {
      setFacilityProfile(null);
      setFacilityGateError(null);
      setIsLoadingFacilityGate(false);
      setIsRefreshingFacilityGate(false);
      return;
    }

    let active = true;
    setIsLoadingFacilityGate(true);
    facilitiesApi
      .getMyFacilityProfile()
      .then((profile) => {
        if (!active) return;
        setFacilityProfile(profile);
        setFacilityGateError(null);
      })
      .catch((error) => {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể kiểm tra trạng thái xác thực cơ sở y tế.';
        setFacilityGateError(message);
      })
      .finally(() => {
        if (active) {
          setIsLoadingFacilityGate(false);
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, authLoading, isFacility, user?.id]);

  useEffect(() => {
    if (!enabled || !isFacility || typeof window === 'undefined') return;
    const handleRefresh = () => {
      void refreshFacilityGate({ silent: true });
    };
    window.addEventListener(FACILITY_GATE_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(FACILITY_GATE_REFRESH_EVENT, handleRefresh);
    };
  }, [enabled, isFacility, refreshFacilityGate]);

  const effectiveProfile = enabled && isFacility ? facilityProfile : null;
  const isFacilityVerified =
    enabled && isFacility && isFacilityProfileActive(effectiveProfile);
  const isFacilityB2bReady =
    enabled && isFacility && isFacilityB2bActive(effectiveProfile);
  const isFacilityLocked =
    enabled &&
    isFacility &&
    !authLoading &&
    !isLoadingFacilityGate &&
    effectiveProfile !== null &&
    !isFacilityVerified;
  const isFacilityB2bLocked =
    enabled &&
    isFacility &&
    !authLoading &&
    !isLoadingFacilityGate &&
    effectiveProfile !== null &&
    isFacilityVerified &&
    !isFacilityB2bReady;

  return {
    hasProvider: enabled,
    facilityProfile: effectiveProfile,
    isLoadingFacilityGate:
      enabled && isFacility ? authLoading || isLoadingFacilityGate : false,
    isRefreshingFacilityGate:
      enabled && isFacility ? isRefreshingFacilityGate : false,
    facilityGateError: enabled && isFacility ? facilityGateError : null,
    isFacilityVerified,
    isFacilityB2bReady,
    isFacilityLocked,
    isFacilityB2bLocked,
    refreshFacilityGate,
  };
}

export function useFacilityVerificationGateState(): FacilityVerificationGateContextValue {
  const ctx = useFacilityVerificationGate();
  const local = useFacilityVerificationGateInternal(!ctx.hasProvider);
  return ctx.hasProvider ? ctx : local;
}

export function FacilityVerificationGateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useFacilityVerificationGateInternal(true);
  return (
    <FacilityVerificationGateContext.Provider value={value}>
      {children}
    </FacilityVerificationGateContext.Provider>
  );
}

export function FacilityVerificationGateGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    facilityProfile,
    isLoadingFacilityGate,
    isRefreshingFacilityGate,
    facilityGateError,
    isFacilityVerified,
    isFacilityB2bReady,
    refreshFacilityGate,
  } = useFacilityVerificationGateState();

  const isFacility = isAuthenticated && isFacilityRole(role);
  const normalized = normalizePath(pathname);
  const isFacilityRoute =
    isFacility &&
    normalized !== '/facility/login' &&
    (normalized === '/facility' || normalized.startsWith('/facility/'));

  const currentPath = pathname ?? null;
  const [settledPathname, setSettledPathname] = useState<string | null>(currentPath);
  const isPathnameChanging = settledPathname !== currentPath;
  const willRefreshOnPathnameChange =
    isPathnameChanging &&
    isFacility &&
    !authLoading &&
    (!isFacilityVerified || !isFacilityB2bReady);

  const lockInfo = isFacilityRoute
    ? getFacilityPathLockInfo(pathname, facilityProfile)
    : { locked: false, stage: null, redirectTo: '/facility' };

  const isTransitionPending =
    isFacilityRoute &&
    !authLoading &&
    !isLoadingFacilityGate &&
    (isRefreshingFacilityGate || willRefreshOnPathnameChange);

  const shouldBlock =
    isFacilityRoute &&
    !authLoading &&
    !isLoadingFacilityGate &&
    !isRefreshingFacilityGate &&
    !willRefreshOnPathnameChange &&
    facilityProfile !== null &&
    lockInfo.locked;

  useEffect(() => {
    if (settledPathname === currentPath) return;
    if (isFacility && !authLoading && (!isFacilityVerified || !isFacilityB2bReady)) {
      let active = true;
      void refreshFacilityGate({ silent: true }).finally(() => {
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
    isFacility,
    authLoading,
    isFacilityVerified,
    isFacilityB2bReady,
    refreshFacilityGate,
  ]);

  useEffect(() => {
    if (shouldBlock) {
      router.replace(lockInfo.redirectTo);
    }
  }, [shouldBlock, lockInfo.redirectTo, router]);

  if (!isFacilityRoute) {
    return <>{children}</>;
  }

  if (
    authLoading ||
    isLoadingFacilityGate ||
    (facilityProfile === null && !facilityGateError) ||
    (isTransitionPending && lockInfo.locked)
  ) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center p-6"
        data-testid="facility-gate-loading"
      >
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            Đang kiểm tra trạng thái hồ sơ pháp lý
          </h2>
          <p className="text-sm text-slate-600">
            Hệ thống đang xác minh trạng thái phê duyệt của Cơ sở Y tế...
          </p>
        </div>
      </div>
    );
  }

  if (facilityGateError && facilityProfile === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">error_outline</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Không thể xác minh trạng thái Cơ sở Y tế
            </h2>
            <p className="text-sm text-slate-600">{facilityGateError}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => void refreshFacilityGate()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Thử kiểm tra lại
            </button>
            <Link
              href="/facility/legal-profile"
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Đến trang Hồ sơ Pháp lý
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (shouldBlock) {
    const isB2bStage = lockInfo.stage === 'B2B';
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center p-6"
        data-testid={isB2bStage ? 'facility-b2b-gate-blocked' : 'facility-gate-blocked'}
      >
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">
              {isB2bStage ? 'handshake' : 'lock'}
            </span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">
              {isB2bStage
                ? 'Cần ký Hợp đồng Hợp tác B2B để mở khóa cổng vận hành'
                : 'Cơ sở Y tế đang chờ duyệt Hồ sơ Pháp lý'}
            </h2>
            <p className="text-sm text-slate-600">
              {isB2bStage
                ? 'Hồ sơ pháp lý của bạn đã được duyệt. Vui lòng xem xét và hoàn tất ký số Hợp đồng Hợp tác B2B để mở khóa quản lý bác sĩ, điều phối và đối soát doanh thu.'
                : facilityProfile?.legalRejectionReason
                  ? `Hồ sơ cần bổ sung: "${facilityProfile.legalRejectionReason}". Đang chuyển bạn đến trang Hồ sơ Pháp lý để cập nhật lại.`
                  : 'Tài khoản Cơ sở Y tế chỉ mở khóa các chức năng hợp đồng & nhân sự sau khi Admin phê duyệt hồ sơ pháp lý. Đang chuyển hướng về trang nộp hồ sơ pháp lý...'}
            </p>
          </div>
          <Link
            href={lockInfo.redirectTo}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {isB2bStage ? 'Đến trang Hợp đồng B2B' : 'Nộp / Cập nhật Hồ sơ Pháp lý'}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
