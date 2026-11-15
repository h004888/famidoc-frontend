'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

export interface DoctorContractsInboundViewProps {
  initialContracts?: FourPartyContract[];
}

export function DoctorContractsInboundView({
  initialContracts,
}: DoctorContractsInboundViewProps) {
  const isControlledByProps = initialContracts !== undefined;
  const [contracts, setContracts] = useState<FourPartyContract[]>(
    initialContracts ?? []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isControlledByProps);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [reloadTick, setReloadTick] = useState(0);

  const triggerReload = () => {
    if (isControlledByProps) return;
    setIsLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    if (isControlledByProps) return;
    let active = true;
    async function loadContracts() {
      try {
        const items = await contractsApi.getMedicalContracts({ limit: 50 });
        if (!active) return;
        setContracts(items);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách hợp đồng phân công.'
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void loadContracts();
    return () => {
      active = false;
    };
  }, [isControlledByProps, reloadTick]);

  const isContractPendingForDoctor = (c: FourPartyContract) =>
    !c.signatures?.doctor &&
    c.status !== 'ACTIVE' &&
    c.status !== 'DOCTOR_ACCEPTED' &&
    c.status !== 'PENDING_PAYMENT' &&
    c.status !== 'CANCELLED';

  const filteredContracts = contracts.filter((c) => {
    if (filter === 'pending') {
      return isContractPendingForDoctor(c);
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
            <span>Bên C • Bác sĩ gia đình phụ trách</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Danh sách Hợp đồng Y tế Phân công
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý và ký xác nhận trên Documenso để tiếp nhận theo dõi sức khỏe dài hạn cho các hộ gia đình theo chuẩn y khoa FamiDoc.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isControlledByProps && (
            <button
              type="button"
              onClick={triggerReload}
              disabled={isLoading}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer disabled:opacity-50"
            >
              Làm mới
            </button>
          )}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right">
            <span className="block text-[11px] text-slate-500 font-medium">Panel Cap / Định biên</span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {contracts.filter((c) => c.status === 'ACTIVE').length} / 30 hộ
            </span>
          </div>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={triggerReload}
            className="px-3 py-1.5 rounded-md bg-rose-600 text-white font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả ({contracts.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Chờ tiếp nhận ({contracts.filter(isContractPendingForDoctor).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đang phụ trách ({contracts.filter((c) => c.status === 'ACTIVE').length})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
          Đang tải danh sách hợp đồng phân công...
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">Chưa có hợp đồng nào được phân công</p>
          <p className="text-xs text-slate-400 mt-1">
            Khi hộ gia đình đăng ký gói hoặc Cơ sở y tế phân công hộ gia đình mới, danh sách sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContracts.map((contract) => {
            const familySigned =
              Boolean(contract.signatures?.family) || contract.status !== 'DRAFT';
            const isPendingReview = isContractPendingForDoctor(contract);
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
                    {!familySigned ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Chờ Bên A ký trước
                      </span>
                    ) : isPendingReview ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Chờ bác sĩ ký Documenso
                      </span>
                    ) : contract.status === 'PENDING_PAYMENT' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Chờ gia đình thanh toán
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
                      Chủ hộ: <strong className="text-slate-800">{contract.familyRepresentativeName}</strong> ({contract.membersCount ?? 1} thành viên)
                    </p>
                    {contract.familyAddress && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        Địa chỉ: {contract.familyAddress}
                      </p>
                    )}
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
                      Thẩm định &amp; Ký Documenso
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
