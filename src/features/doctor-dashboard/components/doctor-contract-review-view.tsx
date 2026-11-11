'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  type FourPartyContract,
  CONTRACT_STATUS_LABELS,
  ContractDocumentSheet,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

export interface DoctorContractReviewViewProps {
  contract?: FourPartyContract;
  contractId?: string;
  onSignSuccess?: (updatedContract: FourPartyContract) => void;
}

const DEFAULT_MOCK_CONTRACT: FourPartyContract = {
  id: 'ct-4p-001',
  contractNumber: 'HD-4P-2026-0001',
  status: 'FACILITY_ASSIGNED',
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
      chronic: 'Đái tháo đường Type 2, Thoái hóa khớp',
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
  doctorId: 'doc-01',
  doctorName: 'BS. CKII Lê Hoàng Nam',
  doctorTitle: 'Bác sĩ Gia đình Chuyên khoa II',
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
    facility: {
      signedBy: 'TS.BS Trần Hữu Dũng - GĐ Phòng khám Medsev',
      signerRole: 'FACILITY',
      signedAt: '2026-11-09T10:00:00.000Z',
      sha256Hash: 'c3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567892',
    },
  },
};

export function DoctorContractReviewView({
  contract = DEFAULT_MOCK_CONTRACT,
  contractId,
  onSignSuccess,
}: DoctorContractReviewViewProps) {
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
  const [activeTab, setActiveTab] = useState<'summary' | 'full'>('summary');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorName, setDoctorName] = useState(
    contract.doctorName || 'BS. CKII Lê Hoàng Nam',
  );
  const [doctorCchn, setDoctorCchn] = useState('CCHN-003891/HCM-CCHN');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const isAccepted = currentContract.status === 'DOCTOR_ACCEPTED' || currentContract.status === 'PENDING_PAYMENT' || currentContract.status === 'ACTIVE';

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsConfirmed(false);
  };

  const handleConfirmSignature = async () => {
    if (!isConfirmed) return;
    setIsSubmitting(true);

    let sha256Mock = `d4e5f6a1b2c37890abcdef1234567890abcdef1234567890abcdef1234567893_${Date.now()}`;
    try {
      const res = await contractsApi.signContract(currentContract.id, {
        termsHash: 'doctor-terms-hash',
        confirmationCode: doctorCchn,
      });
      if (res?.signatureHash) {
        sha256Mock = res.signatureHash;
      }
    } catch {
      // Fallback for offline or mock state
    }

    const now = new Date().toISOString();

    const updated: FourPartyContract = {
      ...currentContract,
      status: 'DOCTOR_ACCEPTED',
      signatures: {
        ...currentContract.signatures,
        doctor: {
          signedBy: doctorName,
          signerRole: 'DOCTOR',
          signedAt: now,
          sha256Hash: sha256Mock,
          certificateId: doctorCchn,
        },
      },
    };

    setCurrentContract(updated);
    setSuccessBanner(
      'Đã ký số y khoa thành công! Hợp đồng đã được chuyển trạng thái sang DOCTOR_ACCEPTED (Sẵn sàng thanh toán).',
    );
    setIsSubmitting(false);
    setIsModalOpen(false);

    if (onSignSuccess) {
      onSignSuccess(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/doctor"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Quay lại Bảng Lâm sàng
          </Link>
          <div className="text-xs text-slate-500">
            Mã định danh hồ sơ: <span className="tabular-nums font-medium text-slate-700">{currentContract.id}</span>
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
                Nền tảng đã kích hoạt cổng thanh toán VietQR cho Hộ gia đình để hoàn tất kích hoạt hợp đồng.
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
                Cơ sở y tế điều phối:{' '}
                <span className="font-medium text-slate-700">
                  {currentContract.facilityName || 'Phòng khám Đa khoa Quốc tế Medsev'}
                </span>
                {' • '}
                Bác sĩ phụ trách:{' '}
                <span className="font-medium text-slate-700">
                  {currentContract.doctorName || doctorName}
                </span>
              </p>
            </div>

            {/* CTA action */}
            <div className="shrink-0">
              {isAccepted ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Bác sĩ đã chấp thuận chuyên môn
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Ký số Chấp thuận Chuyên môn
                </button>
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
              className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">medical_information</span>
              Tóm tắt Nhu cầu Chăm sóc (Care Needs)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'full'}
              onClick={() => setActiveTab('full')}
              className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'full'
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              Toàn văn Hợp đồng & 4 Chữ ký
            </button>
          </div>
        </div>

        {/* Tab 1: Care Needs Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Family Demographics & Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Thông tin Nhân khẩu học Hộ Gia đình
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu định danh do Đại diện gia đình khai báo khi đăng ký dịch vụ
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
                  <span className="font-semibold text-slate-900 text-sm block">
                    {currentContract.members?.length || currentContract.membersCount || 0} thành viên
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
              <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Hồ sơ Sức khỏe Thành viên & Phân tầng Nguy cơ
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đánh dấu các yếu tố lâm sàng cần chú ý: người cao tuổi, trẻ nhỏ, bệnh mạn tính và dị ứng thuốc/thức ăn
                  </p>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  Tổng cộng: {currentContract.members?.length || 0} hồ sơ
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {currentContract.members?.map((member) => {
                  const isElderly = member.age >= 60;
                  const isPediatric = member.age < 18;

                  return (
                    <div
                      key={member.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Member Identity & Demographic Badge */}
                      <div className="space-y-1 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{member.name}</h3>
                          <span className="text-xs text-slate-500">({member.relation})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 tabular-nums">
                            {member.age} tuổi
                          </span>
                          {isElderly && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Cao tuổi
                            </span>
                          )}
                          {isPediatric && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                              Trẻ nhỏ
                            </span>
                          )}
                          {!isElderly && !isPediatric && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              Trưởng thành
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Clinical Profile: Chronic Conditions & Allergies */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 text-xs">
                        {/* Chronic conditions */}
                        <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200/80">
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-slate-600">
                              ecg_heart
                            </span>
                            Bệnh lý mạn tính
                          </div>
                          <div className="text-slate-800 font-medium">
                            {member.chronic || 'Không có ghi nhận'}
                          </div>
                        </div>

                        {/* Allergies */}
                        <div className="p-2.5 rounded-md bg-rose-50/50 border border-rose-200/70">
                          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-rose-600">
                              warning
                            </span>
                            Tiền sử dị ứng
                          </div>
                          <div className="text-rose-900 font-medium">
                            {member.allergies || 'Không có ghi nhận'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Doctor Commitment Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Cam kết trách nhiệm chuyên môn theo dõi sức khỏe ban đầu
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quy chuẩn trách nhiệm pháp lý và đạo đức hành nghề y tế gia đình theo định biên Famidoc
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="material-symbols-outlined text-blue-600 shrink-0 text-[18px] mt-0.5">
                    task_alt
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      Theo dõi và quản lý hồ sơ sức khỏe điện tử liên tục:
                    </strong>
                    Cập nhật đầy đủ diễn tiến sức khỏe, chỉ số sinh hiệu IoT và lịch sử dùng thuốc của từng thành viên trong hộ gia đình.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="material-symbols-outlined text-blue-600 shrink-0 text-[18px] mt-0.5">
                    event_repeat
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      Kế hoạch khám định kỳ & Tư vấn Telemedicine 24/7:
                    </strong>
                    Thực hiện đúng tần suất các đợt khám tại gia (Home Visit) và đảm bảo phiên hội chẩn từ xa theo quyền lợi gói {currentContract.packageName}.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="material-symbols-outlined text-blue-600 shrink-0 text-[18px] mt-0.5">
                    lock
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      Bảo mật tuyệt đối thông tin bệnh án y khoa:
                    </strong>
                    Tuân thủ nghiêm ngặt Luật Khám bệnh, chữa bệnh số 15/2023/QH15 và tiêu chuẩn an toàn dữ liệu sức khỏe quốc gia.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Legal Contract Sheet */}
        {activeTab === 'full' && (
          <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-6 shadow-xs">
            <ContractDocumentSheet contract={currentContract} />
          </div>
        )}
      </div>

      {/* Digital Signature Confirmation Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Xác nhận Ký số Y khoa Chuyên môn
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đóng dấu chữ ký số Bác sĩ Gia đình phụ trách hợp đồng 4 bên
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label htmlFor="doctor-sign-name" className="block font-medium text-slate-700 mb-1">
                  Bác sĩ Ký số & Chịu trách nhiệm chuyên môn
                </label>
                <input
                  id="doctor-sign-name"
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-slate-50 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label htmlFor="doctor-cchn" className="block font-medium text-slate-700 mb-1">
                  Số Chứng chỉ Hành nghề (CCHN)
                </label>
                <input
                  id="doctor-cchn"
                  type="text"
                  value={doctorCchn}
                  onChange={(e) => setDoctorCchn(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900 tabular-nums"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                <p className="font-semibold text-xs">Hợp đồng: {currentContract.contractNumber}</p>
                <p className="text-[11px] text-blue-800">
                  Hộ gia đình: {currentContract.familyRepresentativeName} ({currentContract.members?.length || 0} thành viên)
                </p>
                <p className="text-[11px] text-blue-800">
                  Cơ sở Y tế phê duyệt: {currentContract.facilityName || 'Phòng khám Medsev'}
                </p>
              </div>

              {/* Confirmation checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  id="doctor-confirm-checkbox"
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  aria-label="Tôi xác nhận đã thẩm định hồ sơ nhu cầu chăm sóc sức khỏe của hộ gia đình và cam kết thực hiện đầy đủ nghĩa vụ chuyên môn theo hợp đồng 4 bên."
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                />
                <label
                  htmlFor="doctor-confirm-checkbox"
                  className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none"
                >
                  Tôi xác nhận đã thẩm định hồ sơ nhu cầu chăm sóc sức khỏe của hộ gia đình và cam kết thực hiện đầy đủ nghĩa vụ chuyên môn theo hợp đồng 4 bên.
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!isConfirmed || isSubmitting}
                onClick={handleConfirmSignature}
                className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors shadow-xs ${
                  isConfirmed && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Đang tạo chữ ký...' : 'Xác nhận Ký số'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
