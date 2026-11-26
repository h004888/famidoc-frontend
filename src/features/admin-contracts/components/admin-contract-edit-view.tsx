'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Handshake,
  Loader2,
  Save,
  Stethoscope,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  contractsApi,
  extractErrorMessage,
  normalizeStaffingContract,
  type BackendContractStatus,
  type MedicalContractDetailDto,
  type StaffingContractItem,
} from '@/lib/api';
import { doctorsApi } from '@/lib/api/doctors.api';
import { cn, formatCurrencyVND } from '@/lib/utils';

export type AdminContractEditType = 'medical' | 'staffing';

export interface AdminContractEditViewProps {
  contractId: string;
  contractType?: AdminContractEditType;
}

interface DoctorOption {
  id: string;
  name: string;
  specialty?: string;
}

const BACKEND_STATUS_LABELS: Record<BackendContractStatus, string> = {
  PENDING_APPROVAL: 'Chờ thẩm định & ký duyệt',
  PENDING_PAYMENT: 'Chờ thanh toán VietQR',
  PAID_PENDING_APPROVAL: 'Đã tạm giữ — Chờ CSYT & BS duyệt',
  PENDING_ACTIVATION: 'Đã thanh toán – chờ hiệu lực',
  APPROVAL_REJECTED: 'Đã từ chối phê duyệt',
  APPROVAL_EXPIRED: 'Quá hạn phê duyệt 24h',
  ACTIVE: 'Đang hiệu lực (ACTIVE)',
  EXPIRED: 'Đã hết hạn',
  TERMINATED: 'Đã chấm dứt / Hủy',
  CANCELLED: 'Đã hủy',
};

const STAFFING_STATUS_LABELS: Record<StaffingContractItem['status'], string> = {
  DRAFT: 'Dự thảo (DRAFT)',
  ACTIVE: 'Đang hiệu lực (ACTIVE)',
  TERMINATED: 'Đã hủy / Chấm dứt',
};

function toDateInputValue(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function AdminContractEditView({ contractId, contractType }: AdminContractEditViewProps) {
  const router = useRouter();

  const [resolvedType, setResolvedType] = useState<AdminContractEditType>(
    contractType || 'medical'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Medical 4-party state
  const [medicalDetail, setMedicalDetail] = useState<MedicalContractDetailDto | null>(null);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [medStatus, setMedStatus] = useState<BackendContractStatus>('PENDING_APPROVAL');
  const [medDoctorId, setMedDoctorId] = useState<string>('UNASSIGNED');
  const [initialMedDoctorId, setInitialMedDoctorId] = useState<string>('UNASSIGNED');
  const [medStartDate, setMedStartDate] = useState('');
  const [medEndDate, setMedEndDate] = useState('');
  const [medMemberCount, setMedMemberCount] = useState(1);
  const [medTotalAmount, setMedTotalAmount] = useState(0);
  const [medAdditionalTerms, setMedAdditionalTerms] = useState('');
  const [medAdminNote, setMedAdminNote] = useState('');

  // Staffing B2B state
  const [staffingDetail, setStaffingDetail] = useState<StaffingContractItem | null>(null);
  const [stFacilityShare, setStFacilityShare] = useState(85);
  const [stValidFrom, setStValidFrom] = useState('');
  const [stValidTo, setStValidTo] = useState('');
  const [stTerms, setStTerms] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      const loadStaffing = async () => {
        const raw = await contractsApi.getStaffingContractById(contractId);
        if (!raw) return null;
        return normalizeStaffingContract(raw);
      };

      const loadMedical = async () => {
        const [detail, docs] = await Promise.all([
          contractsApi.getMedicalContractDetail(contractId),
          doctorsApi.getAdminDoctors({ limit: 50 }).catch(() => []),
        ]);
        return { detail, docs };
      };

      try {
        if (contractType === 'staffing') {
          const st = await loadStaffing();
          if (!active) return;
          if (!st) {
            setLoadError('Không tìm thấy thông tin hợp đồng cung ứng nhân lực B2B.');
            return;
          }
          setResolvedType('staffing');
          setStaffingDetail(st);
          setStFacilityShare(st.facilitySharePercent);
          setStValidFrom(toDateInputValue(st.validFrom));
          setStValidTo(toDateInputValue(st.validTo));
          setStTerms(st.contractTerms || '');
          return;
        }

        try {
          const { detail, docs } = await loadMedical();
          if (!active) return;
          setResolvedType('medical');
          setMedicalDetail(detail);
          setMedStatus(detail.contractStatus);
          const docId = detail.doctor?.id || 'UNASSIGNED';
          setMedDoctorId(docId);
          setInitialMedDoctorId(docId);
          setMedStartDate(toDateInputValue(detail.startDate));
          setMedEndDate(toDateInputValue(detail.endDate));
          setMedMemberCount(detail.memberCount ?? 1);
          setMedTotalAmount(Number(detail.totalAmount ?? 0));
          setMedAdditionalTerms(detail.additionalTerms || '');

          const mappedDocs: DoctorOption[] = Array.isArray(docs)
            ? docs
                .filter((d) => d && d.id)
                .map((d) => ({
                  id: String(d.id),
                  name: d.doctorName || d.user?.fullName || `Bác sĩ #${d.id}`,
                  specialty: d.specialty,
                }))
            : [];

          if (detail.doctor?.id && !mappedDocs.some((d) => d.id === detail.doctor?.id)) {
            mappedDocs.unshift({
              id: detail.doctor.id,
              name: detail.doctor.doctorName || detail.doctor.user?.fullName || 'Bác sĩ hiện tại',
              specialty: detail.doctor.specialty,
            });
          }
          setDoctorOptions(mappedDocs);
        } catch (medErr) {
          if (contractType === 'medical') {
            throw medErr;
          }
          const st = await loadStaffing();
          if (!active) return;
          if (!st) throw medErr;
          setResolvedType('staffing');
          setStaffingDetail(st);
          setStFacilityShare(st.facilitySharePercent);
          setStValidFrom(toDateInputValue(st.validFrom));
          setStValidTo(toDateInputValue(st.validTo));
          setStTerms(st.contractTerms || '');
        }
      } catch (err) {
        if (!active) return;
        setLoadError(
          extractErrorMessage(err, 'Không thể tải thông tin hợp đồng để chỉnh sửa.')
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [contractId, contractType]);

  const handleSaveMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (medStartDate && medEndDate && medStartDate > medEndDate) {
      setSaveError('Ngày kết thúc hợp đồng phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }

    if (medMemberCount < 1) {
      setSaveError('Số thành viên tham gia phải tối thiểu là 1.');
      return;
    }

    if (medTotalAmount < 0) {
      setSaveError('Tổng giá trị hợp đồng không hợp lệ.');
      return;
    }

    setIsSaving(true);
    try {
      const nextDoctorId = medDoctorId === 'UNASSIGNED' ? null : medDoctorId;

      if (nextDoctorId && nextDoctorId !== initialMedDoctorId) {
        await contractsApi.assignDoctor(contractId, { doctorId: nextDoctorId });
      }

      const updated = await contractsApi.updateMedicalContract(contractId, {
        contractStatus: medStatus,
        doctorId: nextDoctorId,
        startDate: medStartDate || undefined,
        endDate: medEndDate || undefined,
        memberCount: Number(medMemberCount),
        totalAmount: Number(medTotalAmount),
        additionalTerms: medAdditionalTerms.trim(),
        adminNote: medAdminNote.trim() || undefined,
      });

      setMedicalDetail((prev) => (prev ? { ...prev, ...updated } : updated));
      setInitialMedDoctorId(medDoctorId);
      toast.success('Đã cập nhật thông tin Hợp đồng Y tế 4 bên thành công!');
      router.push('/admin/contracts');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể lưu thay đổi hợp đồng y tế.');
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isStaffingEditable = Boolean(
    staffingDetail &&
      staffingDetail.status === 'DRAFT' &&
      !staffingDetail.facilitySigned &&
      (staffingDetail.rawStatus === 'PENDING_FACILITY_SIGNATURE' ||
        staffingDetail.rawStatus === 'REVISION_REQUESTED' ||
        !staffingDetail.rawStatus)
  );

  const handleSaveStaffing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!isStaffingEditable) {
      setSaveError(
        'Chỉ có thể chỉnh sửa điều khoản khi hợp đồng đang chờ CSYT ký hoặc ở trạng thái yêu cầu chỉnh sửa.'
      );
      return;
    }

    if (stValidFrom && stValidTo && stValidFrom > stValidTo) {
      setSaveError('Ngày hết hiệu lực phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }

    if (stFacilityShare < 50 || stFacilityShare > 95) {
      setSaveError('Tỷ lệ doanh thu Cơ sở Y tế phải nằm trong khoảng 50% đến 95%.');
      return;
    }

    setIsSaving(true);
    try {
      await contractsApi.updateStaffingContract(contractId, {
        facilitySharePercent: Number(stFacilityShare),
        platformSharePercent: 100 - Number(stFacilityShare),
        validFrom: stValidFrom || undefined,
        validTo: stValidTo || undefined,
        contractTerms: stTerms.trim(),
      });

      toast.success('Đã cập nhật Hợp đồng Cung ứng Nhân lực B2B thành công!');
      router.push('/admin/contracts');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể lưu thay đổi hợp đồng B2B.');
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const contractCode =
    resolvedType === 'staffing'
      ? staffingDetail?.contractNumber || contractId
      : medicalDetail?.contractNumber || contractId;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị hệ thống', href: '/admin' },
          { label: 'Hợp đồng & Pháp lý', href: '/admin/contracts' },
          { label: `Sửa hợp đồng ${contractCode}` },
        ]}
        title={
          resolvedType === 'staffing'
            ? `Cập nhật Hợp đồng B2B · ${contractCode}`
            : `Cập nhật Hợp đồng Y tế 4 Bên · ${contractCode}`
        }
        description={
          resolvedType === 'staffing'
            ? 'Điều chỉnh tỷ lệ chia sẻ doanh thu, thời hạn hiệu lực, trạng thái và nội dung điều khoản hợp đồng khung CSYT.'
            : 'Cập nhật trạng thái hiệu lực, thời hạn, phân công bác sĩ CCHN và điều khoản bổ sung hợp đồng chăm sóc gia đình.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Link href="/admin/contracts">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                <span>Quay lại danh sách</span>
              </Link>
            </Button>
            {resolvedType === 'medical' && (
              <Button asChild variant="secondary" size="sm" className="rounded-xl gap-1.5">
                <Link href={`/admin/contracts/${contractId}/review`}>
                  <FileText className="size-3.5" aria-hidden="true" />
                  <span>Xem hồ sơ thẩm định 4 bên</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="rounded-2xl p-6 space-y-4 lg:col-span-8">
            <Skeleton className="h-6 w-56" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-28 w-full" />
          </Card>
          <Card className="rounded-2xl p-6 space-y-4 lg:col-span-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
          </Card>
        </div>
      ) : loadError ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="size-4" />
          <AlertTitle>Không thể tải dữ liệu hợp đồng</AlertTitle>
          <AlertDescription className="mt-1 space-y-3">
            <p className="text-xs">{loadError}</p>
            <Button asChild size="sm" variant="outline" className="rounded-xl bg-background">
              <Link href="/admin/contracts">Quay lại danh sách Hợp đồng</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : resolvedType === 'staffing' && staffingDetail ? (
        <form onSubmit={handleSaveStaffing} className="grid grid-cols-1 gap-6 lg:grid-cols-12" noValidate>
          <div className="space-y-6 lg:col-span-8">
            {saveError && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs font-medium">{saveError}</AlertDescription>
              </Alert>
            )}

            {staffingDetail.revisionReason && (
              <Alert className="rounded-2xl border-rose-200 bg-rose-50 text-rose-900">
                <AlertCircle className="size-4 text-rose-600" />
                <AlertDescription className="text-xs font-medium text-rose-900">
                  <strong>Lý do Cơ sở Y tế yêu cầu chỉnh sửa:</strong> {staffingDetail.revisionReason}
                  <span className="mt-1 block text-[11px] font-normal text-rose-800">
                    Sau khi lưu điều chỉnh, hệ thống sẽ giữ nguyên mã hợp đồng và gửi lại bản dự thảo + phiên ký Documenso mới cho CSYT.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Handshake className="size-4 text-primary" aria-hidden="true" />
                  <span>Thông tin Chung &amp; Phân chia Doanh thu B2B</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Đối tác: <strong className="text-foreground">{staffingDetail.facilityName}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-5">
                {!isStaffingEditable && (
                  <Alert className="rounded-xl border-amber-200 bg-amber-50 text-amber-900">
                    <AlertCircle className="size-4 text-amber-700" />
                    <AlertDescription className="text-xs">
                      Hợp đồng hiện ở trạng thái không thể sửa trực tiếp. Để hủy dự thảo hoặc chấm dứt hợp đồng đang hiệu lực (kèm kiểm tra ràng buộc), vui lòng thao tác tại danh sách Hợp đồng B2B.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Trạng thái hợp đồng B2B</Label>
                    <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-muted/40 px-3 text-xs font-semibold">
                      <span>
                        {staffingDetail.rawStatus === 'REVISION_REQUESTED'
                          ? 'CSYT yêu cầu chỉnh sửa'
                          : staffingDetail.rawStatus === 'PENDING_ADMIN_SIGNATURE'
                            ? 'Chờ Admin ký (Bước 2)'
                            : STAFFING_STATUS_LABELS[staffingDetail.status]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="st-share" className="text-xs font-semibold">
                      Tỷ lệ CSYT hưởng (%)
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="st-share"
                        type="number"
                        min={50}
                        max={95}
                        disabled={!isStaffingEditable}
                        value={stFacilityShare}
                        onChange={(e) => setStFacilityShare(Number(e.target.value))}
                        className="w-28 tabular-nums"
                      />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        Nền tảng FamiDoc: <strong>{100 - stFacilityShare}%</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-xl bg-muted/40 p-3">
                  <div className="flex items-center justify-between text-xs font-medium tabular-nums">
                    <span className="text-primary font-semibold">CSYT: {stFacilityShare}%</span>
                    <span className="text-muted-foreground">FamiDoc: {100 - stFacilityShare}%</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-primary transition-all"
                      style={{ width: `${Math.min(95, Math.max(50, stFacilityShare))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="st-from" className="text-xs font-semibold">
                      Ngày bắt đầu hiệu lực
                    </Label>
                    <Input
                      id="st-from"
                      type="date"
                      disabled={!isStaffingEditable}
                      value={stValidFrom}
                      onChange={(e) => setStValidFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="st-to" className="text-xs font-semibold">
                      Ngày kết thúc hiệu lực
                    </Label>
                    <Input
                      id="st-to"
                      type="date"
                      disabled={!isStaffingEditable}
                      value={stValidTo}
                      onChange={(e) => setStValidTo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="st-terms" className="text-xs font-semibold">
                    Điều khoản bổ sung / Thỏa thuận đặc thù (tùy chọn)
                  </Label>
                  <Textarea
                    id="st-terms"
                    rows={5}
                    disabled={!isStaffingEditable}
                    value={stTerms}
                    onChange={(e) => setStTerms(e.target.value)}
                    placeholder="Nhập các thỏa thuận bổ sung riêng với CSYT (nếu có). Để trống nếu giữ nguyên 10 điều khoản chuẩn B2B..."
                    className="font-sans text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    10 Điều khoản chuẩn B2B (cơ chế đối soát, thuế, bảo hiểm nghề nghiệp, bảo mật dữ liệu, bàn giao và Documenso) được tự động cố định trong bản PDF.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-end gap-2.5 border-t border-border/60 pt-4">
                <Button asChild type="button" variant="outline" className="rounded-xl">
                  <Link href="/admin/contracts">Hủy</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !isStaffingEditable}
                  className="rounded-xl gap-1.5 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu cập nhật B2B'}</span>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Summary Card */}
          <div className="space-y-4 lg:col-span-4">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-bold">Trạng thái Ký số B2B</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mã hợp đồng</span>
                  <span className="tabular-nums font-semibold text-primary">{staffingDetail.contractNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cơ sở Y tế (Bên B - Bước 1)</span>
                  <Badge variant="outline" className={cn(staffingDetail.facilitySigned ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800')}>
                    {staffingDetail.facilitySigned ? 'Đã ký' : 'Chờ ký'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nền tảng FamiDoc (Bên A - Bước 2)</span>
                  <Badge variant="outline" className={cn(staffingDetail.adminSigned ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-muted text-muted-foreground')}>
                    {staffingDetail.adminSigned ? 'Đã ký' : 'Chờ ký'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSaveMedical} className="grid grid-cols-1 gap-6 lg:grid-cols-12" noValidate>
          <div className="space-y-6 lg:col-span-8">
            {saveError && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs font-medium">{saveError}</AlertDescription>
              </Alert>
            )}

            {/* Block 1: Trạng thái, thời hạn & giá trị */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Calendar className="size-4 text-primary" aria-hidden="true" />
                  <span>Thông tin Hiệu lực &amp; Giá trị Hợp đồng 4 Bên</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Mã hợp đồng: <strong className="tabular-nums text-primary">{contractCode}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Trạng thái hợp đồng</Label>
                    <Select
                      value={medStatus}
                      onValueChange={(v) => setMedStatus(v as BackendContractStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(BACKEND_STATUS_LABELS) as BackendContractStatus[]).map((st) => (
                          <SelectItem key={st} value={st}>
                            {BACKEND_STATUS_LABELS[st]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="med-members" className="text-xs font-semibold">
                      Số thành viên áp dụng
                    </Label>
                    <Input
                      id="med-members"
                      type="number"
                      min={1}
                      max={20}
                      value={medMemberCount}
                      onChange={(e) => setMedMemberCount(Number(e.target.value))}
                      className="tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="med-start" className="text-xs font-semibold">
                      Ngày bắt đầu
                    </Label>
                    <Input
                      id="med-start"
                      type="date"
                      value={medStartDate}
                      onChange={(e) => setMedStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="med-end" className="text-xs font-semibold">
                      Ngày kết thúc
                    </Label>
                    <Input
                      id="med-end"
                      type="date"
                      value={medEndDate}
                      onChange={(e) => setMedEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="med-amount" className="text-xs font-semibold">
                      Tổng giá trị (VNĐ)
                    </Label>
                    <Input
                      id="med-amount"
                      type="number"
                      min={0}
                      step={50000}
                      value={medTotalAmount}
                      onChange={(e) => setMedTotalAmount(Number(e.target.value))}
                      className="tabular-nums"
                    />
                  </div>
                </div>

                <Separator />

                {/* Phân công Bác sĩ phụ trách */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <Stethoscope className="size-3.5 text-primary" aria-hidden="true" />
                    <span>Bác sĩ Gia đình phụ trách (Bên B)</span>
                  </Label>
                  <Select value={medDoctorId} onValueChange={setMedDoctorId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn bác sĩ phụ trách..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">Chưa gán bác sĩ phụ trách</SelectItem>
                      {doctorOptions.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                          {doc.specialty ? ` · ${doc.specialty}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Thay đổi bác sĩ tại đây sẽ đồng bộ phân công trên hợp đồng 4 bên.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="med-terms" className="text-xs font-semibold">
                    Điều khoản bổ sung &amp; Cam kết y tế
                  </Label>
                  <Textarea
                    id="med-terms"
                    rows={4}
                    value={medAdditionalTerms}
                    onChange={(e) => setMedAdditionalTerms(e.target.value)}
                    placeholder="Nhập các điều khoản bổ sung hoặc ghi chú y tế đặc biệt của hộ gia đình..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="med-note" className="text-xs font-semibold">
                    Ghi chú kiểm toán của Admin (Audit Note)
                  </Label>
                  <Textarea
                    id="med-note"
                    rows={2}
                    value={medAdminNote}
                    onChange={(e) => setMedAdminNote(e.target.value)}
                    placeholder="Lý do điều chỉnh hợp đồng (VD: Gia hạn thời gian hiệu lực, điều chuyển bác sĩ theo yêu cầu CSYT)..."
                  />
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-end gap-2.5 border-t border-border/60 pt-4">
                <Button asChild type="button" variant="outline" className="rounded-xl">
                  <Link href="/admin/contracts">Hủy bỏ</Link>
                </Button>
                <Button type="submit" disabled={isSaving} className="rounded-xl gap-1.5 cursor-pointer">
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  <span>{isSaving ? 'Đang cập nhật...' : 'Lưu cập nhật Hợp đồng'}</span>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Tóm tắt các bên tham gia */}
          <div className="space-y-4 lg:col-span-4">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-bold">Thông tin Các bên Tham gia</CardTitle>
                <CardDescription className="text-xs">
                  Tổng giá trị: <strong className="text-primary tabular-nums">{formatCurrencyVND(medTotalAmount)}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <Users className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Bên A · Đại diện Hộ gia đình</p>
                    <p className="font-semibold text-foreground">
                      {medicalDetail?.familyUnit?.representativeUser?.fullName || 'Đại diện Hộ gia đình'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {medicalDetail?.familyUnit?.homeAddress || 'Chưa cập nhật địa chỉ'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-2.5">
                  <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Bên C · Cơ sở Y tế Đối tác</p>
                    <p className="font-semibold text-foreground">
                      {medicalDetail?.facility?.facilityName || '—'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {medicalDetail?.facility?.address || ''}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tiến độ chữ ký (Documenso)
                  </p>
                  {(['FAMILY_REP', 'ASSIGNED_DOCTOR', 'HEALTHCARE_FACILITY', 'ADMIN'] as const).map(
                    (roleKey) => {
                      const sig = medicalDetail?.signatures?.find((s) => s.signerRole === roleKey);
                      const labelMap = {
                        FAMILY_REP: 'Bên A (Gia đình)',
                        ASSIGNED_DOCTOR: 'Bên B (Bác sĩ)',
                        HEALTHCARE_FACILITY: 'Bên C (CSYT)',
                        ADMIN: 'Bên D (FamiDoc)',
                      };
                      return (
                        <div key={roleKey} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{labelMap[roleKey]}</span>
                          {sig ? (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                              <CheckCircle2 className="size-3.5" /> Đã ký
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Clock className="size-3.5" /> Chờ ký
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
