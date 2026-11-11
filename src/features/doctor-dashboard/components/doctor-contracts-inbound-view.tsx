'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api/contracts.api';

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
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');

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
              {contracts.filter((c) => c.status === 'ACTIVE').length} / 30 hộ
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả ({contracts.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Chờ tiếp nhận ({contracts.filter((c) => c.status === 'FACILITY_ASSIGNED').length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đang phụ trách ({contracts.filter((c) => c.status === 'ACTIVE').length})
        </button>
      </div>

      {/* Table / List */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">Chưa có hợp đồng nào được phân công</p>
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
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-300 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-700 tabular-nums">
                      {contract.contractNumber}
                    </span>
                    {isPendingReview ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Chờ tiếp nhận y tế
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang phụ trách
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{contract.packageName}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Chủ hộ: <strong className="text-slate-800">{contract.familyRepresentativeName}</strong> ({contract.membersCount} thành viên)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Địa chỉ: {contract.familyAddress}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 tabular-nums">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.packagePrice)}
                  </span>
                  {isPendingReview ? (
                    <Link
                      href={`/doctor/contracts/${contract.id}/review`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Thẩm định &amp; Ký số
                    </Link>
                  ) : (
                    <Link
                      href={`/doctor/contracts/${contract.id}/review`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Xem hồ sơ hợp đồng
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
