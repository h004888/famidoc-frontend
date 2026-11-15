'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  type FourPartyContract,
  MAX_HOUSEHOLDS_PER_DOCTOR,
  doctorAssignmentSchema,
  DocumensoSigningEmbed,
} from '@/features/four-party-contract';
import { contractsApi, publicApi } from '@/lib/api';

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

export function FacilityDoctorAssignView({
  contract,
  contractId,
  doctors: initialDoctors,
  onAssignSuccess,
}: FacilityDoctorAssignViewProps) {
  const [currentContract, setCurrentContract] = useState<FourPartyContract | null>(
    contract ?? null
  );
  const [doctors, setDoctors] = useState<AvailableDoctor[]>(initialDoctors ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(contractId) && !contract);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(
    contract?.doctorId || null
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadContractAndDoctors = useCallback(async () => {
    if (!contractId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await contractsApi.getMedicalContractById(contractId);
      setCurrentContract(data);
      setSelectedDoctorId((prev) => prev ?? data.doctorId ?? null);

      if (!initialDoctors) {
        try {
          const doctorResp = await publicApi.getDoctors({
            facilityId: data.facilityId,
            limit: 50,
          });
          const mapped: AvailableDoctor[] = (doctorResp.items ?? []).map((doc) => ({
            id: doc.id,
            name: doc.doctorName || doc.fullName || 'Bác sĩ Gia đình',
            title: doc.academicTitle || doc.title || 'Bác sĩ Gia đình',
            specialty: doc.specialty || 'Y học Gia đình',
            currentAssignedHouseholds:
              doc.isAvailable === false ? MAX_HOUSEHOLDS_PER_DOCTOR : 0,
            phone: doc.phone || '—',
            rating: doc.ratingAvg ?? doc.rating,
          }));
          setDoctors(mapped);
        } catch {
          setDoctors([]);
        }
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Không thể tải thông tin hợp đồng để phân công bác sĩ.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [contractId, initialDoctors]);

  useEffect(() => {
    if (contractId && !contract) {
      void loadContractAndDoctors();
    }
  }, [contractId, contract, loadContractAndDoctors]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center text-xs text-slate-500">
        Đang tải thông tin hợp đồng và phiên ký Documenso cho Cơ sở Y tế...
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
            Không thể tải hợp đồng cần phân công
          </h2>
          <p className="text-xs text-rose-800">
            {loadError || 'Không tìm thấy hợp đồng được yêu cầu.'}
          </p>
          <div className="flex items-center gap-2">
            {contractId && (
              <button
                type="button"
                onClick={() => void loadContractAndDoctors()}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                Thử lại
              </button>
            )}
            <Link
              href="/facility/contracts"
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-800 text-xs font-semibold"
            >
              Quay lại danh sách tiếp nhận
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

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

    setIsAssigning(true);
    setErrorMessage(null);
    try {
      await contractsApi.assignDoctor(currentContract.id, {
        doctorId: selectedDoctor.id,
      });

      const updated: FourPartyContract = {
        ...currentContract,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorTitle: selectedDoctor.title,
      };
      setCurrentContract(updated);
      setSuccessMessage(
        `Đã phân công ${selectedDoctor.name} phụ trách hợp đồng ${currentContract.contractNumber}. Đại diện CSYT vui lòng ký xác nhận trên Documenso.`
      );
      onAssignSuccess?.(updated);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật phân công bác sĩ trên máy chủ.'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const isFacilitySigned = Boolean(
    currentContract.signatures?.facility ||
      currentContract.status === 'PENDING_PAYMENT' ||
      currentContract.status === 'ACTIVE'
  );

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/facility/contracts"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
            >
              <span>&larr;</span> Quay lại danh sách tiếp nhận
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Phân công Bác sĩ Gia đình &amp; Ký Documenso (Bên B — CSYT)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hợp đồng số:{' '}
            <span className="font-semibold text-slate-800 tabular-nums">
              {currentContract.contractNumber}
            </span>{' '}
            • Trạng thái hiện tại:{' '}
            <span className="font-medium text-amber-700">{currentContract.status}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFacilitySigned ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              Đã ký Documenso CSYT (Bên B)
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              Chờ CSYT ký Documenso
            </span>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-emerald-900">
                Cập nhật hợp đồng thành công!
              </div>
              <p className="text-sm text-emerald-800 mt-1">{successMessage}</p>
            </div>
            <Link
              href="/facility/contracts"
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
            >
              Về danh sách
            </Link>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
        >
          {errorMessage}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Summary of Contract & Family (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Family & Package Card */}
          <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">
                Thông tin Hộ Gia đình &amp; Gói Dịch vụ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu đăng ký thật từ hệ thống FamiDoc
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Đại diện hộ gia đình</span>
                <span className="font-medium text-slate-900">
                  {currentContract.familyRepresentativeName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-slate-500 block">Số điện thoại</span>
                  <span className="font-medium text-slate-800 tabular-nums">
                    {currentContract.familyRepresentativePhone}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Quy mô hộ</span>
                  <span className="font-medium text-slate-800 tabular-nums">
                    {currentContract.membersCount || 1} suất thành viên
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Địa chỉ chăm sóc tại nhà</span>
                <span className="text-slate-700">
                  {currentContract.familyAddress || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 block">Gói chăm sóc</span>
                <span className="font-semibold text-blue-700">
                  {currentContract.packageName}
                </span>
                <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  Thời hạn: {currentContract.durationMonths || 12} tháng • Phí:{' '}
                  {formatPrice(currentContract.packagePrice)}
                </div>
              </div>

              {currentContract.doctorName && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 block">
                    Bác sĩ phụ trách hiện tại (Bên C)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {currentContract.doctorName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Members Needs Summary */}
          {currentContract.members && currentContract.members.length > 0 && (
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Danh sách thành viên cần theo dõi ({currentContract.members.length})
              </h3>
              <div className="space-y-2">
                {currentContract.members.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-md bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-medium text-slate-800">
                      <span>
                        <span className="font-medium text-slate-900">{m.name}</span>{' '}
                        <span className="text-slate-500">({m.age} tuổi)</span>
                      </span>
                      <span className="text-slate-500">{m.relation}</span>
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
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-semibold text-slate-700">
              Tiến trình xác nhận chữ ký 4 bên (Documenso):
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <span>{currentContract.signatures?.family ? '✓' : '○'}</span>
              <span>
                Bên A: Đại diện Gia đình (
                {currentContract.signatures?.family
                  ? `Đã ký: ${currentContract.signatures.family.signedBy}`
                  : 'Chờ ký'}
                )
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <span>{currentContract.signatures?.facility ? '✓' : '•'}</span>
              <span>
                Bên B: Cơ sở Y tế (
                {currentContract.signatures?.facility
                  ? `Đã ký: ${currentContract.signatures.facility.signedBy}`
                  : 'Ký Documenso song song sau Bên A'}
                )
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span>{currentContract.signatures?.doctor ? '✓' : '○'}</span>
              <span>
                Bên C: Bác sĩ gia đình (
                {currentContract.signatures?.doctor
                  ? `Đã ký: ${currentContract.signatures.doctor.signedBy}`
                  : 'Ký song song sau Bên A'}
                )
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span>{currentContract.signatures?.platform ? '✓' : '○'}</span>
              <span>
                Bên D: Nền tảng FamiDoc (
                {currentContract.signatures?.platform
                  ? `Đã ký: ${currentContract.signatures.platform.signedBy}`
                  : 'Ký song song sau Bên A'}
                )
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Documenso Signing & Doctor Reassignment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div data-testid="facility-Documenso-signing-section">
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
                      : 'FACILITY_ASSIGNED',
                  signatures: {
                    ...currentContract.signatures,
                    facility: {
                      signedBy: currentContract.facilityName || 'Cơ sở Y tế Đối tác',
                      signerRole: 'FACILITY',
                      signedAt: new Date().toISOString(),
                      sha256Hash: 'Documenso-verified-signature',
                    },
                  },
                };
                setCurrentContract(updated);
                setSuccessMessage(
                  `Đã đồng bộ chữ ký Cơ sở Y tế trên Documenso (${res.signedRoles.length}/4 bên).`
                );
                onAssignSuccess?.(updated);
              }}
            />
          </div>

          {/* Doctor Selection Panel */}
          {doctors.length > 0 && (
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">
                    Phân công / Điều chỉnh Bác sĩ Gia đình phụ trách
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Định biên tối đa: {MAX_HOUSEHOLDS_PER_DOCTOR} hộ/BS
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mỗi bác sĩ gia đình phụ trách tối đa {MAX_HOUSEHOLDS_PER_DOCTOR} hộ để đảm bảo chất lượng theo dõi và khám tại nhà.
                </p>
              </div>

              <div className="space-y-3">
                {doctors.map((doctor) => {
                  const isCapped =
                    doctor.currentAssignedHouseholds >= MAX_HOUSEHOLDS_PER_DOCTOR;
                  const isSelected = selectedDoctorId === doctor.id;

                  return (
                    <div
                      key={doctor.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500'
                          : isCapped
                          ? 'border-slate-200 bg-slate-50/60 opacity-80'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">
                              {doctor.name}
                            </span>
                            {doctor.rating && (
                              <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ★ {doctor.rating}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500">
                            {doctor.title} • {doctor.specialty}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-slate-600 font-medium">
                              Tải định biên:
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${
                                isCapped
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : doctor.currentAssignedHouseholds >= 25
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {doctor.currentAssignedHouseholds}/{MAX_HOUSEHOLDS_PER_DOCTOR} hộ
                            </span>
                          </div>

                          {isCapped && (
                            <div className="text-xs text-rose-700 font-medium pt-1">
                              Đã đạt định biên tối đa (30/30 hộ) — Không thể nhận thêm hợp đồng.
                            </div>
                          )}
                        </div>

                        <div className="sm:self-center shrink-0">
                          <button
                            type="button"
                            data-testid={`select-doctor-${doctor.id}`}
                            disabled={isCapped}
                            onClick={() => handleSelectDoctor(doctor)}
                            className={`w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : isCapped
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            {isSelected
                              ? 'Đang chọn'
                              : isCapped
                              ? 'Đã đạt định biên tối đa'
                              : 'Chỉ định bác sĩ'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedDoctor && (
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    Bác sĩ được chọn: <strong className="text-slate-900">{selectedDoctor.name}</strong>
                  </div>
                  <button
                    type="button"
                    disabled={isAssigning}
                    onClick={() => void handleSubmitAssignment()}
                    className="px-4 py-2 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isAssigning ? 'Đang phân công...' : 'Lưu phân công bác sĩ'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
