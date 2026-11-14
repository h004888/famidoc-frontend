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
];

export function DoctorContractsInboundView({
  initialContracts = DEFAULT_DOCTOR_CONTRACTS,
}: DoctorContractsInboundViewProps) {
  const [contracts, setContracts] = useState<FourPartyContract[]>(initialContracts);
  const [filter, setFilter] = useState<'pending' | 'active' | 'all'>('pending');
  const [selectedSummary, setSelectedSummary] = useState<CareNeedsSummaryDto | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    if (initialContracts === DEFAULT_DOCTOR_CONTRACTS) {
      contractsApi
        .getMedicalContracts({ role: 'DOCTOR' })
        .then((items) => {
          if (items && items.length > 0) {
            setContracts(items as unknown as FourPartyContract[]);
          }
        })
        .catch(() => {});
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
    <div className="space-y-6">
      {/* Header Profile / Quota status */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <span>Bác sĩ gia đình phụ trách</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Danh sách Hợp đồng Y tế Phân công
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý và tiếp nhận trách nhiệm theo dõi sức khỏe dài hạn cho các hộ gia đình theo chuẩn y khoa FamiDoc.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right">
            <span className="block text-[11px] text-slate-500 font-medium">Panel Cap / Định biên</span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'DOCTOR_ACCEPTED').length} / 30 hộ
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            filter === 'pending'
              ? 'bg-[#2E37A4] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Chờ ký duyệt tiếp nhận</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {contracts.filter((c) => c.status === 'FACILITY_ASSIGNED' || c.status === 'PLATFORM_SIGNED').length}
          </span>
        </button>

        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            filter === 'active'
              ? 'bg-[#2E37A4] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Đang chăm sóc</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'DOCTOR_ACCEPTED').length}
          </span>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả ({contracts.length})
        </button>
      </div>

      {/* Table / List */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">Chưa có hợp đồng nào trong danh mục này</p>
          <p className="text-xs text-slate-400 mt-1">
            Khi Cơ sở y tế điều phối và phân công hộ gia đình mới, danh sách sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContracts.map((contract) => {
            const isPendingReview =
              contract.status === 'FACILITY_ASSIGNED' || contract.status === 'PLATFORM_SIGNED';
            return (
              <div
                key={contract.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-300 transition-colors flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-700 tabular-nums">
                      {contract.contractNumber}
                    </span>
                    {isPendingReview ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        Chờ tiếp nhận y tế
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang chăm sóc
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{contract.packageName}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Chủ hộ: <strong className="text-slate-800">{contract.familyRepresentativeName}</strong> · <span className="font-semibold text-slate-700">{contract.membersCount} thành viên</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Địa chỉ: {contract.familyAddress}
                    </p>
                  </div>

                  {/* Hotline gọi ngay */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="material-symbols-outlined text-[16px] text-rose-600">phone</span>
                      <span>Hotline gia đình:</span>
                      <strong className="text-slate-900 tabular-nums">{contract.familyRepresentativePhone || '0987 654 321'}</strong>
                    </div>
                    <a
                      href={`tel:${contract.familyRepresentativePhone || '0987654321'}`}
                      className="text-xs text-emerald-700 font-bold hover:underline"
                    >
                      Gọi ngay
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCareSummary(contract.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#2E37A4]">medical_information</span>
                    <span>Tóm tắt nhu cầu</span>
                  </button>

                  {isPendingReview ? (
                    <Link
                      href={`/doctor/contracts/${contract.id}/review`}
                      className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2E37A4] text-white hover:bg-[#222982] transition-colors"
                    >
                      Ký số tiếp nhận
                    </Link>
                  ) : (
                    <Link
                      href={`/doctor/contracts/${contract.id}/review`}
                      className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Xem hồ sơ
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
                <h3 className="font-bold text-base text-slate-900">Tóm Tắt Nhu Cầu Chăm Sóc Y Tế Gia Đình</h3>
                <p className="text-xs text-slate-500">Mã HĐ: #{selectedSummary.contractNumber} · {selectedSummary.packageName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSummary(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                ✕
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
                  <div key={m.patientId} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {m.fullName} ({m.age} tuổi · {m.gender})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {m.relationshipToHead}
                      </span>
                    </div>

                    {m.allergies && m.allergies.length > 0 && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                        ⚠️ Dị ứng: {m.allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ')}
                      </div>
                    )}

                    {m.documents && m.documents.length > 0 && (
                      <div className="text-[11px] text-slate-600">
                        📄 Bệnh án đính kèm: {m.documents.map((d) => d.title).join(', ')}
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
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2E37A4] rounded-xl hover:bg-[#222982]"
              >
                Đã nắm thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
