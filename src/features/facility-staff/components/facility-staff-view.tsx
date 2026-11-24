'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  doctorsApi,
  type CreateFacilityDoctorPayload,
  type DoctorQuotaProposalDto,
} from '@/lib/api/doctors.api';
import { extractErrorMessage } from '@/lib/api';
import { DOCTOR_ACADEMIC_TITLE_OPTIONS } from '@/lib/constants/doctor-academic-titles';
import {
  isValidVietnameseMobilePhone,
  normalizeVietnameseMobilePhone,
} from '@/lib/phone-vn';
import { ConfirmDialog } from '@/components/shared';
import { useFacilityVerificationGateState } from '@/components/layout/facility-verification-gate';
import { FacilityDoctorExcelImportModal } from './facility-doctor-excel-import-modal';

const DEFAULT_SPECIALTY_OPTIONS = [
  'Y học gia đình',
  'Khoa Nội Tổng quát',
  'Khoa Nhi',
  'Khoa Nội tiết',
  'Khoa Cấp cứu & Y tế Gia đình',
];

export interface DoctorStaff {
  id: string;
  name: string;
  title: string;
  department: string;
  cchnNumber: string;
  issueDate: string;
  credentialsCount?: number;
  rejectionReason?: string | null;
  panelCap: number;
  maxCap: number;
  rating: number | null;
  totalReviews: number;
  status: 'active' | 'on_leave' | 'pending_approval';
  onboardingStatus?:
    | 'PENDING_SUBMISSION'
    | 'PENDING_FACILITY_REVIEW'
    | 'FACILITY_VERIFIED'
    | 'ACTIVE'
    | 'SUSPENDED';
  email?: string;
  phone?: string;
  experienceYears?: number;
  academicTitle?: string;
}

export function FacilityStaffView() {
  const { facilityProfile } = useFacilityVerificationGateState();
  const hasExplicitNoActiveB2b =
    facilityProfile !== null && facilityProfile.hasActiveStaffingContract === false;

  const [staffList, setStaffList] = useState<DoctorStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Thêm Bác sĩ (tối giản) & Modal Import Excel
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('');
  const [newDoctorExp, setNewDoctorExp] = useState('');
  const [newDoctorDept, setNewDoctorDept] = useState('Y học gia đình');
  const [customDoctorDept, setCustomDoctorDept] = useState('');
  const [newDoctorTitle, setNewDoctorTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmApproveDoctor, setConfirmApproveDoctor] = useState<DoctorStaff | null>(null);
  const [isApprovingDoctor, setIsApprovingDoctor] = useState(false);

  // Modal Thông báo cấp tài khoản thành công (không hiển thị mật khẩu cứng)
  const [createdDoctorInfo, setCreatedDoctorInfo] = useState<{
    name: string;
    email: string;
    specialty: string;
    mailSent: boolean;
    mailWarning?: string;
  } | null>(null);

  // Đề xuất điều chỉnh Quota bác sĩ (Task 5.3)
  const [quotaProposals, setQuotaProposals] = useState<DoctorQuotaProposalDto[]>([]);
  const [quotaTargetDoctor, setQuotaTargetDoctor] = useState<DoctorStaff | null>(null);
  const [requestedMaxPanel, setRequestedMaxPanel] = useState<string>('30');
  const [quotaReason, setQuotaReason] = useState<string>('');
  const [isSubmittingQuota, setIsSubmittingQuota] = useState(false);

  // Tải danh sách bác sĩ trực tiếp từ Backend API
  const fetchDoctors = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const docs = await doctorsApi.getFacilityDoctors();
      if (Array.isArray(docs)) {
        const mapped: DoctorStaff[] = docs.map((d: any, idx: number) => {
          const creds = Array.isArray(d.credentials) ? d.credentials : [];
          const cred =
            creds.find((c: any) => c.credentialType === 'PRACTICE_LICENSE_CCHN') ||
            (creds.length > 0 ? creds[0] : null);
          const cchnNumber =
            cred?.certificateNumber ||
            d.cchnNumber ||
            (d.onboardingStatus === 'PENDING_SUBMISSION' && !cred ? 'Chờ BS nộp hồ sơ' : 'Chưa có');
          const issueDate = cred?.issueDate
            ? new Date(cred.issueDate).toLocaleDateString('vi-VN')
            : d.cchnIssueDate || 'Chưa có';
          return {
            id: d.id || `DOC-00${idx + 1}`,
            name: d.doctorName || d.fullName || 'Bác sĩ',
            title: d.academicTitle ? `${d.academicTitle} • ${d.specialty || 'Y học Gia đình'}` : d.specialty ? `Bác sĩ ${d.specialty}` : 'Bác sĩ Gia đình',
            department: d.specialty || 'Khoa Y học Gia đình',
            cchnNumber,
            issueDate,
            credentialsCount: creds.length,
            rejectionReason: d.rejectionReason || null,
            panelCap: d.activeAndHeldCount ?? d.activePanelCount ?? 0,
            maxCap: d.maxPanelCapacity ?? 30,
            rating: d.ratingAvg ?? null,
            totalReviews: d.totalReviews ?? 0,
            status: d.onboardingStatus === 'ACTIVE' ? 'active' : 'pending_approval',
            onboardingStatus: d.onboardingStatus || 'PENDING_SUBMISSION',
            email: d.email,
            phone: d.phone,
          };
        });
        setStaffList(mapped);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể tải danh sách bác sĩ trực thuộc từ máy chủ.');
      setFetchError(msg);
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuotaProposals = async () => {
    if (typeof doctorsApi.getFacilityQuotaProposals !== 'function') return;
    try {
      const list = await doctorsApi.getFacilityQuotaProposals({ limit: 20 });
      setQuotaProposals(Array.isArray(list) ? list : []);
    } catch {
      setQuotaProposals([]);
    }
  };

  useEffect(() => {
    // Dọn sạch mọi dữ liệu ảo cũ trong LocalStorage của trình duyệt
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('famidoc_facility_doctors');
      } catch {
        // Ignore
      }
    }
    void fetchDoctors();
    void fetchQuotaProposals();
  }, []);

  const handleOpenQuotaModal = (doc: DoctorStaff) => {
    setQuotaTargetDoctor(doc);
    setRequestedMaxPanel(String(doc.maxCap + 5));
    setQuotaReason('');
  };

  const handleSubmitQuotaProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaTargetDoctor || typeof doctorsApi.createQuotaProposal !== 'function') return;
    const parsedMax = Number(requestedMaxPanel);
    if (!Number.isInteger(parsedMax) || parsedMax < 1) {
      toast.error('Hạn mức đề xuất phải là số nguyên >= 1.');
      return;
    }
    setIsSubmittingQuota(true);
    try {
      await doctorsApi.createQuotaProposal(quotaTargetDoctor.id, {
        requestedMaxPanel: parsedMax,
        reason: quotaReason.trim(),
      });
      toast.success(
        `Đã gửi đề xuất điều chỉnh Quota cho ${quotaTargetDoctor.name} lên ${parsedMax} hộ.`
      );
      setQuotaTargetDoctor(null);
      setQuotaReason('');
      await fetchQuotaProposals();
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Không thể gửi đề xuất điều chỉnh quota.')
      );
    } finally {
      setIsSubmittingQuota(false);
    }
  };

  const departmentOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const spec of DEFAULT_SPECIALTY_OPTIONS) {
      seen.set(spec.trim().toLowerCase(), spec);
    }
    for (const doc of staffList) {
      const dept = doc.department?.trim();
      if (!dept) continue;
      const key = dept.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, dept);
      }
    }
    return Array.from(seen.values());
  }, [staffList]);

  const filteredStaff = staffList.filter((doc) => {
    const matchesDept =
      filterDepartment === 'all' ||
      doc.department.trim().toLowerCase() === filterDepartment.trim().toLowerCase() ||
      (filterDepartment.toLowerCase() === 'y học gia đình' &&
        doc.department.trim().toLowerCase() === 'khoa y học gia đình');
    const matchesStatus =
      filterStatus === 'all' ||
      doc.status === filterStatus ||
      doc.onboardingStatus === filterStatus;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.cchnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.email && doc.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.phone && doc.phone.includes(searchQuery));
    return matchesDept && matchesStatus && matchesSearch;
  });

  // Thẩm định Cấp 1 hồ sơ chuyên môn của Bác sĩ
  const handleApprove = async (docId: string) => {
    setIsApprovingDoctor(true);
    try {
      await doctorsApi.facilityApproveCredentials(docId, {
        approved: true,
        verificationNotes: 'Cơ sở y tế đã thẩm định và phê duyệt Cấp 1 hồ sơ chuyên môn',
      });
      setStaffList((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, onboardingStatus: 'FACILITY_VERIFIED', rejectionReason: null } : d
        )
      );
      toast.success(`Đã duyệt Cấp 1 cho Bác sĩ. Hồ sơ đã chuyển sang Admin để đối soát CSDL Quốc gia.`);
      await fetchDoctors();
    } catch (err: any) {
      console.warn('Lỗi thẩm định Cấp 1:', err);
      toast.error(extractErrorMessage(err, 'Không thể thẩm định Cấp 1 trên máy chủ.'));
    } finally {
      setIsApprovingDoctor(false);
    }
  };

  const openCreateDoctorModal = () => {
    setCreateError(null);
    setIsModalOpen(true);
  };

  const closeCreateDoctorModal = () => {
    setCreateError(null);
    setIsModalOpen(false);
  };

  // Khởi tạo Bác sĩ mới trực thuộc (thông tin tối giản, mật khẩu sinh ngẫu nhiên gửi email)
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newDoctorName.trim();
    const cleanEmail = newDoctorEmail.trim();
    const normalizedPhone = normalizeVietnameseMobilePhone(newDoctorPhone);

    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      setCreateError('Họ và tên bác sĩ phải từ 2 đến 100 ký tự.');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setCreateError('Định dạng email đăng nhập không hợp lệ.');
      return;
    }
    if (!newDoctorPhone.trim() || !isValidVietnameseMobilePhone(newDoctorPhone)) {
      setCreateError('Số điện thoại không đúng định dạng di động Việt Nam.');
      return;
    }

    const parsedExp = newDoctorExp.trim() !== '' ? Number(newDoctorExp) : undefined;
    if (
      parsedExp !== undefined &&
      (!Number.isInteger(parsedExp) || parsedExp < 0 || parsedExp > 60)
    ) {
      setCreateError('Số năm kinh nghiệm phải là số nguyên từ 0 đến 60.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    const resolvedDept =
      newDoctorDept === '__CUSTOM__' ? customDoctorDept.trim() : newDoctorDept.trim();
    if (!resolvedDept || resolvedDept.length < 2 || resolvedDept.length > 100) {
      setIsSubmitting(false);
      setCreateError('Chuyên khoa chuyên môn phải từ 2 đến 100 ký tự.');
      return;
    }

    const payload: CreateFacilityDoctorPayload = {
      doctorName: cleanName,
      email: cleanEmail,
      phone: normalizedPhone,
      specialty: resolvedDept,
      ...(parsedExp !== undefined ? { experienceYears: parsedExp } : {}),
      ...(newDoctorTitle.trim() ? { academicTitle: newDoctorTitle.trim() } : {}),
    };

    try {
      const res: any = await doctorsApi.createFacilityDoctor(payload);
      const createdRecord = res?.data ?? res;
      const createdId = createdRecord?.id || 'doc-new';
      const mailSent = createdRecord?.mailSent !== false;
      const mailWarning =
        typeof createdRecord?.mailWarning === 'string' && createdRecord.mailWarning.trim()
          ? createdRecord.mailWarning.trim()
          : undefined;

      const newDoc: DoctorStaff = {
        id: createdId,
        name: cleanName,
        title: newDoctorTitle.trim() ? `${newDoctorTitle.trim()} • ${resolvedDept}` : `Bác sĩ ${resolvedDept}`,
        department: resolvedDept,
        cchnNumber: 'Chờ BS nộp hồ sơ',
        issueDate: 'Chưa nộp',
        credentialsCount: 0,
        panelCap: 0,
        maxCap: 30,
        rating: null,
        totalReviews: 0,
        status: 'pending_approval',
        onboardingStatus: 'PENDING_SUBMISSION',
        email: createdRecord?.email || cleanEmail,
        phone: createdRecord?.phone || normalizedPhone,
        experienceYears: parsedExp ?? 0,
        academicTitle: newDoctorTitle.trim() || undefined,
      };

      setStaffList((prev) => [newDoc, ...prev]);
      fetchDoctors().catch(() => {});

      setIsModalOpen(false);
      setCreateError(null);
      setCreatedDoctorInfo({
        name: cleanName,
        email: createdRecord?.email || cleanEmail,
        specialty: resolvedDept,
        mailSent,
        ...(mailWarning ? { mailWarning } : {}),
      });

      setNewDoctorName('');
      setNewDoctorEmail('');
      setNewDoctorPhone('');
      setNewDoctorExp('');
      setNewDoctorDept('Y học gia đình');
      setCustomDoctorDept('');
      setNewDoctorTitle('');
      if (mailSent) {
        toast.success(`Đã khởi tạo tài khoản Bác sĩ và gửi email thông tin đăng nhập!`);
      } else {
        toast.warning(
          mailWarning || 'Tài khoản đã được tạo nhưng gửi email thông tin đăng nhập thất bại.'
        );
      }
    } catch (err: any) {
      console.warn('Lỗi khi gọi API khởi tạo Bác sĩ:', err?.message || err);
      const errorMsg = extractErrorMessage(
        err,
        'Không thể khởi tạo Bác sĩ trên máy chủ. Vui lòng kiểm tra trạng thái kích hoạt CSYT và Hợp đồng B2B.'
      );
      setCreateError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshList = () => {
    void fetchDoctors();
    toast.info('Đã đồng bộ lại danh sách bác sĩ từ cơ sở dữ liệu.');
  };

  return (
    <div className="min-h-full bg-[#f5f6f8] text-[#0f172a] font-sans antialiased">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
              <span className="material-symbols-outlined text-[17px]">badge</span>
              <span>Cơ sở y tế • Nhân sự trực thuộc (Flow 2.1)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Quản lý Đội ngũ Bác sĩ Trực thuộc
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Khởi tạo tài khoản Bác sĩ trực thuộc, theo dõi tiến trình nộp CCHN và thẩm định Cấp 1 nội bộ.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefreshList}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Làm mới danh sách bác sĩ"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500">refresh</span>
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              disabled={hasExplicitNoActiveB2b}
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Import Excel</span>
            </button>
            <button
              type="button"
              disabled={hasExplicitNoActiveB2b}
              onClick={openCreateDoctorModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Thêm Bác Sĩ Mới</span>
            </button>
          </div>
        </div>

        {hasExplicitNoActiveB2b && (
          <div
            role="status"
            className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <div>
              <strong className="font-bold">Chưa có Hợp đồng Hợp tác B2B đang hiệu lực:</strong>{' '}
              Cơ sở y tế cần có Hợp đồng B2B trạng thái ACTIVE trước khi khởi tạo thêm tài khoản bác sĩ mới.
            </div>
            <Link
              href="/facility/contracts"
              className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0"
            >
              Xem Hợp đồng B2B
            </Link>
          </div>
        )}

        {fetchError && (
          <div
            role="alert"
            className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <span>{fetchError}</span>
            <button
              type="button"
              onClick={() => void fetchDoctors()}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ, email, số CCHN, chuyên khoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Lọc theo chuyên khoa"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="h-9 px-3 bg-slate-50 border border-input rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Tất cả chuyên khoa</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đã kích hoạt (ACTIVE)</option>
              <option value="PENDING_SUBMISSION">Chờ BS nộp CCHN</option>
              <option value="PENDING_FACILITY_REVIEW">Chờ CSYT thẩm định Cấp 1</option>
              <option value="FACILITY_VERIFIED">Đã duyệt Cấp 1 (Chờ Admin)</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Bác sĩ &amp; Chức danh</th>
                  <th className="py-3.5 px-4">Liên hệ &amp; Email</th>
                  <th className="py-3.5 px-4">Chứng chỉ CCHN</th>
                  <th className="py-3.5 px-4">Khoa phòng</th>
                  <th className="py-3.5 px-4 text-center">Panel Cap</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái Onboarding</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Không tìm thấy bác sĩ nào phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((doc) => {
                    const capPercent = doc.maxCap > 0 ? Math.round((doc.panelCap / doc.maxCap) * 100) : 0;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{doc.name}</div>
                          <div className="text-[11px] text-slate-500">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 tracking-wide mt-0.5">ID: {doc.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{doc.email || '—'}</div>
                          <div className="text-[11px] text-slate-500">{doc.phone || '—'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="tabular-nums text-xs text-slate-700 font-semibold">
                            {doc.cchnNumber}
                          </div>
                          <div className="text-[11px] text-slate-400">Cấp ngày: {doc.issueDate}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {doc.department}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="font-semibold text-slate-800">
                            {doc.panelCap} / {doc.maxCap} hộ
                          </div>
                          <div className="w-20 mx-auto bg-slate-100 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${capPercent > 90
                                ? 'bg-rose-500'
                                : capPercent > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                }`}
                              style={{ width: `${capPercent}%` }}
                            ></div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {doc.onboardingStatus === 'ACTIVE' || doc.status === 'active' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Đang hoạt động
                            </span>
                          ) : doc.onboardingStatus === 'FACILITY_VERIFIED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              ● Đã duyệt Cấp 1 (Chờ Admin)
                            </span>
                          ) : doc.onboardingStatus === 'PENDING_FACILITY_REVIEW' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              ● Chờ CSYT duyệt Cấp 1
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                {doc.rejectionReason ? 'Yêu cầu bổ sung hồ sơ' : 'Chờ BS nộp hồ sơ'}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/facility/doctors/${doc.id}`}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                            >
                              Hồ sơ chuyên môn
                            </Link>
                            {doc.onboardingStatus === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleOpenQuotaModal(doc)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0037c1] rounded-lg text-xs font-semibold border border-blue-200 cursor-pointer"
                              >
                                Đề xuất Quota
                              </button>
                            )}
                            {doc.onboardingStatus === 'PENDING_FACILITY_REVIEW' && (
                              <button
                                type="button"
                                onClick={() => setConfirmApproveDoctor(doc)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                              >
                                Duyệt Cấp 1
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredStaff.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">Không tìm thấy bác sĩ phù hợp.</div>
            ) : (
              filteredStaff.map((doc) => (
                <div key={doc.id} className="space-y-2.5 p-4 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{doc.name}</div>
                      <div className="text-[11px] text-slate-500">{doc.title}</div>
                    </div>
                    {doc.onboardingStatus === 'ACTIVE' || doc.status === 'active' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang hoạt động
                      </span>
                    ) : doc.onboardingStatus === 'FACILITY_VERIFIED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Đã duyệt Cấp 1
                      </span>
                    ) : doc.onboardingStatus === 'PENDING_FACILITY_REVIEW' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Chờ CSYT duyệt Cấp 1
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.rejectionReason ? 'Yêu cầu bổ sung' : 'Chờ BS nộp hồ sơ'}
                      </span>
                    )}
                  </div>
                  {doc.rejectionReason && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-800">
                      <strong>Lý do từ chối:</strong> {doc.rejectionReason}
                    </div>
                  )}
                  <div className="rounded-xl bg-slate-50 p-2.5 text-slate-600 tabular-nums">
                    Panel: {doc.panelCap}/{doc.maxCap} hộ • CCHN: {doc.cchnNumber}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/facility/doctors/${doc.id}`}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      Quản lý hồ sơ
                    </Link>
                    {doc.onboardingStatus === 'PENDING_FACILITY_REVIEW' && (
                      <button
                        type="button"
                        onClick={() => setConfirmApproveDoctor(doc)}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                      >
                        Duyệt Cấp 1
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bảng theo dõi đề xuất điều chỉnh Quota đã gửi */}
        {quotaProposals.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              Lịch sử Đề xuất Điều chỉnh Quota ({quotaProposals.length})
            </h2>
            <div className="space-y-2">
              {quotaProposals.map((prop) => (
                <div
                  key={prop.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">
                      {prop.doctor?.doctorName ?? 'Bác sĩ'}
                    </span>{' '}
                    <span className="text-slate-600 tabular-nums">
                      ({prop.currentMaxPanel} → {prop.requestedMaxPanel} hộ)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{prop.reason}</p>
                    {prop.reviewNote && (
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        <strong>Admin:</strong> {prop.reviewNote}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 self-start sm:self-center ${
                      prop.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : prop.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {prop.status === 'APPROVED'
                      ? 'Đã duyệt'
                      : prop.status === 'REJECTED'
                        ? 'Từ chối'
                        : 'Chờ Admin duyệt'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Đề xuất điều chỉnh Quota */}
        {quotaTargetDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Đề xuất điều chỉnh Quota hộ gia đình
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {quotaTargetDoctor.name} • Đang giữ {quotaTargetDoctor.panelCap}/{quotaTargetDoctor.maxCap} hộ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuotaTargetDoctor(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitQuotaProposal} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hạn mức tối đa đề xuất mới (hộ gia đình)
                  </label>
                  <input
                    type="number"
                    min={Math.max(1, quotaTargetDoctor.panelCap)}
                    max={200}
                    required
                    value={requestedMaxPanel}
                    onChange={(e) => setRequestedMaxPanel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lý do đề xuất điều chỉnh
                  </label>
                  <textarea
                    required
                    minLength={5}
                    rows={3}
                    placeholder="VD: Bổ sung điều dưỡng hỗ trợ theo dõi tại nhà..."
                    value={quotaReason}
                    onChange={(e) => setQuotaReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setQuotaTargetDoctor(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuota}
                    className="px-4 py-2 bg-[#0037c1] hover:bg-[#002c9a] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingQuota ? 'Đang gửi...' : 'Gửi đề xuất lên Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Thêm Bác sĩ Mới (Flow 2.1 - API 14) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Khởi tạo Tài khoản Bác sĩ Trực thuộc</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Cấp tài khoản tối giản • Bác sĩ tự hoàn thiện hồ sơ chuyên môn và nộp 3 chứng chỉ bắt buộc</p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateDoctorModal}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDoctor} noValidate className="space-y-3.5">
                {createError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                    <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">error</span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-rose-800">Không thể khởi tạo bác sĩ:</p>
                      <p className="leading-relaxed">{createError}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên Bác sĩ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: ThS.BS Phan Văn Minh"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email đăng nhập <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="minh.phan@ansinhhospital.vn"
                      value={newDoctorEmail}
                      onChange={(e) => setNewDoctorEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0988123456"
                      value={newDoctorPhone}
                      onChange={(e) => setNewDoctorPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Học vị / Học hàm (tùy chọn)
                    </label>
                    <select
                      value={newDoctorTitle}
                      onChange={(e) => setNewDoctorTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                      <option value="">-- Để bác sĩ tự cập nhật --</option>
                      {DOCTOR_ACADEMIC_TITLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số năm kinh nghiệm (tùy chọn)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      placeholder="Bác sĩ có thể cập nhật sau"
                      value={newDoctorExp}
                      onChange={(e) => setNewDoctorExp(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="create-doctor-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                    Khoa phòng chuyên môn
                  </label>
                  <select
                    id="create-doctor-dept"
                    value={newDoctorDept}
                    onChange={(e) => setNewDoctorDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="__CUSTOM__">Khác (nhập chuyên khoa...)</option>
                  </select>
                  {newDoctorDept === '__CUSTOM__' && (
                    <input
                      type="text"
                      aria-label="Nhập chuyên khoa"
                      placeholder="VD: Nhi khoa, Tim mạch can thiệp..."
                      value={customDoctorDept}
                      onChange={(e) => setCustomDoctorDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  )}
                </div>  

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeCreateDoctorModal}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? 'Đang tạo...' : 'Khởi tạo Bác sĩ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Thông Báo Cấp Tài Khoản Bác Sĩ Thành Công */}
        {createdDoctorInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold ${
                  createdDoctorInfo.mailSent
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {createdDoctorInfo.mailSent ? '✓' : '!'}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Khởi Tạo Bác Sĩ Thành Công!</h3>
                {createdDoctorInfo.mailSent ? (
                  <p className="text-xs text-slate-500 mt-1">
                    Tài khoản đã được tạo cho <strong>{createdDoctorInfo.name}</strong> và thông tin đăng nhập kèm mật khẩu ngẫu nhiên an toàn đã được gửi qua email.
                  </p>
                ) : (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <p className="font-semibold">
                      {createdDoctorInfo.mailWarning ||
                        'Tài khoản đã được tạo nhưng gửi email thông tin đăng nhập thất bại.'}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-800">
                      Vui lòng kiểm tra cấu hình gửi mail hoặc hướng dẫn bác sĩ sử dụng chức năng Quên mật khẩu để đặt lại mật khẩu.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email nhận thông báo:</span>
                  <span className="font-semibold text-slate-900 tracking-wide">{createdDoctorInfo.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mật khẩu khởi tạo:</span>
                  {createdDoctorInfo.mailSent ? (
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Đã gửi qua email bác sĩ
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      Gửi email thất bại
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chuyên khoa:</span>
                  <span className="font-semibold text-slate-800">{createdDoctorInfo.specialty}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="font-bold text-amber-700">PENDING_SUBMISSION (Chờ nộp hồ sơ)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Bác sĩ cần đăng nhập vào Portal Bác sĩ, cập nhật thông tin cá nhân và tải lên đủ 3 chứng chỉ bắt buộc để CSYT thẩm định Cấp 1.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreatedDoctorInfo(null)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
                >
                  Đã hiểu &amp; Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(confirmApproveDoctor)}
          onOpenChange={(open) => {
            if (!open && !isApprovingDoctor) setConfirmApproveDoctor(null);
          }}
          title="Xác nhận duyệt Cấp 1 hồ sơ bác sĩ"
          description={
            confirmApproveDoctor
              ? `Bạn xác nhận đã kiểm tra đủ 3 chứng chỉ bắt buộc và phê duyệt Cấp 1 cho Bác sĩ ${confirmApproveDoctor.name}? Hồ sơ sẽ được chuyển lên Quản trị viên FamiDoc thẩm định Cấp 2.`
              : ''
          }
          confirmLabel="Xác nhận duyệt Cấp 1"
          cancelLabel="Kiểm tra lại"
          isLoading={isApprovingDoctor}
          onConfirm={async () => {
            if (!confirmApproveDoctor) return;
            const targetId = confirmApproveDoctor.id;
            await handleApprove(targetId);
            setConfirmApproveDoctor(null);
          }}
        />

        <FacilityDoctorExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImported={fetchDoctors}
        />
      </div>
    </div>
  );
}
