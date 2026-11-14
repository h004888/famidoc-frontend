'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api/contracts.api';

export interface FacilityContractInboundViewProps {
  initialContracts?: FourPartyContract[];
}

const DEFAULT_MOCK_CONTRACTS: FourPartyContract[] = [
  {
    id: 'ct-4p-001',
    contractNumber: 'HD-4P-2026-0001',
    status: 'PLATFORM_SIGNED',
    packageId: 'pkg-gold',
    packageName: 'Gói Chăm Sóc Toàn Diện Gia Đình',
    packagePrice: 9600000,
    durationMonths: 12,
    familyId: 'fam-88219',
    familyRepresentativeName: 'Nguyễn Văn An',
    familyRepresentativePhone: '0912345678',
    familyRepresentativeEmail: 'nguyenvanan@example.com',
    familyAddress: '123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    membersCount: 4,
    facilityId: 'fac-01',
    facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
    createdAt: '2026-11-09T08:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Nguyễn Văn An',
        signerRole: 'FAMILY',
        signedAt: '2026-11-09T08:30:00.000Z',
        sha256Hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
      platform: {
        signedBy: 'Ban Điều Hành Famidoc',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-09T09:15:00.000Z',
        sha256Hash: 'b2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
      },
    },
  },
  {
    id: 'ct-4p-002',
    contractNumber: 'HD-4P-2026-0002',
    status: 'FACILITY_ASSIGNED',
    packageId: 'pkg-silver',
    packageName: 'Gói Tiêu Chuẩn Người Cao Tuổi',
    packagePrice: 6000000,
    durationMonths: 12,
    familyId: 'fam-44012',
    familyRepresentativeName: 'Trần Thị Mai',
    familyRepresentativePhone: '0987654321',
    familyRepresentativeEmail: 'tranmai@example.com',
    familyAddress: '45 Lê Văn Sỹ, Phường 2, Tân Bình, TP. Hồ Chí Minh',
    membersCount: 2,
    facilityId: 'fac-01',
    facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
    doctorId: 'doc-02',
    doctorName: 'BS. CKI Lê Thị Kim Oanh',
    doctorTitle: 'Bác sĩ Gia đình',
    createdAt: '2026-11-08T10:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Trần Thị Mai',
        signerRole: 'FAMILY',
        signedAt: '2026-11-08T10:30:00.000Z',
        sha256Hash: 'e1f2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
      platform: {
        signedBy: 'Ban Điều Hành Famidoc',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-08T11:00:00.000Z',
        sha256Hash: 'f2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
      },
      facility: {
        signedBy: 'Đại diện CSYT - TS.BS Vũ Thành',
        signerRole: 'FACILITY',
        signedAt: '2026-11-08T14:00:00.000Z',
        sha256Hash: 'c3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567892',
      },
    },
  },
  {
    id: 'ct-4p-003',
    contractNumber: 'HD-4P-2026-0003',
    status: 'PLATFORM_SIGNED',
    packageId: 'pkg-pediatric',
    packageName: 'Gói Chăm Sóc Mẹ & Bé Sơ Sinh',
    packagePrice: 7500000,
    durationMonths: 6,
    familyId: 'fam-55102',
    familyRepresentativeName: 'Hoàng Minh Tuấn',
    familyRepresentativePhone: '0903112233',
    familyRepresentativeEmail: 'tuan.hm@example.com',
    familyAddress: '78 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    membersCount: 3,
    facilityId: 'fac-01',
    facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
    createdAt: '2026-11-09T09:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Hoàng Minh Tuấn',
        signerRole: 'FAMILY',
        signedAt: '2026-11-09T09:10:00.000Z',
        sha256Hash: '3344c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
      platform: {
        signedBy: 'Ban Điều Hành Famidoc',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-09T09:30:00.000Z',
        sha256Hash: '5566d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
      },
    },
  },
];

export function FacilityContractInboundView({
  initialContracts = DEFAULT_MOCK_CONTRACTS,
}: FacilityContractInboundViewProps) {
  const [contracts, setContracts] = useState<FourPartyContract[]>(initialContracts);
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContracts = () => {
    setIsRefreshing(true);
    contractsApi
      .getMedicalContracts({ role: 'FACILITY' })
      .then((items) => {
        if (items && items.length > 0) {
          setContracts(items as unknown as FourPartyContract[]);
        }
      })
      .catch(() => {
        // Giữ mock nếu backend offline
      })
      .finally(() => {
        setTimeout(() => setIsRefreshing(false), 400);
      });
  };

  useEffect(() => {
    // Nếu không truyền initialContracts từ test/props, gọi API thật từ Backend
    if (initialContracts === DEFAULT_MOCK_CONTRACTS) {
      fetchContracts();
    }
  }, [initialContracts]);

  // KPI Calculations
  const totalContracts = contracts.length;
  const pendingAssignment = contracts.filter((c) => c.status === 'PLATFORM_SIGNED').length;
  const assignedCount = contracts.filter(
    (c) => c.status === 'FACILITY_ASSIGNED' || c.status === 'DOCTOR_ACCEPTED' || c.status === 'ACTIVE'
  ).length;

  // Distinct packages for filter dropdown
  const packageOptions = useMemo(() => {
    const map = new Map<string, string>();
    contracts.forEach((c) => {
      map.set(c.packageId, c.packageName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [contracts]);

  // Filtered list
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.contractNumber.toLowerCase().includes(q) ||
        c.familyRepresentativeName.toLowerCase().includes(q) ||
        (c.familyRepresentativePhone && c.familyRepresentativePhone.includes(q)) ||
        (c.familyAddress && c.familyAddress.toLowerCase().includes(q));

      // Package filter
      const matchesPackage = packageFilter === 'ALL' || c.packageId === packageFilter;

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [contracts, searchQuery, packageFilter, statusFilter]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPackageFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header with Preclinic Breadcrumb & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb matching project style */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-[#2E37A4] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/facility" className="hover:text-[#2E37A4] transition-colors">
                Cơ sở Y tế
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#2E37A4] font-semibold">Điều phối HĐ 4 bên</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#0052cc] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[17px]">handshake</span>
              <span>Hệ Thống Điều Phối CSYT • Tiếp Nhận &amp; Ký Số HĐ 4 Bên (SCR-22)</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Hợp đồng 4 bên tiếp nhận
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Danh sách hợp đồng dịch vụ bác sĩ gia đình cần phân công và ký số phê duyệt từ cơ sở y tế.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchContracts}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-[16px] text-slate-500 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
              <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-amber-400">domain</span>
              <span>Hệ thống Điều phối CSYT</span>
            </div>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng hợp đồng tiếp nhận
              </span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">folder_shared</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
              {totalContracts}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-slate-400">hub</span>
              <span>Hồ sơ từ Nền tảng Famidoc</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 bg-amber-50/20 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Chờ CSYT phân công &amp; ký
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">pending_actions</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-900 mt-2 tracking-tight flex items-center gap-2">
              <span>{pendingAssignment}</span>
              {pendingAssignment > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-500">schedule</span>
              <span>Cần chỉ định bác sĩ gia đình</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/80 bg-emerald-50/20 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Đã hoàn tất phân công
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-2 tracking-tight">
              {assignedCount}
            </div>
            <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
              <span>Đã ký số CSYT hợp lệ</span>
            </div>
          </div>
        </div>

        {/* Filters and Controls Toolbar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                id="search-input"
                type="text"
                placeholder="Tìm theo số HĐ, tên người đại diện, số điện thoại, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]/20 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Package Select */}
              <div className="w-full sm:w-auto min-w-[190px]">
                <label htmlFor="package-select" className="sr-only">
                  Lọc theo gói
                </label>
                <select
                  id="package-select"
                  aria-label="Lọc theo gói"
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]/20 transition-all font-medium text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Tất cả các gói ({contracts.length})</option>
                  {packageOptions.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div className="w-full sm:w-auto min-w-[210px]">
                <label htmlFor="status-select" className="sr-only">
                  Lọc theo trạng thái
                </label>
                <select
                  id="status-select"
                  aria-label="Lọc theo trạng thái"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]/20 transition-all font-medium text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PLATFORM_SIGNED">Chờ CSYT phân công (Nền tảng đã duyệt)</option>
                  <option value="FACILITY_ASSIGNED">Đã phân công bác sĩ</option>
                </select>
              </div>

              {/* Reset filter button if active */}
              {(searchQuery || packageFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                  title="Đặt lại bộ lọc"
                >
                  <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-600 font-semibold text-xs tracking-wider">
                  <th className="py-3.5 px-4 text-left">Mã Hợp Đồng</th>
                  <th className="py-3.5 px-4 text-left">Đại diện Gia đình</th>
                  <th className="py-3.5 px-4 text-left">Gói Dịch Vụ</th>
                  <th className="py-3.5 px-4 text-right">Phí dịch vụ</th>
                  <th className="py-3.5 px-4 text-left">Bác sĩ phụ trách</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[24px]">search_off</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        Không tìm thấy hợp đồng nào phù hợp
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc làm mới bộ lọc để hiển thị kết quả.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => {
                    const isPending = contract.status === 'PLATFORM_SIGNED';

                    return (
                      <tr key={contract.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 text-left align-top">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px] text-slate-500">
                              description
                            </span>
                            <span>{contract.contractNumber}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-slate-400">
                              schedule
                            </span>
                            <span>Tạo ngày {formatDate(contract.createdAt)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-left align-top">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {contract.familyRepresentativeName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">
                                call
                              </span>
                              <span>{contract.familyRepresentativePhone}</span>
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">
                                group
                              </span>
                              <span>{contract.membersCount || 1} nhân khẩu</span>
                            </span>
                          </div>
                          {contract.familyAddress && (
                            <div
                              className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5 flex items-center gap-1"
                              title={contract.familyAddress}
                            >
                              <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">
                                home_pin
                              </span>
                              <span className="truncate">{contract.familyAddress}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 text-left align-top">
                          <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                            {contract.packageName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-slate-400">
                              calendar_month
                            </span>
                            <span>Thời hạn: {contract.durationMonths || 12} tháng</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right align-top">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                            {formatPrice(contract.packagePrice)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Trọn gói</div>
                        </td>

                        <td className="py-4 px-4 text-left align-top">
                          {contract.doctorName ? (
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[16px]">
                                  stethoscope
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-xs">
                                  {contract.doctorName}
                                </div>
                                {contract.doctorTitle && (
                                  <div className="text-[11px] text-slate-500">
                                    {contract.doctorTitle}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chưa phân công
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center align-top whitespace-nowrap">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chờ phân công &amp; ký
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Đã phân công BS
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right align-top whitespace-nowrap">
                          {isPending ? (
                            <Link
                              href={`/facility/contracts/${contract.id}/assign`}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-[#2E37A4] hover:bg-[#232B85] shadow-xs hover:shadow transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                              <span>Phân công &amp; Ký số</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/facility/contracts/${contract.id}/assign`}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-2xs transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px] text-slate-500">
                                visibility
                              </span>
                              <span>Xem phân công</span>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
