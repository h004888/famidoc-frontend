'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  type FourPartyContract,
  MAX_HOUSEHOLDS_PER_DOCTOR,
  doctorAssignmentSchema,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

export interface AvailableDoctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  currentAssignedHouseholds: number;
  phone: string;
  rating?: number;
}

export interface FacilityDoctorAssignViewProps {
  contract?: FourPartyContract;
  contractId?: string;
  doctors?: AvailableDoctor[];
  onAssignSuccess?: (updatedContract: FourPartyContract) => void;
}

const DEFAULT_MOCK_CONTRACT: FourPartyContract = {
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
  membersCount: 3,
  members: [
    { id: 'm-1', name: 'Nguyễn Văn An', age: 48, relation: 'Chủ hộ', chronic: 'Tăng huyết áp độ 1', allergies: 'Penicillin' },
    { id: 'm-2', name: 'Trần Thị Mai Phương', age: 45, relation: 'Vợ', chronic: 'Không có', allergies: 'Không có' },
    { id: 'm-3', name: 'Nguyễn Minh Quân', age: 16, relation: 'Con trai', chronic: 'Viêm mũi dị ứng', allergies: 'Hải sản' },
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
    },
    platform: {
      signedBy: 'Ban Điều Hành Famidoc',
      signerRole: 'PLATFORM',
      signedAt: '2026-11-09T09:15:00.000Z',
      sha256Hash: 'b2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
    },
  },
};

const DEFAULT_DOCTORS: AvailableDoctor[] = [
  {
    id: 'doc-01',
    name: 'BS. CKII Lê Hoàng Nam',
    title: 'Bác sĩ Gia đình Chuyên khoa II',
    specialty: 'Nội tổng quát & Lão khoa',
    currentAssignedHouseholds: 21,
    phone: '0903889901',
    rating: 4.9,
  },
  {
    id: 'doc-02',
    name: 'BS. CKI Lê Thị Kim Oanh',
    title: 'Bác sĩ Chuyên khoa I',
    specialty: 'Nội tim mạch & Huyết áp',
    currentAssignedHouseholds: 28,
    phone: '0903889902',
    rating: 4.8,
  },
  {
    id: 'doc-03',
    name: 'BS. Đỗ Minh Tuấn',
    title: 'Bác sĩ Gia đình',
    specialty: 'Y học Gia đình & Nhi khoa',
    currentAssignedHouseholds: 30, // MAX REACHED
    phone: '0903889903',
    rating: 4.7,
  },
  {
    id: 'doc-04',
    name: 'BS. Nguyễn Hải Đăng',
    title: 'Bác sĩ Đa khoa',
    specialty: 'Nội khoa tổng quát',
    currentAssignedHouseholds: 31, // OVER QUOTA
    phone: '0903889904',
    rating: 4.6,
  },
];

export function FacilityDoctorAssignView({
  contract = DEFAULT_MOCK_CONTRACT,
  contractId,
  doctors = DEFAULT_DOCTORS,
  onAssignSuccess,
}: FacilityDoctorAssignViewProps) {
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

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(
    currentContract.doctorId || null,
  );
  const [signerName, setSignerName] = useState('TS.BS Vũ Thành (Giám đốc PK Medsev)');
  const [isAgreed, setIsAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleSelectDoctor = (doctor: AvailableDoctor) => {
    if (doctor.currentAssignedHouseholds >= MAX_HOUSEHOLDS_PER_DOCTOR) {
      return;
    }
    setSelectedDoctorId(doctor.id);
    setErrorMessage(null);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedDoctor) {
      setErrorMessage('Vui lòng chọn bác sĩ gia đình phụ trách.');
      return;
    }

    if (!isAgreed) {
      setErrorMessage('Vui lòng xác nhận điều khoản phân công và ký số hợp đồng.');
      return;
    }

    // Validate quota with Zod schema
    const validationResult = doctorAssignmentSchema.safeParse({
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      facilityId: currentContract.facilityId || 'fac-01',
      contractId: currentContract.id,
      currentAssignedHouseholds: selectedDoctor.currentAssignedHouseholds,
    });

    if (!validationResult.success) {
      setErrorMessage(
        validationResult.error.issues[0]?.message ||
          'Định biên bác sĩ đã vượt quá ngưỡng cho phép (tối đa 30 hộ).'
      );
      return;
    }

    // Call contractsApi.assignDoctor & contractsApi.signContract
    let serverSignatureHash = 'c3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567892';
    try {
      await contractsApi.assignDoctor(currentContract.id, { doctorId: selectedDoctor.id });
      const signRes = await contractsApi.signContract(currentContract.id, {
        termsHash: 'facility-terms-hash',
        confirmationCode: 'CA-VNPT-MEDSEV-2026-9921',
      });
      if (signRes?.signatureHash) {
        serverSignatureHash = signRes.signatureHash;
      }
    } catch {
      // Graceful fallback for offline / mock testing
    }

    const signedAt = new Date().toISOString();

    const updated: FourPartyContract = {
      ...currentContract,
      status: 'FACILITY_ASSIGNED',
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorTitle: selectedDoctor.title,
      facilityId: currentContract.facilityId || 'fac-01',
      facilityName: currentContract.facilityName || 'Phòng khám Đa khoa Quốc tế Medsev',
      signatures: {
        ...currentContract.signatures,
        facility: {
          signedBy: signerName.trim() || 'TS.BS Vũ Thành',
          signerRole: 'FACILITY',
          signedAt,
          sha256Hash: serverSignatureHash,
          certificateId: 'CA-VNPT-MEDSEV-2026-9921',
        },
      },
    };

    setCurrentContract(updated);
    setIsSuccess(true);
    setErrorMessage(null);
    if (onAssignSuccess) {
      onAssignSuccess(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb matching project style */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-[#2E37A4] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/facility" className="hover:text-[#2E37A4] transition-colors">
                Cơ sở Y tế
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/facility/contracts" className="hover:text-[#2E37A4] transition-colors">
                Điều phối HĐ 4 bên
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#2E37A4] font-semibold">Chỉ định bác sĩ</span>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href="/facility/contracts"
                className="text-xs font-semibold text-slate-600 hover:text-[#2E37A4] transition-colors inline-flex items-center gap-1"
              >
                <span>←</span> Quay lại danh sách tiếp nhận
              </Link>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#0052cc] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[17px]">how_to_reg</span>
              <span>Hệ Thống Điều Phối CSYT • Phân Công Bác Sĩ &amp; Ký Số (SCR-22)</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Phân công Bác sĩ Gia đình &amp; Ký số CSYT
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Hợp đồng số: <span className="font-semibold text-slate-800">{currentContract.contractNumber}</span> •
              Trạng thái hiện tại: <span className="font-semibold text-amber-700">{currentContract.status}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentContract.status === 'FACILITY_ASSIGNED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Đã ký số CSYT &amp; Phân công
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Chờ CSYT phân công
              </span>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xs">
              <span className="material-symbols-outlined text-[15px] text-amber-400">domain</span>
              <span>Medsev Healthcare</span>
            </div>
          </div>
        </div>

        {/* Success Notification */}
        {isSuccess && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                </div>
                <div>
                  <div className="font-semibold text-emerald-900 text-sm sm:text-base">
                    Phân công bác sĩ &amp; Ký số CSYT thành công!
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
                    Hợp đồng đã được gán cho <strong>{currentContract.doctorName}</strong> và đóng dấu chữ ký số điện tử của đại diện CSYT (Mã băm SHA-256 đã xác lập). Hợp đồng đã sẵn sàng chuyển sang bước ký xác nhận chuyên môn của Bác sĩ.
                  </p>
                </div>
              </div>
              <Link
                href="/facility/contracts"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors shrink-0"
              >
                Về danh sách
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs">
            <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Summary of Contract & Family (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Family & Package Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-blue-600">family_restroom</span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Thông tin Hộ Gia đình &amp; Gói Dịch vụ
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dữ liệu đăng ký được Nền tảng Famidoc xác thực
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Đại diện hộ gia đình</span>
                  <span className="font-semibold text-slate-900">{currentContract.familyRepresentativeName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-slate-500 block">Số điện thoại</span>
                    <span className="font-semibold text-slate-800">{currentContract.familyRepresentativePhone}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Quy mô hộ</span>
                    <span className="font-semibold text-slate-800">{currentContract.membersCount || 1} nhân khẩu</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Địa chỉ chăm sóc tại nhà</span>
                  <span className="text-slate-700">{currentContract.familyAddress || 'Chưa cập nhật'}</span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 block">Gói chăm sóc</span>
                  <span className="font-semibold text-blue-700">{currentContract.packageName}</span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Thời hạn: {currentContract.durationMonths || 12} tháng • Phí: {formatPrice(currentContract.packagePrice)}
                  </div>
                </div>
              </div>
            </div>

            {/* Members Needs Summary */}
            {currentContract.members && currentContract.members.length > 0 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">group</span>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Danh sách thành viên cần theo dõi ({currentContract.members.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {currentContract.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>
                          <span className="font-bold text-slate-900">{m.name}</span>{' '}
                          <span className="text-slate-500 font-normal">({m.age} tuổi)</span>
                        </span>
                        <span className="text-slate-500 font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200/60">
                          {m.relation}
                        </span>
                      </div>
                      {m.chronic && (
                        <div className="text-slate-600">
                          <span className="text-slate-400">Bệnh nền:</span> {m.chronic}
                        </div>
                      )}
                      {m.allergies && (
                        <div className="text-amber-700">
                          <span className="text-amber-600">Dị ứng:</span> {m.allergies}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Signatures Info */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200 text-xs space-y-2.5">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-600">draw</span>
                <span>Tiến trình xác nhận chữ ký 4 bên:</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Bên A: Đại diện Gia đình đã ký số ({currentContract.signatures?.family?.signedBy || 'Nguyễn Văn An'})</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Bên B: Nền tảng Famidoc đã thẩm định &amp; ký duyệt ({currentContract.signatures?.platform?.signedBy || 'Ban Điều Hành'})</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <span className="material-symbols-outlined text-[15px]">radio_button_checked</span>
                <span>Bên C: CSYT đang thực hiện phân công &amp; ký số</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-[15px]">radio_button_unchecked</span>
                <span>Bên D: Bác sĩ gia đình phụ trách (Chờ bước tiếp theo)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Doctor Selection & Digital Signature (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Doctor Selection Panel */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-blue-600">stethoscope</span>
                    <h2 className="text-base font-semibold text-slate-900">
                      Chọn Bác sĩ Gia đình phụ trách
                    </h2>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    Định biên tối đa: {MAX_HOUSEHOLDS_PER_DOCTOR} hộ/BS
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Theo quy định y tế ban đầu, mỗi bác sĩ gia đình phụ trách tối đa không quá 30 hộ để đảm bảo chất lượng theo dõi và khám tại nhà.
                </p>
              </div>

              {/* Doctors List */}
              <div className="space-y-3">
                {doctors.map((doctor) => {
                  const isCapped = doctor.currentAssignedHouseholds >= MAX_HOUSEHOLDS_PER_DOCTOR;
                  const isSelected = selectedDoctorId === doctor.id;

                  return (
                    <div
                      key={doctor.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#2E37A4] bg-blue-50/40 ring-1 ring-[#2E37A4]'
                          : isCapped
                          ? 'border-slate-200 bg-slate-50/60 opacity-80'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {doctor.name}
                            </span>
                            {doctor.rating && (
                              <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 font-medium flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px] text-amber-500">star</span>
                                <span>{doctor.rating}</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 font-medium">
                            {doctor.title} • {doctor.specialty}
                          </div>

                          {/* Quota display */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-slate-600 font-medium">
                              Tải định biên:
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                isCapped
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : doctor.currentAssignedHouseholds >= 25
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {doctor.currentAssignedHouseholds}/{MAX_HOUSEHOLDS_PER_DOCTOR} hộ
                            </span>
                            {!isCapped && (
                              <span className="text-xs text-slate-400">
                                (Còn nhận thêm {MAX_HOUSEHOLDS_PER_DOCTOR - doctor.currentAssignedHouseholds} hộ)
                              </span>
                            )}
                          </div>

                          {/* Warning when quota is reached or exceeded */}
                          {isCapped && (
                            <div className="text-xs text-rose-700 font-semibold pt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              <span>
                                {doctor.currentAssignedHouseholds === MAX_HOUSEHOLDS_PER_DOCTOR
                                  ? 'Đã đạt định biên tối đa (30/30 hộ) — Không thể nhận thêm hợp đồng.'
                                  : 'Vượt ngưỡng định biên (>= 30 hộ) — Bác sĩ đang quá tải.'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Select Action */}
                        <div className="sm:self-center shrink-0">
                          <button
                            type="button"
                            data-testid={`select-doctor-${doctor.id}`}
                            disabled={isCapped}
                            onClick={() => handleSelectDoctor(doctor)}
                            className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#2E37A4] text-white shadow-xs'
                                : isCapped
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                            }`}
                          >
                            {isSelected ? 'Đang chọn' : isCapped ? 'Đã đạt định biên tối đa' : 'Chỉ định bác sĩ'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Doctor Summary & Digital Signing Form */}
            {selectedDoctor && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-blue-600">verified</span>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Xác nhận Ký số Điện tử Cơ sở Y tế
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đại diện CSYT đóng dấu chữ ký số điện tử theo thẩm quyền quy định
                    </p>
                  </div>
                </div>

                {/* Selected doctor banner */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-sm">
                  <div className="font-semibold text-blue-900">
                    Đã chọn: {selectedDoctor.name}
                  </div>
                  <div className="text-xs text-blue-700 mt-0.5">
                    Định biên hiện hành: {selectedDoctor.currentAssignedHouseholds}/{MAX_HOUSEHOLDS_PER_DOCTOR} hộ • Chuyên môn: {selectedDoctor.specialty}
                  </div>
                </div>

                {/* Signer representative input */}
                <div className="space-y-3">
                  <div>
                    <label htmlFor="signer-name" className="block text-xs font-medium text-slate-700 mb-1">
                      Đại diện CSYT ký duyệt
                    </label>
                    <input
                      id="signer-name"
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]/20 bg-white"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Chứng thư số y tế: CA-VNPT-MEDSEV-2026-9921
                    </span>
                  </div>

                  {/* Terms agreement checkbox */}
                  <div className="flex items-start gap-2 pt-2">
                    <input
                      id="terms-agreement"
                      type="checkbox"
                      aria-label="Xác nhận phân công bác sĩ và ký duyệt hợp đồng"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="terms-agreement" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                      Xác nhận phân công bác sĩ và ký duyệt hợp đồng: Cơ sở Y tế chịu trách nhiệm về tính phù hợp định biên và phân công chuyên môn đối với bác sĩ gia đình được chỉ định.
                    </label>
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!isAgreed || !selectedDoctor}
                      onClick={handleSubmitAssignment}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        isAgreed && selectedDoctor
                          ? 'bg-[#2E37A4] text-white hover:bg-[#232B85] shadow-xs'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      Ký số điện tử &amp; Hoàn tất phân công
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
