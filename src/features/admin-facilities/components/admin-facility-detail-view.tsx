'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';
import { adminApi } from '@/lib/api/admin.api';
import { useAdminQuery } from '@/hooks/use-admin-query';
import { useVietQrBanks } from '@/hooks/use-vietqr-banks';
import { AdminPageNavigation } from '@/components/shared/admin-page-navigation';
import {
  contractsApi,
  normalizeStaffingContract,
  type StaffingContractItem,
} from '@/lib/api/contracts.api';
import { unwrapApiEnvelope } from '@/lib/api/envelope';
import { extractErrorMessage } from '@/lib/api';
import {
  buildVietQrQuickLinkUrl,
  resolveBankByInput,
  resolveVietQrBankId,
} from '@/lib/vietqr';
import { DashboardPageShell, VietQrPreviewCard } from '@/components/shared';

interface AdminFacilityDetailViewProps {
  facilityId: string;
}

function formatContractDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
}

function FacilityAuditTimeline({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const load = useCallback(() => adminApi.auditLogs({ page, resourceName: 'HealthcareFacility', resourceId: id }), [page, id]);
  const { data, loading, error, refresh } = useAdminQuery(load);
  const labels: Record<string, string> = {
    FACILITY_REGISTRATION_SUBMITTED: 'Đã nộp đăng ký hợp tác',
    FACILITY_ACCOUNT_APPROVED: 'Đã duyệt tài khoản',
    FACILITY_ACCOUNT_REJECTED: 'Đã từ chối đăng ký',
    FACILITY_INVITE_RESENT: 'Đã gửi lại mã đặt mật khẩu',
    FACILITY_LEGAL_PROFILE_SUBMITTED: 'Đã nộp hồ sơ pháp lý',
    FACILITY_LEGAL_VERIFIED: 'Đã duyệt hồ sơ pháp lý',
    FACILITY_LEGAL_REJECTED: 'Đã yêu cầu bổ sung hồ sơ pháp lý',
  };
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="font-semibold">Lịch sử thẩm định</h3>
      {loading && <p role="status">Đang tải lịch sử…</p>}
      {error && <p role="alert">{error} <button className="underline" onClick={refresh}>Thử lại</button></p>}
      {data?.items.length === 0 && <p className="text-sm text-slate-500">Chưa có sự kiện trong nhật ký.</p>}
      {data && data.items.length > 0 && (
        <>
          <ol className="divide-y divide-slate-200">
            {data.items.map((event) => <li key={event.id} className="space-y-1 py-3 text-sm">
              <p className="font-medium">{labels[event.action] ?? event.action}</p>
              <p className="text-slate-500">{new Date(event.timestamp).toLocaleString('vi-VN')} · {event.actorUser?.fullName ?? 'Hệ thống'}</p>
              {event.details?.reason && <p>{event.details.reason}</p>}
            </li>)}
          </ol>
          <AdminPageNavigation page={page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      )}
    </section>
  );
}

export function AdminFacilityDetailView({ facilityId }: AdminFacilityDetailViewProps) {
  const router = useRouter();
  const [facility, setFacility] = useState<AdminFacilityItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'LEGAL' | 'BANK' | 'TIMELINE' | 'CONTRACTS'>('GENERAL');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const { banks } = useVietQrBanks();

  const resolvedFacilityBank = useMemo(
    () =>
      facility
        ? resolveBankByInput(banks, {
            bankBin: facility.bankBin,
            bankCode: facility.bankCode,
            bankName: facility.bankName,
          })
        : undefined,
    [banks, facility],
  );

  const facilityBankQrUrl = useMemo(() => {
    if (!facility?.bankAccount) return null;
    const bankId = resolveVietQrBankId(banks, {
      bankBin: facility.bankBin || resolvedFacilityBank?.bin,
      bankCode: facility.bankCode || resolvedFacilityBank?.code,
      bankName: facility.bankName,
    });
    return buildVietQrQuickLinkUrl({
      bankId,
      accountNumber: facility.bankAccount,
      accountName: facility.bankAccountHolder,
      template: 'compact2',
    });
  }, [banks, facility, resolvedFacilityBank]);

  // Danh sách hợp đồng B2B của CSYT này
  const [staffingContracts, setStaffingContracts] = useState<StaffingContractItem[]>([]);
  const [isContractsLoading, setIsContractsLoading] = useState(false);

  // Modal tạo hợp đồng B2B
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [facilityShare, setFacilityShare] = useState<number>(85);
  const [platformShare, setPlatformShare] = useState<number>(15);
  const [validFrom, setValidFrom] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState<string>(
    () => new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [contractTerms, setContractTerms] = useState<string>('');
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // Modal từ chối
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleOpenSignedContract = async (contractId: string) => {
    try {
      const url = await contractsApi.fetchStaffingSignedPdfBlobUrl(contractId);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Không thể mở hợp đồng đã ký.'));
    }
  };

  const fetchStaffingContracts = useCallback(async () => {
    setIsContractsLoading(true);
    try {
      const res = await contractsApi.getStaffingContracts({ facilityId });
      if (res && Array.isArray(res.data)) {
        setStaffingContracts(res.data);
      } else {
        setStaffingContracts([]);
      }
    } catch (err) {
      console.warn('Lỗi tải hợp đồng B2B của CSYT:', err);
      setStaffingContracts([]);
    } finally {
      setIsContractsLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setLoadError(undefined);
      try {
        const data = await facilitiesApi.getAdminFacilityDetail(facilityId);
        if (isMounted) {
          setFacility(data || null);
          void fetchStaffingContracts();
        }
      } catch (err) {
        if (isMounted) {
          setFacility(null);
          setLoadError(extractErrorMessage(err, 'Không thể tải hồ sơ CSYT.'));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [facilityId, fetchStaffingContracts]);

  // Thẩm định pháp lý & Kích hoạt ACTIVE
  const handleVerifyLegal = async () => {
    if (!facility) return;
    setIsActionLoading(true);
    try {
      await facilitiesApi.verifyLegal(facility.id, { approved: true, verified: true });
      setFacility((prev) =>
        prev ? { ...prev, onboardingStatus: 'ACTIVE', status: 'ACTIVE', legalRejectionReason: null } : null
      );
      toast.success(`Thẩm định pháp lý thành công! CSYT "${facility.facilityName}" đã chính thức chuyển sang trạng thái ACTIVE.`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể hậu kiểm pháp lý.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Từ chối / Yêu cầu bổ sung hồ sơ pháp lý
  const handleReject = async () => {
    if (!facility || !rejectReason.trim()) return;
    setIsActionLoading(true);
    const reason = rejectReason.trim();
    try {
      await facilitiesApi.verifyLegal(facility.id, {
        approved: false,
        rejectionReason: reason,
      });
      setFacility((prev) =>
        prev ? { ...prev, onboardingStatus: 'REJECTED', legalRejectionReason: reason } : null
      );
      toast.success('Đã gửi thông báo từ chối / yêu cầu bổ sung hồ sơ tới cơ sở y tế.');
      setRejectReason('');
      setShowRejectModal(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể từ chối hồ sơ.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenLegalDocument = async (docType: 'operating' | 'business' = 'operating') => {
    if (!facility) return;
    try {
      const url = await facilitiesApi.fetchLegalDocumentBlobUrl(facility.id, docType);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể tải bản scan hồ sơ pháp lý.'));
    }
  };

  // Admin Tạo & Gửi Dự Thảo Hợp Đồng B2B trực tiếp cho CSYT này
  const handleCreateAndSendContract = async () => {
    if (!facility) return;
    if (facility.onboardingStatus !== 'ACTIVE' && facility.status !== 'ACTIVE') {
      toast.error('Cơ sở Y tế cần được duyệt hồ sơ pháp lý (ACTIVE) trước khi khởi tạo hợp đồng B2B.');
      return;
    }
    if (facilityShare + platformShare !== 100) {
      toast.error('Tổng tỷ lệ phân chia doanh thu của CSYT và Nền tảng phải bằng đúng 100%.');
      return;
    }

    setIsCreatingContract(true);
    try {
      const res = await contractsApi.createStaffingContract({
        facilityId: facility.id,
        platformCommissionRate: platformShare,
        facilityRevenueRate: facilityShare,
        platformSharePercent: platformShare,
        facilitySharePercent: facilityShare,
        startDate: validFrom,
        endDate: validTo,
        ...(contractTerms.trim() ? { contractTerms: contractTerms.trim() } : {}),
      });

      const rawCreated = unwrapApiEnvelope<{ id?: string } | null>(res);
      const contractNumber = rawCreated?.id ? normalizeStaffingContract(rawCreated).contractNumber : null;
      setShowCreateContractModal(false);
      setContractTerms('');
      setActiveTab('CONTRACTS');
      toast.success(
        contractNumber ? `Đã tạo dự thảo hợp đồng ${contractNumber}.` : 'Đã tạo dự thảo hợp đồng B2B.',
      );
      void fetchStaffingContracts();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể thiết lập hợp đồng B2B trên máy chủ.'));
    } finally {
      setIsCreatingContract(false);
    }
  };

  const getStatusBadge = (status: AdminFacilityItem['onboardingStatus']) => {
    switch (status) {
      case 'PENDING_LEGAL':
      case 'LEGAL_SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Chờ hậu kiểm pháp lý
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã kích hoạt chính thức
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Bị từ chối / Cần bổ sung
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Đang tải chi tiết hồ sơ Cơ sở y tế...</p>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">{loadError ?? 'Không tìm thấy thông tin cơ sở y tế.'}</p>
        <Link
          href="/admin/facilities"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isFacilityActive = facility.onboardingStatus === 'ACTIVE' || facility.status === 'ACTIVE';
  const hasCompleteLegalDocs = Boolean(
    facility.taxCode &&
      facility.operatingLicense &&
      (facility.hasOperatingLicense || facility.hasLegalDocument) &&
      facility.hasBusinessLicense,
  );

  return (
    <DashboardPageShell containerClassName="pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/admin" className="hover:text-primary transition-colors">Quản trị hệ thống</Link>
            <span>/</span>
            <Link href="/admin/facilities" className="hover:text-primary transition-colors">Cơ sở y tế</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{facility.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {facility.facilityName}
            </h1>
            {getStatusBadge(facility.onboardingStatus)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/admin/facilities')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Danh sách
          </button>

          {/* Nút Tạo Hợp Đồng B2B trực tiếp cho CSYT đã ACTIVE */}
          <button
            type="button"
            disabled={!isFacilityActive}
            title={
              isFacilityActive
                ? 'Khởi tạo dự thảo hợp đồng B2B'
                : 'Cơ sở Y tế cần được duyệt pháp lý trước khi tạo hợp đồng B2B'
            }
            onClick={() => setShowCreateContractModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Tạo Hợp Đồng B2B
          </button>
        </div>
      </div>

      {/* Action Bar based on Onboarding Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Quy trình thẩm định đối tác y tế (Flow 2.1)
            </p>
            <p className="text-sm text-slate-200">
              {facility.onboardingStatus === 'PENDING_LEGAL' &&
                'CSYT đã có tài khoản Portal nhưng chưa nộp đủ hồ sơ pháp lý (GPHĐ, MST và 2 tệp scan).'}
              {facility.onboardingStatus === 'LEGAL_SUBMITTED' &&
                'CSYT đã nộp hồ sơ pháp lý. Kiểm tra GPHĐ & ĐKKD bản scan rồi duyệt kích hoạt ACTIVE hoặc yêu cầu bổ sung.'}
              {facility.onboardingStatus === 'ACTIVE' &&
                'Hồ sơ đã kích hoạt ACTIVE. Admin có thể thiết lập hợp đồng cung ứng nhân lực y tế B2B cho cơ sở này.'}
              {facility.onboardingStatus === 'REJECTED' &&
                `Hồ sơ pháp lý đã bị từ chối / yêu cầu bổ sung (${facility.legalRejectionReason || 'Đang chờ CSYT cập nhật và nộp lại'}).`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {facility.onboardingStatus === 'LEGAL_SUBMITTED' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                >
                  Yêu cầu bổ sung / Từ chối
                </button>
                <button
                  type="button"
                  disabled={isActionLoading || !hasCompleteLegalDocs}
                  onClick={handleVerifyLegal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Duyệt Pháp Lý &amp; Kích Hoạt
                </button>
              </>
            )}

            {facility.onboardingStatus === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => setShowCreateContractModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-colors"
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                Tạo Hợp đồng B2B Mới
              </button>
            )}

            {facility.onboardingStatus === 'REJECTED' && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold">
                <span className="material-symbols-outlined text-sm">hourglass_top</span>
                Đang chờ CSYT nộp lại hồ sơ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation (5 Tabs gồm Hợp đồng B2B) */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 text-sm font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('GENERAL')}
          className={`pb-3 pt-1 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'GENERAL'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">info</span>
          1. Thông tin chung
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('LEGAL')}
          className={`pb-3 pt-1 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'LEGAL'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">policy</span>
          2. Hồ sơ pháp lý &amp; GPHĐ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('BANK')}
          className={`pb-3 pt-1 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'BANK'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">account_balance</span>
          3. Thông tin ngân hàng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TIMELINE')}
          className={`pb-3 pt-1 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'TIMELINE'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">timeline</span>
          4. Lịch sử xử lý
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CONTRACTS')}
          className={`pb-3 pt-1 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'CONTRACTS'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">handshake</span>
          5. Hợp đồng B2B &amp; Ký kết ({staffingContracts.length})
        </button>
      </div>

      {/* Tab 1: Thông tin chung */}
      {activeTab === 'GENERAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Định danh Cơ sở Y tế
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block">Tên cơ sở y tế</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{facility.facilityName}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Mã định danh hệ thống (ID)</label>
                <p className="text-xs tabular-nums font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-0.5">
                  {facility.id}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Địa chỉ trụ sở</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{facility.address}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Ngày nộp hồ sơ hợp tác</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">
                  {new Date(facility.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Đại diện pháp luật &amp; Liên hệ
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block">Người đại diện pháp luật</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{facility.representativeName}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Email tiếp nhận tài khoản Portal</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{facility.email}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Số điện thoại hotline</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{facility.phone}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Mã số thuế doanh nghiệp</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{facility.taxCode || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hồ sơ pháp lý & GPHĐ */}
      {activeTab === 'LEGAL' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs text-slate-500 block">Số Giấy phép hoạt động (GPHĐ)</label>
              <p className="text-sm font-semibold text-slate-900 mt-1 tabular-nums">
                {facility.operatingLicense || 'Chưa nộp GPHĐ'}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 block">Cơ quan cấp phép</label>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {facility.licenseIssuer || 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 block">Ngày cấp phép</label>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {facility.licenseDate ? new Date(facility.licenseDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Tài liệu pháp lý đã nộp (2 bản số hóa bắt buộc)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. GPHĐ KBCB */}
              <div className="border border-slate-200 rounded-xl bg-slate-50 p-5 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      1. Giấy phép hoạt động KBCB (GPHĐ)
                    </span>
                    {facility.hasOperatingLicense || facility.hasLegalDocument ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        Đã nộp
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                        Chưa nộp
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Số GPHĐ: <strong className="text-slate-700">{facility.operatingLicense || '—'}</strong>
                  </p>
                </div>

                {facility.hasOperatingLicense || facility.hasLegalDocument ? (
                  <button
                    type="button"
                    onClick={() => handleOpenLegalDocument('operating')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Xem / Tải GPHĐ KBCB
                  </button>
                ) : facility.licenseFiles?.[0] && !facility.licenseFiles[0].startsWith('/api/v1/facilities/') ? (
                  <a
                    href={facility.licenseFiles[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Tải GPHĐ gốc
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic">CSYT chưa tải lên tệp scan GPHĐ KBCB.</p>
                )}
              </div>

              {/* 2. Giấy chứng nhận ĐKKD */}
              <div className="border border-slate-200 rounded-xl bg-slate-50 p-5 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      2. Giấy chứng nhận Đăng ký doanh nghiệp (ĐKKD)
                    </span>
                    {facility.hasBusinessLicense ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        Đã nộp
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                        Chưa nộp
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Mã số thuế: <strong className="text-slate-700">{facility.taxCode || '—'}</strong>
                  </p>
                </div>

                {facility.hasBusinessLicense ? (
                  <button
                    type="button"
                    onClick={() => handleOpenLegalDocument('business')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Xem / Tải Giấy ĐKKD
                  </button>
                ) : (
                  <p className="text-xs text-slate-400 italic">CSYT chưa tải lên tệp scan Giấy ĐKKD.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Thông tin ngân hàng */}
      {activeTab === 'BANK' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-3xl space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Tài khoản thụ hưởng thanh toán &amp; Đối soát doanh thu
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 block">Tên Ngân hàng</label>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {facility.bankName || 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 block">Mã BIN / Code VietQR</label>
              <p className="text-sm font-semibold text-slate-900 tabular-nums mt-0.5">
                {facility.bankBin || facility.bankCode || resolvedFacilityBank
                  ? [
                      facility.bankCode || resolvedFacilityBank?.code,
                      facility.bankBin || resolvedFacilityBank?.bin,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : 'Chưa gắn mã chuẩn'}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 block">Số tài khoản (IBAN / STK)</label>
              <p className="text-base tabular-nums font-bold text-primary mt-0.5 tracking-wider">
                {facility.bankAccount || 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 block">Chủ tài khoản thụ hưởng</label>
              <p className="text-sm font-medium text-slate-900 mt-0.5 uppercase">
                {facility.bankAccountHolder || 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          <VietQrPreviewCard
            qrUrl={facilityBankQrUrl}
            title="Mã VietQR kiểm tra tài khoản thụ hưởng CSYT"
            subtitle="Sử dụng Quick Link chuẩn NAPAS / VietQR SVG để đối soát nhanh tên chủ tài khoản trước khi kích hoạt CSYT hoặc chi trả."
            emptyMessage="CSYT chưa có đủ mã BIN/ngân hàng và số tài khoản hợp lệ để tạo mã VietQR."
            bankLabel={
              resolvedFacilityBank
                ? `${resolvedFacilityBank.shortName} (${resolvedFacilityBank.name})`
                : facility.bankName
            }
            bankBin={facility.bankBin || resolvedFacilityBank?.bin || null}
            bankCode={facility.bankCode || resolvedFacilityBank?.code || null}
            accountNumber={facility.bankAccount}
            accountHolder={facility.bankAccountHolder}
          />

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-600">
              <span className="material-symbols-outlined text-sm">lock</span>
              Tài khoản thụ hưởng cho kỳ đối soát doanh thu.
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Timeline */}
      {activeTab === 'TIMELINE' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-slate-900">Tiến trình thẩm định hồ sơ 4 bước (Flow 2.1)</h3>
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-6 py-2">
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Bước 1: Hoàn tất</p>
              <h4 className="text-sm font-semibold text-slate-900 mt-0.5">Quản trị viên tạo tài khoản Cơ sở Y tế</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(facility.createdAt).toLocaleString('vi-VN')} – Tài khoản Portal kèm mật khẩu ngẫu nhiên đã được gửi qua email liên hệ.
              </p>
            </div>

            <div className="relative">
              <div
                className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  facility.onboardingStatus === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : facility.onboardingStatus === 'PENDING_LEGAL' || facility.onboardingStatus === 'LEGAL_SUBMITTED'
                    ? 'bg-blue-500'
                    : 'bg-slate-300'
                }`}
              />
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  facility.onboardingStatus === 'ACTIVE'
                    ? 'text-emerald-600'
                    : facility.onboardingStatus === 'PENDING_LEGAL' || facility.onboardingStatus === 'LEGAL_SUBMITTED'
                    ? 'text-blue-600'
                    : 'text-slate-400'
                }`}
              >
                Bước 3:{' '}
                {facility.onboardingStatus === 'ACTIVE'
                  ? 'Hoàn tất'
                  : facility.onboardingStatus === 'LEGAL_SUBMITTED'
                  ? 'Đã nộp pháp lý (Chờ ký HĐ B2B)'
                  : facility.onboardingStatus === 'PENDING_LEGAL'
                  ? 'Đang chờ CSYT nộp hồ sơ'
                  : 'Chưa thực hiện'}
              </p>
              <h4 className="text-sm font-semibold text-slate-900 mt-0.5">Hồ sơ pháp lý &amp; Ký hợp đồng khung B2B</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                CSYT tải Giấy phép hoạt động và hoàn thiện ký số điện tử hợp đồng cung ứng nhân lực y tế.
              </p>
            </div>

            <div className="relative">
              <div
                className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  facility.onboardingStatus === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : facility.onboardingStatus === 'LEGAL_SUBMITTED'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-300'
                }`}
              />
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  facility.onboardingStatus === 'ACTIVE'
                    ? 'text-emerald-600'
                    : facility.onboardingStatus === 'LEGAL_SUBMITTED'
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                Bước 4:{' '}
                {facility.onboardingStatus === 'ACTIVE'
                  ? 'Hoàn tất (Đã kích hoạt ACTIVE)'
                  : facility.onboardingStatus === 'LEGAL_SUBMITTED'
                  ? 'Chờ Admin hậu kiểm & kích hoạt'
                  : 'Chưa thực hiện'}
              </p>
              <h4 className="text-sm font-semibold text-slate-900 mt-0.5">Hậu kiểm pháp lý &amp; Kích hoạt chính thức (ACTIVE)</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin xác thực GPHĐ trên CSDL Quốc gia và kích hoạt tài khoản chính thức để mở tiếp nhận bác sĩ.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Hợp đồng B2B & Ký kết */}
      {activeTab === 'CONTRACTS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">handshake</span>
                Hợp đồng Khung Cung ứng Nhân lực Y tế B2B của CSYT
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Quản lý dự thảo và các hợp đồng hợp tác đã phát hành cho <strong>{facility.facilityName}</strong>. Admin có thể tạo hợp đồng trực tiếp tại đây mà không cần nhập lại thông tin đơn vị.
              </p>
            </div>

            <button
              type="button"
              disabled={!isFacilityActive}
              onClick={() => setShowCreateContractModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors self-start md:self-auto shrink-0 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Tạo Dự Thảo Mới
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isContractsLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Đang nạp danh sách hợp đồng B2B...</div>
            ) : staffingContracts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs sm:text-sm space-y-3">
                <p>Cơ sở y tế này chưa có hợp đồng cung ứng nhân lực B2B nào.</p>
                {isFacilityActive ? (
                  <button
                    type="button"
                    onClick={() => setShowCreateContractModal(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold"
                  >
                    Thiết lập hợp đồng đầu tiên ngay
                  </button>
                ) : (
                  <p className="text-xs text-amber-700 font-medium">
                    Cần duyệt hồ sơ pháp lý của cơ sở y tế sang ACTIVE trước khi thiết lập hợp đồng B2B.
                  </p>
                )}
              </div>
            ) : (
              <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Số hợp đồng</th>
                      <th className="py-3 px-4">Tỷ lệ phân chia</th>
                      <th className="py-3 px-4">Thời hạn hiệu lực</th>
                      <th className="py-3 px-4">Hồ sơ hợp đồng</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {staffingContracts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 tabular-nums">{c.contractNumber}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {c.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            CSYT: {c.facilitySharePercent}%
                          </span>{' '}
                          •{' '}
                          <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            FamiDoc: {c.platformSharePercent}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 text-[11px] tabular-nums">
                          {formatContractDate(c.validFrom)} - {formatContractDate(c.validTo)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            <div
                              className={`flex items-center gap-1 font-medium ${
                                c.facilitySigned ? 'text-emerald-700' : 'text-amber-600'
                              }`}
                            >
                              <span>{c.facilitySigned ? '✓' : '●'}</span> Bước 1 - CSYT:{' '}
                              {c.facilitySigned ? 'Đã ký số' : 'Chờ CSYT ký'}
                            </div>
                            <div
                              className={`flex items-center gap-1 font-medium ${
                                c.adminSigned
                                  ? 'text-emerald-700'
                                  : c.facilitySigned
                                    ? 'text-blue-700'
                                    : 'text-slate-400'
                              }`}
                            >
                              <span>{c.adminSigned ? '✓' : c.facilitySigned ? '●' : '○'}</span> Bước 2 - Admin:{' '}
                              {c.adminSigned
                                ? 'Đã ký kích hoạt'
                                : c.facilitySigned
                                  ? 'Tới lượt Admin ký'
                                  : 'Chờ CSYT ký trước'}
                            </div>
                            {c.signedPdfUrl && (
                              <button
                                type="button"
                                onClick={() => void handleOpenSignedContract(c.id)}
                                className="text-xs text-primary underline"
                              >
                                Mở bản đã ký
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {c.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Đang có hiệu lực (ACTIVE)
                            </span>
                          ) : c.rawStatus === 'REVISION_REQUESTED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              CSYT yêu cầu chỉnh sửa
                            </span>
                          ) : c.rawStatus === 'PENDING_ADMIN_SIGNATURE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Chờ Admin ký (Bước 2)
                            </span>
                          ) : c.status === 'TERMINATED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Đã chấm dứt / Hủy
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Dự thảo (Chờ CSYT ký)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href={
                              c.rawStatus === 'REVISION_REQUESTED'
                                ? `/admin/contracts/${c.id}/edit?type=staffing`
                                : '/admin/contracts'
                            }
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">visibility</span>
                            {c.rawStatus === 'REVISION_REQUESTED' ? 'Chỉnh sửa lại' : 'Quản lý HĐ B2B'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div data-testid="facility-contracts-mobile" className="divide-y divide-slate-100 md:hidden">
                {staffingContracts.map((c) => (
                  <div key={c.id} className="space-y-2.5 p-4 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 tabular-nums">{c.contractNumber}</div>
                        <div className="text-[10px] text-slate-400">ID: {c.id}</div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : c.rawStatus === 'REVISION_REQUESTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : c.rawStatus === 'PENDING_ADMIN_SIGNATURE'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : c.status === 'TERMINATED'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {c.status === 'ACTIVE'
                          ? 'ACTIVE'
                          : c.rawStatus === 'REVISION_REQUESTED'
                            ? 'Yêu cầu sửa'
                            : c.rawStatus === 'PENDING_ADMIN_SIGNATURE'
                              ? 'Chờ Admin ký'
                              : c.status === 'TERMINATED'
                                ? 'Đã hủy'
                                : 'Chờ CSYT ký'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 space-y-1 text-slate-600 tabular-nums">
                      <div>
                        Tỷ lệ: <strong className="text-emerald-700">CSYT {c.facilitySharePercent}%</strong> •{' '}
                        <strong className="text-indigo-700">FamiDoc {c.platformSharePercent}%</strong>
                      </div>
                      <div>
                        Hiệu lực: {formatContractDate(c.validFrom)} -{' '}
                        {formatContractDate(c.validTo)}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href={
                          c.rawStatus === 'REVISION_REQUESTED'
                            ? `/admin/contracts/${c.id}/edit?type=staffing`
                            : '/admin/contracts'
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        {c.rawStatus === 'REVISION_REQUESTED' ? 'Chỉnh sửa lại' : 'Quản lý HĐ B2B'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: THIẾT LẬP & GỬI DỰ THẢO HỢP ĐỒNG B2B TRỰC TIẾP CHO CSYT NÀY */}
      {showCreateContractModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">handshake</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Thiết lập Hợp đồng Cung ứng Nhân lực B2B
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hợp đồng nguyên tắc liên kết đối tác y tế gia đình (Flow 2.1 - API 9)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateContractModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Tên CSYT được tự động khóa điền sẵn, không cần gõ lại */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Cơ sở Y tế Đối tác (Bên B):</span>
                  <span className="text-[11px] tabular-nums bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
                    ID: {facility.id}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">{facility.facilityName}</p>
                <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    <strong>Đại diện:</strong> {facility.representativeName}
                  </span>
                  <span>
                    <strong>Email tiếp nhận:</strong> {facility.email}
                  </span>
                  <span>
                    <strong>Tài khoản thụ hưởng:</strong> {facility.bankAccount || 'Chưa cập nhật'} (
                    {facility.bankName || 'Chưa cập nhật'})
                  </span>
                </div>
              </div>

              {/* Tỷ lệ phân chia doanh thu */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Cơ chế Phân chia Doanh thu Gói dịch vụ Y tế:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-semibold block">Tỷ lệ CSYT hưởng (%)</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={facilityShare}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFacilityShare(val);
                        setPlatformShare(100 - val);
                      }}
                      className="mt-1 w-full text-base font-bold text-emerald-900 bg-white border border-emerald-300 rounded-lg p-2 tabular-nums"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <span className="text-xs text-indigo-800 font-semibold block">Tỷ lệ FamiDoc hưởng (%)</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={platformShare}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPlatformShare(val);
                        setFacilityShare(100 - val);
                      }}
                      className="mt-1 w-full text-base font-bold text-indigo-900 bg-white border border-indigo-300 rounded-lg p-2 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Thời hạn hiệu lực */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Thời điểm có hiệu lực:</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Thời điểm hết hạn (01 năm):</label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Điều khoản bổ sung (Hướng A) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Điều khoản bổ sung / Thỏa thuận đặc thù (tùy chọn):
                </label>
                <textarea
                  rows={3}
                  value={contractTerms}
                  onChange={(e) => setContractTerms(e.target.value)}
                  placeholder="Để trống nếu áp dụng nguyên văn 10 Điều khoản chuẩn B2B..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateContractModal(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isCreatingContract}
                onClick={handleCreateAndSendContract}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 shadow-md transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                {isCreatingContract ? 'Đang tạo & Gửi...' : 'Tạo & Gửi Dự Thảo tới CSYT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ chối */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Từ chối / Yêu cầu bổ sung hồ sơ
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Vui lòng nhập lý do cụ thể để gửi thông báo hướng dẫn lại cho cơ sở y tế.
              </p>
            </div>
            <div>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Giấy phép hoạt động mờ không đọc được số quyết định, vui lòng tải lại bản scan màu..."
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isActionLoading || !rejectReason.trim()}
                onClick={handleReject}
                className="px-4 py-2 text-xs sm:text-sm font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                {isActionLoading ? 'Đang gửi...' : 'Gửi thông báo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
