'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DocumensoSigningEmbed,
  type FourPartyContract,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

export interface FacilityContractInboundViewProps {
  initialContracts?: FourPartyContract[];
}

export function FacilityContractInboundView({
  initialContracts,
}: FacilityContractInboundViewProps) {
  const isControlledByProps = initialContracts !== undefined;
  const [contracts, setContracts] = useState<FourPartyContract[]>(
    initialContracts ?? []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isControlledByProps);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [signingContract, setSigningContract] = useState<FourPartyContract | null>(null);
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
            : 'Không thể tải danh sách hợp đồng từ máy chủ.'
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

  const totalContracts = contracts.length;
  const pendingSignature = contracts.filter(
    (c) =>
      !c.signatures?.facility &&
      c.status !== 'ACTIVE' &&
      c.status !== 'CANCELLED'
  ).length;
  const signedCount = contracts.filter(
    (c) =>
      Boolean(c.signatures?.facility) ||
      c.status === 'FACILITY_ASSIGNED' ||
      c.status === 'DOCTOR_ACCEPTED' ||
      c.status === 'PENDING_PAYMENT' ||
      c.status === 'ACTIVE'
  ).length;

  const packageOptions = useMemo(() => {
    const map = new Map<string, string>();
    contracts.forEach((c) => {
      map.set(c.packageId, c.packageName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.contractNumber.toLowerCase().includes(q) ||
        c.familyRepresentativeName.toLowerCase().includes(q) ||
        (c.familyRepresentativePhone && c.familyRepresentativePhone.includes(q)) ||
        (c.familyAddress && c.familyAddress.toLowerCase().includes(q));

      const matchesPackage = packageFilter === 'ALL' || c.packageId === packageFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [contracts, searchQuery, packageFilter, statusFilter]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

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
            Hợp đồng 4 bên tiếp nhận (Bên B — Cơ sở Y tế)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách hợp đồng dịch vụ bác sĩ gia đình cần phân công và ký số trên Documenso khi Bên A đã ký xác nhận.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isControlledByProps && (
            <button
              type="button"
              onClick={triggerReload}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer disabled:opacity-50"
            >
              Làm mới
            </button>
          )}
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
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {totalContracts}
          </div>
          <div className="text-xs text-slate-500 mt-1">Hồ sơ hợp đồng 4 bên</div>
        </div>

        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">
            Chờ CSYT ký / phân công
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1 tabular-nums">
            {pendingSignature}
          </div>
          <div className="text-xs text-amber-600 mt-1">Cần ký xác nhận trên Documenso</div>
        </div>

        <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
            Đã ký số CSYT
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1 tabular-nums">
            {signedCount}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Đã hoàn tất chữ ký Bên B</div>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2"
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
              <option value="DRAFT">Chờ Bên A ký Documenso</option>
              <option value="FAMILY_SIGNED">Bên A đã ký — Chờ ký song song</option>
              <option value="PLATFORM_SIGNED">Chờ CSYT phân công (Nền tảng đã duyệt)</option>
              <option value="FACILITY_ASSIGNED">Đã phân công bác sĩ</option>
              <option value="PENDING_PAYMENT">Đủ 4/4 chữ ký — Chờ thanh toán</option>
              <option value="ACTIVE">Đang hiệu lực</option>
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    Đang tải danh sách hợp đồng...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Không tìm thấy hợp đồng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => {
                  const familySigned = Boolean(contract.signatures?.family) || contract.status !== 'DRAFT';
                  const facilitySigned =
                    Boolean(contract.signatures?.facility) ||
                    contract.status === 'FACILITY_ASSIGNED' ||
                    contract.status === 'PENDING_PAYMENT' ||
                    contract.status === 'ACTIVE';
                  const isPending = !facilitySigned;

                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-left">
                        <div className="font-semibold text-slate-900 tabular-nums">
                          {contract.contractNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          Tạo ngày {formatDate(contract.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="font-medium text-slate-900">
                          {contract.familyRepresentativeName}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {contract.familyRepresentativePhone} • {contract.membersCount || 1} suất thành viên
                        </div>
                        {contract.familyAddress && (
                          <div className="text-xs text-slate-400 truncate max-w-[200px]" title={contract.familyAddress}>
                            {contract.familyAddress}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="font-medium text-slate-800">
                          {contract.packageName}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          Thời hạn: {contract.durationMonths || 12} tháng
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 tabular-nums">
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
                        {!familySigned ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            Chờ Bên A ký trước
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Chờ phân công &amp; ký
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Đã ký số CSYT
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSigningContract(contract)}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                          >
                            Ký Documenso
                          </button>
                          <Link
                            href={`/facility/contracts/${contract.id}/assign`}
                            className={
                              isPending
                                ? 'inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors'
                                : 'inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors'
                            }
                          >
                            {isPending ? 'Phân công & Ký số' : 'Xem phân công'}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ký Documenso trực tiếp cho CSYT (Bên B) */}
      {signingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Ký Hợp Đồng Documenso — Bên B (Cơ sở Y tế)
                </h2>
                <p className="text-xs text-slate-500 tabular-nums">
                  {signingContract.contractNumber} • Gia đình: {signingContract.familyRepresentativeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSigningContract(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-semibold px-2 py-1"
              >
                Đóng
              </button>
            </div>

            <DocumensoSigningEmbed
              contractId={signingContract.id}
              onSyncCompleted={triggerReload}
            />
          </div>
        </div>
      )}
    </div>
  );
}
