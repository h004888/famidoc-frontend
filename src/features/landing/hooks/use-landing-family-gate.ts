'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { contractsApi, type FamilyGateStatusDto } from '@/lib/api/contracts.api';
import {
  FAMILY_GATE_REFRESH_EVENT,
  isFamilyRole,
} from '@/components/layout/family-subscription-gate';

/**
 * Trạng thái hiển thị của cổng hợp đồng gia đình trên header công khai.
 * `inactive` gộp cả trường hợp "chưa chọn gói" và "đã có hồ sơ nhưng chưa có hợp đồng".
 */
export type LandingFamilyGateState =
  | 'inactive'
  | 'pending_signature'
  | 'pending_payment'
  | 'active'
  | 'loading'
  | 'error';

export interface LandingFamilyGateAction {
  href: string;
  label: string;
  icon: string;
}

export interface LandingFamilyGate {
  /** Chỉ true khi người dùng đã đăng nhập với vai trò FAMILY/PATIENT. */
  isFamily: boolean;
  state: LandingFamilyGateState;
  gateStatus: FamilyGateStatusDto | null;
  isLoading: boolean;
  hasError: boolean;
  statusLabel: string;
  /** Trạng thái đã sẵn sàng để vẽ menu (không còn loading/error). */
  isResolved: boolean;
  /** Hành động nghiệp vụ chính theo trạng thái cổng hợp đồng. */
  primaryAction: LandingFamilyGateAction;
  /** Lối tắt phụ (không bao gồm `/notifications`, `/settings`, đăng xuất). */
  secondaryActions: LandingFamilyGateAction[];
}

const FALLBACK_ACTION: LandingFamilyGateAction = {
  href: '/onboarding',
  label: 'Không gian chuẩn bị gia đình',
  icon: 'home_health',
};

export const STATUS_LABELS: Record<LandingFamilyGateState, string> = {
  inactive: 'Chưa kích hoạt gói',
  pending_signature: 'Đang chờ ký 4 bên',
  pending_payment: 'Chờ thanh toán VietQR',
  active: 'Gói đang hoạt động',
  loading: 'Đang kiểm tra gói…',
  error: 'Chưa xác minh được gói',
};

/**
 * Lấy nhãn tiếng Việt tương ứng với trạng thái cổng hợp đồng gia đình.
 */
export function getLandingFamilyGateStatusLabel(state: LandingFamilyGateState): string {
  return STATUS_LABELS[state];
}

let inFlightFamilyGateRequest: Promise<FamilyGateStatusDto> | null = null;

/**
 * Gộp các lời gọi `getFamilyGateStatus` đồng thời trong cùng thời điểm mount
 * để tránh gửi trùng request khi nhiều component dùng chung hook trên một trang.
 */
function fetchFamilyGateStatusDeduped(): Promise<FamilyGateStatusDto> {
  if (!inFlightFamilyGateRequest) {
    inFlightFamilyGateRequest = contractsApi.getFamilyGateStatus().finally(() => {
      inFlightFamilyGateRequest = null;
    });
  }
  return inFlightFamilyGateRequest;
}

function encodedContractId(contractId: string): string {
  return encodeURIComponent(contractId);
}

/**
 * Suy ra trạng thái hiển thị từ payload `FamilyGateStatusDto`.
 * Thứ tự ưu tiên: ACTIVE > PENDING_PAYMENT > chờ ký > chưa có hợp đồng.
 */
export function resolveLandingFamilyGateState(
  gateStatus: FamilyGateStatusDto | null,
  options?: { isLoading?: boolean; hasError?: boolean }
): LandingFamilyGateState {
  if (gateStatus?.hasActiveContract) return 'active';

  const pendingContract = gateStatus?.pendingContract;
  if (pendingContract?.id) {
    return pendingContract.contractStatus === 'PENDING_PAYMENT'
      ? 'pending_payment'
      : 'pending_signature';
  }

  if (gateStatus) return 'inactive';
  if (options?.hasError) return 'error';
  if (options?.isLoading) return 'loading';
  return options?.isLoading === false ? 'inactive' : 'loading';
}

export function buildLandingFamilyGateActions(
  state: LandingFamilyGateState,
  gateStatus: FamilyGateStatusDto | null
): { primaryAction: LandingFamilyGateAction; secondaryActions: LandingFamilyGateAction[] } {
  const pendingContract = gateStatus?.pendingContract;
  const contractQuery = pendingContract?.id
    ? `?contractId=${encodedContractId(pendingContract.id)}`
    : '';

  switch (state) {
    case 'active':
      return {
        primaryAction: {
          href: '/family',
          label: 'Bảng Sức khỏe Gia đình',
          icon: 'family_restroom',
        },
        secondaryActions: [
          { href: '/family/appointments', label: 'Lịch hẹn khám tại nhà', icon: 'event_available' },
          { href: '/family/members', label: 'Quản lý thành viên', icon: 'group' },
        ],
      };
    case 'pending_payment':
      return {
        primaryAction: {
          href: `/booking/payment${contractQuery}`,
          label: 'Thanh toán kích hoạt gói',
          icon: 'qr_code_2',
        },
        secondaryActions: [
          {
            href: `/booking/tracking${contractQuery}`,
            label: 'Xem tiến độ hợp đồng',
            icon: 'timeline',
          },
          { href: '/onboarding', label: 'Không gian chuẩn bị gia đình', icon: 'home_health' },
        ],
      };
    case 'pending_signature':
      return {
        primaryAction: {
          href: `/booking/tracking${contractQuery}`,
          label: 'Tiếp tục ký hợp đồng',
          icon: 'draw',
        },
        secondaryActions: [
          { href: '/onboarding', label: 'Không gian chuẩn bị gia đình', icon: 'home_health' },
        ],
      };
    case 'inactive':
      return {
        primaryAction: {
          href: '/doctors',
          label: 'Chọn bác sĩ & gói chăm sóc',
          icon: 'stethoscope',
        },
        secondaryActions: [
          { href: '/onboarding', label: 'Không gian chuẩn bị gia đình', icon: 'home_health' },
          { href: '/packages', label: 'Xem bảng giá gói', icon: 'inventory_2' },
        ],
      };
    case 'loading':
    case 'error':
    default:
      return {
        primaryAction: FALLBACK_ACTION,
        secondaryActions: [{ href: '/doctors', label: 'Chọn bác sĩ & gói chăm sóc', icon: 'stethoscope' }],
      };
  }
}

/**
 * Hook nhẹ lấy trạng thái cổng hợp đồng gia đình cho `LandingHeader`.
 *
 * Chỉ phát sinh HTTP request khi tài khoản đã đăng nhập với vai trò `FAMILY`/`PATIENT`.
 * Khách vãng lai và các vai trò `DOCTOR`/`FACILITY`/`ADMIN` không gọi API.
 * Lỗi mạng hoặc đang tải đều fallback an toàn về `/onboarding`.
 */
export function useLandingFamilyGate(options?: { enabled?: boolean }): LandingFamilyGate {
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const isFamily = isAuthenticated && isFamilyRole(role);
  const shouldFetch = (options?.enabled ?? true) && isFamily;

  const [gateStatus, setGateStatus] = useState<FamilyGateStatusDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const refreshGateStatus = useCallback(async () => {
    if (!shouldFetch) return;
    try {
      const status = await fetchFamilyGateStatusDeduped();
      setGateStatus(status);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [shouldFetch]);

  useEffect(() => {
    if (!shouldFetch) {
      setGateStatus(null);
      setHasError(false);
      setIsLoading(false);
      return;
    }
    if (authLoading) return;

    let active = true;
    setIsLoading(true);

    fetchFamilyGateStatusDeduped()
      .then((status) => {
        if (!active) return;
        setGateStatus(status);
        setHasError(false);
      })
      .catch(() => {
        if (!active) return;
        setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shouldFetch, authLoading]);

  useEffect(() => {
    if (!shouldFetch || typeof window === 'undefined') return;
    const handleRefresh = () => {
      void refreshGateStatus();
    };
    window.addEventListener(FAMILY_GATE_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(FAMILY_GATE_REFRESH_EVENT, handleRefresh);
    };
  }, [shouldFetch, refreshGateStatus]);

  const state = resolveLandingFamilyGateState(gateStatus, { isLoading, hasError });
  const { primaryAction, secondaryActions } = buildLandingFamilyGateActions(state, gateStatus);

  return {
    isFamily,
    state,
    gateStatus,
    isLoading,
    hasError,
    statusLabel: STATUS_LABELS[state],
    isResolved: state !== 'loading' && state !== 'error',
    primaryAction,
    secondaryActions,
  };
}
