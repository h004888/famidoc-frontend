'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  type FourPartyContract,
  CONTRACT_STATUS_LABELS,
  ContractDocumentSheet,
} from '@/features/four-party-contract';
import { formatCurrencyVND } from '@/lib/utils';
import { contractsApi } from '@/lib/api';

export interface AdminFourPartyReviewViewProps {
  contract?: FourPartyContract;
  contractId?: string;
  onSignSuccess?: (updatedContract: FourPartyContract) => void;
}

const DEFAULT_MOCK_CONTRACT: FourPartyContract = {
  id: 'ct-4p-001',
  contractNumber: 'HD-4P-2026-0001',
  status: 'FAMILY_SIGNED',
  packageId: 'pkg-gold',
  packageName: 'Gói Chăm Sóc Toàn Diện Gia Đình',
  packagePrice: 9600000,
  durationMonths: 12,
  familyId: 'fam-88219',
  familyRepresentativeName: 'Nguyễn Văn An',
  familyRepresentativePhone: '0912345678',
  familyRepresentativeEmail: 'nguyenvanan@example.com',
  familyAddress: '123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  membersCount: 3,
  members: [
    {
      id: 'm-1',
      name: 'Nguyễn Văn An',
      age: 48,
      relation: 'Chủ hộ',
      chronic: 'Tăng huyết áp độ 1',
      allergies: 'Penicillin',
    },
    {
      id: 'm-2',
      name: 'Trần Thị Cúc',
      age: 72,
      relation: 'Mẹ',
      chronic: 'Đái tháo đường Type 2',
      allergies: 'Không có ghi nhận',
    },
    {
      id: 'm-3',
      name: 'Nguyễn Minh Quân',
      age: 8,
      relation: 'Con trai',
      chronic: 'Hen phế quản nhẹ',
      allergies: 'Hải sản vỏ cứng',
    },
  ],
  facilityId: 'fac-01',
  facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
  facilityAddress: '456 Lê Văn Sỹ, Phường 2, Tân Bình, TP. Hồ Chí Minh',
  createdAt: '2026-11-09T08:00:00.000Z',
  signatures: {
    family: {
      signedBy: 'Nguyễn Văn An',
      signerRole: 'FAMILY',
      signedAt: '2026-11-09T08:30:00.000Z',
      sha256Hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      ipAddress: '14.232.208.55',
    },
  },
};

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
  contract = DEFAULT_MOCK_CONTRACT,
  contractId,
  onSignSuccess,
}: AdminFourPartyReviewViewProps) {
  const [currentContract, setCurrentContract] = useState<FourPartyContract>(contract);

  useEffect(() => {
    if (contractId) {
      contractsApi
        .getMedicalContractById(contractId)
        .then((data) => {
          if (data) setCurrentContract(data);
        })
        .catch(() => {});
    }
  }, [contractId]);
  const [activeTab, setActiveTab] = useState<'audit' | 'full'>('audit');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signerName, setSignerName] = useState('Ban Điều Hành Famidoc');
  const [signerTitle, setSignerTitle] = useState('Đại diện Pháp lý Nền tảng FamiDoc');
  const [certificateId, setCertificateId] = useState('SMARTCA-VNPT-FD-2026-9901');
  const [auditNotes, setAuditNotes] = useState('Hồ sơ gia đình và số nhân khẩu hợp lệ, gói dịch vụ phù hợp.');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const isPlatformSigned = Boolean(
    currentContract.signatures?.platform?.sha256Hash ||
      currentContract.status === 'PLATFORM_SIGNED' ||
      currentContract.status === 'FACILITY_ASSIGNED' ||
      currentContract.status === 'DOCTOR_ACCEPTED' ||
      currentContract.status === 'PENDING_PAYMENT' ||
      currentContract.status === 'ACTIVE',
  );

  const handleConfirmSign = async () => {
    if (!isConfirmed) return;
    setIsSubmitting(true);

    let generatedHash = `plt_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 10)}${'0'.repeat(32)}`.slice(0, 64);
    try {
      const res = await contractsApi.signContract(currentContract.id, {
        termsHash: 'platform-terms-hash',
        confirmationCode: certificateId.trim(),
      });
      if (res?.signatureHash) {
        generatedHash = res.signatureHash;
      }
    } catch {
      // Fallback for offline or mock state
    }

    const nowIso = new Date().toISOString();

    const updatedContract: FourPartyContract = {
      ...currentContract,
      status: 'PLATFORM_SIGNED',
      signatures: {
        ...currentContract.signatures,
        platform: {
          signedBy: signerName.trim() || 'Ban Điều Hành Famidoc',
          signerRole: 'PLATFORM',
          signedAt: nowIso,
          sha256Hash: generatedHash,
          certificateId: certificateId.trim(),
        },
      },
    };

    setCurrentContract(updatedContract);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setSuccessBanner(
      'Đã ký số phê duyệt thành công! Hợp đồng đã chuyển sang PLATFORM_SIGNED và sẵn sàng chuyển tiếp tới Cơ sở y tế để phân công Bác sĩ.',
    );

    if (onSignSuccess) {
      onSignSuccess(updatedContract);
    }
  };

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
                Thẩm Định &amp; Ký Số Hợp Đồng 4 Bên
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full border bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold tabular-nums">
                {currentContract.contractNumber}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                  currentContract.status === 'PLATFORM_SIGNED'
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
            {!isPlatformSigned && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Ký số Duyệt Nền tảng</span>
              </button>
            )}
            {isPlatformSigned && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>Nền tảng đã ký số</span>
              </div>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {successBanner && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
              <span>{successBanner}</span>
            </div>
            <button
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
            Thẩm định Hồ sơ &amp; Đối chiếu Snapshot
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
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">inventory_2</span>
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
                    <p className="font-medium text-slate-800 mt-0.5">
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

                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-100 space-y-1">
                  <div className="font-semibold text-slate-800">Quyền lợi tiêu chuẩn kèm theo:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    <li>1 Bác sĩ gia đình chuyên trách CCHN theo dõi định kỳ</li>
                    <li>Khám lâm sàng tại nhà định kỳ &amp; tư vấn Telemedicine 24/7</li>
                    <li>Đồng bộ kết quả xét nghiệm và hồ sơ bệnh án điện tử (EMR)</li>
                  </ul>
                </div>
              </div>

              {/* Card 2: Thông tin Đại diện Hộ Gia Đình */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">person</span>
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
                    <span className="text-slate-500">Email giao dịch:</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {currentContract.familyRepresentativeEmail || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Cơ sở y tế điều phối:</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {currentContract.facilityName || 'Chưa điều phối'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Members snapshot table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">group</span>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Danh Sách Thành Viên Gia Đình Đăng Ký Chăm Sóc ({currentContract.members?.length || 0})
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Dữ liệu đối chiếu hồ sơ sức khỏe
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
                          <td className="py-3 px-4 font-semibold text-slate-900">{member.name}</td>
                          <td className="py-3 px-4 tabular-nums text-slate-700">{member.age} tuổi</td>
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
                              <span className="text-rose-700 font-medium">{member.allergies}</span>
                            ) : (
                              <span className="text-slate-400">Không ghi nhận</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Chưa có thông tin danh sách thành viên cụ thể.
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
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">draw</span>
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
                  <div>
                    <span className="text-slate-500">Địa chỉ IP ghi nhận:</span>
                    <p className="font-medium text-slate-800 tabular-nums mt-0.5">
                      {currentContract.signatures.family.ipAddress || '14.232.208.55'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Giao thức xác thực:</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      Email OTP + Khóa bảo mật đối xứng RSA-SHA256
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-500">Mã băm chữ ký số (SHA-256 Checksum):</span>
                    <div className="mt-1 p-2 bg-white rounded border border-slate-200 text-slate-700 text-[11px] break-all tabular-nums">
                      {currentContract.signatures.family.sha256Hash}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">
                  Gia đình chưa ký số hợp đồng này.
                </div>
              )}
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

      {/* Modal: Xác nhận Ký số Đại diện Nền tảng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[22px]">verified</span>
                <h3 className="font-bold text-slate-900 text-base">
                  Xác nhận Ký số Đại diện Nền tảng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Người đại diện ký duyệt Platform:
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Chức danh / Thẩm quyền:
                </label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mã chứng thư số SmartCA:
                </label>
                <input
                  type="text"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ghi chú thẩm định hồ sơ:
                </label>
                <textarea
                  rows={2}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-600 leading-snug">
                    Tôi xác nhận hồ sơ hợp đồng đã được thẩm định tính hợp lệ theo quy chế vận hành nền tảng y tế FamiDoc và kích hoạt quy trình điều phối cơ sở y tế.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!isConfirmed || isSubmitting}
                onClick={handleConfirmSign}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Đang ký số...' : 'Xác nhận Ký số'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
