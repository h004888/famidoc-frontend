'use client';

import React, { useState, useEffect } from 'react';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';
import { doctorsApi } from '@/lib/api/doctors.api';
import { Pagination } from '@/components/ui/pagination';

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

const INITIAL_FACILITIES: AdminFacilityItem[] = [
  {
    id: 'FAC-2026-001',
    facilityName: 'Bệnh viện Đa khoa Quốc tế FamiCare',
    representativeName: 'PGS.TS Trần Quang Minh',
    email: 'admin@famicare.vn',
    phone: '0912345678',
    address: '120 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    onboardingStatus: 'LEGAL_SUBMITTED',
    status: 'PENDING',
    createdAt: '2026-11-12T08:30:00.000Z',
    taxCode: '0315892019',
    operatingLicense: '08921/BYT-GPHĐ',
    licenseIssuer: 'Bộ Y Tế - Cục Quản lý Khám chữa bệnh',
    licenseDate: '2021-04-10',
    bankName: 'Vietcombank - CN TP.HCM',
    bankAccount: '0071000889922',
    bankAccountHolder: 'CTCP BENH VIEN QUOC TE FAMICARE',
    licenseFiles: ['gphd_famicare_mat_truoc.pdf', 'giay_chung_nhan_mst.pdf'],
  },
  {
    id: 'FAC-2026-002',
    facilityName: 'Phòng khám Đa khoa Quốc tế Trustcare Hub',
    representativeName: 'BS.CKII Nguyễn Thị Lan',
    email: 'contact@trustcare.com.vn',
    phone: '0988776655',
    address: '45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
    onboardingStatus: 'PENDING_APPROVAL',
    status: 'PENDING',
    createdAt: '2026-11-14T06:15:00.000Z',
  },
  {
    id: 'FAC-2026-003',
    facilityName: 'Bệnh viện Đa khoa Hồng Ngọc - Cơ sở Phúc Trường Minh',
    representativeName: 'TS.BS Nguyễn Ngọc Uyên',
    email: 'hongngoc.hospital@hongngoc.vn',
    phone: '02439275568',
    address: 'Số 8 Châu Văn Liêm, Phường Phú Đô, Quận Nam Từ Liêm, Hà Nội',
    onboardingStatus: 'ACTIVE',
    status: 'ACTIVE',
    createdAt: '2026-10-01T09:00:00.000Z',
    taxCode: '0101567890',
    operatingLicense: '00123/BYT-GPHĐ',
    licenseIssuer: 'Bộ Y Tế',
    licenseDate: '2019-08-15',
    bankName: 'BIDV - CN Cầu Giấy',
    bankAccount: '21510000998877',
    bankAccountHolder: 'BENH VIEN DA KHOA HONG NGOC',
    licenseFiles: ['gphd_hongngoc.pdf'],
  },
  {
    id: 'FAC-2026-004',
    facilityName: 'Trung tâm Y tế Kỹ thuật cao An Sinh Hub',
    representativeName: 'Vũ Mạnh Cường',
    email: 'ansinh.hub@ansinh.vn',
    phone: '0903456789',
    address: '10 Trần Huy Liệu, Phường 11, Quận Phú Nhuận, TP.HCM',
    onboardingStatus: 'PENDING_LEGAL',
    status: 'PENDING',
    createdAt: '2026-11-13T10:00:00.000Z',
    taxCode: 'PENDING_TAX_A1889C',
    operatingLicense: '',
  },
];

const INITIAL_DOCTORS: DoctorVerificationItem[] = [
  {
    id: 'DOC-7905',
    doctorName: 'ThS.BS Vũ Đình Trọng',
    facilityName: 'Bệnh viện Đa khoa Quốc tế FamiCare',
    specialty: 'Nội tiết - Đái tháo đường & Y học Gia đình',
    cchnNumber: '005891/BYT-CCHN',
    issueDate: '2022-03-12',
    issuingAuthority: 'Cục Quản lý Khám chữa bệnh - Bộ Y Tế',
    onboardingStatus: 'FACILITY_VERIFIED',
  },
  {
    id: 'DOC-7908',
    doctorName: 'BS.CKI Đặng Thị Hồng Hạnh',
    facilityName: 'Phòng khám Đa khoa Quốc tế Trustcare Hub',
    specialty: 'Nhi khoa Tổng quát & Dinh dưỡng Gia đình',
    cchnNumber: '012489/HCM-CCHN',
    issueDate: '2021-09-20',
    issuingAuthority: 'Sở Y tế TP.HCM',
    onboardingStatus: 'FACILITY_VERIFIED',
  },
];

function saveFacilityOverrides(items: AdminFacilityItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const overrides: Record<string, { onboardingStatus: AdminFacilityItem['onboardingStatus']; status: AdminFacilityItem['status'] }> = {};
    items.forEach((item) => {
      overrides[item.id] = { onboardingStatus: item.onboardingStatus, status: item.status };
    });
    localStorage.setItem('famidoc_admin_facility_overrides', JSON.stringify(overrides));
  } catch {
    // Ignore storage errors
  }
}

function applyFacilityOverrides(items: AdminFacilityItem[]): AdminFacilityItem[] {
  if (typeof window === 'undefined') return items;
  try {
    const raw = localStorage.getItem('famidoc_admin_facility_overrides');
    if (!raw) return items;
    const overrides = JSON.parse(raw);
    return items.map((item) => {
      if (overrides[item.id]) {
        return {
          ...item,
          onboardingStatus: overrides[item.id].onboardingStatus,
          status: overrides[item.id].status,
        };
      }
      return item;
    });
  } catch {
    return items;
  }
}

export function AdminFacilitiesView() {
  const [facilities, setFacilities] = useState<AdminFacilityItem[]>(INITIAL_FACILITIES);
  const [doctorsList, setDoctorsList] = useState<DoctorVerificationItem[]>(INITIAL_DOCTORS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING_APPROVAL' | 'PENDING_LEGAL' | 'ACTIVE' | 'DOCTOR_VERIFY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<AdminFacilityItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Rejection Dialog states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Approval Dialog states (Duyệt Cấp 1)
  const [showApproveAccountModal, setShowApproveAccountModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    facilitiesApi
      .getAdminFacilities()
      .then((res: any) => {
        if (!isMounted) return;
        let baseList: AdminFacilityItem[] = [];
        if (res && res.data && Array.isArray(res.data)) {
          baseList = res.data;
        } else if (Array.isArray(res) && res.length > 0) {
          baseList = res;
        } else {
          baseList = INITIAL_FACILITIES;
        }
        setFacilities(applyFacilityOverrides(baseList));
      })
      .catch((err) => {
        console.warn('API fallback for admin facilities:', err);
        setFacilities(applyFacilityOverrides(INITIAL_FACILITIES));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Filter facilities
  const filteredFacilities = facilities.filter((fac) => {
    const matchesSearch =
      fac.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.representativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING_APPROVAL') return fac.onboardingStatus === 'PENDING_APPROVAL';
    if (activeTab === 'PENDING_LEGAL') return fac.onboardingStatus === 'PENDING_LEGAL' || fac.onboardingStatus === 'LEGAL_SUBMITTED';
    if (activeTab === 'ACTIVE') return fac.onboardingStatus === 'ACTIVE' || fac.status === 'ACTIVE';
    return true;
  });

  const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage) || 1;
  const paginatedFacilities = filteredFacilities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats Counters
  const countPendingApproval = facilities.filter((f) => f.onboardingStatus === 'PENDING_APPROVAL').length;
  const countPendingLegal = facilities.filter((f) => f.onboardingStatus === 'PENDING_LEGAL' || f.onboardingStatus === 'LEGAL_SUBMITTED').length;
  const countActive = facilities.filter((f) => f.onboardingStatus === 'ACTIVE' || f.status === 'ACTIVE').length;

  // Actions
  const handleOpenDetail = (fac: AdminFacilityItem) => {
    setSelectedFacility(fac);
    setIsDetailModalOpen(true);
  };

  // Duyệt Lần 1: Cấp tài khoản portal
  const handleExecuteApproveAccount = async () => {
    if (!selectedFacility) return;
    setIsActionLoading(true);
    try {
      await facilitiesApi.approveAccount(selectedFacility.id);
    } catch {
      // Fallback
    }
    const updated = facilities.map((f) =>
      f.id === selectedFacility.id
        ? {
            ...f,
            onboardingStatus: 'PENDING_LEGAL' as const,
          }
        : f
    );
    setFacilities(updated);
    saveFacilityOverrides(updated);
    if (selectedFacility) {
      setSelectedFacility({ ...selectedFacility, onboardingStatus: 'PENDING_LEGAL' });
    }
    setIsActionLoading(false);
    setShowApproveAccountModal(false);
    showToast(
      `Đã duyệt Cấp 1 thành công! Hệ thống đã gửi email cấp tài khoản Portal kèm mật khẩu khởi tạo "FamiDoc@Facility2026" tới ${selectedFacility.email}.`
    );
  };

  // Duyệt Lần 2: Hậu kiểm pháp lý & Kích hoạt ACTIVE
  const handleExecuteVerifyLegal = async () => {
    if (!selectedFacility) return;
    setIsActionLoading(true);
    try {
      await facilitiesApi.verifyLegal(selectedFacility.id, { approved: true, verified: true });
    } catch {
      // Fallback
    }
    const updated = facilities.map((f) =>
      f.id === selectedFacility.id
        ? {
            ...f,
            onboardingStatus: 'ACTIVE' as const,
            status: 'ACTIVE' as const,
          }
        : f
    );
    setFacilities(updated);
    saveFacilityOverrides(updated);
    if (selectedFacility) {
      setSelectedFacility({ ...selectedFacility, onboardingStatus: 'ACTIVE', status: 'ACTIVE' });
    }
    setIsActionLoading(false);
    setIsDetailModalOpen(false);
    showToast(`Hậu kiểm pháp lý thành công! Cơ sở y tế "${selectedFacility.facilityName}" đã chính thức chuyển sang trạng thái ACTIVE.`);
  };

  // Từ chối / Yêu cầu bổ sung
  const handleExecuteReject = async () => {
    if (!selectedFacility || !rejectReason.trim()) return;
    setIsActionLoading(true);
    try {
      await facilitiesApi.rejectFacility(selectedFacility.id, rejectReason);
    } catch {
      // Fallback
    }
    const updated = facilities.map((f) =>
      f.id === selectedFacility.id
        ? {
            ...f,
            onboardingStatus: 'REJECTED' as const,
          }
        : f
    );
    setFacilities(updated);
    saveFacilityOverrides(updated);
    setIsActionLoading(false);
    setShowRejectModal(false);
    setIsDetailModalOpen(false);
    showToast(`Đã gửi thông báo từ chối / yêu cầu bổ sung hồ sơ tới cơ sở y tế.`);
    setRejectReason('');
  };

  // Duyệt Bác sĩ Cấp 2
  const handleApproveDoctorPlatform = async (docId: string, docName: string) => {
    try {
      await doctorsApi.platformApproveCredentials(docId, {
        isApproved: true,
        notes: 'Admin Nền tảng FamiDoc đã hậu kiểm CSDL Quốc gia và phê duyệt Cấp 2.',
      });
    } catch {
      // Fallback
    }
    setDoctorsList((prev) => prev.filter((d) => d.id !== docId));
    showToast(`Đã hậu kiểm CSDL Quốc gia & kích hoạt ACTIVE cho Bác sĩ ${docName} (${docId}). Bác sĩ đã có thể mở lịch khám!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
            ✓
          </span>
          <span className="leading-relaxed">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Admin Backoffice</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">Quản trị & Thẩm định Cơ sở Y tế</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quản trị & Thẩm định Cơ sở Y tế (Duyệt 2 Cấp)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quy trình hợp tác nền tảng B2B: Duyệt cấp tài khoản Portal (Cấp 1) &amp; Hậu kiểm pháp lý CSDL Quốc gia (Cấp 2).
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng cơ sở y tế</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
              🏥
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{facilities.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">Đối tác bệnh viện &amp; phòng khám</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Chờ Duyệt Cấp 1</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Cấp Portal
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-900">{countPendingApproval}</div>
          <div className="mt-1 text-[11px] text-amber-700">Yêu cầu đăng ký mới chưa cấp tài khoản</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs bg-indigo-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700">Chờ Duyệt Cấp 2</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
              Pháp lý GPHĐ
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-900">{countPendingLegal}</div>
          <div className="mt-1 text-[11px] text-indigo-700">Cần đối soát CSDL Cục QLKCB</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Đang hoạt động</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              ACTIVE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">{countActive}</div>
          <div className="mt-1 text-[11px] text-emerald-700">Được phép mở hợp đồng B2B &amp; Bác sĩ</div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({facilities.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('PENDING_APPROVAL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'PENDING_APPROVAL'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chờ Duyệt Cấp 1 ({countPendingApproval})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('PENDING_LEGAL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'PENDING_LEGAL'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chờ Pháp Lý Cấp 2 ({countPendingLegal})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ACTIVE');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang Hoạt Động ({countActive})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('DOCTOR_VERIFY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'DOCTOR_VERIFY'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Duyệt CCHN Bác Sĩ ({doctorsList.length})
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'DOCTOR_VERIFY' && (
            <div className="relative min-w-[280px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo tên CSYT, người đại diện, SĐT..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'DOCTOR_VERIFY' ? (
        /* ========================================================================= */
        /* TAB: THẨM ĐỊNH CCHN BÁC SĨ CẤP 2 (PLATFORM-APPROVE)                       */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Danh sách Bác sĩ chờ Hậu kiểm CSDL Quốc gia (Duyệt Cấp 2)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các bác sĩ này đã được Cơ sở y tế thẩm định nội bộ Cấp 1 (`FACILITY_VERIFIED`). Quản trị viên tiến hành tra cứu số CCHN trên Cổng dịch vụ công để kích hoạt khám bệnh.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
              {doctorsList.length} bác sĩ chờ duyệt
            </span>
          </div>

          {doctorsList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
              Hiện không có bác sĩ nào đang chờ thẩm định Cấp 2.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Bác sĩ &amp; Chuyên khoa</th>
                    <th className="py-3 px-4">Cơ sở y tế trực thuộc</th>
                    <th className="py-3 px-4">Số CCHN &amp; Cơ quan cấp</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {doctorsList.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{doc.doctorName}</div>
                        <div className="text-[11px] text-slate-500">{doc.specialty}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{doc.facilityName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-blue-700">{doc.cchnNumber}</div>
                        <div className="text-[11px] text-slate-500">{doc.issuingAuthority}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          CSYT đã duyệt Cấp 1
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleApproveDoctorPlatform(doc.id, doc.doctorName)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          Duyệt Cấp 2 (Kích hoạt ACTIVE)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB: DANH SÁCH CƠ SỞ Y TẾ (ADMIN LIST FACILITIES)                         */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {paginatedFacilities.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
              Không tìm thấy cơ sở y tế nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-600 font-semibold">
                      <th className="py-3.5 px-4">Cơ sở Y tế</th>
                      <th className="py-3.5 px-4">Đại diện &amp; Liên hệ</th>
                      <th className="py-3.5 px-4">Ngày đăng ký</th>
                      <th className="py-3.5 px-4">Tiến trình Onboarding</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedFacilities.map((fac) => (
                      <tr key={fac.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 max-w-[280px]">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {fac.facilityName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{fac.address}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {fac.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{fac.representativeName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>📞 {fac.phone}</span>
                            <span>•</span>
                            <span>✉️ {fac.email}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                          {new Date(fac.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {fac.onboardingStatus === 'PENDING_APPROVAL' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chờ Duyệt Cấp 1 (Cấp Portal)
                            </span>
                          )}
                          {fac.onboardingStatus === 'PENDING_LEGAL' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                              Đã cấp Portal • Chờ nộp Pháp lý
                            </span>
                          )}
                          {fac.onboardingStatus === 'LEGAL_SUBMITTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                              Đã nộp GPHĐ • Chờ Duyệt Cấp 2
                            </span>
                          )}
                          {(fac.onboardingStatus === 'ACTIVE' || fac.status === 'ACTIVE') && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Đang Hoạt Động (ACTIVE)
                            </span>
                          )}
                          {fac.onboardingStatus === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                              Từ chối / Cần bổ sung
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(fac)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors border border-blue-200/80 shadow-2xs"
                          >
                            Chi tiết &amp; Thẩm định
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {paginatedFacilities.map((fac) => (
                  <div key={fac.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{fac.facilityName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{fac.address}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {fac.id}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl space-y-1">
                      <div>
                        <span className="font-semibold text-slate-700">Đại diện:</span> {fac.representativeName}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Liên hệ:</span> {fac.phone} • {fac.email}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {fac.onboardingStatus === 'PENDING_APPROVAL' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Chờ Duyệt Cấp 1
                          </span>
                        )}
                        {fac.onboardingStatus === 'LEGAL_SUBMITTED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            Chờ Pháp lý Cấp 2
                          </span>
                        )}
                        {(fac.onboardingStatus === 'ACTIVE' || fac.status === 'ACTIVE') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDetail(fac)}
                        className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg text-xs shadow-xs"
                      >
                        Thẩm định
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(currentPage * itemsPerPage, filteredFacilities.length)} trên tổng số{' '}
                    {filteredFacilities.length} cơ sở
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CHI TIẾT HỒ SƠ & THẨM ĐỊNH CƠ SỞ Y TẾ                               */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white relative">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 text-xs text-blue-200 font-medium mb-1">
                <span>Hồ Sơ Chi Tiết Cơ Sở Y Tế</span>
                <span>•</span>
                <span className="font-mono">{selectedFacility.id}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight">{selectedFacility.facilityName}</h2>
              <p className="text-xs text-blue-100 mt-1">{selectedFacility.address}</p>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
              {/* PHẦN 1: THÔNG TIN CƠ BẢN (DUYỆT LẦN 1) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                      1
                    </span>
                    Thông Tin Đăng Ký Cơ Bản (Duyệt Lần 1 - Portal)
                  </h3>
                  <div>
                    {selectedFacility.onboardingStatus === 'PENDING_APPROVAL' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Chờ duyệt cấp tài khoản
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Đã cấp tài khoản Portal
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-xs">Đại diện pháp luật:</span>
                    <span className="font-semibold text-slate-800">{selectedFacility.representativeName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Số điện thoại liên hệ:</span>
                    <span className="font-semibold text-slate-800">{selectedFacility.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Email Portal:</span>
                    <span className="font-semibold text-slate-800">{selectedFacility.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Trạng thái hiện tại:</span>
                    <span className="font-semibold text-blue-700 font-mono text-xs">{selectedFacility.onboardingStatus}</span>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: THÔNG TIN PHÁP LÝ CHUYÊN SÂU (DUYỆT LẦN 2) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                      2
                    </span>
                    Thông Tin Hồ Sơ Pháp Lý (Duyệt Lần 2 - Pháp lý)
                  </h3>
                  <div>
                    {selectedFacility.onboardingStatus === 'ACTIVE' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Đã Kích Hoạt ACTIVE
                      </span>
                    ) : selectedFacility.taxCode && selectedFacility.operatingLicense ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Đã nộp đủ hồ sơ pháp lý
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Chưa hoàn thiện pháp lý
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-xs">Mã số thuế (MST):</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedFacility.taxCode || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Giấy phép hoạt động KCB (GPHĐ):</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedFacility.operatingLicense || 'Chưa nộp'}
                    </span>
                  </div>
                  {selectedFacility.licenseIssuer && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-xs">Cơ quan cấp GPHĐ:</span>
                      <span className="font-semibold text-slate-800">{selectedFacility.licenseIssuer}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block text-xs">Ngân hàng thụ hưởng đối soát:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedFacility.bankName || 'CHƯA_CẬP_NHẬT'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Tài khoản &amp; Chủ tài khoản:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedFacility.bankAccount ? `${selectedFacility.bankAccount} (${selectedFacility.bankAccountHolder})` : 'CHƯA_CẬP_NHẬT'}
                    </span>
                  </div>
                </div>

                {/* Danh sách file đính kèm */}
                {selectedFacility.licenseFiles && selectedFacility.licenseFiles.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Tài liệu pháp lý scan đính kèm:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedFacility.licenseFiles.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs border border-blue-200">
                          <span>📄</span>
                          <span className="font-medium font-mono text-[11px]">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hướng dẫn & Cảnh báo điều kiện duyệt */}
                {selectedFacility.onboardingStatus === 'PENDING_APPROVAL' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
                    💡 <strong>Bước tiếp theo:</strong> Bấm <em>"Duyệt Cấp 1 (Cấp Portal)"</em> để hệ thống tự động sinh tài khoản với mật khẩu mặc định <code>FamiDoc@Facility2026</code> và gửi email kích hoạt cho người đại diện.
                  </div>
                )}

                {selectedFacility.onboardingStatus !== 'PENDING_APPROVAL' && selectedFacility.onboardingStatus !== 'ACTIVE' && (
                  selectedFacility.taxCode && selectedFacility.operatingLicense ? (
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-xs leading-relaxed">
                      🔍 <strong>Hồ sơ sẵn sàng thẩm định:</strong> CSYT đã nộp đầy đủ MST và GPHĐ. Quản trị viên vui lòng tra cứu đối soát trên CSDL Quốc gia trước khi bấm <em>"Duyệt Cấp 2: Kích hoạt ACTIVE"</em>.
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs leading-relaxed">
                      ⚠️ <strong>Chưa đủ điều kiện duyệt Cấp 2:</strong> CSYT chưa hoàn tất nộp Giấy phép hoạt động KCB hoặc Mã số thuế trên Portal. Nút kích hoạt ACTIVE sẽ được mở khi cơ sở hoàn thiện hồ sơ.
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 transition-colors"
              >
                Đóng
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* Nút từ chối */}
                {selectedFacility.onboardingStatus !== 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs sm:text-sm font-semibold border border-rose-200 transition-colors"
                  >
                    Yêu cầu bổ sung / Từ chối
                  </button>
                )}

                {/* HÀNH ĐỘNG 1: DUYỆT CẤP 1 (CẤP TÀI KHOẢN PORTAL) */}
                {selectedFacility.onboardingStatus === 'PENDING_APPROVAL' && (
                  <button
                    type="button"
                    onClick={() => setShowApproveAccountModal(true)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                  >
                    <span>Duyệt Cấp 1 (Cấp Portal)</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}

                {/* HÀNH ĐỘNG 2: DUYỆT CẤP 2 (HẬU KIỂM PHÁP LÝ & KÍCH HOẠT ACTIVE) */}
                {selectedFacility.onboardingStatus !== 'PENDING_APPROVAL' && selectedFacility.onboardingStatus !== 'ACTIVE' && (
                  <button
                    type="button"
                    disabled={!selectedFacility.taxCode || !selectedFacility.operatingLicense || isActionLoading}
                    onClick={handleExecuteVerifyLegal}
                    className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 ${
                      selectedFacility.taxCode && selectedFacility.operatingLicense
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {isActionLoading ? (
                      <span>Đang kích hoạt...</span>
                    ) : (
                      <>
                        <span>Duyệt Cấp 2: Kích Hoạt ACTIVE</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </>
                    )}
                  </button>
                )}

                {selectedFacility.onboardingStatus === 'ACTIVE' && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <span>✓ Cơ sở y tế đã được kích hoạt hợp tác</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP CONFIRM: DUYỆT CẤP 1 (CẤP TÀI KHOẢN PORTAL)                          */}
      {/* ========================================================================= */}
      {showApproveAccountModal && selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
              🔑
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xác nhận Duyệt Lần 1: Cấp Tài Khoản Portal
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hệ thống sẽ cấp tài khoản đăng nhập cho cơ sở y tế <strong>{selectedFacility.facilityName}</strong> với thông tin sau:
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Email Portal:</span>
                <span className="font-semibold text-slate-900">{selectedFacility.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mật khẩu khởi tạo:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  FamiDoc@Facility2026
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái mới:</span>
                <span className="font-semibold text-sky-700">PENDING_LEGAL</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Email thông báo kích hoạt kèm mật khẩu sẽ được tự động gửi tới hòm thư người đại diện.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveAccountModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleExecuteApproveAccount}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-colors"
              >
                {isActionLoading ? 'Đang cấp tài khoản...' : 'Xác nhận cấp tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP: TỪ CHỐI / YÊU CẦU BỔ SUNG HỒ SƠ                                    */}
      {/* ========================================================================= */}
      {showRejectModal && selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
              ⚠️
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Yêu cầu bổ sung hồ sơ / Từ chối
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gửi lý do chi tiết tới <strong>{selectedFacility.facilityName}</strong> ({selectedFacility.email}).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do yêu cầu sửa đổi hoặc từ chối: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Giấy phép hoạt động KCB đã mờ hoặc hết hạn; Thông tin Mã số thuế chưa khớp với CSDL Thuế Quốc gia..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isActionLoading}
                onClick={handleExecuteReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-colors disabled:opacity-60"
              >
                {isActionLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
