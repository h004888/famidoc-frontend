'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';
import { doctorsApi } from '@/lib/api/doctors.api';
import { extractErrorMessage } from '@/lib/api';
import {
  isValidVietnameseMobilePhone,
  normalizeVietnameseMobilePhone,
} from '@/lib/phone-vn';
import { ConfirmDialog, EmptyState, PageHeader } from '@/components/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type WorkspaceTab = 'FACILITIES' | 'DOCTOR_VERIFY';
type FacilityStatusFilter = 'ALL' | 'PENDING_LEGAL' | 'LEGAL_SUBMITTED' | 'ACTIVE' | 'REJECTED';
type DoctorStatusFilter = 'ALL' | 'FACILITY_VERIFIED' | 'PENDING_FACILITY_REVIEW' | 'PENDING_SUBMISSION';

interface DoctorVerificationItem {
  id: string;
  doctorName: string;
  facilityName: string;
  specialty: string;
  cchnNumber: string;
  issueDate: string;
  issuingAuthority: string;
  onboardingStatus: string;
}

function getEffectiveOnboardingStatus(
  fac: Pick<AdminFacilityItem, 'onboardingStatus' | 'status'>
): AdminFacilityItem['onboardingStatus'] {
  if (fac.onboardingStatus === 'ACTIVE' || fac.status === 'ACTIVE') return 'ACTIVE';
  if (fac.onboardingStatus === 'REJECTED') return 'REJECTED';
  if (fac.onboardingStatus === 'LEGAL_SUBMITTED') return 'LEGAL_SUBMITTED';
  return 'PENDING_LEGAL';
}

function formatDateTimeVN(value?: string): string {
  if (!value) return 'Chưa rõ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa rõ';
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortId(id: string): string {
  if (!id) return '—';
  return id.length > 18 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function FacilityStatusBadge({
  facility,
  compact = false,
}: {
  facility: Pick<AdminFacilityItem, 'onboardingStatus' | 'status'>;
  compact?: boolean;
}) {
  const effective = getEffectiveOnboardingStatus(facility);

  switch (effective) {
    case 'PENDING_LEGAL':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
          {compact ? 'Chờ nộp Pháp lý' : 'Đã cấp Portal • Chờ nộp Pháp lý'}
        </Badge>
      );
    case 'LEGAL_SUBMITTED':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" aria-hidden="true" />
          {compact ? 'Chờ Duyệt Cấp 2' : 'Đã nộp GPHĐ • Chờ Duyệt Cấp 2'}
        </Badge>
      );
    case 'ACTIVE':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
          {compact ? 'ACTIVE' : 'Đang Hoạt Động (ACTIVE)'}
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
          Từ chối / Cần bổ sung
        </Badge>
      );
  }
}

export function AdminFacilitiesView() {
  const [facilities, setFacilities] = useState<AdminFacilityItem[]>([]);
  const [doctorsList, setDoctorsList] = useState<DoctorVerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('FACILITIES');
  const [statusFilter, setStatusFilter] = useState<FacilityStatusFilter>('ALL');
  const [doctorFilter, setDoctorFilter] = useState<DoctorStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  const [approvingDoctorId, setApprovingDoctorId] = useState<string | null>(null);
  const [confirmApproveDoctor, setConfirmApproveDoctor] = useState<{
    id: string;
    doctorName: string;
  } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorPage, setDoctorPage] = useState(1);
  const itemsPerPage = 6;

  // Create Facility dialog states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingFacility, setIsCreatingFacility] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState({
    facilityName: '',
    representativeName: '',
    email: '',
    phone: '',
    address: '',
  });

  const fetchFacilitiesData = useCallback(async () => {
    setIsLoading(true);
    setFacilitiesError(null);
    try {
      const res: any = await facilitiesApi.getAdminFacilities();
      if (res && res.data && Array.isArray(res.data)) {
        setFacilities(res.data);
      } else if (Array.isArray(res)) {
        setFacilities(res);
      } else {
        setFacilities([]);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách cơ sở y tế Admin:', err);
      setFacilitiesError(extractErrorMessage(err, 'Không thể tải danh sách cơ sở y tế từ máy chủ.'));
      setFacilities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDoctorsData = useCallback(async () => {
    setIsDoctorsLoading(true);
    setDoctorsError(null);
    try {
      const docs: any[] = await doctorsApi.getAdminDoctors();
      if (Array.isArray(docs)) {
        const mapped: DoctorVerificationItem[] = docs
          .filter(
            (d: any) =>
              d.onboardingStatus === 'FACILITY_VERIFIED' ||
              d.onboardingStatus === 'PENDING_FACILITY_REVIEW' ||
              d.onboardingStatus === 'PENDING_SUBMISSION'
          )
          .map((d: any) => {
            const creds = Array.isArray(d.credentials) ? d.credentials : [];
            const cred =
              creds.find((c: any) => c.credentialType === 'PRACTICE_LICENSE_CCHN') ??
              (creds.length > 0 ? creds[0] : null);
            return {
              id: d.id,
              doctorName: d.doctorName || d.fullName || 'Bác sĩ',
              facilityName: d.facility?.facilityName || 'Cơ sở Y tế Đối tác',
              specialty: d.specialty || 'Y học Gia đình',
              cchnNumber: cred?.certificateNumber || 'Chưa nộp CCHN',
              issueDate: cred?.issueDate ? new Date(cred.issueDate).toLocaleDateString('vi-VN') : 'Chưa có',
              issuingAuthority: cred?.issuingAuthority || 'Bộ Y Tế',
              onboardingStatus: d.onboardingStatus,
            };
          });
        setDoctorsList(mapped);
      } else {
        setDoctorsList([]);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách Bác sĩ thẩm định Admin:', err);
      setDoctorsError(extractErrorMessage(err, 'Không thể tải danh sách bác sĩ chờ thẩm định.'));
      setDoctorsList([]);
    } finally {
      setIsDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilitiesData();
    fetchDoctorsData();
  }, [fetchFacilitiesData, fetchDoctorsData]);

  const handleRefreshAll = () => {
    fetchFacilitiesData();
    fetchDoctorsData();
  };

  // Counters
  const { countPendingLegal, countLegalSubmitted, countActive, countRejected } = useMemo(() => {
    let pendingLegal = 0;
    let legalSubmitted = 0;
    let active = 0;
    let rejected = 0;

    for (const fac of facilities) {
      const effective = getEffectiveOnboardingStatus(fac);
      if (effective === 'PENDING_LEGAL') pendingLegal += 1;
      else if (effective === 'LEGAL_SUBMITTED') legalSubmitted += 1;
      else if (effective === 'ACTIVE') active += 1;
      else if (effective === 'REJECTED') rejected += 1;
    }

    return {
      countPendingLegal: pendingLegal,
      countLegalSubmitted: legalSubmitted,
      countActive: active,
      countRejected: rejected,
    };
  }, [facilities]);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return facilities.filter((fac) => {
      const matchesSearch =
        !q ||
        fac.facilityName.toLowerCase().includes(q) ||
        fac.representativeName.toLowerCase().includes(q) ||
        fac.email.toLowerCase().includes(q) ||
        fac.phone.toLowerCase().includes(q) ||
        fac.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const effective = getEffectiveOnboardingStatus(fac);
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'PENDING_LEGAL') return effective === 'PENDING_LEGAL';
      if (statusFilter === 'LEGAL_SUBMITTED') return effective === 'LEGAL_SUBMITTED';
      if (statusFilter === 'ACTIVE') return effective === 'ACTIVE';
      if (statusFilter === 'REJECTED') return effective === 'REJECTED';
      return true;
    });
  }, [facilities, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFacilities.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedFacilities = filteredFacilities.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    const q = doctorSearchQuery.trim().toLowerCase();
    return doctorsList.filter((doc) => {
      const matchesSearch =
        !q ||
        doc.doctorName.toLowerCase().includes(q) ||
        doc.facilityName.toLowerCase().includes(q) ||
        doc.cchnNumber.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (doctorFilter === 'ALL') return true;
      return doc.onboardingStatus === doctorFilter;
    });
  }, [doctorsList, doctorSearchQuery, doctorFilter]);

  const doctorTotalPages = Math.max(1, Math.ceil(filteredDoctors.length / itemsPerPage));
  const safeDoctorPage = Math.min(doctorPage, doctorTotalPages);
  const paginatedDoctors = filteredDoctors.slice(
    (safeDoctorPage - 1) * itemsPerPage,
    safeDoctorPage * itemsPerPage
  );

  const countDoctorsReady = useMemo(
    () => doctorsList.filter((d) => d.onboardingStatus === 'FACILITY_VERIFIED').length,
    [doctorsList]
  );
  const countDoctorsFacilityPending = useMemo(
    () => doctorsList.filter((d) => d.onboardingStatus === 'PENDING_FACILITY_REVIEW').length,
    [doctorsList]
  );
  const countDoctorsPendingSubmission = useMemo(
    () => doctorsList.filter((d) => d.onboardingStatus === 'PENDING_SUBMISSION').length,
    [doctorsList]
  );

  const selectFacilityFilter = (filter: FacilityStatusFilter) => {
    setWorkspaceTab('FACILITIES');
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  // Admin tạo mới tài khoản CSYT và gửi mật khẩu ngẫu nhiên qua email
  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const cleanFacilityName = createForm.facilityName.trim();
    const cleanRepName = createForm.representativeName.trim();
    const cleanEmail = createForm.email.trim();
    const normalizedPhone = normalizeVietnameseMobilePhone(createForm.phone);
    const cleanAddress = createForm.address.trim();

    if (!cleanFacilityName) {
      nextErrors.facilityName = 'Tên cơ sở y tế không được để trống';
    } else if (cleanFacilityName.length < 3 || cleanFacilityName.length > 255) {
      nextErrors.facilityName = 'Tên cơ sở y tế phải từ 3 đến 255 ký tự';
    }
    if (!cleanRepName) {
      nextErrors.representativeName = 'Tên người đại diện không được để trống';
    } else if (cleanRepName.length < 2 || cleanRepName.length > 100) {
      nextErrors.representativeName = 'Tên người đại diện phải từ 2 đến 100 ký tự';
    }
    if (!cleanEmail) {
      nextErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      nextErrors.email = 'Định dạng email không hợp lệ';
    }
    if (!createForm.phone.trim()) {
      nextErrors.phone = 'Số điện thoại không được để trống';
    } else if (!isValidVietnameseMobilePhone(createForm.phone)) {
      nextErrors.phone = 'Số điện thoại không đúng định dạng di động Việt Nam';
    }
    if (cleanAddress.length > 500) {
      nextErrors.address = 'Địa chỉ tối đa 500 ký tự';
    }

    if (Object.keys(nextErrors).length > 0) {
      setCreateErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    setCreateErrors({});
    setIsCreatingFacility(true);
    try {
      const created = await facilitiesApi.createFacilityByAdmin({
        facilityName: cleanFacilityName,
        representativeName: cleanRepName,
        email: cleanEmail,
        phone: normalizedPhone,
        ...(cleanAddress ? { address: cleanAddress } : {}),
      });
      setFacilities((prev) => [created, ...prev]);
      toast.success(
        `Đã khởi tạo tài khoản Cơ sở Y tế "${created.facilityName}". Mật khẩu ngẫu nhiên đã được gửi tới email ${created.email}.`
      );
      setShowCreateModal(false);
      setCreateErrors({});
      setCreateForm({
        facilityName: '',
        representativeName: '',
        email: '',
        phone: '',
        address: '',
      });
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể khởi tạo tài khoản Cơ sở Y tế.'));
    } finally {
      setIsCreatingFacility(false);
    }
  };

  // Duyệt Bác sĩ Cấp 2
  const handleApproveDoctorPlatform = async (docId: string, docName: string) => {
    setApprovingDoctorId(docId);
    try {
      await doctorsApi.platformApproveCredentials(docId, {
        approved: true,
      });
      setDoctorsList((prev) => prev.filter((d) => d.id !== docId));
      toast.success(`Đã phê duyệt CCHN và kích hoạt Bác sĩ ${docName}.`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể duyệt cấp 2 cho Bác sĩ.'));
    } finally {
      setApprovingDoctorId(null);
    }
  };

  const kpiCards: Array<{
    key: FacilityStatusFilter;
    label: string;
    value: number;
    description: string;
    pill?: string;
    pillClass?: string;
    icon: React.ReactNode;
    iconBoxClass: string;
  }> = [
    {
      key: 'ALL',
      label: 'Tổng cơ sở y tế',
      value: facilities.length,
      description: 'Đối tác bệnh viện & phòng khám',
      icon: <Building2 className="h-5 w-5" aria-hidden="true" />,
      iconBoxClass: 'bg-primary/10 text-primary',
    },
    {
      key: 'PENDING_LEGAL',
      label: 'Chờ Nộp Pháp Lý',
      value: countPendingLegal,
      description: 'Đã cấp tài khoản, chờ CSYT gửi GPHĐ',
      pill: 'Chờ hồ sơ',
      pillClass: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: <Clock className="h-5 w-5" aria-hidden="true" />,
      iconBoxClass: 'bg-amber-50 text-amber-600',
    },
    {
      key: 'LEGAL_SUBMITTED',
      label: 'Chờ Duyệt Pháp Lý',
      value: countLegalSubmitted,
      description: 'Cần đối soát GPHĐ & MST CSDL Quốc gia',
      pill: 'Cần duyệt gấp',
      pillClass: 'border-indigo-200 bg-indigo-50 text-indigo-800',
      icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
      iconBoxClass: 'bg-indigo-50 text-indigo-600',
    },
    {
      key: 'ACTIVE',
      label: 'Đang hoạt động',
      value: countActive,
      description: 'Được phép mở hợp đồng B2B & Bác sĩ',
      pill: 'ACTIVE',
      pillClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      icon: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
      iconBoxClass: 'bg-emerald-50 text-emerald-600',
    },
  ];

  const facilityFilterTabs: Array<{ key: FacilityStatusFilter; label: string; count: number }> = [
    { key: 'ALL', label: 'Tất cả', count: facilities.length },
    { key: 'PENDING_LEGAL', label: 'Chờ Nộp Pháp Lý', count: countPendingLegal },
    { key: 'LEGAL_SUBMITTED', label: 'Chờ Pháp Lý Cấp 2', count: countLegalSubmitted },
    { key: 'ACTIVE', label: 'Đang Hoạt Động', count: countActive },
    { key: 'REJECTED', label: 'Từ chối / Bổ sung', count: countRejected },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] font-sans text-slate-900 antialiased">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Standardized Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Quản trị hệ thống', href: '/admin' },
            { label: 'Quản trị & Thẩm định Cơ sở Y tế' },
          ]}
          title="Quản trị & Thẩm định Cơ sở Y tế"
          description="Quy trình hợp tác nền tảng B2B: Admin khởi tạo tài khoản đối tác qua email & thẩm định hồ sơ pháp lý."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="cursor-pointer rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tạo Cơ sở Y tế mới</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isLoading || isDoctorsLoading}
                className="cursor-pointer rounded-xl bg-white text-xs font-semibold shadow-xs"
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5 text-slate-500', (isLoading || isDoctorsLoading) && 'animate-spin')}
                  aria-hidden="true"
                />
                <span>Làm mới</span>
              </Button>
            </div>
          }
        />

        {/* Interactive KPI Stat Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {kpiCards.map((card) => {
            const isSelected = workspaceTab === 'FACILITIES' && statusFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectFacilityFilter(card.key)}
                className={cn(
                  'group flex flex-col justify-between rounded-2xl border bg-white p-4.5 text-left shadow-xs transition-all cursor-pointer outline-hidden hover:border-slate-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/50',
                  isSelected
                    ? 'border-primary/60 ring-2 ring-primary/15 bg-gradient-to-br from-white to-blue-50/30'
                    : 'border-slate-200/90'
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                        card.iconBoxClass
                      )}
                    >
                      {card.icon}
                    </span>
                    <span className="truncate text-xs font-bold text-slate-700">{card.label}</span>
                  </div>
                  {card.pill && (
                    <Badge
                      variant="outline"
                      className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', card.pillClass)}
                    >
                      {card.pill}
                    </Badge>
                  )}
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {card.value}
                  </span>
                  <span className="text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Lọc danh sách →
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500 line-clamp-1">{card.description}</p>
              </button>
            );
          })}
        </div>

        {/* Workspace Tabs: Facilities vs Doctor CCHN Verification */}
        <Tabs
          value={workspaceTab}
          onValueChange={(value) => setWorkspaceTab(value as WorkspaceTab)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-xl bg-slate-200/70 p-1 sm:w-auto">
              <TabsTrigger
                value="FACILITIES"
                className="group cursor-pointer gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold data-[state=active]:text-primary sm:text-sm"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>Danh sách Cơ sở Y tế</span>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-slate-100 px-2 py-0 text-[11px] font-bold text-slate-700 tabular-nums group-data-[state=active]:bg-blue-50 group-data-[state=active]:text-primary"
                >
                  {facilities.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="DOCTOR_VERIFY"
                className="group cursor-pointer gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold data-[state=active]:text-primary sm:text-sm"
              >
                <Stethoscope className="h-4 w-4" aria-hidden="true" />
                <span>Duyệt CCHN Bác Sĩ</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'rounded-full px-2 py-0 text-[11px] font-bold tabular-nums',
                    countDoctorsReady > 0
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-700 group-data-[state=active]:bg-blue-50 group-data-[state=active]:text-primary'
                  )}
                >
                  {doctorsList.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: DANH SÁCH CƠ SỞ Y TẾ (ADMIN LIST FACILITIES)                       */}
          {/* ========================================================================= */}
          {workspaceTab === 'FACILITIES' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <Card className="rounded-2xl border-slate-200/90 py-3.5 shadow-xs">
                <CardContent className="flex flex-col gap-3 px-4">
                  <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5">
                    {facilityFilterTabs.map((tab) => {
                      const active = statusFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => selectFacilityFilter(tab.key)}
                          className={cn(
                            'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40',
                            active
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                          )}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                              active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                            )}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full sm:max-w-md">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      aria-label="Tìm kiếm cơ sở y tế"
                      placeholder="Tìm tên CSYT, đại diện, email, SĐT..."
                      className="h-9 rounded-xl bg-slate-50/70 pl-9 pr-8 text-xs focus-visible:bg-white"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        aria-label="Xóa từ khóa tìm kiếm"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {facilitiesError && (
                <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50 text-rose-900">
                  <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                    <span>{facilitiesError}</span>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={fetchFacilitiesData}
                      className="cursor-pointer rounded-lg text-xs font-semibold"
                    >
                      Thử lại
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <Card className="rounded-2xl border-slate-200/90 shadow-xs">
                  <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500" role="status">
                    <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
                    <span className="text-xs sm:text-sm font-medium">Đang tải danh sách cơ sở y tế...</span>
                  </CardContent>
                </Card>
              ) : paginatedFacilities.length === 0 ? (
                <EmptyState
                  icon="local_hospital"
                  title="Không tìm thấy cơ sở y tế phù hợp"
                  description={
                    searchQuery || statusFilter !== 'ALL'
                      ? 'Không có cơ sở y tế nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.'
                      : 'Chưa có cơ sở y tế nào đăng ký trên nền tảng.'
                  }
                  action={
                    (searchQuery || statusFilter !== 'ALL') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setCurrentPage(1);
                        }}
                        className="cursor-pointer rounded-xl text-xs font-semibold"
                      >
                        Xóa bộ lọc
                      </Button>
                    )
                  }
                />
              ) : (
                <Card className="overflow-hidden rounded-2xl border-slate-200/90 py-0 gap-0 shadow-xs">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table className="text-xs sm:text-sm">
                      <TableHeader>
                        <TableRow className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold tracking-wider text-slate-600 uppercase hover:bg-slate-50/90">
                          <TableHead className="px-4 py-3.5 text-slate-600">Cơ sở Y tế</TableHead>
                          <TableHead className="px-4 py-3.5 text-slate-600">Đại diện &amp; Liên hệ</TableHead>
                          <TableHead className="px-4 py-3.5 text-slate-600">Ngày đăng ký</TableHead>
                          <TableHead className="px-4 py-3.5 text-slate-600">Tiến trình Onboarding</TableHead>
                          <TableHead className="px-4 py-3.5 text-right text-slate-600">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 text-slate-700">
                        {paginatedFacilities.map((fac) => (
                          <TableRow key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                            <TableCell className="max-w-[290px] px-4 py-3.5 whitespace-normal">
                              <div className="flex items-start gap-2.5">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary mt-0.5" aria-hidden="true">
                                  <Building2 className="h-3.5 w-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm truncate" title={fac.facilityName}>
                                    {fac.facilityName}
                                  </div>
                                  <div className="mt-0.5 truncate text-[11px] text-slate-500" title={fac.address}>
                                    {fac.address}
                                  </div>
                                  <div
                                    className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 tabular-nums"
                                    title={fac.id}
                                  >
                                    ID: {formatShortId(fac.id)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="max-w-[260px] px-4 py-3.5 whitespace-normal">
                              <div className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                                {fac.representativeName}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Phone className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                                  <span>{fac.phone}</span>
                                </span>
                                <span className="inline-flex min-w-0 items-center gap-1">
                                  <Mail className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                                  <span className="truncate" title={fac.email}>
                                    {fac.email}
                                  </span>
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3.5 text-[11px] text-slate-600 tabular-nums whitespace-nowrap">
                              {formatDateTimeVN(fac.createdAt)}
                            </TableCell>

                            <TableCell className="px-4 py-3.5 whitespace-nowrap">
                              <FacilityStatusBadge facility={fac} />
                            </TableCell>

                            <TableCell className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end">
                                <Button
                                  asChild
                                  size="xs"
                                  variant="secondary"
                                  className="h-8 rounded-lg border border-blue-200/80 bg-blue-50 px-3 text-xs font-semibold text-primary hover:bg-blue-100"
                                >
                                  <Link href={`/admin/facilities/${fac.id}`}>Chi tiết &amp; Thẩm định</Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View Cards */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {paginatedFacilities.map((fac) => (
                      <div key={fac.id} className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold leading-snug text-slate-900">
                              {fac.facilityName}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{fac.address}</p>
                          </div>
                          <span
                            className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 tabular-nums"
                            title={fac.id}
                          >
                            {formatShortId(fac.id)}
                          </span>
                        </div>

                        <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <span>{fac.representativeName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Phone className="h-3 w-3 text-slate-400" aria-hidden="true" />
                              {fac.phone}
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <Mail className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                              <span className="truncate">{fac.email}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            Đăng ký: {formatDateTimeVN(fac.createdAt)}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                          <FacilityStatusBadge facility={fac} compact />

                          <div className="flex items-center gap-2">
                            <Button
                              asChild
                              size="sm"
                              className="h-9 rounded-lg px-3 text-xs font-semibold"
                            >
                              <Link href={`/admin/facilities/${fac.id}`}>Chi tiết &amp; Thẩm định</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:flex-row">
                      <div className="text-xs text-slate-500 tabular-nums">
                        Hiển thị {(safeCurrentPage - 1) * itemsPerPage + 1} –{' '}
                        {Math.min(safeCurrentPage * itemsPerPage, filteredFacilities.length)} trên tổng số{' '}
                        {filteredFacilities.length} cơ sở
                      </div>
                      <Pagination
                        currentPage={safeCurrentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                      />
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: THẨM ĐỊNH CCHN BÁC SĨ CẤP 2 (PLATFORM-APPROVE)                     */}
          {/* ========================================================================= */}
          {workspaceTab === 'DOCTOR_VERIFY' && (
            <div className="space-y-4">
              <Card className="rounded-2xl border-slate-200/90 py-3.5 shadow-xs">
                <CardContent className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { key: 'ALL', label: 'Tất cả', count: doctorsList.length },
                        { key: 'FACILITY_VERIFIED', label: 'Sẵn sàng duyệt Cấp 2', count: countDoctorsReady },
                        {
                          key: 'PENDING_FACILITY_REVIEW',
                          label: 'Chờ CSYT duyệt Cấp 1',
                          count: countDoctorsFacilityPending,
                        },
                        {
                          key: 'PENDING_SUBMISSION',
                          label: 'Chờ BS nộp hồ sơ',
                          count: countDoctorsPendingSubmission,
                        },
                      ] as const
                    ).map((item) => {
                      const active = doctorFilter === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setDoctorFilter(item.key);
                            setDoctorPage(1);
                          }}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40',
                            active
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                          )}
                        >
                          <span>{item.label}</span>
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                              active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                            )}
                          >
                            {item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full lg:w-80 shrink-0">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      type="text"
                      value={doctorSearchQuery}
                      onChange={(e) => {
                        setDoctorSearchQuery(e.target.value);
                        setDoctorPage(1);
                      }}
                      aria-label="Tìm kiếm bác sĩ chờ thẩm định"
                      placeholder="Tìm tên bác sĩ, CSYT, số CCHN..."
                      className="h-9 rounded-xl bg-slate-50/70 pl-9 pr-8 text-xs focus-visible:bg-white"
                    />
                    {doctorSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setDoctorSearchQuery('');
                          setDoctorPage(1);
                        }}
                        aria-label="Xóa từ khóa tìm kiếm bác sĩ"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {doctorsError && (
                <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50 text-rose-900">
                  <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                    <span>{doctorsError}</span>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={fetchDoctorsData}
                      className="cursor-pointer rounded-lg text-xs font-semibold"
                    >
                      Thử lại
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Card className="overflow-hidden rounded-2xl border-slate-200/90 py-0 gap-0 shadow-xs">
                <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                      Danh sách Bác sĩ chờ Hậu kiểm CSDL Quốc gia (Duyệt Cấp 2)
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Các bác sĩ đã được Cơ sở y tế thẩm định nội bộ Cấp 1. Quản trị viên tra cứu số CCHN trên Cổng dịch vụ công để kích hoạt khám bệnh.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 tabular-nums"
                  >
                    {filteredDoctors.length} bác sĩ chờ xử lý
                  </Badge>
                </div>

                {isDoctorsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500" role="status">
                    <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
                    <span className="text-xs sm:text-sm font-medium">Đang tải danh sách bác sĩ...</span>
                  </div>
                ) : paginatedDoctors.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon="stethoscope"
                      title="Không có bác sĩ nào đang chờ thẩm định"
                      description={
                        doctorSearchQuery || doctorFilter !== 'ALL'
                          ? 'Thử xóa bộ lọc hoặc đổi từ khóa tìm kiếm để xem các bác sĩ khác.'
                          : 'Tất cả bác sĩ đủ điều kiện đã được xử lý.'
                      }
                      className="border-0 shadow-none"
                    />
                  </div>
                ) : (
                  <>
                    {/* Desktop Doctors Table */}
                    <div className="hidden md:block">
                      <Table className="text-xs sm:text-sm">
                        <TableHeader>
                          <TableRow className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold tracking-wider text-slate-600 uppercase hover:bg-slate-50/90">
                            <TableHead className="px-4 py-3.5 text-slate-600">Bác sĩ &amp; Chuyên khoa</TableHead>
                            <TableHead className="px-4 py-3.5 text-slate-600">Cơ sở y tế trực thuộc</TableHead>
                            <TableHead className="px-4 py-3.5 text-slate-600">Số CCHN &amp; Cơ quan cấp</TableHead>
                            <TableHead className="px-4 py-3.5 text-slate-600">Trạng thái</TableHead>
                            <TableHead className="px-4 py-3.5 text-right text-slate-600">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 text-slate-700">
                          {paginatedDoctors.map((doc) => {
                            const isReady = doc.onboardingStatus === 'FACILITY_VERIFIED';
                            const isApproving = approvingDoctorId === doc.id;
                            return (
                              <TableRow key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                                <TableCell className="px-4 py-3.5 whitespace-normal">
                                  <div className="font-bold text-slate-900">{doc.doctorName}</div>
                                  <div className="text-[11px] text-slate-500">{doc.specialty}</div>
                                </TableCell>
                                <TableCell className="px-4 py-3.5 whitespace-normal">
                                  <span className="font-medium text-slate-800">{doc.facilityName}</span>
                                </TableCell>
                                <TableCell className="px-4 py-3.5 whitespace-normal">
                                  <div className="font-semibold text-primary tabular-nums">{doc.cchnNumber}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {doc.issuingAuthority} • {doc.issueDate}
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3.5 whitespace-nowrap">
                                  {isReady ? (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800"
                                    >
                                      CSYT đã duyệt Cấp 1
                                    </Badge>
                                  ) : doc.onboardingStatus === 'PENDING_FACILITY_REVIEW' ? (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800"
                                    >
                                      Chờ CSYT duyệt Cấp 1
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700"
                                    >
                                      Chờ BS nộp hồ sơ
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="px-4 py-3.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      asChild
                                      variant="outline"
                                      size="xs"
                                      className="h-8 rounded-lg px-2.5 text-xs font-semibold"
                                    >
                                      <Link href={`/admin/doctors/${doc.id}`}>Hồ sơ BS</Link>
                                    </Button>
                                    {isReady ? (
                                      <Button
                                        type="button"
                                        size="xs"
                                        disabled={isApproving}
                                        onClick={() =>
                                          setConfirmApproveDoctor({ id: doc.id, doctorName: doc.doctorName })
                                        }
                                        className="h-8 cursor-pointer rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                                      >
                                        {isApproving ? 'Đang kích hoạt...' : 'Duyệt Cấp 2 (Kích hoạt ACTIVE)'}
                                      </Button>
                                    ) : (
                                      <span className="text-[11px] italic text-slate-400">
                                        {doc.onboardingStatus === 'PENDING_FACILITY_REVIEW'
                                          ? 'Chờ CSYT thẩm định trước'
                                          : 'Chờ bác sĩ nộp đủ 3 file'}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Doctors Cards */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {paginatedDoctors.map((doc) => {
                        const isReady = doc.onboardingStatus === 'FACILITY_VERIFIED';
                        const isApproving = approvingDoctorId === doc.id;
                        return (
                          <div key={doc.id} className="space-y-2.5 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-bold text-slate-900">{doc.doctorName}</div>
                                <div className="text-xs text-slate-500">{doc.specialty}</div>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'shrink-0 rounded-full text-[10px] font-semibold',
                                  isReady
                                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                                    : doc.onboardingStatus === 'PENDING_FACILITY_REVIEW'
                                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                                      : 'border-slate-200 bg-slate-100 text-slate-700'
                                )}
                              >
                                {isReady
                                  ? 'CSYT đã duyệt Cấp 1'
                                  : doc.onboardingStatus === 'PENDING_FACILITY_REVIEW'
                                    ? 'Chờ CSYT duyệt Cấp 1'
                                    : 'Chờ BS nộp hồ sơ'}
                              </Badge>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
                              <div>
                                <span className="font-semibold text-slate-700">CSYT:</span> {doc.facilityName}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">CCHN:</span>{' '}
                                <span className="font-semibold text-primary tabular-nums">{doc.cchnNumber}</span> ({doc.issuingAuthority})
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button asChild variant="outline" size="sm" className="h-9 rounded-lg text-xs font-semibold">
                                <Link href={`/admin/doctors/${doc.id}`}>Hồ sơ BS</Link>
                              </Button>
                              {isReady && (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isApproving}
                                  onClick={() =>
                                    setConfirmApproveDoctor({ id: doc.id, doctorName: doc.doctorName })
                                  }
                                  className="h-9 cursor-pointer rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  {isApproving ? 'Đang kích hoạt...' : 'Duyệt Cấp 2'}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {doctorTotalPages > 1 && (
                      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:flex-row">
                        <div className="text-xs text-slate-500 tabular-nums">
                          Hiển thị {(safeDoctorPage - 1) * itemsPerPage + 1} –{' '}
                          {Math.min(safeDoctorPage * itemsPerPage, filteredDoctors.length)} trên tổng số{' '}
                          {filteredDoctors.length} bác sĩ
                        </div>
                        <Pagination
                          currentPage={safeDoctorPage}
                          totalPages={doctorTotalPages}
                          onPageChange={(page) => setDoctorPage(page)}
                        />
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}
        </Tabs>

        {/* ========================================================================= */}
        {/* DIALOG: ADMIN TẠO TÀI KHOẢN CƠ SỞ Y TẾ MỚI                                */}
        {/* ========================================================================= */}
        <Dialog
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) setCreateErrors({});
          }}
        >
          <DialogContent className="rounded-2xl border-slate-200 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Tạo tài khoản Cơ sở Y tế mới
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Hệ thống sẽ sinh mật khẩu ngẫu nhiên an toàn và tự động gửi thông tin đăng nhập qua email liên hệ của cơ sở y tế.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFacility} noValidate className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="create-facility-name" className="text-xs font-semibold">
                  Tên Cơ sở Y tế <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="create-facility-name"
                  required
                  value={createForm.facilityName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, facilityName: e.target.value }))}
                  placeholder="Bệnh viện Đa khoa Quốc tế FamiDoc"
                  className="rounded-xl text-xs"
                />
                {createErrors.facilityName && (
                  <p className="text-[11px] font-medium text-rose-600">{createErrors.facilityName}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-facility-rep" className="text-xs font-semibold">
                  Người đại diện <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="create-facility-rep"
                  required
                  value={createForm.representativeName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, representativeName: e.target.value }))}
                  placeholder="TS.BS Nguyễn Văn A"
                  className="rounded-xl text-xs"
                />
                {createErrors.representativeName && (
                  <p className="text-[11px] font-medium text-rose-600">{createErrors.representativeName}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="create-facility-email" className="text-xs font-semibold">
                    Email liên hệ <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="create-facility-email"
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="contact@hospital.vn"
                    className="rounded-xl text-xs"
                  />
                  {createErrors.email && (
                    <p className="text-[11px] font-medium text-rose-600">{createErrors.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-facility-phone" className="text-xs font-semibold">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="create-facility-phone"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="0912345678"
                    className="rounded-xl text-xs"
                  />
                  {createErrors.phone && (
                    <p className="text-[11px] font-medium text-rose-600">{createErrors.phone}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-facility-address" className="text-xs font-semibold">
                  Địa chỉ trụ sở
                </Label>
                <Input
                  id="create-facility-address"
                  value={createForm.address}
                  onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Số 10 Phố Huế, Hai Bà Trưng, Hà Nội"
                  className="rounded-xl text-xs"
                />
                {createErrors.address && (
                  <p className="text-[11px] font-medium text-rose-600">{createErrors.address}</p>
                )}
              </div>
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCreatingFacility}
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingFacility}
                  className="cursor-pointer rounded-xl text-xs font-bold"
                >
                  {isCreatingFacility ? 'Đang khởi tạo...' : 'Khởi tạo & Gửi Email'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={Boolean(confirmApproveDoctor)}
          onOpenChange={(open) => {
            if (!open) setConfirmApproveDoctor(null);
          }}
          title="Xác nhận phê duyệt Cấp 2 (Kích hoạt ACTIVE)"
          description={
            confirmApproveDoctor
              ? `Bạn xác nhận đã hậu kiểm đủ 3 chứng chỉ (CCHN, Bằng chuyên môn, Y học gia đình) và hồ sơ pháp lý CSYT cho Bác sĩ ${confirmApproveDoctor.doctorName}?`
              : ''
          }
          confirmLabel="Xác nhận kích hoạt ACTIVE"
          cancelLabel="Kiểm tra lại"
          isLoading={Boolean(approvingDoctorId)}
          onConfirm={async () => {
            if (!confirmApproveDoctor) return;
            const target = confirmApproveDoctor;
            await handleApproveDoctorPlatform(target.id, target.doctorName);
            setConfirmApproveDoctor(null);
          }}
        />
      </div>
    </div>
  );
}
