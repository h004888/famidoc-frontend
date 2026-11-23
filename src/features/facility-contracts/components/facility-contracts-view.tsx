'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  contractsApi,
  extractErrorMessage,
  type StaffingContractItem,
} from '@/lib/api';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { FACILITY_GATE_REFRESH_EVENT } from '@/components/layout/facility-verification-gate';
import { StaffingSignConfirmDialog } from '@/features/admin-contracts/components/staffing-detail-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatDateVi(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getB2bStatusBadge(item: StaffingContractItem) {
  if (item.status === 'ACTIVE') {
    return (
      <Badge
        variant="outline"
        className="h-6 rounded-full border-[#b7eb8f] bg-[#f6ffed] px-2.5 text-xs font-semibold text-[#039855]"
      >
        Đang hiệu lực
      </Badge>
    );
  }
  if (item.rawStatus === 'REVISION_REQUESTED') {
    return (
      <Badge
        variant="outline"
        className="h-6 rounded-full border-[#ffa39e] bg-[#fff1f0] px-2.5 text-xs font-semibold text-[#d92d20]"
      >
        Đã gửi yêu cầu sửa
      </Badge>
    );
  }
  if (item.rawStatus === 'PENDING_ADMIN_SIGNATURE' || (item.status === 'DRAFT' && item.facilitySigned && !item.adminSigned)) {
    return (
      <Badge
        variant="outline"
        className="h-6 rounded-full border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700"
      >
        Đã ký · Chờ Admin ký
      </Badge>
    );
  }
  if (item.status === 'TERMINATED') {
    return (
      <Badge
        variant="outline"
        className="h-6 rounded-full border-[#ffa39e] bg-[#fff1f0] px-2.5 text-xs font-semibold text-[#d92d20]"
      >
        Đã chấm dứt / Hủy
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="h-6 rounded-full border-[#ffd591] bg-[#fff7e6] px-2.5 text-xs font-semibold text-[#904d00]"
    >
      Chờ Cơ sở Y tế ký số
    </Badge>
  );
}

export function FacilityContractsView() {
  const [staffingList, setStaffingList] = useState<StaffingContractItem[]>([]);
  const [facilityName, setFacilityName] = useState('Cơ sở Y tế Đối tác');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedStaffing, setSelectedStaffing] =
    useState<StaffingContractItem | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestSeqRef = useRef(0);

  const fetchStaffingContracts = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await contractsApi.getStaffingContracts(
        { limit: 50 },
        { throwOnError: true }
      );
      if (seq !== requestSeqRef.current) return;
      setStaffingList(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      setLoadError(
        extractErrorMessage(
          err,
          'Không thể tải danh sách hợp đồng hợp tác B2B từ máy chủ.'
        )
      );
    } finally {
      if (seq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    facilitiesApi
      .getMyFacilityProfile()
      .then((profile) => {
        if (!active) return;
        if (profile?.facilityName) {
          setFacilityName(profile.facilityName);
        }
      })
      .catch(() => {
        // Giữ tên mặc định trung tính khi không tải được hồ sơ cơ sở
      });

    void fetchStaffingContracts();

    return () => {
      active = false;
      requestSeqRef.current += 1;
    };
  }, [fetchStaffingContracts]);

  const handleExecuteRejectStaffing = async () => {
    const trimmedReason = rejectionReason.trim();
    if (!selectedStaffing || trimmedReason.length < 5 || trimmedReason.length > 500) {
      return;
    }
    setIsSubmitting(true);
    try {
      await contractsApi.rejectStaffingContract(
        selectedStaffing.id,
        trimmedReason
      );

      setStaffingList((prev) =>
        prev.map((c) =>
          c.id === selectedStaffing.id
            ? {
                ...c,
                rawStatus: 'REVISION_REQUESTED',
                revisionReason: trimmedReason,
                rejectionReason: trimmedReason,
              }
            : c
        )
      );
      toast.success(
        'Đã gửi yêu cầu đàm phán điều chỉnh điều khoản hợp đồng B2B tới FamiDoc.'
      );
      setShowRejectDialog(false);
      setSelectedStaffing(null);
      setRejectionReason('');
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Không thể gửi phản hồi từ chối hợp đồng.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canFacilityActOnContract = (item: StaffingContractItem) =>
    item.status === 'DRAFT' &&
    item.rawStatus !== 'REVISION_REQUESTED' &&
    !item.facilitySigned;

  const currentContract =
    staffingList.find((c) => c.status === 'DRAFT') ??
    staffingList.find((c) => c.status === 'ACTIVE') ??
    staffingList[0] ??
    null;

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-4 font-sans text-[#131b2f] antialiased sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Đường dẫn trang"
          className="flex items-center gap-2 text-xs text-[#4a4f63]"
        >
          <Link href="/facility" className="transition-colors hover:text-[#0037c1]">
            Cổng Cơ sở Y tế
          </Link>
          <span className="text-[#c4c5d7]">/</span>
          <span className="font-semibold text-[#0037c1]">
            Hợp đồng Hợp tác B2B
          </span>
        </nav>

        {/* Page Header */}
        <header className="flex flex-col justify-between gap-4 border-b border-[#e4e8ed] pb-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#20283d]">
              Hợp đồng Hợp tác B2B
            </h1>
            <p className="mt-1 text-sm text-[#4a4f63]">
              Quản lý hợp đồng khung 2 bên về phân chia doanh thu và cung ứng
              dịch vụ bác sĩ gia đình giữa Cơ sở Y tế và FamiDoc.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e4e8ed] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#20283d] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#52c41a]" />
              <span>{facilityName}</span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-[40px] rounded-lg border-[#acc0f3] bg-[#f0fbff] text-xs font-semibold text-[#0037c1] hover:bg-[#eaeffa]"
            >
              <Link href="/facility/doctors">
                <span className="material-symbols-outlined text-[16px]">
                  stethoscope
                </span>
                <span>Quản lý Bác sĩ &amp; CCHN</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <Card
            role="status"
            aria-live="polite"
            className="rounded-2xl border-[#e4e8ed] bg-white py-12 shadow-xs"
          >
            <CardContent className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#eaeffa] border-t-[#0037c1]" />
              <p className="text-sm font-medium text-[#4a4f63]">
                Đang tải hợp đồng hợp tác B2B...
              </p>
            </CardContent>
          </Card>
        )}

        {/* API Error State */}
        {!isLoading && loadError && (
          <Alert
            variant="destructive"
            className="rounded-xl border-[#ffa39e] bg-[#fff1f0] text-[#93000a]"
          >
            <AlertTitle className="text-sm font-semibold">
              Không thể tải Hợp đồng Hợp tác B2B
            </AlertTitle>
            <AlertDescription className="mt-1 flex flex-col justify-between gap-3 text-sm text-[#93000a] sm:flex-row sm:items-center">
              <span>{loadError}</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void fetchStaffingContracts()}
                className="min-h-[40px] shrink-0 cursor-pointer rounded-lg px-4 text-xs font-semibold"
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !loadError && staffingList.length === 0 && (
          <Card
            data-testid="facility-b2b-empty-state"
            className="mx-auto max-w-2xl rounded-2xl border-[#e4e8ed] bg-white py-10 shadow-xs"
          >
            <CardContent className="flex flex-col items-center space-y-4 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaeffa] text-[#0037c1]">
                <span className="material-symbols-outlined text-[28px]">
                  history_edu
                </span>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-[#20283d]">
                  Chưa có dự thảo Hợp đồng Hợp tác B2B
                </h2>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-[#4a4f63]">
                  {facilityName} hiện chưa có bản dự thảo hợp đồng khung nào từ
                  hệ thống. Sau khi hồ sơ pháp lý được duyệt, FamiDoc sẽ phát
                  hành dự thảo hợp đồng để đơn vị kiểm tra và ký số tại đây.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Button
                  asChild
                  variant="outline"
                  className="min-h-[44px] rounded-lg border-[#acc0f3] bg-[#f0fbff] px-4 text-sm font-semibold text-[#0037c1] hover:bg-[#eaeffa]"
                >
                  <Link href="/facility/legal-profile">
                    Xem hồ sơ pháp lý
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void fetchStaffingContracts()}
                  className="min-h-[44px] cursor-pointer rounded-lg border-[#d9dfe5] bg-white px-4 text-sm font-semibold text-[#20283d]"
                >
                  Kiểm tra lại
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active / Draft Summary Card */}
        {!isLoading && !loadError && currentContract && (
          <>
            <section
              data-testid="facility-b2b-summary-card"
              aria-label="Hợp đồng khung B2B hiện hành"
              className="overflow-hidden rounded-2xl border border-[#acc0f3] bg-white shadow-sm"
            >
              {/* Card Top */}
              <div className="flex flex-col justify-between gap-4 border-b border-[#e4e8ed] bg-[#faf8ff] px-6 py-5 md:flex-row md:items-start">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-md bg-[#eaeffa] px-2.5 py-0.5 text-xs font-bold text-[#0037c1] tabular-nums">
                      {currentContract.contractNumber}
                    </span>
                    {getB2bStatusBadge(currentContract)}
                  </div>
                  <h2 className="text-xl font-semibold text-[#20283d]">
                    Hợp đồng Khung Hợp tác Cung ứng Dịch vụ Y tế Gia đình
                  </h2>
                  <p className="text-sm text-[#4a4f63]">
                    Áp dụng cho toàn bộ gói chăm sóc hộ gia đình đăng ký với bác
                    sĩ thuộc {currentContract.facilityName || facilityName}.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {canFacilityActOnContract(currentContract) && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedStaffing(currentContract);
                            setShowRejectDialog(true);
                          }}
                          className="min-h-[44px] cursor-pointer rounded-lg border-[#ffa39e] bg-[#fff1f0] px-4 text-sm font-semibold text-[#d92d20] hover:bg-[#ffdad6]"
                        >
                          Yêu cầu sửa điều khoản
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedStaffing(currentContract);
                            setShowSignDialog(true);
                          }}
                          className="min-h-[44px] cursor-pointer rounded-lg border-[#acc0f3] bg-[#f0fbff] px-4 text-sm font-semibold text-[#0037c1] hover:bg-[#eaeffa]"
                        >
                          Ký số (Documenso)
                        </Button>
                      </>
                    )}
                  <Button
                    asChild
                    className="min-h-[44px] rounded-lg bg-[#0046c0] px-5 text-sm font-semibold text-white hover:bg-[#003899]"
                  >
                    <Link href={`/facility/contracts/${currentContract.id}`}>
                      <span>
                        {canFacilityActOnContract(currentContract)
                          ? 'Xem chi tiết & Ký số'
                          : 'Xem hợp đồng'}
                      </span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* 3 Metrics */}
              <div className="grid grid-cols-1 divide-y divide-[#e4e8ed] border-b border-[#e4e8ed] md:grid-cols-3 md:divide-x md:divide-y-0">
                <div className="p-6">
                  <div className="text-xs font-semibold text-[#4a4f63]">
                    Tỷ lệ phân chia doanh thu
                  </div>
                  <div className="mt-1.5 text-lg font-bold text-[#20283d] tabular-nums">
                    {currentContract.facilitySharePercent}% CSYT /{' '}
                    {currentContract.platformSharePercent}% FamiDoc
                  </div>
                  <div
                    className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-[#eaeffa]"
                    aria-hidden="true"
                  >
                    <div
                      className="bg-[#0037c1]"
                      style={{
                        width: `${currentContract.facilitySharePercent}%`,
                      }}
                    />
                    <div
                      className="bg-[#fa8c16]"
                      style={{
                        width: `${currentContract.platformSharePercent}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#4a4f63]">
                    Áp dụng trên doanh thu thuần mỗi gói chăm sóc
                  </p>
                </div>

                <div className="p-6">
                  <div className="text-xs font-semibold text-[#4a4f63]">
                    Kỳ đối soát định kỳ
                  </div>
                  <div className="mt-1.5 text-lg font-bold text-[#20283d] tabular-nums">
                    Ngày 05 hằng tháng
                  </div>
                  <p className="mt-2 text-xs text-[#4a4f63] tabular-nums">
                    Thanh toán chuyển khoản trong 05 ngày làm việc
                  </p>
                </div>

                <div className="p-6">
                  <div className="text-xs font-semibold text-[#4a4f63]">
                    Thời hạn hiệu lực
                  </div>
                  <div className="mt-1.5 text-lg font-bold text-[#20283d] tabular-nums">
                    {formatDateVi(currentContract.validFrom)} –{' '}
                    {formatDateVi(currentContract.validTo)}
                  </div>
                  <p className="mt-2 text-xs text-[#4a4f63]">
                    Ký số điện tử theo Luật Giao dịch điện tử
                  </p>
                </div>
              </div>

              {/* 2-Party Seals */}
              <div className="flex flex-col items-stretch gap-3 bg-white p-6 md:flex-row md:items-center">
                <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-[#e4e8ed] bg-[#f6f7f9] px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold text-[#4a4f63]">
                      Bên nền tảng (FamiDoc)
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-[#20283d]">
                      Nền tảng FamiDoc
                    </div>
                  </div>
                  {currentContract.adminSigned ? (
                    <Badge
                      variant="outline"
                      className="h-6 rounded-full border-[#b7eb8f] bg-[#f6ffed] px-2.5 text-xs font-semibold text-[#039855]"
                    >
                      Đã ký số
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="h-6 rounded-full border-[#d9dfe5] bg-white px-2.5 text-xs font-semibold text-[#4a4f63]"
                    >
                      Chờ ký
                    </Badge>
                  )}
                </div>

                <div
                  aria-label="Ký kết hai bên"
                  className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full bg-[#eaeffa] text-sm font-bold text-[#0037c1]"
                >
                  ↔
                </div>

                <div
                  className={`flex flex-1 items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    currentContract.facilitySigned
                      ? 'border-[#b7eb8f] bg-[#f6ffed]/60'
                      : 'border-[#ffd591] bg-[#fff7e6]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-[#4a4f63]">
                      Cơ sở Y tế đối tác (CSYT)
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-[#20283d]">
                      {currentContract.facilityName || facilityName}
                    </div>
                  </div>
                  {currentContract.facilitySigned ? (
                    <Badge
                      variant="outline"
                      className="h-6 rounded-full border-[#b7eb8f] bg-[#f6ffed] px-2.5 text-xs font-semibold text-[#039855]"
                    >
                      Đã ký số
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="h-6 rounded-full border-[#ffd591] bg-[#fff7e6] px-2.5 text-xs font-semibold text-[#904d00]"
                    >
                      Chờ CSYT ký
                    </Badge>
                  )}
                </div>
              </div>
            </section>

            {/* Active Ready Banner */}
            {currentContract.status === 'ACTIVE' && (
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#b7eb8f] bg-[#f6ffed] px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-[#039855]">
                    verified
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[#113b00]">
                      Hợp đồng Hợp tác B2B đang có hiệu lực pháp lý
                    </div>
                    <p className="text-xs text-[#4a4f63]">
                      Cơ sở y tế đã đủ điều kiện quản lý đội ngũ bác sĩ gia đình
                      và tiếp nhận hợp đồng y tế 4 bên.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-[40px] rounded-lg border-[#b7eb8f] bg-white text-xs font-semibold text-[#039855] hover:bg-[#f6ffed]"
                  >
                    <Link href="/facility/doctors">
                      Quản lý Bác sĩ &amp; CCHN
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Terminated / Revision Requested Banner */}
            {(currentContract.status === 'TERMINATED' ||
              currentContract.rawStatus === 'REVISION_REQUESTED') && (
              <div
                data-testid="facility-b2b-terminated-banner"
                className="flex flex-col justify-between gap-3 rounded-xl border border-[#ffa39e] bg-[#fff1f0] px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-[22px] text-[#d92d20]">
                    info
                  </span>
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-[#93000a]">
                      {currentContract.rawStatus === 'REVISION_REQUESTED'
                        ? 'Hợp đồng đang chờ Admin chỉnh sửa theo góp ý của CSYT'
                        : 'Hợp đồng Hợp tác B2B đã từ chối hoặc chấm dứt hiệu lực'}
                    </div>
                    <p className="text-xs text-[#93000a]">
                      {currentContract.revisionReason || currentContract.rejectionReason
                        ? `Lý do đề xuất điều chỉnh: ${currentContract.revisionReason || currentContract.rejectionReason}`
                        : currentContract.terminatedReason ||
                          'Vui lòng liên hệ Quản trị viên FamiDoc để phát hành lại bản dự thảo mới.'}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="min-h-[40px] shrink-0 rounded-lg border-[#ffa39e] bg-white text-xs font-semibold text-[#d92d20] hover:bg-[#fff1f0]"
                >
                  <Link href={`/facility/contracts/${currentContract.id}`}>
                    Xem chi tiết
                  </Link>
                </Button>
              </div>
            )}

            {/* Conditional History Table (> 1 contract only) */}
            {staffingList.length > 1 && (
              <section
                data-testid="facility-b2b-history"
                aria-label="Lịch sử hợp đồng hợp tác B2B"
                className="overflow-hidden rounded-xl border border-[#e4e8ed] bg-white shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-[#e4e8ed] px-6 py-4">
                  <h3 className="text-base font-semibold text-[#20283d]">
                    Lịch sử Hợp đồng Khung B2B
                  </h3>
                  <span className="rounded-full border border-[#e4e8ed] bg-[#f6f7f9] px-3 py-0.5 text-xs font-semibold text-[#4a4f63] tabular-nums">
                    {staffingList.length} hợp đồng
                  </span>
                </div>

                {/* Desktop Table */}
                <div
                  data-testid="desktop-view"
                  className="hidden overflow-x-auto md:block"
                >
                  <Table className="border-collapse text-sm">
                    <TableHeader>
                      <TableRow className="border-b border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Mã hợp đồng
                        </TableHead>
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Phân chia doanh thu
                        </TableHead>
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Ngày đối soát
                        </TableHead>
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Thời hạn hiệu lực
                        </TableHead>
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Trạng thái ký 2 bên
                        </TableHead>
                        <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-200">
                      {staffingList.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-slate-50/70"
                        >
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left font-bold text-[#00258b] tabular-nums">
                            {item.contractNumber}
                          </TableCell>
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left text-[#2f364a] tabular-nums">
                            <span className="font-semibold text-[#20283d]">
                              {item.facilitySharePercent}% CSYT
                            </span>{' '}
                            / {item.platformSharePercent}% FamiDoc
                          </TableCell>
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left text-[#4a4f63] tabular-nums">
                            Ngày 05 hằng tháng
                          </TableCell>
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left text-[#4a4f63] tabular-nums">
                            {formatDateVi(item.validFrom)} –{' '}
                            {formatDateVi(item.validTo)}
                          </TableCell>
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left">
                            {getB2bStatusBadge(item)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-left">
                            <Button
                              asChild
                              size="sm"
                              variant={
                                canFacilityActOnContract(item)
                                  ? 'default'
                                  : 'outline'
                              }
                              className={
                                canFacilityActOnContract(item)
                                  ? 'min-h-[36px] rounded-lg bg-[#0046c0] text-xs font-semibold text-white hover:bg-[#003899]'
                                  : 'min-h-[36px] rounded-lg border-[#acc0f3] bg-[#f0fbff] text-xs font-semibold text-[#0037c1] hover:bg-[#eaeffa]'
                              }
                            >
                              <Link href={`/facility/contracts/${item.id}`}>
                                {canFacilityActOnContract(item)
                                  ? 'Xem & Ký'
                                  : 'Xem chi tiết'}
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div
                  data-testid="mobile-view"
                  className="divide-y divide-[#e4e8ed] md:hidden"
                >
                  {staffingList.map((item) => (
                    <div key={item.id} className="space-y-3 p-4 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#00258b] tabular-nums">
                            {item.contractNumber}
                          </div>
                          <div className="mt-0.5 text-xs text-[#4a4f63] tabular-nums">
                            {formatDateVi(item.validFrom)} –{' '}
                            {formatDateVi(item.validTo)}
                          </div>
                        </div>
                        {getB2bStatusBadge(item)}
                      </div>
                      <div className="rounded-lg bg-[#f6f7f9] p-3 text-xs text-[#2f364a] tabular-nums">
                        Phân chia:{' '}
                        <strong className="text-[#20283d]">
                          {item.facilitySharePercent}% CSYT
                        </strong>{' '}
                        / {item.platformSharePercent}% FamiDoc
                      </div>
                      <div className="flex justify-end">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="min-h-[40px] rounded-lg border-[#acc0f3] bg-[#f0fbff] text-xs font-semibold text-[#0037c1]"
                        >
                          <Link href={`/facility/contracts/${item.id}`}>
                            {canFacilityActOnContract(item)
                              ? 'Xem & Ký'
                              : 'Xem chi tiết'}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <StaffingSignConfirmDialog
          item={showSignDialog ? selectedStaffing : null}
          signerRole="FACILITY"
          onClose={() => {
            setShowSignDialog(false);
            setSelectedStaffing(null);
          }}
          onSynced={() => {
            void fetchStaffingContracts();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event(FACILITY_GATE_REFRESH_EVENT));
            }
          }}
        />

        {/* shadcn Dialog: Yêu cầu sửa điều khoản / Từ chối dự thảo */}
        <Dialog
          open={showRejectDialog}
          onOpenChange={(open) => {
            if (isSubmitting) return;
            setShowRejectDialog(open);
            if (!open) {
              setSelectedStaffing(null);
              setRejectionReason('');
            }
          }}
        >
          <DialogContent className="rounded-2xl border-[#e4e8ed] sm:max-w-md">
            {selectedStaffing && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-[#20283d]">
                    Yêu cầu điều chỉnh điều khoản B2B
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#4a4f63]">
                    Nhập nội dung đề xuất điều chỉnh (5–500 ký tự) để gửi lại
                    cho FamiDoc xem xét.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label
                    htmlFor="b2b-rejection-reason"
                    className="text-xs font-semibold text-[#20283d]"
                  >
                    Nội dung đề xuất
                  </Label>
                  <textarea
                    id="b2b-rejection-reason"
                    rows={3}
                    minLength={5}
                    maxLength={500}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ví dụ: Đề xuất điều chỉnh tỷ lệ phân chia hoặc ngày đối soát..."
                    className="w-full rounded-lg border border-[#d9dfe5] bg-white p-3 text-sm text-[#131b2f] focus:border-[#1250dc] focus:outline-hidden focus:ring-2 focus:ring-[#1250dc]/20"
                  />
                  <div className="flex items-center justify-between text-xs text-[#4a4f63] tabular-nums">
                    <span>
                      {rejectionReason.trim().length > 0 &&
                      rejectionReason.trim().length < 5
                        ? 'Vui lòng nhập tối thiểu 5 ký tự.'
                        : 'Tối thiểu 5 ký tự'}
                    </span>
                    <span>{rejectionReason.trim().length}/500</span>
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (isSubmitting) return;
                      setShowRejectDialog(false);
                      setSelectedStaffing(null);
                      setRejectionReason('');
                    }}
                    disabled={isSubmitting}
                    className="min-h-[44px] cursor-pointer rounded-lg border-[#d9dfe5] text-sm font-semibold text-[#20283d]"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={
                      rejectionReason.trim().length < 5 ||
                      rejectionReason.trim().length > 500 ||
                      isSubmitting
                    }
                    onClick={() => void handleExecuteRejectStaffing()}
                    className="min-h-[44px] cursor-pointer rounded-lg text-sm font-semibold"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu đàm phán'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
