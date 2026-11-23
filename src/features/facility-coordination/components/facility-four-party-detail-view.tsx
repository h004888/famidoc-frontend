'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  DocumensoSigningEmbed,
  openSignedPdf,
} from '@/features/four-party-contract';
import {
  contractsApi,
  extractErrorMessage,
  type BackendSignerRole,
  type CareNeedsSummaryDto,
  type MedicalContractDetailDto,
} from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface FacilityFourPartyDetailViewProps {
  contractId: string;
}

interface ResolvedMemberRow {
  id: string;
  fullName: string;
  relationship: string;
  age: number | null;
  gender: string;
  allergiesText: string;
}

function formatPriceVnd(value: number | string | undefined): string {
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num);
}

function formatDateTimeVi(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatGenderVi(gender?: string): string {
  const g = (gender || '').toUpperCase();
  if (g === 'MALE' || g === 'NAM') return 'Nam';
  if (g === 'FEMALE' || g === 'NU' || g === 'NỮ') return 'Nữ';
  return gender || '—';
}

function formatRelationshipVi(rel?: string): string {
  const r = (rel || '').toUpperCase();
  if (r === 'HEAD' || r === 'SELF') return 'Chủ hộ';
  if (r === 'SPOUSE') return 'Vợ / Chồng';
  if (r === 'CHILD' || r === 'CON') return 'Con';
  if (r === 'PARENT') return 'Bố / Mẹ';
  if (r === 'MEMBER') return 'Thành viên';
  return rel || 'Thành viên';
}

function computeAgeFromDob(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function resolveMembers(
  detail: MedicalContractDetailDto,
  careSummary: CareNeedsSummaryDto | null
): ResolvedMemberRow[] {
  if (careSummary?.members && careSummary.members.length > 0) {
    return careSummary.members.map((m, idx) => ({
      id: m.patientId || `member-${idx}`,
      fullName: m.fullName || 'Thành viên',
      relationship: formatRelationshipVi(m.relationshipToHead),
      age: Number.isFinite(m.age) ? m.age : computeAgeFromDob(m.dateOfBirth),
      gender: formatGenderVi(m.gender),
      allergiesText:
        m.allergies && m.allergies.length > 0
          ? m.allergies
              .map((a) => {
                const name = a.allergenName || a.allergen || 'Dị ứng';
                return a.severity ? `${name} (${a.severity})` : name;
              })
              .join(', ')
          : 'Không ghi nhận',
    }));
  }

  if (detail.members && detail.members.length > 0) {
    return detail.members.map((m, idx) => ({
      id: m.patientId || m.id || `detail-member-${idx}`,
      fullName: m.patient?.fullName || 'Thành viên',
      relationship: formatRelationshipVi(m.patient?.relationshipToHead),
      age: computeAgeFromDob(m.patient?.dateOfBirth),
      gender: formatGenderVi(m.patient?.gender),
      allergiesText: careSummary
        ? 'Không ghi nhận'
        : 'Chưa tải được thông tin dị ứng',
    }));
  }

  return [];
}

const TIMELINE_PARTY_META: Array<{
  code: 'A' | 'B' | 'C' | 'D';
  role: BackendSignerRole;
  title: string;
  waitingAfterAHit: string;
}> = [
  {
    code: 'A',
    role: 'FAMILY_REP',
    title: 'Bên A · Đại diện Hộ gia đình',
    waitingAfterAHit: 'Cần hoàn tất ký đầu tiên để mở khóa các bên còn lại',
  },
  {
    code: 'B',
    role: 'HEALTHCARE_FACILITY',
    title: 'Bên B · Cơ sở Y tế',
    waitingAfterAHit: 'Thực hiện ký số tại khung Documenso bên phải',
  },
  {
    code: 'C',
    role: 'ASSIGNED_DOCTOR',
    title: 'Bên C · Bác sĩ Gia đình',
    waitingAfterAHit: 'Ký song song sau khi Bên A hoàn tất',
  },
  {
    code: 'D',
    role: 'ADMIN',
    title: 'Bên D · Nền tảng FamiDoc',
    waitingAfterAHit: 'Ký song song sau khi Bên A hoàn tất',
  },
];

export function FacilityFourPartyDetailView({
  contractId,
}: FacilityFourPartyDetailViewProps) {
  const [detail, setDetail] = useState<MedicalContractDetailDto | null>(null);
  const [careSummary, setCareSummary] = useState<CareNeedsSummaryDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  const loadData = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setIsLoading(true);
    setLoadError(null);
    const [detailResult, careResult] = await Promise.allSettled([
      contractsApi.getMedicalContractDetail(contractId),
      contractsApi.getCareSummary(contractId),
    ]);
    if (seq !== requestSeqRef.current) return;

    if (detailResult.status === 'rejected') {
      setLoadError(
        extractErrorMessage(
          detailResult.reason,
          'Không thể tải chi tiết hợp đồng y tế 4 bên. Vui lòng thử lại.'
        )
      );
      setDetail(null);
      setCareSummary(null);
      setIsLoading(false);
      return;
    }

    setDetail(detailResult.value);
    if (careResult.status === 'fulfilled') {
      setCareSummary(careResult.value);
    } else {
      setCareSummary(null);
    }
    setIsLoading(false);
  }, [contractId]);

  useEffect(() => {
    void loadData();
    return () => {
      requestSeqRef.current += 1;
    };
  }, [loadData]);

  const handleDownloadPdf = async () => {
    if (!detail) return;
    setIsDownloadingPdf(true);
    setPdfError(null);
    try {
      await openSignedPdf(detail.id);
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : 'Không thể tải bản PDF đã ký từ máy chủ.'
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[420px] flex-col items-center justify-center gap-3 bg-[#f6f7f9] p-6 text-[#4a4f63]"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#eaeffa] border-t-[#0037c1]" />
        <p className="text-sm font-medium">
          Đang tải chi tiết hợp đồng y tế 4 bên...
        </p>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Alert
            variant="destructive"
            className="rounded-xl border-[#ffa39e] bg-[#fff1f0] text-[#93000a]"
          >
            <AlertTitle className="text-sm font-semibold">
              Không thể tải hợp đồng y tế 4 bên
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm text-[#93000a]">
              {loadError || 'Không tìm thấy hợp đồng được yêu cầu.'}
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void loadData()}
              className="min-h-[44px] cursor-pointer rounded-lg bg-[#0046c0] text-sm font-semibold text-white hover:bg-[#003899]"
            >
              Thử lại
            </Button>
            <Button
              asChild
              variant="outline"
              className="min-h-[44px] rounded-lg border-[#acc0f3] bg-[#f0fbff] text-sm font-semibold text-[#0037c1]"
            >
              <Link href="/facility/coordination">
                Quay lại danh sách Hợp đồng Y tế 4 bên
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const members = resolveMembers(detail, careSummary);
  const signaturesByRole = new Map(
    (detail.signatures ?? []).map((s) => [s.signerRole, s])
  );
  const isCompleteStatus =
    detail.contractStatus === 'PENDING_PAYMENT' ||
    detail.contractStatus === 'ACTIVE';
  const isEndedStatus =
    detail.contractStatus === 'EXPIRED' ||
    detail.contractStatus === 'TERMINATED';
  const familySigned =
    signaturesByRole.has('FAMILY_REP') || isCompleteStatus;

  const timelineNodes = TIMELINE_PARTY_META.map((meta) => {
    const sig = signaturesByRole.get(meta.role);
    const signerFallback = detail.documensoSigners?.find(
      (s) => s.signerRole === meta.role && s.completedAt
    );
    const signed = Boolean(sig) || isCompleteStatus;
    const signedAt = sig?.signedAt ?? signerFallback?.completedAt ?? null;
    const isActiveTurn =
      !signed &&
      !isEndedStatus &&
      detail.contractStatus === 'PENDING_APPROVAL' &&
      (meta.role === 'FAMILY_REP' ? true : familySigned);

    return {
      ...meta,
      signed,
      signedAt,
      isActiveTurn,
    };
  });

  const signedCount = timelineNodes.filter((n) => n.signed).length;
  const allFourSigned =
    !isEndedStatus &&
    (signedCount >= 4 || Boolean(detail.signedPdfUrl) || isCompleteStatus);

  const hasDoctor = Boolean(detail.doctor);
  const doctorName =
    detail.doctor?.doctorName ||
    detail.doctor?.user?.fullName ||
    'Chưa có thông tin bác sĩ';
  const doctorCchn =
    detail.doctor?.cchnNumber ||
    detail.doctor?.credentials?.find(
      (c) => c.credentialType === 'PRACTICE_LICENSE_CCHN'
    )?.certificateNumber;
  const packageName =
    detail.billingSnapshot?.package?.name ||
    detail.servicePackage?.packageName ||
    careSummary?.packageName ||
    'Gói Chăm Sóc Gia Đình';
  const totalPrice =
    detail.billingSnapshot?.pricing?.totalPriceVnd ?? detail.totalAmount;
  const durationMonths = detail.servicePackage?.durationMonths ?? 12;
  const memberCount = detail.memberCount ?? (members.length || 1);

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-4 font-sans text-[#131b2f] antialiased sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Back link & Header */}
        <div className="space-y-3 border-b border-[#e4e8ed] pb-5">
          <Link
            href="/facility/coordination"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0037c1] transition-colors hover:text-[#00258b]"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            <span>Quay lại danh sách Hợp đồng Y tế 4 bên</span>
          </Link>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-[#20283d] tabular-nums">
                  Hợp đồng Y tế 4 bên · {detail.contractNumber}
                </h1>
                {isEndedStatus ? (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-full border-[#ffa39e] bg-[#fff1f0] px-2.5 text-xs font-semibold text-[#d92d20] tabular-nums"
                  >
                    {detail.contractStatus === 'EXPIRED'
                      ? 'Đã hết hạn'
                      : 'Đã hủy / Chấm dứt'}
                  </Badge>
                ) : allFourSigned ? (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-full border-[#b7eb8f] bg-[#f6ffed] px-2.5 text-xs font-semibold text-[#039855] tabular-nums"
                  >
                    {detail.contractStatus === 'ACTIVE'
                      ? 'Đang hiệu lực (4/4)'
                      : 'Hoàn tất 4/4 chữ ký'}
                  </Badge>
                ) : !familySigned ? (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-full border-[#d9dfe5] bg-[#f6f7f9] px-2.5 text-xs font-semibold text-[#4a4f63] tabular-nums"
                  >
                    Chờ Bên A ký trước (0/4)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-full border-[#ffd591] bg-[#fff7e6] px-2.5 text-xs font-semibold text-[#904d00] tabular-nums"
                  >
                    {signaturesByRole.has('HEALTHCARE_FACILITY')
                      ? `CSYT đã ký (${signedCount}/4)`
                      : `Chờ Cơ sở Y tế ký (${signedCount}/4)`}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[#4a4f63] tabular-nums">
                Khởi tạo lúc {formatDateTimeVi(detail.createdAt)} · Cơ sở Y tế:{' '}
                {detail.facility?.facilityName || 'Cơ sở Y tế phối hợp'}
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-[#e4e8ed] bg-white px-4 py-2.5 text-left shadow-xs md:text-right">
              <div className="text-xs font-semibold text-[#4a4f63] tabular-nums">
                {packageName} · {durationMonths} tháng ({memberCount} thành viên)
              </div>
              <div className="mt-0.5 text-base font-bold text-[#0037c1] tabular-nums">
                {formatPriceVnd(totalPrice)}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Household, Members, Read-only Doctor, 4-Party Timeline */}
          <div className="space-y-6 lg:col-span-6">
            {/* Household & Members */}
            <Card className="rounded-xl border-[#e4e8ed] bg-white py-0 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#e4e8ed] px-5 py-4">
                <h2 className="text-base font-semibold text-[#20283d]">
                  Thông tin Hộ gia đình &amp; Thành viên
                </h2>
                <Badge
                  variant="outline"
                  className="h-6 rounded-full border-[#acc0f3] bg-[#eaeffa] px-2.5 text-xs font-semibold text-[#0037c1] tabular-nums"
                >
                  {memberCount} thành viên
                </Badge>
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-[#4a4f63]">
                      Đại diện Hộ gia đình (Bên A)
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-[#20283d]">
                      {detail.familyUnit?.representativeUser?.fullName ||
                        'Đại diện Hộ gia đình'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#4a4f63]">
                      Số điện thoại liên hệ
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-[#20283d] tabular-nums">
                      {detail.familyUnit?.representativeUser?.phoneNumber ||
                        detail.familyUnit?.emergencyPhone ||
                        '—'}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-[#4a4f63]">
                      Địa chỉ chăm sóc tại nhà
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-[#2f364a]">
                      {careSummary?.familyAddress ||
                        detail.familyUnit?.homeAddress ||
                        'Chưa cập nhật'}
                    </div>
                  </div>
                </div>

                {members.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-[#e4e8ed]">
                    <Table className="border-collapse text-xs sm:text-sm">
                      <TableHeader>
                        <TableRow className="border-b border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                          <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                            Họ và tên
                          </TableHead>
                          <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                            Quan hệ
                          </TableHead>
                          <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                            Tuổi / Giới tính
                          </TableHead>
                          <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                            Dị ứng
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-200">
                        {members.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="border-r border-slate-200 px-4 py-3 text-left font-semibold text-[#20283d]">
                              {m.fullName}
                            </TableCell>
                            <TableCell className="border-r border-slate-200 px-4 py-3 text-left text-[#4a4f63]">
                              {m.relationship}
                            </TableCell>
                            <TableCell className="border-r border-slate-200 px-4 py-3 text-left text-[#4a4f63] tabular-nums">
                              {m.age !== null ? `${m.age} tuổi` : '—'} ·{' '}
                              {m.gender}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-left text-[#4a4f63]">
                              {m.allergiesText}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#e4e8ed] bg-[#f6f7f9] px-4 py-3 text-xs text-[#4a4f63] tabular-nums">
                    Hợp đồng áp dụng cho {memberCount} thành viên hộ gia đình.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Read-only Pre-selected Doctor */}
            <Card className="rounded-xl border-[#e4e8ed] bg-white py-0 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#e4e8ed] px-5 py-4">
                <h2 className="text-base font-semibold text-[#20283d]">
                  Bác sĩ Gia đình đã chọn
                </h2>
                <Badge
                  variant="outline"
                  className="h-6 rounded-full border-[#d9dfe5] bg-[#f6f7f9] px-2.5 text-xs font-semibold text-[#4a4f63]"
                >
                  Chỉ xem
                </Badge>
              </div>
              <CardContent className="space-y-3 p-5">
                {hasDoctor ? (
                  <>
                    <div className="flex items-center gap-3.5 rounded-xl border border-[#acc0f3] bg-[#f2f3ff] p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#0046c0] bg-white text-sm font-bold text-[#0037c1]">
                        {doctorName.split(' ').slice(-1)[0]?.charAt(0) || 'B'}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="text-sm font-bold text-[#20283d]">
                          {doctorName}
                        </div>
                        <div className="text-xs text-[#4a4f63]">
                          {[detail.doctor?.specialty, detail.facility?.facilityName]
                            .filter(Boolean)
                            .join(' · ') || 'Bác sĩ Gia đình'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {doctorCchn && (
                            <Badge
                              variant="outline"
                              className="h-6 rounded-full border-[#b7eb8f] bg-[#f6ffed] px-2.5 text-xs font-semibold text-[#039855] tabular-nums"
                            >
                              CCHN · {doctorCchn}
                            </Badge>
                          )}
                          {typeof detail.doctor?.experienceYears === 'number' &&
                            detail.doctor.experienceYears > 0 && (
                              <Badge
                                variant="outline"
                                className="h-6 rounded-full border-[#d9dfe5] bg-white px-2.5 text-xs font-semibold text-[#4a4f63] tabular-nums"
                              >
                                {detail.doctor.experienceYears} năm kinh nghiệm
                              </Badge>
                            )}
                        </div>
                      </div>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-[#4a4f63]">
                      <span className="material-symbols-outlined text-[15px]">
                        info
                      </span>
                      <span>
                        Bác sĩ đã được hộ gia đình lựa chọn trực tiếp khi đăng ký
                        gói chăm sóc.
                      </span>
                    </p>
                  </>
                ) : (
                  <div
                    data-testid="facility-detail-no-doctor"
                    className="flex items-center gap-3 rounded-xl border border-[#e4e8ed] bg-[#f6f7f9] p-4 text-sm text-[#4a4f63]"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#747686]">
                      person_off
                    </span>
                    <span>
                      Chưa có thông tin bác sĩ gia đình gắn với hợp đồng này.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4-Party Signature Timeline */}
            <Card
              data-testid="four-party-signature-timeline"
              className="rounded-xl border-[#e4e8ed] bg-white py-0 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-[#e4e8ed] px-5 py-4">
                <h2 className="text-base font-semibold text-[#20283d]">
                  Tiến trình ký số 4 bên
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    'h-6 rounded-full px-2.5 text-xs font-semibold tabular-nums',
                    isEndedStatus
                      ? 'border-[#ffa39e] bg-[#fff1f0] text-[#d92d20]'
                      : allFourSigned
                        ? 'border-[#b7eb8f] bg-[#f6ffed] text-[#039855]'
                        : 'border-[#ffd591] bg-[#fff7e6] text-[#904d00]'
                  )}
                >
                  {isEndedStatus
                    ? detail.contractStatus === 'EXPIRED'
                      ? 'Đã hết hạn'
                      : 'Đã hủy / Chấm dứt'
                    : `${signedCount}/4 chữ ký hoàn tất`}
                </Badge>
              </div>
              <CardContent className="space-y-3 p-5">
                {timelineNodes.map((node) => {
                  const partySubtitle =
                    node.role === 'FAMILY_REP'
                      ? detail.familyUnit?.representativeUser?.fullName ||
                        'Đại diện Hộ gia đình'
                      : node.role === 'HEALTHCARE_FACILITY'
                        ? detail.facility?.facilityName || 'Cơ sở Y tế phối hợp'
                        : node.role === 'ASSIGNED_DOCTOR'
                          ? doctorName
                          : 'Công ty Cổ phần Y tế Số FamiDoc';

                  return (
                    <div
                      key={node.role}
                      data-testid={`timeline-party-${node.code}`}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3.5',
                        node.signed
                          ? 'border-[#b7eb8f] bg-[#f6ffed]/40'
                          : node.isActiveTurn
                            ? 'border-[#ffd591] bg-[#fff7e6]'
                            : 'border-[#e4e8ed] bg-[#f6f7f9]/60'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                          node.signed
                            ? 'border-[#b7eb8f] bg-[#f6ffed] text-[#039855]'
                            : node.isActiveTurn
                              ? 'border-[#904d00] bg-white text-[#904d00]'
                              : 'border-[#d9dfe5] bg-[#f6f7f9] text-[#4a4f63]'
                        )}
                      >
                        {node.code}
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#20283d]">
                            {node.title}
                          </span>
                          {node.signed ? (
                            <Badge
                              variant="outline"
                              className="h-6 rounded-full border-[#b7eb8f] bg-[#f6ffed] px-2.5 text-xs font-semibold text-[#039855]"
                            >
                              Đã ký
                            </Badge>
                          ) : isEndedStatus ? (
                            <Badge
                              variant="outline"
                              className="h-6 rounded-full border-[#d9dfe5] bg-white px-2.5 text-xs font-semibold text-[#4a4f63]"
                            >
                              {detail.contractStatus === 'EXPIRED'
                                ? 'Đã hết hạn'
                                : 'Đã hủy'}
                            </Badge>
                          ) : node.isActiveTurn ? (
                            <Badge
                              variant="outline"
                              className="h-6 rounded-full border-[#ffd591] bg-white px-2.5 text-xs font-semibold text-[#904d00]"
                            >
                              Chờ ký
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="h-6 rounded-full border-[#d9dfe5] bg-white px-2.5 text-xs font-semibold text-[#4a4f63]"
                            >
                              Chờ Bên A ký trước
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#4a4f63] tabular-nums">
                          {partySubtitle}
                          {node.signed
                            ? node.signedAt
                              ? ` · Đã ký lúc ${formatDateTimeVi(node.signedAt)}`
                              : ' · Đã hoàn tất chữ ký'
                            : isEndedStatus
                              ? ' · Hợp đồng đã kết thúc'
                              : ` · ${node.waitingAfterAHit}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Documenso Signing Embed + 4/4 Signed PDF Action */}
          <div className="space-y-4 lg:col-span-6">
            {allFourSigned && (
              <Card
                data-testid="facility-signed-pdf-card"
                className="rounded-xl border-[#b7eb8f] bg-[#f6ffed] py-0 shadow-xs"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-[22px] text-[#039855]">
                      verified
                    </span>
                    <div className="space-y-1">
                      <h2 className="text-sm font-bold text-[#113b00]">
                        Hợp đồng 4 bên đã được ký đầy đủ (4/4)
                      </h2>
                      <p className="text-xs leading-relaxed text-[#2f364a]">
                        Cả 4 bên đã hoàn tất chữ ký điện tử trên Documenso. Bản
                        PDF đầy đủ chữ ký đã sẵn sàng tải xuống và lưu trữ.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      disabled={isDownloadingPdf}
                      onClick={() => void handleDownloadPdf()}
                      className="min-h-[44px] cursor-pointer rounded-lg bg-[#0046c0] px-4 text-sm font-semibold text-white hover:bg-[#003899]"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        download
                      </span>
                      <span>
                        {isDownloadingPdf ? 'Đang tải PDF...' : 'Tải PDF đã ký'}
                      </span>
                    </Button>
                  </div>
                  {pdfError && (
                    <Alert
                      variant="destructive"
                      className="rounded-lg border-[#ffa39e] bg-[#fff1f0] text-[#93000a]"
                    >
                      <AlertDescription className="text-xs text-[#93000a]">
                        {pdfError}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <DocumensoSigningEmbed
              contractId={detail.id}
              onSyncCompleted={() => {
                void loadData();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
