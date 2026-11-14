'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi, type CareNeedsSummaryDto } from '@/lib/api/contracts.api';

export interface DoctorContractsInboundViewProps {
  initialContracts?: FourPartyContract[];
}

const DEFAULT_DOCTOR_CONTRACTS: FourPartyContract[] = [
  {
    id: 'ct-doc-001',
    contractNumber: 'HĐ-4B-2026-0088',
    status: 'FACILITY_ASSIGNED',
    packageId: 'pkg-tam-dai',
    packageName: 'Gói Chăm Sóc Sức Khỏe Tam Đại',
    packagePrice: 12500000,
    durationMonths: 12,
    familyId: 'fam-102',
    familyRepresentativeName: 'Trần Văn Mạnh',
    familyRepresentativePhone: '0987654321',
    familyRepresentativeEmail: 'manh.tran@example.com',
    familyAddress: '456 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM',
    membersCount: 5,
    facilityId: 'fac-01',
    facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
    assignedDoctorId: 'doc-current',
    assignedDoctorName: 'BS. CKII Lê Hoàng Nam',
    createdAt: '2026-11-09T09:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Trần Văn Mạnh',
        signerRole: 'FAMILY',
        signedAt: '2026-11-09T09:15:00.000Z',
        sha256Hash: 'a1b2c3d4e5f6',
      },
      platform: {
        signedBy: 'FamiDoc Admin',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-09T09:30:00.000Z',
        sha256Hash: 'b2c3d4e5f6a1',
      },
      facility: {
        signedBy: 'Đại diện Bệnh viện',
        signerRole: 'FACILITY',
        signedAt: '2026-11-09T09:45:00.000Z',
        sha256Hash: 'c3d4e5f6a1b2',
      },
    },
  },
  {
    id: 'ct-doc-002',
    contractNumber: 'HĐ-4B-2026-0099',
    status: 'ACTIVE',
    packageId: 'pkg-cao-tuoi',
    packageName: 'Gói Quản Lý Bệnh Mạn Tính Người Cao Tuổi',
    packagePrice: 8500000,
    durationMonths: 12,
    familyId: 'fam-105',
    familyRepresentativeName: 'Lê Thị Thu',
    familyRepresentativePhone: '0901234567',
    familyRepresentativeEmail: 'thu.le@example.com',
    familyAddress: '789 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    membersCount: 2,
    facilityId: 'fac-01',
    facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
    assignedDoctorId: 'doc-current',
    assignedDoctorName: 'BS. CKII Lê Hoàng Nam',
    createdAt: '2026-11-01T08:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Lê Thị Thu',
        signerRole: 'FAMILY',
        signedAt: '2026-11-01T08:15:00.000Z',
        sha256Hash: 'd4e5f6a1b2c3',
      },
      platform: {
        signedBy: 'FamiDoc Admin',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-01T08:30:00.000Z',
        sha256Hash: 'e5f6a1b2c3d4',
      },
      facility: {
        signedBy: 'Đại diện Bệnh viện',
        signerRole: 'FACILITY',
        signedAt: '2026-11-01T08:45:00.000Z',
        sha256Hash: 'f6a1b2c3d4e5',
      },
      doctor: {
        signedBy: 'BS. CKII Lê Hoàng Nam',
        signerRole: 'DOCTOR',
        signedAt: '2026-11-01T09:00:00.000Z',
        sha256Hash: '1a2b3c4d5e6f',
      },
    },
  },
];

export function DoctorContractsInboundView({
  initialContracts = DEFAULT_DOCTOR_CONTRACTS,
}: DoctorContractsInboundViewProps) {
  const [contracts, setContracts] = useState<FourPartyContract[]>(initialContracts);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [selectedSummary, setSelectedSummary] = useState<CareNeedsSummaryDto | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContracts = () => {
    setIsRefreshing(true);
    contractsApi
      .getMedicalContracts({ role: 'DOCTOR' })
      .then((items) => {
        if (items && items.length > 0) {
          setContracts(items as unknown as FourPartyContract[]);
        }
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => setIsRefreshing(false), 400);
      });
  };

  useEffect(() => {
    if (initialContracts === DEFAULT_DOCTOR_CONTRACTS) {
      fetchContracts();
    }
  }, [initialContracts]);

  const handleOpenCareSummary = async (contractId: string) => {
    setIsLoadingSummary(true);
    try {
      const summary = await contractsApi.getCareSummary(contractId);
      if (summary) {
        setSelectedSummary(summary);
      } else {
        setSelectedSummary({
          contractId,
          contractNumber: 'HĐ-4B-2026-0088',
          packageName: 'Gói Chăm Sóc Sức Khỏe Gia Đình',
          facilityName: 'Bệnh viện ĐHYD TP.HCM',
          familyAddress: '456 Lê Văn Sỹ, Quận 3, TP.HCM',
          members: [
            {
              patientId: 'p-1',
              fullName: 'Trần Văn Mạnh',
              age: 46,
              gender: 'Nam',
              relationshipToHead: 'Chủ hộ',
              allergies: [{ allergen: 'Kháng sinh Penicillin', severity: 'Nặng' }],
              documents: [{ title: 'Sổ khám tim mạch 2025', documentType: 'EMR' }],
            },
            {
              patientId: 'p-2',
              fullName: 'Nguyễn Thị Hoa',
              age: 72,
              gender: 'Nữ',
              relationshipToHead: 'Mẹ',
              allergies: [{ allergen: 'Hải sản', severity: 'Nhẹ' }],
              documents: [{ title: 'Đơn thuốc Đái tháo đường T2', documentType: 'PRESCRIPTION' }],
            },
          ],
        });
      }
    } catch {
      setSelectedSummary({
        contractId,
        contractNumber: 'HĐ-4B-2026-0088',
        packageName: 'Gói Chăm Sóc Sức Khỏe Gia Đình',
        facilityName: 'Bệnh viện ĐHYD TP.HCM',
        familyAddress: '456 Lê Văn Sỹ, Quận 3, TP.HCM',
        members: [
          {
            patientId: 'p-1',
            fullName: 'Trần Văn Mạnh',
            age: 46,
            gender: 'Nam',
            relationshipToHead: 'Chủ hộ',
            allergies: [{ allergen: 'Kháng sinh Penicillin', severity: 'Nặng' }],
            documents: [{ title: 'Sổ khám tim mạch 2025', documentType: 'EMR' }],
          },
        ],
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const pendingCount = contracts.filter(
    (c) => c.status === 'FACILITY_ASSIGNED' || c.status === 'PLATFORM_SIGNED'
  ).length;

  const activeCount = contracts.filter(
    (c) => c.status === 'ACTIVE' || c.status === 'DOCTOR_ACCEPTED'
  ).length;

  const filteredContracts = contracts.filter((c) => {
    if (filter === 'pending') {
      return c.status === 'FACILITY_ASSIGNED' || c.status === 'PLATFORM_SIGNED';
    }
    if (filter === 'active') {
      return c.status === 'ACTIVE' || c.status === 'DOCTOR_ACCEPTED';
    }
    return true;
  });

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
              <Link href="/doctor" className="hover:text-[#2E37A4] transition-colors">
                Bác sĩ
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#2E37A4] font-semibold">Hợp đồng phụ trách</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#0052cc] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[17px]">stethoscope</span>
              <span>Bác sĩ gia đình phụ trách • Tiếp nhận &amp; Quản lý Hợp đồng (SCR-22)</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Danh sách Hợp đồng Y tế Phân công
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Quản lý và tiếp nhận trách nhiệm theo dõi sức khỏe dài hạn cho các hộ gia đình theo chuẩn y khoa FamiDoc.
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
              <span className="material-symbols-outlined text-[16px] text-amber-400">medical_services</span>
              <span>BS Gia Đình: Lê Hoàng Nam</span>
            </div>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Panel Cap / Quota */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Panel Cap / Định biên
              </span>
              <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight tabular-nums">
              {activeCount} / 30 hộ
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-slate-400">info</span>
              <span>Định mức tối đa 30 hộ/BS</span>
            </div>
          </div>

          {/* Pending Approval */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 bg-amber-50/20 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Chờ ký duyệt
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">pending_actions</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-900 mt-2 tracking-tight flex items-center gap-2">
              <span>{pendingCount}</span>
              {pendingCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-500">schedule</span>
              <span>Cần thẩm định &amp; ký số</span>
            </div>
          </div>

          {/* Active Care */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/80 bg-emerald-50/20 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Đang phụ trách
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-2 tracking-tight">
              {activeCount}
            </div>
            <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
              <span>Theo dõi sức khỏe định kỳ</span>
            </div>
          </div>

          {/* Total Contracts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng hợp đồng phân công
              </span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">folder_shared</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
              {contracts.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-slate-400">hub</span>
              <span>Hồ sơ CSYT điều phối</span>
            </div>
          </div>
        </div>

        {/* Tabs Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-[#2E37A4] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Tất cả</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {contracts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-[#2E37A4] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Chờ duyệt tiếp nhận</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'active'
                ? 'bg-[#2E37A4] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Đang phụ trách</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === 'active' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {activeCount}
            </span>
          </button>
        </div>

        {/* Contract Cards Grid */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-[24px]">folder_off</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Chưa có hợp đồng nào được phân công
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Khi Cơ sở y tế điều phối và phân công hộ gia đình mới, danh sách hợp đồng sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredContracts.map((contract) => {
              const isPendingReview =
                contract.status === 'FACILITY_ASSIGNED' || contract.status === 'PLATFORM_SIGNED';

              return (
                <div
                  key={contract.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px] text-slate-500">
                          description
                        </span>
                        <span>{contract.contractNumber}</span>
                      </div>

                      {isPendingReview ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Chờ tiếp nhận y tế
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Đang phụ trách
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {contract.packageName}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Chủ hộ:{' '}
                        <strong className="text-slate-900 font-bold">
                          {contract.familyRepresentativeName}
                        </strong>{' '}
                        · <span className="font-semibold text-slate-700">{contract.membersCount} thành viên</span>
                      </p>
                      {contract.familyAddress && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">
                            home_pin
                          </span>
                          <span className="truncate">{contract.familyAddress}</span>
                        </p>
                      )}
                    </div>

                    {/* Hotline Card */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="material-symbols-outlined text-[16px] text-rose-600">
                          call
                        </span>
                        <span>Hotline gia đình:</span>
                        <strong className="text-slate-900 font-bold tabular-nums">
                          {contract.familyRepresentativePhone || '0987 654 321'}
                        </strong>
                      </div>
                      <a
                        href={`tel:${contract.familyRepresentativePhone || '0987654321'}`}
                        className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Gọi ngay</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </a>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCareSummary(contract.id)}
                      disabled={isLoadingSummary}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#2E37A4]">
                        medical_information
                      </span>
                      <span>Tóm tắt nhu cầu</span>
                    </button>

                    {isPendingReview ? (
                      <Link
                        href={`/doctor/contracts/${contract.id}/review`}
                        className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#2E37A4] text-white hover:bg-[#232B85] shadow-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                        <span>Thẩm định &amp; Ký số</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/doctor/contracts/${contract.id}/review`}
                        className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px] text-slate-500">
                          visibility
                        </span>
                        <span>Xem hồ sơ</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Tóm tắt nhu cầu chăm sóc y tế */}
        {selectedSummary && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Tóm Tắt Nhu Cầu Chăm Sóc Y Tế Gia Đình
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã HĐ: #{selectedSummary.contractNumber} · {selectedSummary.packageName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSummary(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="text-xs text-slate-600 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                  <span className="font-semibold text-blue-900">Địa chỉ gia đình: </span>
                  {selectedSummary.familyAddress}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hồ sơ sức khỏe thành viên ({selectedSummary.members?.length || 0})
                  </h4>
                  {selectedSummary.members?.map((m) => (
                    <div
                      key={m.patientId}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {m.fullName} ({m.age} tuổi · {m.gender})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {m.relationshipToHead}
                        </span>
                      </div>

                      {m.allergies && m.allergies.length > 0 && (
                        <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">warning</span>
                          <span>
                            Dị ứng: {m.allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ')}
                          </span>
                        </div>
                      )}

                      {m.documents && m.documents.length > 0 && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">
                            description
                          </span>
                          <span>Bệnh án đính kèm: {m.documents.map((d) => d.title).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSummary(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2E37A4] rounded-xl hover:bg-[#232B85] transition-colors cursor-pointer"
                >
                  Đã nắm thông tin
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
