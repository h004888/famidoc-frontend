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
 * Toàn bộ phân hệ `/facility` và `/facility/*` (ngoại trừ `/facility/legal-profile` và `/facility/login`)
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

export function isFacilityProfileActive(profile: AdminFacilityItem | null): boolean {
  if (!profile) return false;
  return profile.verificationStatus === 'ACTIVE' || profile.status === 'ACTIVE';
}

export interface FacilityVerificationGateContextValue {
  hasProvider: boolean;
  facilityProfile: AdminFacilityItem | null;
  isLoadingFacilityGate: boolean;
  facilityGateError: string | null;
  isFacilityVerified: boolean;
  isFacilityLocked: boolean;
  refreshFacilityGate: (options?: { silent?: boolean }) => Promise<void>;
}

const DEFAULT_FACILITY_GATE_CONTEXT: FacilityVerificationGateContextValue = {
  hasProvider: false,
  facilityProfile: null,
  isLoadingFacilityGate: false,
  facilityGateError: null,
  isFacilityVerified: false,
  isFacilityLocked: false,
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
  const [facilityGateError, setFacilityGateError] = useState<string | null>(null);

  const refreshFacilityGate = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled || !isFacility) {
        setFacilityProfile(null);
        setFacilityGateError(null);
        setIsLoadingFacilityGate(false);
        return;
      }

      const silent = options?.silent ?? false;
      if (!silent) {
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
        if (!silent) {
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
  const isFacilityLocked =
    enabled &&
    isFacility &&
    !authLoading &&
    !isLoadingFacilityGate &&
    effectiveProfile !== null &&
    !isFacilityVerified;

  return {
    hasProvider: enabled,
    facilityProfile: effectiveProfile,
    isLoadingFacilityGate:
      enabled && isFacility ? authLoading || isLoadingFacilityGate : false,
    facilityGateError: enabled && isFacility ? facilityGateError : null,
    isFacilityVerified,
    isFacilityLocked,
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
    facilityGateError,
    isFacilityVerified,
    refreshFacilityGate,
  } = useFacilityVerificationGateState();

  const isFacility = isAuthenticated && isFacilityRole(role);
  const isRestricted = isFacility && isRestrictedFacilityPath(pathname);
  const shouldBlock =
    isRestricted &&
    !authLoading &&
    !isLoadingFacilityGate &&
    facilityProfile !== null &&
    !isFacilityVerified;

  const lastPathnameRef = React.useRef<string | null>(pathname ?? null);

  useEffect(() => {
    const currentPath = pathname ?? null;
    if (lastPathnameRef.current !== currentPath) {
      lastPathnameRef.current = currentPath;
      if (isFacility && !authLoading && !isFacilityVerified) {
        void refreshFacilityGate({ silent: true });
      }
    }
  }, [pathname, isFacility, authLoading, isFacilityVerified, refreshFacilityGate]);

  useEffect(() => {
    if (shouldBlock) {
      router.replace('/facility/legal-profile');
    }
  }, [shouldBlock, router]);

  if (!isRestricted) {
    return <>{children}</>;
  }

  if (authLoading || isLoadingFacilityGate || (facilityProfile === null && !facilityGateError)) {
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
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center p-6"
        data-testid="facility-gate-blocked"
      >
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">
              Cơ sở Y tế đang chờ duyệt Hồ sơ Pháp lý
            </h2>
            <p className="text-sm text-slate-600">
              {facilityProfile?.legalRejectionReason
                ? `Hồ sơ cần bổ sung: "${facilityProfile.legalRejectionReason}". Đang chuyển bạn đến trang Hồ sơ Pháp lý để cập nhật lại.`
                : 'Tài khoản Cơ sở Y tế chỉ mở khóa các chức năng hợp đồng & nhân sự sau khi Admin phê duyệt hồ sơ pháp lý. Đang chuyển hướng về trang nộp hồ sơ pháp lý...'}
            </p>
          </div>
          <Link
            href="/facility/legal-profile"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Nộp / Cập nhật Hồ sơ Pháp lý
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
