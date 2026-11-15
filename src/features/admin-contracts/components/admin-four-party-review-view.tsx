'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  type FourPartyContract,
  CONTRACT_STATUS_LABELS,
  ContractDocumentSheet,
  DocumensoSigningEmbed,
} from '@/features/four-party-contract';
import { formatCurrencyVND } from '@/lib/utils';
import { contractsApi } from '@/lib/api';

export interface AdminFourPartyReviewViewProps {
  contract?: FourPartyContract;
  contractId?: string;
  onSignSuccess?: (updatedContract: FourPartyContract) => void;
}

function formatMedicalDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export function AdminFourPartyReviewView({
  contract,
  contractId,
  onSignSuccess,
}: AdminFourPartyReviewViewProps) {
  const [currentContract, setCurrentContract] = useState<FourPartyContract | null>(
    contract ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(contractId) && !contract);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'audit' | 'full'>('audit');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const loadContract = useCallback(async () => {
    if (!contractId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await contractsApi.getMedicalContractById(contractId);
      setCurrentContract(data);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Không thể tải thông tin hợp đồng y tế 4 bên.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (contractId && !contract) {
      void loadContract();
    }
  }, [contractId, contract, loadContract]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center text-xs text-slate-500">
        Đang tải hồ sơ hợp đồng 4 bên và phiên ký Documenso...
      </div>
    );
  }

  if (loadError || !currentContract) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div
          role="alert"
          className="max-w-3xl mx-auto rounded-xl border border-rose-200 bg-rose-50 p-6 space-y-3"
        >
          <h2 className="text-sm font-bold text-rose-900">
            Không thể tải hồ sơ hợp đồng 4 bên
          </h2>
          <p className="text-xs text-rose-800">
            {loadError || 'Không tìm thấy hợp đồng được yêu cầu.'}
          </p>
          <div className="flex items-center gap-2">
            {contractId && (
              <button
                type="button"
                onClick={() => void loadContract()}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                Thử lại
              </button>
            )}
            <Link
              href="/admin/contracts"
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-800 text-xs font-semibold"
            >
              Quay lại Quản trị Hợp đồng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPlatformSigned = Boolean(
    currentContract.signatures?.platform?.sha256Hash ||
      currentContract.status === 'PLATFORM_SIGNED' ||
      currentContract.status === 'PENDING_PAYMENT' ||
      currentContract.status === 'ACTIVE'
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link
                href="/admin/contracts"
                className="hover:text-slate-800 transition-colors flex items-center gap-1"
              >
                <span>&larr; Quay lại Quản trị Hợp đồng</span>
              </Link>
              <span>/</span>
              <span className="text-slate-700 font-medium">Thẩm định HĐ 4 Bên</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Thẩm Định &amp; Ký Số Hợp Đồng 4 Bên (Bên D — Nền tảng)
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full border bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold tabular-nums">
                {currentContract.contractNumber}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                  currentContract.status === 'ACTIVE' || isPlatformSigned
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentContract.status === 'FAMILY_SIGNED'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {CONTRACT_STATUS_LABELS[currentContract.status] || currentContract.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPlatformSigned ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  check_circle
                </span>
                <span>Nền tảng (Bên D) đã ký Documenso</span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
                Ký trực tiếp trên Documenso bên dưới
              </span>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {successBanner && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                check_circle
              </span>
              <span>{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-600 hover:text-emerald-900 text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'audit'}
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Thẩm định Hồ sơ &amp; Ký Documenso (Bên D)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'full'}
            onClick={() => setActiveTab('full')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'full'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Toàn văn Hợp đồng (Văn bản pháp lý A4)
          </button>
        </div>

        {/* Tab 1: Audit Snapshot View */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Top row: 2 cards: Package info & Family rep info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Gói dịch vụ đăng ký */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                      inventory_2
                    </span>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Snapshot Gói Chăm Sóc Sức Khỏe
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {currentContract.durationMonths || 12} tháng
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Tên gói dịch vụ:</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">
                      {currentContract.packageName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Đơn giá niêm yết:</span>
                    <p className="font-semibold text-indigo-700 text-sm tabular-nums mt-0.5">
                      {formatCurrencyVND(currentContract.packagePrice)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Quy mô bảo trợ:</span>
                    <p className="font-medium text-slate-800 mt-0.5 tabular-nums">
                      {currentContract.membersCount || currentContract.members?.length || 1} nhân khẩu
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ngày tạo hồ sơ:</span>
                    <p className="font-medium text-slate-800 tabular-nums mt-0.5">
                      {formatMedicalDate(currentContract.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Thông tin Đại diện Hộ Gia Đình */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                      person
                    </span>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Thông Tin Đại Diện Gia Đình (Bên A)
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium tabular-nums">
                    Mã hộ: {currentContract.familyId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Họ và tên chủ hộ:</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">
                      {currentContract.familyRepresentativeName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Số điện thoại liên hệ:</span>
                    <p className="font-medium text-slate-800 tabular-nums mt-0.5">
                      {currentContract.familyRepresentativePhone}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Địa chỉ thường trú / phục vụ:</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {currentContract.familyAddress || 'Chưa cung cấp địa chỉ'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Cơ sở y tế (Bên B):</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {currentContract.facilityName || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Bác sĩ phụ trách (Bên C):</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {currentContract.doctorName || 'Chưa phân công'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Members snapshot table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                    group
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Danh Sách Thành Viên Gia Đình ({currentContract.members?.length || 0}/
                    {currentContract.membersCount || 1} suất)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Hồ sơ chi tiết được gia đình khai báo sau khi hợp đồng kích hoạt ACTIVE
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Họ và Tên</th>
                      <th className="py-3 px-4">Tuổi</th>
                      <th className="py-3 px-4">Quan hệ với chủ hộ</th>
                      <th className="py-3 px-4">Tiền sử / Bệnh mạn tính</th>
                      <th className="py-3 px-4">Dị ứng thuốc &amp; thực phẩm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentContract.members && currentContract.members.length > 0 ? (
                      currentContract.members.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {member.name}
                          </td>
                          <td className="py-3 px-4 tabular-nums text-slate-700">
                            {member.age} tuổi
                          </td>
                          <td className="py-3 px-4 text-slate-600">{member.relation}</td>
                          <td className="py-3 px-4 text-slate-700">
                            {member.chronic ? (
                              <span className="text-slate-800">{member.chronic}</span>
                            ) : (
                              <span className="text-slate-400">Không ghi nhận</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {member.allergies ? (
                              <span className="text-rose-700 font-medium">
                                {member.allergies}
                              </span>
                            ) : (
                              <span className="text-slate-400">Không ghi nhận</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          Gia đình đã chốt {currentContract.membersCount || 1} suất thành viên và sẽ thêm hồ sơ chi tiết sau khi kích hoạt gói.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Digital Signature Audit Box: Family Signature */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                    draw
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Chữ ký số Đại diện Gia đình (Bên A)
                  </h3>
                </div>
                {currentContract.signatures?.family ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Đã ký số điện tử hợp lệ</span>
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                    Chưa ký
                  </span>
                )}
              </div>

              {currentContract.signatures?.family ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500">Người ký số:</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">
                      {currentContract.signatures.family.signedBy}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Thời gian ký ghi nhận:</span>
                    <p className="font-medium text-slate-800 tabular-nums mt-0.5">
                      {formatMedicalDate(currentContract.signatures.family.signedAt)}
                    </p>
                  </div>
                  {currentContract.signatures.family.ipAddress && (
                    <div>
                      <span className="text-slate-500">Địa chỉ IP ghi nhận:</span>
                      <p className="font-medium text-slate-800 tabular-nums mt-0.5">
                        {currentContract.signatures.family.ipAddress}
                      </p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <span className="text-slate-500">Mã xác thực chữ ký (Documenso / SHA-256):</span>
                    <div className="mt-1 p-2 bg-white rounded border border-slate-200 text-slate-700 text-[11px] break-all tabular-nums">
                      {currentContract.signatures.family.sha256Hash}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">
                  Đại diện hộ gia đình (Bên A) chưa hoàn tất ký trên Documenso.
                </div>
              )}
            </div>

            {/* Documenso E-Signing Section for Admin (Bên D) */}
            <div data-testid="admin-Documenso-signing-section">
              <DocumensoSigningEmbed
                contractId={currentContract.id}
                onSyncCompleted={(res) => {
                  const updated: FourPartyContract = {
                    ...currentContract,
                    status:
                      res.contractStatus === 'PENDING_PAYMENT'
                        ? 'PENDING_PAYMENT'
                        : res.contractStatus === 'ACTIVE'
                        ? 'ACTIVE'
                        : 'PLATFORM_SIGNED',
                    signatures: {
                      ...currentContract.signatures,
                      platform: {
                        signedBy: 'Ban Điều Hành FamiDoc',
                        signerRole: 'PLATFORM',
                        signedAt: new Date().toISOString(),
                        sha256Hash: 'Documenso-verified-signature',
                      },
                    },
                  };
                  setCurrentContract(updated);
                  setSuccessBanner(
                    `Đã đồng bộ chữ ký Nền tảng trên Documenso (${res.signedRoles.length}/4 bên).`
                  );
                  onSignSuccess?.(updated);
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Full Document Sheet */}
        {activeTab === 'full' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <ContractDocumentSheet contract={currentContract} />
          </div>
        )}
      </main>
    </div>
  );
}
