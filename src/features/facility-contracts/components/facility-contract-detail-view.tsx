'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  contractsApi,
  type StaffingContractItem,
  normalizeStaffingContract,
} from '@/lib/api/contracts.api';
import { extractErrorMessage } from '@/lib/api';
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

interface FacilityContractDetailViewProps {
  contractId: string;
}

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

export function FacilityContractDetailView({
  contractId,
}: FacilityContractDetailViewProps) {
  const router = useRouter();
  const [contract, setContract] = useState<StaffingContractItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const requestSeqRef = useRef(0);

  const loadContract = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await contractsApi.getStaffingContractById(contractId, {
        throwOnError: true,
      });
      if (seq !== requestSeqRef.current) return;
      if (data && (data.id || data.contractNumber || data.contractCode)) {
        setContract(normalizeStaffingContract(data));
      } else {
        setContract(null);
      }
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      setLoadError(
        extractErrorMessage(
          err,
          'Không thể tải chi tiết hợp đồng hợp tác B2B từ máy chủ.'
        )
      );
      setContract(null);
    } finally {
      if (seq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [contractId]);

  useEffect(() => {
    void loadContract();
    return () => {
      requestSeqRef.current += 1;
    };
  }, [loadContract]);

  const handleExecuteSign = async () => {
    if (!contract) return;
    setIsSigning(true);
    try {
      await contractsApi.signStaffingContract(contract.id, {
        confirmed: true,
        signedPdfUrl:
          contract.signedPdfUrl ||
          `https://cdn.famidoc.vn/contracts/staffing/${contract.contractNumber}-signed.pdf`,
        signatureHash:
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });
      setContract((prev) =>
        prev
          ? {
              ...prev,
              status: 'ACTIVE',
              adminSigned: true,
              facilitySigned: true,
            }
          : null
      );
      toast.success(
        'Ký số điện tử thành công! Hợp đồng Hợp tác B2B đã có hiệu lực pháp lý.'
      );
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Không thể thực hiện ký số điện tử.')
      );
    } finally {
      setIsSigning(false);
    }
  };

  const handleExecuteReject = async () => {
    const trimmed = rejectionReason.trim();
    if (!contract || trimmed.length < 5 || trimmed.length > 500) return;
    setIsSigning(true);
    try {
      await contractsApi.rejectStaffingContract(contract.id, trimmed);
      setContract((prev) =>
        prev
          ? { ...prev, status: 'TERMINATED', rejectionReason: trimmed }
          : null
      );
      toast.success(
        'Đã gửi phản hồi yêu cầu đàm phán sửa đổi tới FamiDoc.'
      );
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể từ chối hợp đồng.'));
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[400px] flex-col items-center justify-center gap-3 bg-[#f6f7f9] text-[#4a4f63]"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#eaeffa] border-t-[#0037c1]" />
        <p className="text-sm font-medium">Đang tải hợp đồng hợp tác B2B...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Alert
            variant="destructive"
            className="rounded-xl border-[#ffa39e] bg-[#fff1f0] text-[#93000a]"
          >
            <AlertTitle className="text-sm font-semibold">
              Không thể tải hợp đồng hợp tác B2B
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm text-[#93000a]">
              {loadError}
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void loadContract()}
              className="min-h-[44px] cursor-pointer rounded-lg bg-[#0046c0] text-sm font-semibold text-white hover:bg-[#003899]"
            >
              Thử lại
            </Button>
            <Button
              asChild
              variant="outline"
              className="min-h-[44px] rounded-lg border-[#acc0f3] bg-[#f0fbff] text-sm font-semibold text-[#0037c1]"
            >
              <Link href="/facility/contracts">Quay lại danh sách</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] p-4 sm:p-6 lg:p-8">
        <Card className="mx-auto max-w-xl rounded-2xl border-[#e4e8ed] bg-white p-8 text-center shadow-xs">
          <CardContent className="space-y-4 p-0">
            <p className="text-base font-semibold text-[#20283d]">
              Không tìm thấy hợp đồng B2B được yêu cầu.
            </p>
            <Button
              asChild
              className="min-h-[44px] rounded-lg bg-[#0046c0] px-5 text-sm font-semibold text-white hover:bg-[#003899]"
            >
              <Link href="/facility/contracts">Quay lại danh sách</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pdfHref =
    contract.signedPdfUrl ||
    `https://cdn.famidoc.vn/contracts/staffing/${contract.contractNumber}-signed.pdf`;

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-4 font-sans text-[#131b2f] antialiased sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6 pb-16">
        {/* Navigation & Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <nav
              aria-label="Đường dẫn trang"
              className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[#4a4f63]"
            >
              <Link
                href="/facility"
                className="transition-colors hover:text-[#0037c1]"
              >
                Cổng Cơ sở Y tế
              </Link>
              <span className="text-[#c4c5d7]">/</span>
              <Link
                href="/facility/contracts"
                className="transition-colors hover:text-[#0037c1]"
              >
                Hợp đồng Hợp tác B2B
              </Link>
              <span className="text-[#c4c5d7]">/</span>
              <span className="font-semibold text-[#20283d] tabular-nums">
                {contract.contractNumber}
              </span>
            </nav>
            <h1 className="text-xl font-semibold tracking-tight text-[#20283d] sm:text-2xl">
              Chi tiết Hợp đồng Hợp tác B2B
            </h1>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/facility/contracts')}
            className="min-h-[40px] cursor-pointer self-start rounded-lg border-[#d9dfe5] bg-white px-3.5 text-xs font-semibold text-[#20283d] hover:bg-[#f6f7f9] sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            <span>Quay lại danh sách</span>
          </Button>
        </div>

        {/* 3 Core Terms Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="rounded-xl border-[#b7eb8f] bg-white p-5 shadow-xs">
            <CardContent className="space-y-2 p-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#039855]">
                  Tỷ lệ doanh thu CSYT
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6ffed] text-[#039855]">
                  <span className="material-symbols-outlined text-lg">
                    payments
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#20283d] tabular-nums">
                {contract.facilitySharePercent}% CSYT
              </div>
              <p className="text-xs leading-snug text-[#4a4f63] tabular-nums">
                Cơ sở Y tế hưởng {contract.facilitySharePercent}% và FamiDoc{' '}
                {contract.platformSharePercent}% trên tổng doanh thu gói chăm
                sóc.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#acc0f3] bg-white p-5 shadow-xs">
            <CardContent className="space-y-2 p-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0037c1]">
                  Kỳ đối soát tự động
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaeffa] text-[#0037c1]">
                  <span className="material-symbols-outlined text-lg">
                    calendar_month
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#20283d] tabular-nums">
                Ngày 05 hằng tháng
              </div>
              <p className="text-xs leading-snug text-[#4a4f63]">
                Lập bảng quyết toán chuyển khoản về tài khoản thụ hưởng của Cơ
                sở Y tế.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#e4e8ed] bg-white p-5 shadow-xs">
            <CardContent className="space-y-2 p-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#4a4f63]">
                  Thời hạn hiệu lực
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f3ff] text-[#0037c1]">
                  <span className="material-symbols-outlined text-lg">
                    verified_user
                  </span>
                </div>
              </div>
              <div className="text-xl font-bold text-[#20283d] tabular-nums">
                {formatDateVi(contract.validFrom)} –{' '}
                {formatDateVi(contract.validTo)}
              </div>
              <p className="text-xs leading-snug text-[#4a4f63]">
                Áp dụng cho toàn bộ bác sĩ gia đình thuộc cơ sở y tế đối tác.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Full Contract Document & 2-Party Seals */}
        <Card className="rounded-2xl border-[#e4e8ed] bg-white p-6 shadow-xs sm:p-8">
          <CardContent className="space-y-6 p-0">
            <div className="flex flex-col justify-between gap-2 border-b border-[#e4e8ed] pb-4 sm:flex-row sm:items-center">
              <div>
                <span className="text-xs font-semibold text-[#4a4f63]">
                  Văn bản hợp đồng điện tử
                </span>
                <p className="text-sm font-bold text-[#20283d] tabular-nums">
                  Số hiệu: {contract.contractNumber}
                </p>
              </div>
              <Badge
                variant="outline"
                className="h-6 w-fit rounded-full border-[#e4e8ed] bg-[#f6f7f9] px-3 text-xs font-semibold text-[#4a4f63]"
              >
                Luật Giao dịch điện tử &amp; NĐ 130/2018/NĐ-CP
              </Badge>
            </div>

            <div className="max-h-[460px] space-y-4 overflow-y-auto rounded-xl border border-[#e4e8ed] bg-[#f6f7f9] p-6 text-sm leading-relaxed text-[#2f364a]">
              <div className="space-y-1 border-b border-[#e4e8ed] pb-4 text-center">
                <p className="text-sm font-bold text-[#20283d]">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-xs font-semibold text-[#4a4f63]">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <p className="pt-2 text-base font-bold text-[#00258b]">
                  HỢP ĐỒNG NGUYÊN TẮC CUNG ỨNG NGUỒN NHÂN LỰC Y TẾ B2B
                </p>
                <p className="text-xs text-[#4a4f63]">
                  Giữa Nền tảng Y tế Gia đình FamiDoc và Cơ sở Y tế Đối tác
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <p className="font-bold text-[#20283d]">
                    BÊN A (NỀN TẢNG CÔNG NGHỆ): CÔNG TY CỔ PHẦN Y TẾ SỐ FAMIDOC
                  </p>
                  <p className="text-xs text-[#4a4f63]">
                    Đại diện: Ban Giám Đốc Nền Tảng
                  </p>
                </div>

                <div>
                  <p className="font-bold text-[#20283d]">
                    BÊN B (ĐỐI TÁC CUNG ỨNG Y TẾ): {contract.facilityName}
                  </p>
                  {contract.facilityId && (
                    <p className="text-xs text-[#4a4f63] tabular-nums">
                      Mã định danh cơ sở: {contract.facilityId}
                    </p>
                  )}
                </div>

                <div className="whitespace-pre-line border-t border-[#e4e8ed] pt-3 text-sm text-[#2f364a]">
                  {contract.contractTerms}
                </div>
              </div>
            </div>

            {/* 2 Digital Seals */}
            <div className="grid grid-cols-1 gap-4 border-t border-[#e4e8ed] pt-5 sm:grid-cols-2">
              <div
                className={`space-y-2 rounded-xl border p-4 ${
                  contract.adminSigned
                    ? 'border-[#b7eb8f] bg-[#f6ffed]'
                    : 'border-[#ffd591] bg-[#fff7e6]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#20283d]">
                    Đại diện Bên A (FamiDoc)
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      contract.adminSigned ? 'bg-[#52c41a]' : 'bg-[#fa8c16]'
                    }`}
                  />
                </div>
                <div className="pt-1">
                  {contract.adminSigned ? (
                    <Badge
                      variant="outline"
                      className="h-7 rounded-full border-[#b7eb8f] bg-white px-3 text-xs font-semibold text-[#039855]"
                    >
                      Đã ký số bởi FamiDoc
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="h-7 rounded-full border-[#ffd591] bg-white px-3 text-xs font-semibold text-[#904d00]"
                    >
                      Chờ FamiDoc ký duyệt
                    </Badge>
                  )}
                </div>
              </div>

              <div
                className={`space-y-2 rounded-xl border p-4 ${
                  contract.facilitySigned
                    ? 'border-[#b7eb8f] bg-[#f6ffed]'
                    : 'border-[#ffd591] bg-[#fff7e6]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#20283d]">
                    Đại diện Bên B (Cơ sở Y tế)
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      contract.facilitySigned ? 'bg-[#52c41a]' : 'bg-[#fa8c16]'
                    }`}
                  />
                </div>
                <div className="pt-1">
                  {contract.facilitySigned ? (
                    <Badge
                      variant="outline"
                      className="h-7 rounded-full border-[#b7eb8f] bg-white px-3 text-xs font-semibold text-[#039855]"
                    >
                      Đã ký số bởi {contract.facilityName}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="h-7 rounded-full border-[#ffd591] bg-white px-3 text-xs font-semibold text-[#904d00]"
                    >
                      Chờ đại diện CSYT ký xác nhận
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className="rounded-2xl border-[#e4e8ed] bg-white p-6 shadow-sm">
          <CardContent className="p-0">
            {contract.status === 'TERMINATED' ? (
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="text-base font-semibold text-[#d92d20]">
                    Hợp đồng đã từ chối / đang chờ điều chỉnh
                  </div>
                  {contract.rejectionReason && (
                    <p className="text-sm text-[#4a4f63]">
                      Lý do: {contract.rejectionReason}
                    </p>
                  )}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="min-h-[44px] rounded-lg border-[#acc0f3] bg-[#f0fbff] text-sm font-semibold text-[#0037c1]"
                >
                  <Link href="/facility/contracts">Quay lại danh sách</Link>
                </Button>
              </div>
            ) : contract.facilitySigned ? (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-base font-bold text-[#039855]">
                    <span className="material-symbols-outlined text-xl">
                      check_circle
                    </span>
                    <span>Hợp đồng Hợp tác B2B đang có hiệu lực</span>
                  </div>
                  <p className="text-sm text-[#4a4f63]">
                    Cơ sở y tế đã hoàn tất ký kết và có thể quản lý danh sách
                    bác sĩ gia đình.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={pdfHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#acc0f3] bg-[#f0fbff] px-4 text-sm font-semibold text-[#0037c1] transition-colors hover:bg-[#eaeffa]"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      download
                    </span>
                    <span>Tải bản PDF đã ký</span>
                  </a>
                  <Button
                    asChild
                    className="min-h-[44px] rounded-lg bg-[#0046c0] px-5 text-sm font-semibold text-white hover:bg-[#003899]"
                  >
                    <Link href="/facility/doctors">
                      <span>Quản lý Bác sĩ &amp; CCHN</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[#20283d]">
                    Xác nhận chấp thuận điều khoản &amp; Ký số điện tử
                  </h3>
                  <p className="text-sm text-[#4a4f63] tabular-nums">
                    Bằng việc ký số, đại diện cơ sở y tế xác nhận tỷ lệ phân
                    chia {contract.facilitySharePercent}% CSYT /{' '}
                    {contract.platformSharePercent}% FamiDoc và quy chuẩn chuyên
                    môn.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRejectModal(true)}
                    className="min-h-[44px] cursor-pointer rounded-lg border-[#ffa39e] bg-[#fff1f0] px-4 text-sm font-semibold text-[#d92d20] hover:bg-[#ffdad6]"
                  >
                    Yêu cầu sửa điều khoản
                  </Button>
                  <Button
                    type="button"
                    disabled={isSigning}
                    onClick={() => void handleExecuteSign()}
                    className="min-h-[44px] cursor-pointer rounded-lg bg-[#0046c0] px-5 text-sm font-semibold text-white hover:bg-[#003899] disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      draw
                    </span>
                    <span>
                      {isSigning ? 'Đang ký số...' : 'Ký số điện tử ngay'}
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* shadcn Dialog: Yêu cầu đàm phán sửa đổi */}
        <Dialog
          open={showRejectModal}
          onOpenChange={(open) => {
            if (isSigning) return;
            setShowRejectModal(open);
            if (!open) setRejectionReason('');
          }}
        >
          <DialogContent className="rounded-2xl border-[#e4e8ed] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[#20283d]">
                Yêu cầu điều chỉnh điều khoản B2B
              </DialogTitle>
              <DialogDescription className="text-sm text-[#4a4f63]">
                Nhập nội dung đề xuất điều chỉnh (5–500 ký tự) để gửi lại cho
                FamiDoc xem xét.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label
                htmlFor="detail-reject-reason"
                className="text-xs font-semibold text-[#20283d]"
              >
                Nội dung đề xuất
              </Label>
              <textarea
                id="detail-reject-reason"
                rows={3}
                minLength={5}
                maxLength={500}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ví dụ: Cơ sở y tế đề xuất điều chỉnh tỷ lệ phân chia hoặc ngày đối soát..."
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
                  if (isSigning) return;
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={isSigning}
                className="min-h-[44px] cursor-pointer rounded-lg border-[#d9dfe5] text-sm font-semibold text-[#20283d]"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={
                  isSigning ||
                  rejectionReason.trim().length < 5 ||
                  rejectionReason.trim().length > 500
                }
                onClick={() => void handleExecuteReject()}
                className="min-h-[44px] cursor-pointer rounded-lg text-sm font-semibold"
              >
                {isSigning ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
