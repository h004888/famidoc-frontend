'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DocumensoSigningEmbed,
  type ContractStatus,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';
import type {
  BackendContractStatus,
  BackendSignerRole,
  MedicalContractDetailDto,
} from '@/lib/api';

export interface TrackedContract {
  id: string;
  contractNumber?: string;
  packageName?: string;
  packagePrice?: string;
  facilityName?: string;
  doctorName?: string;
  memberCount?: number;
  createdAt?: string;
  status: ContractStatus;
  signedRoles?: BackendSignerRole[];
  signedPdfUrl?: string | null;
  signatures?: {
    family?: { signedAt: string; signer: string };
    platform?: { signedAt?: string; signer?: string };
    facility?: { signedAt?: string; signer?: string };
    doctor?: { signedAt?: string; signer?: string };
  };
}

export interface ContractSigningTrackerViewProps {
  contract?: TrackedContract;
  contractId?: string;
  onProceedPayment?: () => void;
  onRefresh?: () => void;
  pollingIntervalMs?: number;
  /** Đường dẫn quay lại ở breadcrumb trạng thái trống/lỗi (mặc định `/family/subscription`). */
  backHref?: string;
}

const mapContractStatus = (
  status: BackendContractStatus,
  signedRoles: BackendSignerRole[]
): ContractStatus => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'PENDING_PAYMENT';
    case 'ACTIVE':
      return 'ACTIVE';
    case 'EXPIRED':
    case 'TERMINATED':
      return 'CANCELLED';
    default:
      return signedRoles.includes('FAMILY_REP') ? 'FAMILY_SIGNED' : 'DRAFT';
  }
};

const formatAmount = (value?: string | number): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return undefined;
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
};

const mapContractDetail = (dto: MedicalContractDetailDto): TrackedContract => {
  const signedRoles: BackendSignerRole[] =
    dto.signatures?.map((s) => s.signerRole) ??
    (['PENDING_PAYMENT', 'ACTIVE'].includes(dto.contractStatus)
      ? ['FAMILY_REP', 'HEALTHCARE_FACILITY', 'ASSIGNED_DOCTOR', 'ADMIN']
      : []);

  return {
    id: dto.id,
    contractNumber: dto.contractNumber,
    packageName:
      dto.billingSnapshot?.package?.name ?? dto.servicePackage?.packageName,
    packagePrice: formatAmount(
      dto.billingSnapshot?.pricing?.totalPriceVnd ?? dto.totalAmount
    ),
    facilityName: dto.facility?.facilityName,
    doctorName: dto.doctor?.doctorName ?? dto.doctor?.user?.fullName,
    memberCount: dto.memberCount,
    createdAt: dto.createdAt,
    status: mapContractStatus(dto.contractStatus, signedRoles),
    signedRoles,
    signedPdfUrl: dto.signedPdfUrl ?? null,
  };
};

const describeLoadError = (error: unknown): string => {
  const status = (error as { status?: number } | null)?.status;
  if (status === 404) {
    return 'Không tìm thấy hợp đồng này. Vui lòng kiểm tra lại đường dẫn trong email.';
  }
  if (status === 403) {
    return 'Bạn không có quyền xem hợp đồng này. Vui lòng đăng nhập bằng tài khoản đại diện hộ gia đình.';
  }
  return 'Không thể tải hợp đồng. Vui lòng kiểm tra kết nối và thử lại.';
};

const PARALLEL_PARTIES: Array<{
  role: BackendSignerRole;
  partyCode: string;
  title: string;
  description: string;
}> = [
  {
    role: 'HEALTHCARE_FACILITY',
    partyCode: 'Bên B',
    title: 'Cơ sở Y tế phối hợp',
    description: 'Xác nhận bảo trợ chuyên môn, cơ sở vật chất & phân công bác sĩ.',
  },
  {
    role: 'ASSIGNED_DOCTOR',
    partyCode: 'Bên C',
    title: 'Bác sĩ Gia đình phụ trách',
    description: 'Chấp thuận tiếp nhận theo dõi hộ gia đình trong định biên <= 30 hộ.',
  },
  {
    role: 'ADMIN',
    partyCode: 'Bên D',
    title: 'Nền tảng Công nghệ FamiDoc',
    description: 'Kiểm soát hợp đồng điện tử, lưu trữ hồ sơ & điều phối VietQR.',
  },
];

function deriveSignedRoles(contract: TrackedContract): BackendSignerRole[] {
  if (contract.signedRoles && contract.signedRoles.length > 0) {
    return contract.signedRoles;
  }
  if (
    contract.status === 'PENDING_PAYMENT' ||
    contract.status === 'DOCTOR_ACCEPTED' ||
    contract.status === 'ACTIVE'
  ) {
    return ['FAMILY_REP', 'HEALTHCARE_FACILITY', 'ASSIGNED_DOCTOR', 'ADMIN'];
  }
  if (contract.status === 'FAMILY_SIGNED') {
    return ['FAMILY_REP'];
  }
  return [];
}

export function ContractSigningTrackerView({
  contract,
  contractId,
  onProceedPayment,
  onRefresh,
  pollingIntervalMs,
  backHref = '/family/subscription',
}: ContractSigningTrackerViewProps) {
  const router = useRouter();
  const [prevContract, setPrevContract] = useState(contract);
  const [currentContract, setCurrentContract] = useState<TrackedContract | null>(
    contract ?? null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(
    Boolean(contractId) && !contract
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  if (contract !== prevContract) {
    setPrevContract(contract);
    setCurrentContract(contract ?? null);
  }

  useEffect(() => {
    if (!contractId) return;
    const targetContractId = contractId;
    let active = true;
    async function loadContract() {
      try {
        const fetched = await contractsApi.getMedicalContractDetail(targetContractId);
        if (!active) return;
        setCurrentContract(mapContractDetail(fetched));
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setLoadError(describeLoadError(error));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void loadContract();
    return () => {
      active = false;
    };
  }, [contractId, reloadTick]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    const targetId = contractId ?? currentContract?.id;
    try {
      if (!targetId) {
        setLoadError('Chưa xác định được hợp đồng cần xem.');
        return;
      }
      const fetched = await contractsApi.getMedicalContractDetail(targetId);
      setCurrentContract(mapContractDetail(fetched));
      setLoadError(null);
    } catch (error) {
      setLoadError(describeLoadError(error));
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 400);
    }
  }, [contractId, currentContract?.id, onRefresh]);

  useEffect(() => {
    if (!pollingIntervalMs || pollingIntervalMs <= 0) return;
    const timer = setInterval(() => {
      void handleRefresh();
    }, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [pollingIntervalMs, handleRefresh]);

  const handlePaymentClick = () => {
    if (onProceedPayment) {
      onProceedPayment();
    } else {
      const target = currentContract?.id
        ? `/booking/payment?contractId=${encodeURIComponent(currentContract.id)}`
        : '/booking/payment';
      router.push(target);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3"
        >
          <div className="w-8 h-8 mx-auto border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">
            Đang tải tiến trình ký hợp đồng...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-600 text-[22px] shrink-0">
              error
            </span>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-rose-900">
                Không thể tải hợp đồng
              </h2>
              <p className="text-xs text-rose-800 leading-relaxed">{loadError}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setLoadError(null);
                if (contractId) {
                  setReloadTick((t) => t + 1);
                } else {
                  void handleRefresh();
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Thử lại
            </button>
            <Link
              href={backHref}
              className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors"
            >
              Về danh sách gói dịch vụ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentContract) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-slate-400 text-[32px]">
            receipt_long
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            Chưa có hợp đồng để theo dõi
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Đường dẫn này cần mã hợp đồng. Hãy mở lại đường dẫn trong email thông báo
            thanh toán, hoặc chọn gói dịch vụ để bắt đầu.
          </p>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-2">
            <Link href={backHref}>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Về danh sách gói dịch vụ
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = currentContract.status;
  const signedRoles = deriveSignedRoles(currentContract);
  const isFamilySigned = signedRoles.includes('FAMILY_REP');
  const parallelSignedCount = PARALLEL_PARTIES.filter((p) =>
    signedRoles.includes(p.role)
  ).length;
  const isAllSigned =
    currentStatus === 'DOCTOR_ACCEPTED' ||
    currentStatus === 'PENDING_PAYMENT' ||
    currentStatus === 'ACTIVE' ||
    (isFamilySigned && parallelSignedCount === PARALLEL_PARTIES.length);
  const isPaymentReady =
    currentStatus === 'DOCTOR_ACCEPTED' || currentStatus === 'PENDING_PAYMENT';
  const isActive = currentStatus === 'ACTIVE';
  const isAwaitingSignatures =
    !isPaymentReady && !isActive && currentStatus !== 'CANCELLED';

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link
              href={backHref}
              className="hover:text-slate-800 transition-colors"
            >
              Gói dịch vụ &amp; Hợp đồng
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Tiến độ ký kết Documenso 4 bên</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Theo Dõi Tiến Trình Ký Hợp Đồng 4 Bên
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-[16px] ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            refresh
          </span>
          <span>Cập nhật tiến độ</span>
        </button>
      </div>

      {/* Contract Metadata Overview Card */}
      <Card className="bg-white rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Badge variant="outline" className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border-primary/20 font-bold text-xs tabular-nums">
              {currentContract.contractNumber || currentContract.id}
            </Badge>
            <span className="text-xs text-slate-500 font-medium">
              Khởi tạo:{' '}
              <strong className="text-slate-700 tabular-nums">
                {currentContract.createdAt || '—'}
              </strong>
            </span>
            {currentContract.memberCount && (
              <span className="text-xs text-slate-600 font-medium tabular-nums">
                • {currentContract.memberCount} thành viên
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isPaymentReady
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isActive
                ? 'Đang hiệu lực'
                : isPaymentReady
                ? 'Sẵn sàng thanh toán VietQR'
                : isFamilySigned
                ? 'Đang chờ Bên B, C, D ký song song'
                : 'Chờ Bên A ký Documenso'}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Gói chăm sóc</span>
            <p className="font-bold text-slate-800 text-sm">
              {currentContract.packageName || 'Gói Chăm Sóc Gia Đình'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Giá trị gói khám</span>
            <p className="font-bold text-primary text-base tabular-nums">
              {currentContract.packagePrice || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Cơ sở y tế (Bên B)</span>
            <p className="font-semibold text-slate-700">
              {currentContract.facilityName || 'Đang cập nhật'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Bác sĩ gia đình (Bên C)</span>
            <p className="font-semibold text-slate-700">
              {currentContract.doctorName || 'Chờ phân công bác sĩ'}
            </p>
          </div>
        </div>
      </Card>

      {/* Nhúng Documenso ngay cho Bên A ký khi đang chờ chữ ký */}
      {contractId && isAwaitingSignatures && (
        <div data-testid="family-documenso-signing-section">
          <DocumensoSigningEmbed
            contractId={currentContract.id}
            onSyncCompleted={() => {
              void handleRefresh();
            }}
          />
        </div>
      )}

      {/* Action Notice & Trigger Banners */}
      {isPaymentReady && (
        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Hợp đồng đã hoàn tất đủ 4 chữ ký số trên Documenso!
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Tất cả 4 bên (Gia đình, Cơ sở y tế, Bác sĩ, Nền tảng FamiDoc) đã ký kết hoàn tất. Vui
              lòng thanh toán VietQR để kích hoạt gói và mở khóa trang Quản lý thành viên.
            </p>
          </div>

          <Button
            type="button"
            onClick={handlePaymentClick}
            className="h-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold gap-2 whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
            <span>Thanh toán VietQR ngay</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">
                verified
              </span>
              <h2 className="text-sm sm:text-base font-bold text-emerald-900">
                Hợp đồng đang có hiệu lực pháp lý toàn diện
              </h2>
            </div>
            <p className="text-xs text-emerald-700 max-w-xl leading-relaxed">
              Quyền quản trị gia đình đã được mở khóa. Bạn có thể thêm tối đa{' '}
              <strong>{currentContract.memberCount ?? 1}</strong> hồ sơ thành viên và xem bản PDF
              đã ký số 4 bên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/family/members"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              <span>Quản lý thành viên</span>
            </Link>
            <Link
              href="/family/subscription/contract"
              className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              <span>Xem bản sao hợp đồng</span>
            </Link>
          </div>
        </div>
      )}

      {/* Quy trình ký Documenso 2 Pha & Thanh toán */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Quy trình ký kết 2 pha trên Documenso &amp; Kích hoạt
          </h2>
          <span className="text-xs text-slate-500 font-medium tabular-nums">
            Đã ký: {signedRoles.length}/4 bên
          </span>
        </div>

        {/* Pha 1: Bên A ký trước */}
        <div
          data-testid="phase-1-family"
          data-phase-status={isFamilySigned ? 'completed' : 'current'}
          className={`p-4 sm:p-5 rounded-xl border transition-all ${
            isFamilySigned
              ? 'bg-slate-50/70 border-slate-200'
              : 'bg-blue-50/50 border-blue-200 shadow-xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-start gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                  isFamilySigned
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {isFamilySigned ? '✓' : '1'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Pha 1: Bên A (Đại diện Hộ gia đình) ký xác nhận trước trên Documenso
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  Gia đình kiểm tra gói chăm sóc, số lượng thành viên và ký điện tử trực tiếp trên Documenso.
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                isFamilySigned
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {isFamilySigned ? 'Đã hoàn tất' : 'Đang chờ Bên A ký'}
            </span>
          </div>
        </div>

        {/* Pha 2: 3 bên ký song song */}
        <div
          data-testid="phase-2-parallel"
          data-phase-status={
            isAllSigned
              ? 'completed'
              : isFamilySigned
              ? 'current'
              : 'pending'
          }
          className={`p-4 sm:p-5 rounded-xl border transition-all space-y-4 ${
            isAllSigned
              ? 'bg-slate-50/70 border-slate-200'
              : isFamilySigned
              ? 'bg-primary/5 border-primary/20 shadow-xs'
              : 'bg-white border-slate-200 opacity-80'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-start gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                  isAllSigned
                    ? 'bg-emerald-600 text-white'
                    : isFamilySigned
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {isAllSigned ? '✓' : '2'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Pha 2: Bên B, Bên C &amp; Bên D ký song song đồng thời trên Documenso
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  Ngay sau khi Bên A ký xong, cả 3 bên còn lại được mở khóa cùng lúc và không phụ thuộc thứ tự ký giữa nhau.
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold tabular-nums ${
                isAllSigned
                  ? 'bg-emerald-50 text-emerald-700'
                  : isFamilySigned
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isAllSigned
                ? 'Đã ký 3/3 bên'
                : isFamilySigned
                ? `Đang ký song song (${parallelSignedCount}/3)`
                : 'Chờ Pha 1 hoàn tất'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PARALLEL_PARTIES.map((party) => {
              const partySigned = signedRoles.includes(party.role);
              return (
                <div
                  key={party.role}
                  data-testid={`party-status-${party.role}`}
                  data-signed={partySigned ? 'true' : 'false'}
                  className={`space-y-2 rounded-lg border p-3.5 ${
                    partySigned
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {party.partyCode} · {party.title}
                    </span>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
                        partySigned
                          ? 'bg-emerald-100 text-emerald-800'
                          : isFamilySigned
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {partySigned
                        ? 'Đã ký'
                        : isFamilySigned
                        ? 'Chờ ký'
                        : 'Chờ Bên A'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {party.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pha 3: Thanh toán & Kích hoạt */}
        <div
          data-testid="phase-3-payment"
          data-phase-status={
            isActive ? 'completed' : isPaymentReady ? 'current' : 'pending'
          }
          className={`p-4 sm:p-5 rounded-xl border transition-all ${
            isActive
              ? 'bg-emerald-50/50 border-emerald-200'
              : isPaymentReady
              ? 'bg-blue-50/50 border-blue-200 shadow-xs'
              : 'bg-white border-slate-200 opacity-80'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : isPaymentReady
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {isActive ? '✓' : '3'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pha 3: Thanh toán VietQR &amp; Kích hoạt quyền quản trị hộ gia đình
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Khi hợp đồng chuyển sang ACTIVE, toàn bộ tính năng quản lý thành viên, đặt lịch &amp; Telehealth sẽ được mở khóa.
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : isPaymentReady
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isActive
                ? 'Đã kích hoạt'
                : isPaymentReady
                ? 'Sẵn sàng thanh toán'
                : 'Chờ đủ 4/4 chữ ký'}
            </span>
          </div>
        </div>
      </div>

      {/* Support & Legal Notes */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">
            contact_support
          </span>
          <span>
            Cần giải đáp thắc mắc về hợp đồng hoặc tiến độ ký Documenso?
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700 tabular-nums">Hotline: 1900 8888</span>
          <span>•</span>
          <Link
            href="/contact"
            className="text-primary font-semibold hover:underline"
          >
            Gửi yêu cầu hỗ trợ
          </Link>
        </div>
      </div>
    </div>
  );
}
