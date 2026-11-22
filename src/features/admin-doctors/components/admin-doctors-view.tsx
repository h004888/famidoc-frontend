'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { doctorsApi, type DoctorCredentialDto } from '@/lib/api/doctors.api';
import { extractErrorMessage } from '@/lib/api';
import { Pagination } from '@/components/ui/pagination';
import { DashboardPageShell } from '@/components/shared';
import { AdminQuotaProposalsPanel } from './admin-quota-proposals-panel';
import { AdminMatchingQueuePanel } from './admin-matching-queue-panel';

interface DoctorRow {
  id: string;
  doctorName: string;
  facilityName: string;
  specialty: string;
  cchnNumber: string;
  issueDate: string;
  issuingAuthority: string;
  onboardingStatus: string;
  experienceYears?: number;
  credentialsCount: number;
  maxPanelCapacity: number;
  activePanelCount: number;
}

export function AdminDoctorsView() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [quotaTarget, setQuotaTarget] = useState<DoctorRow | null>(null);
  const [quotaInput, setQuotaInput] = useState('5');
  const [quotaReason, setQuotaReason] = useState('');
  const [savingQuota, setSavingQuota] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'FACILITY_VERIFIED' | 'PENDING_FACILITY_REVIEW' | 'ACTIVE' | 'PENDING_SUBMISSION'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchDoctors = async () => {
    setIsLoading(true);
    setLoadError(undefined);
    try {
      const data: any[] = await doctorsApi.getAdminDoctors();
      if (Array.isArray(data)) {
        const mapped: DoctorRow[] = data.map((d: any) => {
          const creds: DoctorCredentialDto[] = Array.isArray(d.credentials) ? d.credentials : [];
          const cred = creds.find((c) => c.credentialType === 'PRACTICE_LICENSE_CCHN');
          return {
            id: d.id,
            doctorName: d.doctorName || d.fullName || 'Bác sĩ',
            facilityName: d.facility?.facilityName || d.facilityName || 'Cơ sở Y tế Đối tác',
            specialty: d.specialty || 'Chưa cập nhật',
            cchnNumber: cred?.certificateNumber || 'Chưa nộp CCHN',
            issueDate: cred?.issueDate ? new Date(cred.issueDate).toLocaleDateString('vi-VN') : 'Chưa có',
            issuingAuthority: cred?.issuingAuthority || '—',
            onboardingStatus: d.onboardingStatus || (d.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING_SUBMISSION'),
            experienceYears: d.experienceYears ?? 0,
            credentialsCount: creds.length,
            maxPanelCapacity: typeof d.maxPanelCapacity === 'number' ? d.maxPanelCapacity : 5,
            activePanelCount: typeof d.activePanelCount === 'number' ? d.activePanelCount : 0,
          };
        });
        setDoctors(mapped);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Không thể tải danh sách bác sĩ.'));
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleOpenQuotaModal = (doc: DoctorRow) => {
    setQuotaTarget(doc);
    setQuotaInput(String(doc.maxPanelCapacity));
    setQuotaReason('');
  };

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaTarget) return;
    const parsed = Number(quotaInput);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      toast.error('Hạn mức hộ gia đình phải là số nguyên từ 1 đến 100.');
      return;
    }
    if (quotaReason.trim().length < 5) {
      toast.error('Vui lòng nhập lý do điều chỉnh (tối thiểu 5 ký tự).');
      return;
    }
    setSavingQuota(true);
    try {
      await doctorsApi.updateDoctorPanelCapacity(quotaTarget.id, {
        maxPanelCapacity: parsed,
        reason: quotaReason.trim(),
      });
      toast.success(`Đã cập nhật hạn mức của ${quotaTarget.doctorName} thành ${parsed} hộ.`);
      setQuotaTarget(null);
      await fetchDoctors();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể cập nhật hạn mức bác sĩ.'));
    } finally {
      setSavingQuota(false);
    }
  };

  if (loadError) return (
    <DashboardPageShell>
      <p role="alert">{loadError} <button type="button" className="underline" onClick={fetchDoctors}>Thử lại</button></p>
    </DashboardPageShell>
  );

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.cchnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return doc.onboardingStatus === statusFilter;
  });

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage) || 1;
  const paginatedDoctors = filteredDoctors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingVerifyCount = doctors.filter((d) => d.onboardingStatus === 'FACILITY_VERIFIED').length;
  const activeCount = doctors.filter((d) => d.onboardingStatus === 'ACTIVE').length;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'FACILITY_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            CSYT đã duyệt • Chờ Admin duyệt Cấp 2
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã kích hoạt hành nghề (ACTIVE)
          </span>
        );
      case 'PENDING_FACILITY_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Chờ CSYT duyệt Cấp 1
          </span>
        );
      case 'PENDING_SUBMISSION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Chưa nộp hồ sơ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardPageShell containerClassName="pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <Link href="/admin" className="hover:text-primary transition-colors">Quản trị hệ thống</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Thẩm định Nhân sự Y tế</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý &amp; Thẩm định CCHN Bác sĩ
          </h1>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Chờ Admin duyệt Tầng 2</p>
            <p className="text-2xl font-bold text-slate-900">{pendingVerifyCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bác sĩ đang hoạt động (ACTIVE)</p>
            <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">stethoscope</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng bác sĩ trên hệ thống</p>
            <p className="text-2xl font-bold text-slate-900">{doctors.length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({doctors.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('FACILITY_VERIFIED');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              statusFilter === 'FACILITY_VERIFIED'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Chờ Admin duyệt ({pendingVerifyCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('PENDING_FACILITY_REVIEW');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              statusFilter === 'PENDING_FACILITY_REVIEW'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            Chờ CSYT duyệt Cấp 1 ({doctors.filter((d) => d.onboardingStatus === 'PENDING_FACILITY_REVIEW').length})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ACTIVE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Đã kích hoạt ({activeCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên bác sĩ, CSYT, CCHN..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Đang tải danh sách bác sĩ...
          </div>
        ) : paginatedDoctors.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Không tìm thấy bác sĩ nào phù hợp với bộ lọc.
          </div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Bác sĩ &amp; Chuyên môn</th>
                  <th className="py-3.5 px-4">Cơ sở Y tế trực thuộc</th>
                  <th className="py-3.5 px-4">Chứng chỉ hành nghề (CCHN)</th>
                  <th className="py-3.5 px-4">Trạng thái thẩm định</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{doc.doctorName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{doc.specialty} • {doc.experienceYears} năm kinh nghiệm</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">ID: {doc.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{doc.facilityName}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="tabular-nums font-semibold text-slate-800">{doc.cchnNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Cấp ngày: {doc.issueDate} • {doc.issuingAuthority} • {doc.credentialsCount}/3 chứng chỉ
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(doc.onboardingStatus)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenQuotaModal(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">tune</span>
                          Hạn mức ({doc.activePanelCount}/{doc.maxPanelCapacity})
                        </button>
                        <Link
                          href={`/admin/doctors/${doc.id}`}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                            doc.onboardingStatus === 'FACILITY_VERIFIED'
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">visibility</span>
                          {doc.onboardingStatus === 'FACILITY_VERIFIED' ? 'Hậu kiểm & Duyệt' : 'Xem hồ sơ'}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {paginatedDoctors.map((doc) => (
              <div key={doc.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{doc.doctorName}</div>
                    <div className="text-xs text-slate-500">
                      {doc.specialty} • {doc.experienceYears} năm kinh nghiệm
                    </div>
                  </div>
                  {renderStatusBadge(doc.onboardingStatus)}
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-700">CSYT:</span> {doc.facilityName}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">CCHN:</span>{' '}
                    <span className="font-semibold text-slate-800 tabular-nums">{doc.cchnNumber}</span> ({doc.issuingAuthority})
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenQuotaModal(doc)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">tune</span>
                    Hạn mức ({doc.activePanelCount}/{doc.maxPanelCapacity})
                  </button>
                  <Link
                    href={`/admin/doctors/${doc.id}`}
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                      doc.onboardingStatus === 'FACILITY_VERIFIED'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    {doc.onboardingStatus === 'FACILITY_VERIFIED' ? 'Hậu kiểm & Duyệt' : 'Xem hồ sơ'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      <AdminQuotaProposalsPanel />
      <AdminMatchingQueuePanel />

      {quotaTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <form
            onSubmit={(e) => void handleSaveQuota(e)}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 border border-slate-200"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Điều chỉnh hạn mức hộ gia đình
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bác sĩ: <strong>{quotaTarget.doctorName}</strong> (đang phụ trách {quotaTarget.activePanelCount} hộ)
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Hạn mức tối đa mới (hộ gia đình)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={quotaInput}
                onChange={(e) => setQuotaInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Lý do điều chỉnh
              </label>
              <textarea
                rows={3}
                value={quotaReason}
                onChange={(e) => setQuotaReason(e.target.value)}
                placeholder="Nhập lý do Admin điều chỉnh hạn mức..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuotaTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingQuota}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {savingQuota ? 'Đang lưu...' : 'Lưu hạn mức'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardPageShell>
  );
}
