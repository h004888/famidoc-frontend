'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  type FourPartyContract,
  CONTRACT_STATUS_LABELS,
  ContractDocumentSheet,
  DocumensoSigningEmbed,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

export interface DoctorContractReviewViewProps {
  contract?: FourPartyContract;
  contractId?: string;
  onSignSuccess?: (updatedContract: FourPartyContract) => void;
}

export function DoctorContractReviewView({
  contract,
  contractId,
  onSignSuccess,
}: DoctorContractReviewViewProps) {
  const [currentContract, setCurrentContract] = useState<FourPartyContract | null>(
    contract ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(contractId) && !contract);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'full'>('summary');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const triggerReload = () => {
    if (!contractId) return;
    setIsLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    if (!contractId) return;
    const targetContractId = contractId;
    let active = true;
    async function loadContract() {
      try {
        const data = await contractsApi.getMedicalContractById(targetContractId);
        if (!active) return;
        setCurrentContract(data);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải chi tiết hợp đồng y tế 4 bên.'
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void loadContract();
    return () => {
      active = false;
    };
  }, [contractId, reloadTick]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center text-xs text-slate-500">
        Đang tải thông tin hợp đồng và phiên ký Documenso...
      </div>
    );
  }

  if (loadError || !currentContract) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6">
        <div
          role="alert"
          className="max-w-3xl mx-auto rounded-xl border border-rose-200 bg-rose-50 p-6 space-y-3"
        >
          <h2 className="text-sm font-bold text-rose-900">
            Không thể tải hợp đồng y tế
          </h2>
          <p className="text-xs text-rose-800">
            {loadError || 'Không tìm thấy hợp đồng được yêu cầu.'}
          </p>
          <div className="flex items-center gap-2">
            {contractId && (
              <button
                type="button"
                onClick={triggerReload}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                Thử lại
              </button>
            )}
            <Link
              href="/doctor/contracts"
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-800 text-xs font-semibold"
            >
              Quay lại danh sách hợp đồng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAccepted =
    Boolean(currentContract.signatures?.doctor) ||
    currentContract.status === 'DOCTOR_ACCEPTED' ||
    currentContract.status === 'PENDING_PAYMENT' ||
    currentContract.status === 'ACTIVE';

  const membersList = currentContract.members ?? [];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/doctor/contracts"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Quay lại Danh sách Hợp đồng
          </Link>
          <div className="text-xs text-slate-500">
            Mã định danh hồ sơ:{' '}
            <span className="tabular-nums font-medium text-slate-700">
              {currentContract.id}
            </span>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600 shrink-0 text-[20px] mt-0.5">
              check_circle
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{successBanner}</p>
              <p className="text-xs text-emerald-700">
                Trạng thái hợp đồng đã được đồng bộ từ Documenso. Khi đủ 4/4 chữ ký, hộ gia đình sẽ thanh toán VietQR để kích hoạt gói.
              </p>
            </div>
          </div>
        )}

        {/* Header Hero Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Hợp đồng 4 Bên
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
                  {currentContract.contractNumber}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded border ${
                    isAccepted
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {CONTRACT_STATUS_LABELS[currentContract.status]}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentContract.packageName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Cơ sở y tế điều phối (Bên B):{' '}
                <span className="font-medium text-slate-700">
                  {currentContract.facilityName || 'Đang cập nhật'}
                </span>
                {' • '}
                Bác sĩ phụ trách (Bên C):{' '}
                <span className="font-medium text-slate-700">
                  {currentContract.doctorName || 'Bác sĩ Gia đình phụ trách'}
                </span>
              </p>
            </div>

            <div className="shrink-0">
              {isAccepted ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Bác sĩ đã chấp thuận chuyên môn
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                  Ký trực tiếp trên Documenso bên dưới
                </span>
              )}
            </div>
          </div>

          {/* View Mode Navigation Tabs */}
          <div className="flex border-b border-slate-200 mt-6 -mb-1 gap-6">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'summary'}
              onClick={() => setActiveTab('summary')}
              className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">medical_information</span>
              Tóm tắt Nhu cầu &amp; Ký Documenso (Bên C)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'full'}
              onClick={() => setActiveTab('full')}
              className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'full'
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              Toàn văn Hợp đồng &amp; 4 Chữ ký
            </button>
          </div>
        </div>

        {/* Tab 1: Care Needs Summary + Documenso Signing Embed */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Family Demographics & Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Thông tin Nhân khẩu học Hộ Gia đình
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu định danh và số suất thành viên đăng ký theo gói chăm sóc
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80">
                  <span className="text-slate-500 block mb-1">Đại diện hộ gia đình</span>
                  <span className="font-semibold text-slate-900 text-sm block">
                    {currentContract.familyRepresentativeName}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80">
                  <span className="text-slate-500 block mb-1">Số điện thoại liên hệ</span>
                  <span className="font-semibold text-slate-900 text-sm block tabular-nums">
                    {currentContract.familyRepresentativePhone}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80">
                  <span className="text-slate-500 block mb-1">Quy mô gia đình</span>
                  <span className="font-semibold text-slate-900 text-sm block tabular-nums">
                    {currentContract.membersCount ?? membersList.length ?? 1} thành viên
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80">
                  <span className="text-slate-500 block mb-1">Thời hạn hợp đồng</span>
                  <span className="font-semibold text-slate-900 text-sm block tabular-nums">
                    {currentContract.durationMonths || 12} tháng
                  </span>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 text-xs">
                <span className="text-slate-500 block mb-0.5">Địa chỉ lưu trú đăng ký khám tại nhà (Home Visit)</span>
                <span className="font-medium text-slate-800">
                  {currentContract.familyAddress || 'Chưa cập nhật'}
                </span>
              </div>
            </div>

            {/* Members Clinical Roster & Care Needs */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Hồ sơ Sức khỏe Thành viên &amp; Phân tầng Nguy cơ
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hồ sơ bệnh lý chi tiết sẽ hiển thị ngay khi Hộ gia đình kê khai sau bước kích hoạt gói
                </p>
              </div>

              {membersList.length === 0 ? (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
                  Hộ gia đình đã đăng ký gói cho{' '}
                  <strong className="text-slate-900 tabular-nums">
                    {currentContract.membersCount ?? 1} thành viên
                  </strong>
                  . Danh sách hồ sơ sức khỏe từng thành viên sẽ được gia đình bổ sung ngay sau khi hợp đồng được kích hoạt.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {membersList.map((member) => {
                    const isElderly = member.age >= 60;
                    const isPediatric = member.age <= 12;
                    return (
                      <div
                        key={member.id}
                        className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 text-sm">
                            {member.name}
                          </span>
                          <span className="text-xs text-slate-600 tabular-nums">
                            {member.age} tuổi
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {member.relation}
                          </span>
                          {isElderly && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                              Cao tuổi
                            </span>
                          )}
                          {isPediatric && (
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[11px]">
                              Trẻ nhỏ
                            </span>
                          )}
                        </div>
                        {member.chronic && (
                          <p className="text-slate-700">
                            <span className="text-slate-500">Bệnh mạn tính:</span> {member.chronic}
                          </p>
                        )}
                        {member.allergies && (
                          <p className="text-slate-700">
                            <span className="text-slate-500">Dị ứng:</span> {member.allergies}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Clinical Commitment */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3 text-xs text-slate-700">
              <h2 className="text-sm font-semibold text-slate-900">
                Cam kết trách nhiệm chuyên môn theo dõi sức khỏe ban đầu
              </h2>
              <ul className="space-y-1.5 list-disc pl-5">
                <li>Theo dõi và quản lý hồ sơ sức khỏe điện tử liên tục cho toàn bộ thành viên được bảo trợ.</li>
                <li>Thực hiện thăm khám tại nhà và tư vấn Telehealth đúng hạn mức và tiêu chuẩn chuyên môn của Bộ Y tế.</li>
                <li>Bảo mật tuyệt đối thông tin bệnh án y khoa theo Luật Bảo vệ dữ liệu cá nhân và Luật Khám bệnh, chữa bệnh.</li>
              </ul>
            </div>

            {/* Documenso E-Signing Section */}
            <div data-testid="doctor-Documenso-signing-section">
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
                        : 'DOCTOR_ACCEPTED',
                    signatures: {
                      ...currentContract.signatures,
                      doctor: {
                        signedBy:
                          currentContract.doctorName || 'Bác sĩ Gia đình phụ trách',
                        signerRole: 'DOCTOR',
                        signedAt: new Date().toISOString(),
                        sha256Hash: 'Documenso-verified-signature',
                      },
                    },
                  };
                  setCurrentContract(updated);
                  setSuccessBanner(
                    `Đã đồng bộ chữ ký Bác sĩ trên Documenso thành công (${res.signedRoles.length}/4 bên).`
                  );
                  onSignSuccess?.(updated);
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Full Legal Document Sheet */}
        {activeTab === 'full' && (
          <ContractDocumentSheet contract={currentContract} />
        )}
      </div>
    </div>
  );
}
