'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ContractStatus } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

export interface TrackedContract {
  id: string;
  packageName?: string;
  packagePrice?: string;
  facilityName?: string;
  doctorName?: string;
  createdAt?: string;
  status: ContractStatus;
  signatures?: {
    family?: { signedAt: string; signer: string };
    platform?: { signedAt?: string; signer?: string };
    facility?: { signedAt?: string; signer?: string };
    doctor?: { signedAt?: string; signer?: string };
  };
}

export interface ContractSigningTrackerViewProps {
  contract?: TrackedContract;
  onProceedPayment?: () => void;
  onRefresh?: () => void;
  pollingIntervalMs?: number;
}

const DEFAULT_CONTRACT: TrackedContract = {
  id: 'FMD-2026-REGR821',
  packageName: 'Gói Toàn Diện Gia Đình (12 Tháng)',
  packagePrice: '9.600.000 đ',
  facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
  doctorName: 'BS. CKII Lê Hoàng Nam',
  createdAt: '01/11/2026 09:15',
  status: 'FAMILY_SIGNED',
  signatures: {
    family: { signedAt: '01/11/2026 09:15', signer: 'Nguyễn Văn An (Đại diện chủ hộ)' },
  },
};

const STEP_DEFINITIONS = [
  {
    step: 1,
    id: 'step-1',
    title: '1. Gia đình ký số',
    description: 'Xác thực eKYC/OTP & hoàn tất chữ ký điện tử chủ hộ.',
    actor: 'Đại diện hộ gia đình',
    method: 'Smart OTP & eKYC',
  },
  {
    step: 2,
    id: 'step-2',
    title: '2. Nền tảng ký duyệt',
    description: 'Ban điều hành FamiDoc đối chiếu quyền lợi gói & ký số bảo chứng.',
    actor: 'FamiDoc Platform Admin',
    method: 'Dấu thời gian TSA & Chữ ký số hệ thống',
  },
  {
    step: 3,
    id: 'step-3',
    title: '3. CSYT phân công & ký',
    description: 'Cơ sở y tế điều phối chỉ định bác sĩ định biên (<30 hộ) & ký số xác nhận.',
    actor: 'Cơ sở y tế phụ trách',
    method: 'Chứng thư số VNPT-CA / Viettel-CA',
  },
  {
    step: 4,
    id: 'step-4',
    title: '4. Bác sĩ ký chấp thuận',
    description: 'Bác sĩ xem Care Needs Summary, cam kết chuyên môn & ký số y khoa.',
    actor: 'Bác sĩ gia đình phụ trách',
    method: 'Chữ ký số cá nhân bác sĩ',
  },
  {
    step: 5,
    id: 'step-5',
    title: '5. Thanh toán & Kích hoạt',
    description: 'Hoàn tất thanh toán VietQR để kích hoạt quyền lợi y tế 12 tháng.',
    actor: 'Cổng thanh toán tự động VietQR SePay',
    method: 'Chuyển khoản VietQR tức thì',
  },
];

function getStepStatus(
  stepNumber: number,
  contractStatus: ContractStatus
): 'completed' | 'current' | 'pending' {
  switch (contractStatus) {
    case 'DRAFT':
      if (stepNumber === 1) return 'current';
      return 'pending';
    case 'FAMILY_SIGNED':
      if (stepNumber === 1) return 'completed';
      if (stepNumber === 2) return 'current';
      return 'pending';
    case 'PLATFORM_SIGNED':
      if (stepNumber <= 2) return 'completed';
      if (stepNumber === 3) return 'current';
      return 'pending';
    case 'FACILITY_ASSIGNED':
      if (stepNumber <= 3) return 'completed';
      if (stepNumber === 4) return 'current';
      return 'pending';
    case 'DOCTOR_ACCEPTED':
    case 'PENDING_PAYMENT':
      if (stepNumber <= 4) return 'completed';
      if (stepNumber === 5) return 'current';
      return 'pending';
    case 'ACTIVE':
      return 'completed';
    case 'CANCELLED':
      return 'pending';
    default:
      return 'pending';
  }
}

export function ContractSigningTrackerView({
  contract = DEFAULT_CONTRACT,
  onProceedPayment,
  onRefresh,
  pollingIntervalMs,
}: ContractSigningTrackerViewProps) {
  const router = useRouter();
  const [currentContract, setCurrentContract] = useState<TrackedContract>(contract);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCurrentContract(contract);
  }, [contract]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    try {
      if (currentContract.id) {
        const fetched = await contractsApi.getMedicalContractById(currentContract.id);
        if (fetched) {
          setCurrentContract((prev) => ({
            ...prev,
            status: fetched.status,
            doctorName: fetched.doctorName || prev.doctorName,
            facilityName: fetched.facilityName || prev.facilityName,
          }));
        }
      }
    } catch {
      // offline / mock fallback
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 400);
    }
  };

  useEffect(() => {
    if (!pollingIntervalMs || pollingIntervalMs <= 0) return;
    const timer = setInterval(() => {
      handleRefresh();
    }, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [pollingIntervalMs, currentContract.id]);

  const currentStatus = currentContract.status;
  const isPaymentReady =
    currentStatus === 'DOCTOR_ACCEPTED' || currentStatus === 'PENDING_PAYMENT';
  const isActive = currentStatus === 'ACTIVE';

  const handlePaymentClick = () => {
    if (onProceedPayment) {
      onProceedPayment();
    } else {
      router.push('/family/billing');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link
              href="/family/subscription"
              className="hover:text-slate-800 transition-colors"
            >
              Gói dịch vụ & Hợp đồng
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Tiến độ ký kết 4 bên</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Theo Dõi Tiến Trình Ký Hợp Đồng 4 Bên
          </h1>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
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

      {/* Contract Metadata Overview Card (Achromatic Ledger Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-[#2E37A4]/10 text-[#2E37A4] font-bold text-xs tabular-nums">
              {currentContract.id}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Khởi tạo: <strong className="text-slate-700 tabular-nums">{currentContract.createdAt || '01/11/2026'}</strong>
            </span>
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
                ? 'Sẵn sàng thanh toán'
                : 'Đang luân chuyển ký số'}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Gói chăm sóc</span>
            <p className="font-bold text-slate-800 text-sm">
              {currentContract.packageName || 'Gói Toàn Diện Gia Đình (12 Tháng)'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Giá trị gói khám</span>
            <p className="font-bold text-[#2E37A4] text-base tabular-nums">
              {currentContract.packagePrice || '9.600.000 đ'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Cơ sở y tế điều phối</span>
            <p className="font-semibold text-slate-700">
              {currentContract.facilityName || 'Bệnh viện Đại học Y Dược TP.HCM'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Bác sĩ gia đình</span>
            <p className="font-semibold text-slate-700">
              {currentContract.doctorName || 'Chờ CSYT phân công'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Notice & Trigger Banners */}
      {isPaymentReady && (
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-sm sm:text-base font-bold text-blue-900">
                Hợp đồng đã hoàn tất đủ 4 chữ ký số!
              </h2>
            </div>
            <p className="text-xs text-blue-700 max-w-xl leading-relaxed">
              Tất cả các bên (Gia đình, Nền tảng, CSYT, Bác sĩ) đã ký duyệt thành công. Vui lòng
              tiến hành thanh toán VietQR để tự động kích hoạt quyền lợi chăm sóc sức khỏe.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePaymentClick}
            className="px-6 py-3 bg-[#2E37A4] hover:bg-[#232b85] active:bg-[#1a2068] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
            <span>Thanh toán VietQR ngay</span>
          </button>
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
              Hợp đồng 4 bên đã được thanh toán và kích hoạt thành công. Bạn có thể xem và tải bản
              sao hợp đồng điện tử có đầy đủ chữ ký số và mã băm SHA-256.
            </p>
          </div>

          <Link
            href="/family/subscription/contract"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">description</span>
            <span>Xem bản sao hợp đồng</span>
          </Link>
        </div>
      )}

      {/* 5-Step Progress Stepper (Clinical Architecture) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Tiến trình ký kết & Kích hoạt hợp đồng
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Quy trình chuẩn Nghị định 13/2023/NĐ-CP
          </span>
        </div>

        <div className="space-y-4">
          {STEP_DEFINITIONS.map((def, index) => {
            const stepStatus = getStepStatus(def.step, currentStatus);
            const isCompleted = stepStatus === 'completed';
            const isCurrent = stepStatus === 'current';
            const isPending = stepStatus === 'pending';

            return (
              <div
                key={def.id}
                data-testid={def.id}
                data-step-status={stepStatus}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50/70 border-slate-200/90 text-slate-700'
                    : isCurrent
                    ? 'bg-blue-50/40 border-blue-200 shadow-xs text-slate-900'
                    : 'bg-white border-slate-100 text-slate-400 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Step Badge Indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 tabular-nums ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#2E37A4] text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? '✓' : def.step}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-bold leading-snug ${
                          isCompleted
                            ? 'text-slate-800'
                            : isCurrent
                            ? 'text-[#2E37A4]'
                            : 'text-slate-500'
                        }`}
                      >
                        {def.title}
                      </h3>

                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700'
                            : isCurrent
                            ? 'bg-blue-100/70 text-[#2E37A4]'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isCompleted
                          ? 'Đã hoàn tất'
                          : isCurrent
                          ? 'Đang thực hiện'
                          : 'Chờ đến lượt'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {def.description}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500 font-medium">
                      <span>
                        Chủ thể: <strong className="text-slate-700">{def.actor}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Phương thức: <strong className="text-slate-700">{def.method}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support & Legal Notes */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">
            contact_support
          </span>
          <span>
            Cần giải đáp thắc mắc về hợp đồng hoặc tiến độ phân công bác sĩ?
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700 tabular-nums">Hotline: 1900 8888</span>
          <span>•</span>
          <Link
            href="/contact"
            className="text-[#2E37A4] font-semibold hover:underline"
          >
            Gửi yêu cầu hỗ trợ
          </Link>
        </div>
      </div>
    </div>
  );
}
