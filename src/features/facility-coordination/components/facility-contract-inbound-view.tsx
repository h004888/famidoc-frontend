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

  useEffect(() => {
    // Nếu không truyền initialContracts từ test/props, gọi API thật từ Backend
    if (initialContracts === DEFAULT_MOCK_CONTRACTS) {
      contractsApi
        .getMedicalContracts({ role: 'FACILITY' })
        .then((items) => {
          if (items && items.length > 0) {
            setContracts(items as unknown as FourPartyContract[]);
          }
        })
        .catch(() => {
          // Giữ mock nếu backend offline
        });
    }
  }, [initialContracts]);

  // KPI Calculations
  const totalContracts = contracts.length;
  const pendingAssignment = contracts.filter((c) => c.status === 'PLATFORM_SIGNED').length;
  const assignedCount = contracts.filter((c) => c.status === 'FACILITY_ASSIGNED' || c.status === 'DOCTOR_ACCEPTED' || c.status === 'ACTIVE').length;

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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Hợp đồng 4 bên tiếp nhận
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách hợp đồng dịch vụ bác sĩ gia đình cần phân công và ký số phê duyệt từ cơ sở y tế.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Hệ thống Điều phối CSYT
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tổng hợp đồng tiếp nhận
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {totalContracts}
          </div>
          <div className="text-xs text-slate-500 mt-1">Hồ sơ từ Nền tảng Famidoc</div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">
            Chờ CSYT phân công & ký
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">
            {pendingAssignment}
          </div>
          <div className="text-xs text-amber-600 mt-1">Cần chỉ định bác sĩ gia đình</div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
            Đã hoàn tất phân công
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">
            {assignedCount}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Đã ký số CSYT hợp lệ</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search-input" className="block text-xs font-medium text-slate-700 mb-1">
              Tìm kiếm hồ sơ
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Tìm theo số HĐ, tên người đại diện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label htmlFor="package-select" className="block text-xs font-medium text-slate-700 mb-1">
              Lọc theo gói chăm sóc
            </label>
            <select
              id="package-select"
              aria-label="Lọc theo gói"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="ALL">Tất cả các gói</option>
              {packageOptions.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-select" className="block text-xs font-medium text-slate-700 mb-1">
              Lọc theo trạng thái hợp đồng
            </label>
            <select
              id="status-select"
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PLATFORM_SIGNED">Chờ CSYT phân công (Nền tảng đã duyệt)</option>
              <option value="FACILITY_ASSIGNED">Đã phân công bác sĩ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs tracking-wider">
                <th className="py-3 px-4 text-left">Mã Hợp Đồng</th>
                <th className="py-3 px-4 text-left">Đại diện Gia đình</th>
                <th className="py-3 px-4 text-left">Gói Dịch Vụ</th>
                <th className="py-3 px-4 text-right">Phí dịch vụ</th>
                <th className="py-3 px-4 text-left">Bác sĩ phụ trách</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Không tìm thấy hợp đồng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => {
                  const isPending = contract.status === 'PLATFORM_SIGNED';

                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-left">
                        <div className="font-semibold text-slate-900">
                          {contract.contractNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Tạo ngày {formatDate(contract.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="font-medium text-slate-900">
                          {contract.familyRepresentativeName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {contract.familyRepresentativePhone} • {contract.membersCount || 1} nhân khẩu
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[200px]" title={contract.familyAddress}>
                          {contract.familyAddress}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="font-medium text-slate-800">
                          {contract.packageName}
                        </div>
                        <div className="text-xs text-slate-500">
                          Thời hạn: {contract.durationMonths || 12} tháng
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {formatPrice(contract.packagePrice)}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        {contract.doctorName ? (
                          <div>
                            <span className="font-medium text-slate-800">
                              {contract.doctorName}
                            </span>
                            {contract.doctorTitle && (
                              <div className="text-xs text-slate-500">
                                {contract.doctorTitle}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Chưa phân công
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Chờ phân công & ký
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Đã phân công BS
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <Link
                            href={`/facility/contracts/${contract.id}/assign`}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                          >
                            Phân công & Ký số
                          </Link>
                        ) : (
                          <Link
                            href={`/facility/contracts/${contract.id}/assign`}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
                          >
                            Xem phân công
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
    </div>
  );
}
