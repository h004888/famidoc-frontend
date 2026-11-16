'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { contractsApi, type FamilyGateStatusDto } from '@/lib/api/contracts.api';

export const FAMILY_GATE_REFRESH_EVENT = 'famidoc:family-gate-refresh';

export function isFamilyRole(role: string | null | undefined): boolean {
  return role === 'FAMILY' || role === 'PATIENT' || role === 'FAMILY_REP';
}

function normalizePath(pathname: string | null | undefined): string {
  return (pathname ?? '').split('?')[0].replace(/\/+$/, '') || '/';
}

/**
 * Toàn bộ không gian `/family` và `/family/*` bị khóa khi tài khoản chưa có hợp đồng `ACTIVE`.
 */
export function isRestrictedFamilyPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = normalizePath(pathname);
  return normalized === '/family' || normalized.startsWith('/family/');
}

export interface BlockedFamilyLocation {
  pathname?: string | null;
  search?: string | null;
}

function toSearchParams(search: string | null | undefined): URLSearchParams {
  const raw = (search ?? '').trim();
  return new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
}

/**
 * Xác định đích chuyển hướng ra luồng `/booking` khi tài khoản chưa có hợp đồng `ACTIVE`:
 * 1. Link đặt gói cũ `/family/subscription?packageId&doctorId&facilityId` -> `/booking` giữ nguyên query.
 * 2. Link kế thừa có `contractId` trên `/family/subscription/tracking` hoặc `/family/billing`.
 * 3. Hợp đồng chờ thanh toán (`PENDING_PAYMENT`) -> `/booking/payment`.
 * 4. Hợp đồng đang chờ ký -> `/booking/tracking`.
 * 5. Chưa có hợp đồng nào -> `/doctors`.
 */
export function resolveBlockedFamilyRedirect(
  gateStatus: FamilyGateStatusDto | null,
  location?: BlockedFamilyLocation,
): string {
  const pathname = location?.pathname ? normalizePath(location.pathname) : null;
  const params = toSearchParams(location?.search);
  const contractIdParam = params.get('contractId');

  if (pathname === '/family/subscription') {
    const hasBookingContext = Boolean(
      params.get('packageId') && params.get('doctorId') && params.get('facilityId'),
    );
    if (hasBookingContext) {
      return `/booking?${params.toString()}`;
    }
  }

  if (contractIdParam) {
    const encodedContractId = encodeURIComponent(contractIdParam);
    if (pathname === '/family/subscription/tracking') {
      return `/booking/tracking?contractId=${encodedContractId}`;
    }
    if (pathname === '/family/billing') {
      return `/booking/payment?contractId=${encodedContractId}`;
    }
    if (pathname === '/family/subscription' || pathname === '/family/subscription/contract') {
      return `/booking/tracking?contractId=${encodedContractId}`;
    }
  }

  const pendingContract = gateStatus?.pendingContract;
  if (pendingContract?.id) {
    const encodedContractId = encodeURIComponent(pendingContract.id);
    if (pendingContract.contractStatus === 'PENDING_PAYMENT') {
      return `/booking/payment?contractId=${encodedContractId}`;
    }
    return `/booking/tracking?contractId=${encodedContractId}`;
  }

  return '/doctors';
}

export interface FamilySubscriptionGateContextValue {
  hasProvider: boolean;
  gateStatus: FamilyGateStatusDto | null;
  isLoadingGate: boolean;
  gateError: string | null;
  isFamilyLocked: boolean;
  unlockTargetHref: string;
  refreshGateStatus: (options?: { silent?: boolean }) => Promise<void>;
}

const DEFAULT_GATE_CONTEXT: FamilySubscriptionGateContextValue = {
  hasProvider: false,
  gateStatus: null,
  isLoadingGate: false,
  gateError: null,
  isFamilyLocked: false,
  unlockTargetHref: '/doctors',
  refreshGateStatus: async () => {},
};

const FamilySubscriptionGateContext =
  createContext<FamilySubscriptionGateContextValue>(DEFAULT_GATE_CONTEXT);

export function useFamilySubscriptionGate() {
  return useContext(FamilySubscriptionGateContext);
}

function useFamilySubscriptionGateInternal(enabled: boolean): FamilySubscriptionGateContextValue {
  const { role, isAuthenticated, isLoading: authLoading } = useAuth();
  const isFamily = isAuthenticated && isFamilyRole(role);

  const [gateStatus, setGateStatus] = useState<FamilyGateStatusDto | null>(null);
  const [isLoadingGate, setIsLoadingGate] = useState<boolean>(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const refreshGateStatus = useCallback(async (options?: { silent?: boolean }) => {
    if (!enabled || !isFamily) {
      setGateStatus(null);
      setGateError(null);
      setIsLoadingGate(false);
      return;
    }

    const silent = options?.silent ?? false;
    if (!silent) {
      setIsLoadingGate(true);
    }
    setGateError(null);
    try {
      const status = await contractsApi.getFamilyGateStatus();
      setGateStatus(status);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể kiểm tra trạng thái hợp đồng gia đình.';
      setGateError(message);
    } finally {
      if (!silent) {
        setIsLoadingGate(false);
      }
    }
  }, [enabled, isFamily]);

  useEffect(() => {
    if (!enabled || authLoading || !isFamily) return;
    let active = true;
    async function loadInitialGateStatus() {
      try {
        const status = await contractsApi.getFamilyGateStatus();
        if (!active) return;
        setGateStatus(status);
        setGateError(null);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : 'Không thể kiểm tra trạng thái hợp đồng gia đình.';
        setGateError(message);
      } finally {
        if (active) {
          setIsLoadingGate(false);
        }
      }
    }
    void loadInitialGateStatus();
    return () => {
      active = false;
    };
  }, [enabled, authLoading, isFamily]);

  useEffect(() => {
    if (!enabled || !isFamily || typeof window === 'undefined') return;
    const handleRefresh = () => {
      void refreshGateStatus();
    };
    window.addEventListener(FAMILY_GATE_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(FAMILY_GATE_REFRESH_EVENT, handleRefresh);
    };
  }, [enabled, isFamily, refreshGateStatus]);

  const effectiveGateStatus = enabled && isFamily ? gateStatus : null;
  const effectiveGateError = enabled && isFamily ? gateError : null;
  const isFamilyLocked =
    enabled && isFamily && !authLoading && !isLoadingGate && effectiveGateStatus !== null && !effectiveGateStatus.hasActiveContract;

  return {
    hasProvider: enabled,
    gateStatus: effectiveGateStatus,
    isLoadingGate: enabled && isFamily ? authLoading || isLoadingGate : false,
    gateError: effectiveGateError,
    isFamilyLocked,
    unlockTargetHref: resolveBlockedFamilyRedirect(effectiveGateStatus),
    refreshGateStatus,
  };
}

export function useFamilySubscriptionGateState(): FamilySubscriptionGateContextValue {
  const ctx = useFamilySubscriptionGate();
  const local = useFamilySubscriptionGateInternal(!ctx.hasProvider);
  return ctx.hasProvider ? ctx : local;
}

export function FamilySubscriptionGateProvider({ children }: { children: React.ReactNode }) {
  const value = useFamilySubscriptionGateInternal(true);
  return (
    <FamilySubscriptionGateContext.Provider value={value}>
      {children}
    </FamilySubscriptionGateContext.Provider>
  );
}

export function FamilySubscriptionGateGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role, isAuthenticated, isLoading: authLoading } = useAuth();
  const { gateStatus, isLoadingGate, gateError, refreshGateStatus } = useFamilySubscriptionGateState();

  const isFamily = isAuthenticated && isFamilyRole(role);
  const isRestricted = isFamily && isRestrictedFamilyPath(pathname);
  const shouldBlock = isRestricted && !authLoading && !isLoadingGate && gateStatus !== null && !gateStatus.hasActiveContract;
  const currentSearch = searchParams?.toString() ?? '';
  const redirectTarget = resolveBlockedFamilyRedirect(gateStatus, {
    pathname,
    search: currentSearch,
  });
  const lastPathnameRef = React.useRef<string | null>(pathname ?? null);

  useEffect(() => {
    const currentPath = pathname ?? null;
    if (lastPathnameRef.current !== currentPath) {
      lastPathnameRef.current = currentPath;
      if (isFamily && !authLoading && !gateStatus?.hasActiveContract) {
        void refreshGateStatus();
      }
    }
  }, [pathname, isFamily, authLoading, gateStatus?.hasActiveContract, refreshGateStatus]);

  useEffect(() => {
    if (shouldBlock) {
      router.replace(redirectTarget);
    }
  }, [shouldBlock, redirectTarget, router]);

  if (!isRestricted) {
    return <>{children}</>;
  }

  if (authLoading || isLoadingGate || (gateStatus === null && !gateError)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            Đang kiểm tra trạng thái kích hoạt gói
          </h2>
          <p className="text-sm text-slate-600">
            Hệ thống đang xác minh hợp đồng chăm sóc sức khỏe gia đình của bạn...
          </p>
        </div>
      </div>
    );
  }

  if (gateError && gateStatus === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">error_outline</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Không thể xác minh trạng thái gói gia đình
            </h2>
            <p className="text-sm text-slate-600">{gateError}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => void refreshGateStatus()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Thử kiểm tra lại
            </button>
            <Link
              href="/doctors"
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Tìm bác sĩ &amp; đăng ký gói
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (shouldBlock) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6" data-testid="family-gate-blocked">
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">
              Cần kích hoạt gói chăm sóc gia đình
            </h2>
            <p className="text-sm text-slate-600">
              Tài khoản chưa có hợp đồng ACTIVE. Hệ thống đang chuyển hướng bạn đến bước tiếp theo để hoàn tất ký 4 bên và thanh toán.
            </p>
          </div>
          <Link
            href={redirectTarget}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {gateStatus?.pendingContract ? 'Theo dõi & kích hoạt hợp đồng' : 'Tìm bác sĩ & đăng ký gói'}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
