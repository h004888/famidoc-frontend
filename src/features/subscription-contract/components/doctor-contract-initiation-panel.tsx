'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  contractsApi,
  matchingApi,
  patientsApi,
  publicApi,
  type PatientDto,
  type PublicDoctorCarePackageDto,
  type PublicDoctorDetailDto,
} from '@/lib/api';
import { ApiError } from '@/lib/http/errors';
import { calculatePackagePrice } from '@/features/doctors/components/doctor-package-selector';
import { useBookingNavigationOptional } from '@/features/booking/components/booking-navigation-context';

export interface DoctorContractInitiationPanelProps {
  packageId?: string;
  doctorId?: string;
  facilityId?: string;
  matchSessionId?: string;
  queueId?: string;
  /** Hợp đồng hiện có cần tái dựng ngữ cảnh khi quay lại Bước 1. */
  contractId?: string;
  requestedMembers: number;
  /** Đường dẫn trang theo dõi ký hợp đồng sau khi khởi tạo (mặc định `/booking/tracking`). */
  trackingPath?: string;
}

interface SourceMeta {
  kind: 'TRACK_A' | 'TRACK_B' | 'ADMIN_QUEUE' | 'EXISTING_CONTRACT';
  badgeText: string;
  rationale?: string | null;
  compositeScore?: number | null;
}

interface ExistingContractContext {
  id: string;
  contractNumber?: string;
  contractStatus: string;
  packageId: string;
  doctorId?: string;
  facilityId: string;
  memberCount: number;
  additionalTerms: string;
  familyRepSigned: boolean;
}

export function DoctorContractInitiationPanel({
  packageId: packageIdProp,
  doctorId: doctorIdProp,
  facilityId: facilityIdProp,
  matchSessionId,
  queueId,
  contractId,
  requestedMembers,
  trackingPath = '/booking/tracking',
}: DoctorContractInitiationPanelProps) {
  const router = useRouter();
  const bookingNavigation = useBookingNavigationOptional();
  const [doctor, setDoctor] = useState<PublicDoctorDetailDto | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<PublicDoctorCarePackageDto | null>(null);
  const [existingContract, setExistingContract] =
    useState<ExistingContractContext | null>(null);
  const [familyMembers, setFamilyMembers] = useState<PatientDto[]>([]);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [sourceMeta, setSourceMeta] = useState<SourceMeta>({
    kind: 'TRACK_A',
    badgeText: 'Track A · Bác sĩ gia đình đã chọn',
  });
  const [memberCount, setMemberCount] = useState<number>(1);
  const [additionalTerms, setAdditionalTerms] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSlotConflict, setIsSlotConflict] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    null | 'replace' | 'cancel_reselect'
  >(null);

  const resolvedDoctorId = doctorIdProp ?? doctor?.id ?? existingContract?.doctorId;
  const resolvedFacilityId =
    doctor?.facility?.id ?? facilityIdProp ?? existingContract?.facilityId;

  useEffect(() => {
    let active = true;

    async function loadInitiationContext() {
      try {
        let resolvedPackageId = packageIdProp;
        let targetDoctorId = doctorIdProp;
        let desiredMembersInput = requestedMembers;
        let nextSourceMeta: SourceMeta = {
          kind: 'TRACK_A',
          badgeText: 'Track A · Bác sĩ gia đình đã chọn',
        };
        let fallbackFacilityFromSource: PublicDoctorDetailDto['facility'] = null;
        let fallbackPkgFromSource: PublicDoctorCarePackageDto | null = null;

        // 1. Khởi tạo từ hợp đồng nháp hiện có (quay lại từ Bước 2/3)
        const contract = contractId
          ? await contractsApi.getMedicalContractDetail(contractId)
          : null;

        if (contract) {
          resolvedPackageId = resolvedPackageId ?? contract.servicePackage?.id;
          targetDoctorId = targetDoctorId ?? contract.doctor?.id;
          desiredMembersInput = contract.memberCount ?? desiredMembersInput;
          nextSourceMeta = {
            kind: 'EXISTING_CONTRACT',
            badgeText: `Hợp đồng #${contract.contractNumber}`,
          };
        } else if (matchSessionId) {
          // 2. Ngữ cảnh Track B (TypeSafe Jev Matching)
          const session = await matchingApi.getMatchingSession(matchSessionId);
          if (!session.doctor) {
            throw new Error(
              'Phiên gợi ý chưa có bác sĩ phù hợp để xác nhận hợp đồng.'
            );
          }
          resolvedPackageId = session.package.id;
          targetDoctorId = session.doctor.id;
          desiredMembersInput = session.memberCount;
          fallbackFacilityFromSource = session.facility
            ? {
                id: session.facility.id,
                facilityName: session.facility.facilityName,
                address: session.facility.address,
                verificationStatus: 'ACTIVE',
              }
            : null;
          fallbackPkgFromSource = {
            id: session.package.id,
            packageCode: session.package.packageCode,
            packageName: session.package.packageName,
            durationMonths: session.package.durationMonths,
            basePrice: session.package.basePrice,
            periodicVisitsQuota: session.package.periodicVisitsQuota,
            telehealthQuota: session.package.telehealthQuota,
            includedMembers: session.package.includedMembers,
            maxMembers: session.package.maxMembers,
            additionalMemberMonthlyPrice:
              session.package.additionalMemberMonthlyPrice,
          };
          nextSourceMeta = {
            kind: 'TRACK_B',
            badgeText: 'Track B · Hệ thống gợi ý bác sĩ phù hợp',
            rationale: session.rationale,
            compositeScore: session.compositeScore,
          };
        } else if (queueId) {
          // 3. Ngữ cảnh Hàng chờ điều phối Admin đã gán bác sĩ
          const queue = await matchingApi.getQueueRequestDetail(queueId);
          if (queue.status !== 'ASSIGNED' || !queue.doctor) {
            throw new Error(
              'Yêu cầu hàng chờ chưa được Quản trị viên phân công bác sĩ hoặc đã hết hiệu lực.'
            );
          }
          resolvedPackageId = queue.package?.id ?? queue.packageId;
          targetDoctorId = queue.doctor.id;
          desiredMembersInput = queue.memberCount;
          fallbackFacilityFromSource = queue.facility
            ? {
                id: queue.facility.id,
                facilityName: queue.facility.facilityName,
                address: queue.facility.address,
                verificationStatus: 'ACTIVE',
              }
            : null;
          if (queue.package) {
            fallbackPkgFromSource = {
              id: queue.package.id,
              packageCode: queue.package.packageCode,
              packageName: queue.package.packageName,
              durationMonths: queue.package.durationMonths,
              basePrice: queue.package.basePrice,
              periodicVisitsQuota: queue.package.periodicVisitsQuota,
              telehealthQuota: queue.package.telehealthQuota,
              includedMembers: queue.package.includedMembers,
              maxMembers: queue.package.maxMembers,
              additionalMemberMonthlyPrice:
                queue.package.additionalMemberMonthlyPrice,
            };
          }
          nextSourceMeta = {
            kind: 'ADMIN_QUEUE',
            badgeText: 'Điều phối từ Hàng chờ Quản trị viên',
            rationale: queue.adminNote
              ? `Ghi chú điều phối: ${queue.adminNote}`
              : null,
          };
        }

        if (!resolvedPackageId || !targetDoctorId) {
          throw new Error(
            'Không xác định được bác sĩ và gói chăm sóc của hợp đồng hiện tại.'
          );
        }

        const [doctorDetail, membersList] = await Promise.all([
          publicApi.getDoctorDetail(targetDoctorId),
          typeof patientsApi.getFamilyMembers === 'function'
            ? patientsApi.getFamilyMembers().catch(() => [] as PatientDto[])
            : Promise.resolve([] as PatientDto[]),
        ]);
        if (!active) return;

        const effectiveDoctor: PublicDoctorDetailDto = {
          ...doctorDetail,
          facility: doctorDetail.facility ?? fallbackFacilityFromSource,
        };

        const matchedPackage =
          doctorDetail.carePackages.find((pkg) => pkg.id === resolvedPackageId) ??
          fallbackPkgFromSource ??
          doctorDetail.carePackages[0] ??
          null;

        const packageCap = Math.max(1, matchedPackage?.maxMembers ?? 1);

        const contractContext: ExistingContractContext | null = contract
          ? {
              id: contract.id,
              contractNumber: contract.contractNumber,
              contractStatus: contract.contractStatus,
              packageId: resolvedPackageId,
              doctorId: targetDoctorId,
              facilityId:
                contract.facility?.id ??
                effectiveDoctor.facility?.id ??
                facilityIdProp ??
                '',
              memberCount: Math.max(1, contract.memberCount ?? 1),
              additionalTerms: contract.additionalTerms ?? '',
              familyRepSigned: Boolean(
                contract.signatures?.some((s) => s.signerRole === 'FAMILY_REP')
              ),
            }
          : null;

        const desiredMembers =
          contractContext?.memberCount ??
          (!Number.isFinite(desiredMembersInput) ||
          Math.trunc(desiredMembersInput) < 1
            ? 1
            : Math.trunc(desiredMembersInput));

        const minMembers = Math.min(
          Math.max(1, matchedPackage?.includedMembers ?? 1),
          packageCap
        );
        const clampedMembers = Math.min(
          Math.max(desiredMembers, minMembers),
          packageCap
        );

        const activePatients = (Array.isArray(membersList) ? membersList : []).filter(
          (m) => m.status !== 'INACTIVE'
        );

        setDoctor(effectiveDoctor);
        setSelectedPackage(matchedPackage);
        setExistingContract(contractContext);
        setFamilyMembers(activePatients);
        setSelectedPatientIds(
          activePatients.slice(0, clampedMembers).map((m) => m.id)
        );
        setSourceMeta(nextSourceMeta);
        setMemberCount(clampedMembers);
        setAdditionalTerms(contractContext?.additionalTerms ?? '');
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải thông tin gói dịch vụ và bác sĩ.'
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadInitiationContext();
    return () => {
      active = false;
    };
  }, [
    contractId,
    doctorIdProp,
    facilityIdProp,
    matchSessionId,
    packageIdProp,
    queueId,
    requestedMembers,
  ]);

  // Đồng bộ ngữ cảnh điều hướng để shell dựng nút Quay lại và khóa bước khi đã ACTIVE.
  const syncNavigation = bookingNavigation?.update;
  useEffect(() => {
    if (!syncNavigation) return;
    syncNavigation({
      doctorId: resolvedDoctorId,
      contractId: existingContract?.id ?? contractId,
      contractStatus: existingContract?.contractStatus,
    });
  }, [
    contractId,
    existingContract?.contractStatus,
    existingContract?.id,
    resolvedDoctorId,
    syncNavigation,
  ]);

  const maxPkgMembers = Math.max(1, selectedPackage?.maxMembers ?? 1);
  const minPkgMembers = Math.min(
    Math.max(1, selectedPackage?.includedMembers ?? 1),
    maxPkgMembers
  );
  const effectiveCount = Math.max(minPkgMembers, Math.min(memberCount, maxPkgMembers));
  const pricing = selectedPackage
    ? calculatePackagePrice(selectedPackage, effectiveCount)
    : { extraMembers: 0, additionalCost: 0, totalPrice: 0 };

  const isContractActive = existingContract?.contractStatus === 'ACTIVE';
  const isExistingUnpaid =
    existingContract !== null && !isContractActive;

  const clampNotice = (() => {
    if (existingContract) return null;
    if (!Number.isFinite(requestedMembers)) return null;
    const requested = Math.trunc(requestedMembers);
    if (requested > maxPkgMembers) {
      return `Số lượng thành viên từ liên kết (${requested}) vượt quá trần tối đa ${maxPkgMembers} người của gói ${selectedPackage?.packageName ?? ''}. Hệ thống đã tự điều chỉnh về ${maxPkgMembers} người.`;
    }
    if (requested < minPkgMembers) {
      return requested < 1
        ? `Số lượng thành viên từ liên kết không hợp lệ (< 1). Hệ thống đã tự điều chỉnh về tối thiểu ${minPkgMembers} người theo quyền lợi có sẵn của gói.`
        : `Số lượng thành viên từ liên kết (${requested}) thấp hơn mức tối thiểu ${minPkgMembers} người có sẵn trong gói ${selectedPackage?.packageName ?? ''}. Hệ thống đã tự điều chỉnh về ${minPkgMembers} người.`;
    }
    return null;
  })();

  /** Có thay đổi so với hợp đồng cũ hay không. */
  const isDirty = useMemo(() => {
    if (!existingContract) return false;
    return (
      existingContract.memberCount !== effectiveCount ||
      existingContract.additionalTerms !== additionalTerms.trim()
    );
  }, [additionalTerms, effectiveCount, existingContract]);

  const requiresReplacementConfirmation = Boolean(
    existingContract &&
      (existingContract.familyRepSigned ||
        existingContract.contractStatus === 'PENDING_PAYMENT')
  );

  const goToTracking = (targetContractId: string) => {
    router.push(
      `${trackingPath}?contractId=${encodeURIComponent(targetContractId)}`
    );
  };

  const handleContinueExisting = () => {
    if (!existingContract) return;
    goToTracking(existingContract.id);
  };

  const handleInitiateContract = async (confirmedReplacement = false) => {
    if (!selectedPackage) {
      setSubmitError('Không tìm thấy gói chăm sóc để khởi tạo hợp đồng.');
      return;
    }

    // Không đổi gì so với hợp đồng chưa thanh toán thì đi tiếp, không tạo bản nháp mới.
    if (existingContract && !isDirty) {
      handleContinueExisting();
      return;
    }

    if (
      existingContract &&
      requiresReplacementConfirmation &&
      !confirmedReplacement
    ) {
      setConfirmAction('replace');
      return;
    }

    setSubmitError(null);
    setIsSlotConflict(false);
    setConfirmAction(null);
    setIsSubmitting(true);
    try {
      const trimmedTerms = additionalTerms.trim();
      const validPatientIds =
        selectedPatientIds.length > 0 && selectedPatientIds.length === effectiveCount
          ? selectedPatientIds
          : undefined;
      const created = await contractsApi.initiateFourPartyContract({
        packageId: selectedPackage.id,
        ...(resolvedFacilityId ? { facilityId: resolvedFacilityId } : {}),
        doctorId: resolvedDoctorId,
        memberCount: effectiveCount,
        ...(validPatientIds ? { patientIds: validPatientIds } : {}),
        ...(matchSessionId ? { matchingSessionId: matchSessionId } : {}),
        ...(queueId ? { queueRequestId: queueId } : {}),
        ...(existingContract ? { replaceContractId: existingContract.id } : {}),
        ...(trimmedTerms ? { additionalTerms: trimmedTerms } : {}),
      });

      if (!created?.id) {
        throw new Error('Máy chủ không trả về mã hợp đồng vừa khởi tạo.');
      }

      goToTracking(created.id);
    } catch (err) {
      const conflict =
        (err instanceof ApiError && err.status === 409) ||
        (typeof err === 'object' &&
          err !== null &&
          'status' in err &&
          (err as { status?: number }).status === 409);
      setIsSlotConflict(Boolean(conflict));
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Không thể khởi tạo hợp đồng 4 bên. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Hủy bản nháp rồi quay về hồ sơ bác sĩ để chọn gói khác. */
  const handleCancelDraftAndReselect = async (confirmed = false) => {
    if (!existingContract || !resolvedDoctorId) return;
    if (requiresReplacementConfirmation && !confirmed) {
      setConfirmAction('cancel_reselect');
      return;
    }
    setSubmitError(null);
    setConfirmAction(null);
    setIsSubmitting(true);
    try {
      await contractsApi.cancelDraftContract(
        existingContract.id,
        'Hủy bản nháp để chọn lại gói chăm sóc'
      );
      router.push(`/doctors/${encodeURIComponent(resolvedDoctorId)}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Không thể hủy bản nháp hợp đồng. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center text-xs text-slate-500">
        Đang tải thông tin gói chăm sóc và điều khoản hợp đồng...
      </div>
    );
  }

  if (loadError || !doctor || !selectedPackage) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-rose-800">
          Không thể tải thông tin đăng ký dịch vụ
        </h2>
        <p className="text-xs text-rose-700">
          {loadError || 'Không tìm thấy gói chăm sóc phù hợp từ bác sĩ đã chọn.'}
        </p>
        {resolvedDoctorId && (
          <Link
            href={`/doctors/${encodeURIComponent(resolvedDoctorId)}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <span>Quay lại hồ sơ bác sĩ</span>
          </Link>
        )}
      </div>
    );
  }

  if (isContractActive) {
    return (
      <section
        data-testid="booking-contract-active"
        className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 text-center shadow-xs"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <span className="material-symbols-outlined text-[30px]">verified</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Hợp đồng #{existingContract?.contractNumber} đã được kích hoạt
          </h1>
          <p className="mx-auto max-w-lg text-xs sm:text-sm text-slate-600 leading-relaxed">
            Gói chăm sóc gia đình đang có hiệu lực. Bạn không thể quay lại chỉnh sửa bước xác nhận
            gói, hãy tiếp tục quản lý hồ sơ tại Bảng điều khiển Gia đình.
          </p>
        </div>
        <Link
          href="/family"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-emerald-800"
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          <span>Vào Bảng điều khiển Gia đình</span>
        </Link>
      </section>
    );
  }

  const reselectPackageHref =
    resolvedDoctorId != null
      ? `/doctors/${encodeURIComponent(resolvedDoctorId)}`
      : '/doctors';
  const blocksPackageReselect = Boolean(
    existingContract &&
      (existingContract.familyRepSigned ||
        existingContract.contractStatus === 'PENDING_PAYMENT')
  );

  return (
    <section
      aria-label="Khởi tạo hợp đồng dịch vụ với bác sĩ"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
    >
      {/* Cột nội dung */}
      <div className="space-y-4">
        {isExistingUnpaid && existingContract && (
          <div
            data-testid="booking-existing-contract-banner"
            className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-950">
                Đang xem lại hợp đồng #{existingContract.contractNumber}
              </p>
              <p className="text-xs leading-relaxed text-blue-900">
                {isDirty
                  ? 'Bạn đã thay đổi thông tin. Bấm xác nhận để hủy bản nháp cũ và tạo hợp đồng mới.'
                  : 'Hợp đồng này chưa thanh toán. Bạn có thể đi tiếp sang bước ký mà không tạo hợp đồng mới.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleContinueExisting}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 cursor-pointer"
            >
              <span>Tiếp tục tới bước ký</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        )}

        <div className="space-y-4 rounded-2xl border border-blue-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {sourceMeta.badgeText}
            </span>
            <h1 className="mt-2 text-xl font-bold text-slate-900">
              Xác Nhận Gói Chăm Sóc &amp; Ký Hợp Đồng 4 Bên Trên Documenso
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Bác sĩ:{' '}
              <span className="font-semibold text-slate-900">
                {doctor.academicTitle
                  ? `${doctor.academicTitle} ${doctor.doctorName}`
                  : doctor.doctorName}
              </span>
              {doctor.facility?.facilityName && (
                <>
                  {' '}
                  · Cơ sở y tế (tự suy ra):{' '}
                  <span className="font-semibold text-slate-900">
                    {doctor.facility.facilityName}
                  </span>
                </>
              )}
            </p>
            {sourceMeta.rationale && (
              <p className="mt-2 rounded-lg bg-blue-50/70 border border-blue-200/80 px-3 py-2 text-xs text-blue-950">
                {sourceMeta.rationale}
                {typeof sourceMeta.compositeScore === 'number' && (
                  <span className="ml-1.5 font-semibold tabular-nums text-[#0037c1]">
                    (Điểm phù hợp tổng hợp: {Math.round(sourceMeta.compositeScore * 100)}%)
                  </span>
                )}
              </p>
            )}
          </div>

          {clampNotice && (
            <div
              role="status"
              className="rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm text-blue-900"
            >
              {clampNotice}
            </div>
          )}

          {/* Số lượng suất thành viên — chặn dưới đồng bộ `includedMembers` như trang bác sĩ */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900">
                Số lượng suất thành viên bảo trợ
              </span>
              <span className="text-xs text-slate-500">
                Bao gồm sẵn {selectedPackage.includedMembers} người
              </span>
            </div>
            <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
              <button
                type="button"
                aria-label="Giảm số thành viên"
                disabled={effectiveCount <= minPkgMembers || isSubmitting}
                onClick={() =>
                  setMemberCount((c) => Math.max(minPkgMembers, c - 1))
                }
                className="inline-flex h-11 w-11 items-center justify-center text-base font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
              <span
                data-testid="selected-member-count"
                className="min-w-20 border-x border-slate-200 px-4 py-3 text-center text-sm font-bold tabular-nums text-slate-900"
              >
                {effectiveCount} người
              </span>
              <button
                type="button"
                aria-label="Tăng số thành viên"
                disabled={effectiveCount >= maxPkgMembers || isSubmitting}
                onClick={() =>
                  setMemberCount((c) => Math.min(maxPkgMembers, c + 1))
                }
                className="inline-flex h-11 w-11 items-center justify-center text-base font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Tối thiểu {minPkgMembers} người (quyền lợi có sẵn của gói) và tối đa{' '}
              {maxPkgMembers} người.
            </p>
            {pricing.extraMembers > 0 && (
              <p className="text-sm tabular-nums text-slate-600">
                {pricing.extraMembers} người phụ trội: +
                {pricing.additionalCost.toLocaleString('vi-VN')}đ
              </p>
            )}
            <p className="text-sm leading-relaxed text-slate-600">
              Hồ sơ thành viên chi tiết sẽ được mở khóa và kê khai tại mục{' '}
              <strong className="text-slate-900">Quản lý thành viên</strong> ngay sau khi hợp
              đồng hoàn tất ký 4 bên và kích hoạt thanh toán.
            </p>
          </div>

          {/* Danh sách thành viên hộ gia đình thật (pre-select tối đa effectiveCount) */}
          <div
            data-testid="family-members-preview"
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">
                Thành viên hộ gia đình tham gia ({selectedPatientIds.length}/{effectiveCount} suất)
              </p>
              <Link
                href="/family/members"
                className="text-xs font-semibold text-[#0037c1] hover:underline"
              >
                Quản lý hồ sơ thành viên →
              </Link>
            </div>

            {familyMembers.length === 0 ? (
              <p className="text-xs text-slate-600 leading-relaxed">
                Hộ gia đình chưa có hồ sơ thành viên nào. Bạn vẫn có thể xác nhận khởi tạo hợp đồng theo số suất ({effectiveCount} người) và bổ sung hồ sơ tại{' '}
                <Link href="/family/members" className="font-semibold text-[#0037c1] underline">
                  /family/members
                </Link>
                .
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {familyMembers.map((member) => {
                    const checked = selectedPatientIds.includes(member.id);
                    const disabled = !checked && selectedPatientIds.length >= effectiveCount;
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'border-[#0037c1] bg-blue-50/50'
                            : 'border-slate-200 bg-slate-50/40'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => {
                            setSelectedPatientIds((prev) =>
                              prev.includes(member.id)
                                ? prev.filter((id) => id !== member.id)
                                : prev.length < effectiveCount
                                  ? [...prev, member.id]
                                  : prev
                            );
                          }}
                          className="h-4 w-4 accent-[#0037c1]"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {member.relationshipToHead}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {familyMembers.length < effectiveCount && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Hộ gia đình hiện có {familyMembers.length} hồ sơ, ít hơn {effectiveCount} suất đã chọn. Bạn có thể bổ sung thêm tại{' '}
                    <Link href="/family/members" className="font-bold underline">
                      /family/members
                    </Link>{' '}
                    hoặc điều chỉnh lại số suất thành viên ở trên.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Quyền lợi gói */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-sm font-bold text-slate-900">Quyền lợi gói dịch vụ đã chọn</p>
            <ul className="space-y-1.5 text-sm text-slate-700">
              <li>
                • Thời hạn hiệu lực:{' '}
                <strong className="text-slate-900">
                  {selectedPackage.durationMonths} tháng
                </strong>
              </li>
              <li>
                • Lượt bác sĩ thăm khám tại nhà:{' '}
                <strong className="text-slate-900">
                  {selectedPackage.periodicVisitsQuota} lượt
                </strong>
              </li>
              <li>
                • Lượt tư vấn Telehealth:{' '}
                <strong className="text-slate-900">
                  {selectedPackage.telehealthQuota} lượt
                </strong>
              </li>
              <li>
                • Hình thức ký kết:{' '}
                <strong className="text-slate-900">Chứng thư số Documenso 4 bên</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Xem trước hợp đồng 4 bên */}
        <div
          data-testid="contract-legal-preview"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold uppercase tracking-wide text-slate-900">
              Xem Trước Hợp Đồng Dịch Vụ Bác Sĩ Gia Đình 4 Bên
            </h2>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
              Chuẩn pháp lý Việt Nam • Ký trực tiếp trên Documenso
            </span>
          </div>

          {/* Bốn bên ký kèm chỉ dấu thứ tự */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              {
                key: 'A',
                order: '1',
                orderLabel: 'Ký trước',
                role: 'Bên A: Đại diện Hộ gia đình',
                detail: `Người đăng ký gói cho ${effectiveCount} thành viên`,
                sequential: true,
              },
              {
                key: 'B',
                order: '2',
                orderLabel: 'Ký song song',
                role: 'Bên B: Cơ sở Y tế phối hợp',
                detail: doctor.facility?.facilityName || 'Cơ sở y tế đối tác FamiDoc',
                sequential: false,
              },
              {
                key: 'C',
                order: '2',
                orderLabel: 'Ký song song',
                role: 'Bên C: Bác sĩ Gia đình phụ trách',
                detail: doctor.academicTitle
                  ? `${doctor.academicTitle} ${doctor.doctorName}`
                  : doctor.doctorName,
                sequential: false,
              },
              {
                key: 'D',
                order: '2',
                orderLabel: 'Ký song song',
                role: 'Bên D: Nền tảng Công nghệ FamiDoc',
                detail: 'Điều phối hợp đồng điện tử, VietQR & bảo mật dữ liệu',
                sequential: false,
              },
            ].map((party) => (
              <div
                key={party.key}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
              >
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <Badge
                    variant={party.sequential ? 'default' : 'outline'}
                    className="size-7 justify-center rounded-full p-0 text-xs font-bold"
                    aria-label={`Thứ tự ký ${party.order}: ${party.orderLabel}`}
                  >
                    {party.order}
                  </Badge>
                  <span className="text-center text-xs leading-tight text-slate-500">
                    {party.orderLabel}
                  </span>
                </div>
                <div className="min-w-0 space-y-0.5">
                  <strong className="block text-sm text-slate-900">{party.role}</strong>
                  <span className="block text-sm leading-relaxed text-slate-600">
                    {party.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="legal-basis">
              <AccordionTrigger className="text-sm font-semibold text-slate-800">
                Căn cứ pháp lý &amp; quy trình ký 2 pha
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                  <p>
                    <strong className="text-slate-900">Căn cứ pháp lý:</strong> Bộ luật Dân sự
                    2015; Luật Khám bệnh, chữa bệnh số 15/2023/QH15 &amp; NĐ 96/2023/NĐ-CP; Thông
                    tư 21/2019/TT-BYT (mô hình Bác sĩ gia đình); Luật Giao dịch điện tử
                    20/2023/QH15; Luật Bảo vệ quyền lợi người tiêu dùng 19/2023/QH15; Luật Bảo vệ
                    dữ liệu cá nhân 91/2025/QH15 &amp; NĐ 13/2023/NĐ-CP.
                  </p>
                  <p>
                    <strong className="text-slate-900">Quy trình ký 2 pha:</strong> Gia đình
                    (Bên A) ký xác nhận trước trên biểu mẫu Documenso. Ngay sau khi Bên A hoàn
                    tất, Bên B (CSYT), Bên C (Bác sĩ) và Bên D (Nền tảng) sẽ mở khóa và ký song
                    song. Đủ 4/4 chữ ký sẽ chuyển sang thanh toán VietQR để kích hoạt gói.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="space-y-1.5">
            <label
              htmlFor="additional-terms-input"
              className="block text-sm font-semibold text-slate-800"
            >
              Điều khoản / Ghi chú thỏa thuận bổ sung (tùy chọn)
            </label>
            <textarea
              id="additional-terms-input"
              rows={2}
              value={additionalTerms}
              onChange={(e) => setAdditionalTerms(e.target.value)}
              placeholder="Ví dụ: Yêu cầu khung giờ thăm khám ưu tiên, lưu ý tiền sử chăm sóc của gia đình..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Rail tóm tắt + hành động chính */}
      <aside className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur lg:sticky lg:top-6 lg:bottom-auto lg:z-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:pb-0 lg:backdrop-blur-none">
        <div className="space-y-3 rounded-2xl bg-white lg:space-y-4 lg:border lg:border-slate-200 lg:p-5 lg:shadow-xs">
          {submitError && (
            <div
              role="alert"
              data-testid={isSlotConflict ? 'slot-conflict-alert' : 'submit-error-alert'}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800 space-y-2"
            >
              <p>{submitError}</p>
              {isSlotConflict && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/doctors?packageId=${encodeURIComponent(selectedPackage.id)}&members=${effectiveCount}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-rose-300 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                  >
                    Chọn bác sĩ trẻ còn slot (Track A)
                  </Link>
                  <Link
                    href={`/doctors/matching?packageId=${encodeURIComponent(selectedPackage.id)}&members=${effectiveCount}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#0037c1] text-xs font-semibold text-white hover:bg-[#002c9a]"
                  >
                    Ghép bác sĩ tự động (Track B)
                  </Link>
                </div>
              )}
            </div>
          )}

          {confirmAction && (
            <div
              role="alertdialog"
              aria-label="Xác nhận hủy hợp đồng hiện tại"
              data-testid="booking-replace-confirm"
              className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3.5"
            >
              <p className="text-sm font-bold text-amber-950">
                Hợp đồng #{existingContract?.contractNumber} đã được ký
              </p>
              <p className="text-xs leading-relaxed text-amber-900">
                {confirmAction === 'cancel_reselect'
                  ? 'Thao tác này sẽ hủy hợp đồng hiện tại và các mã VietQR đang chờ trước khi quay lại hồ sơ bác sĩ chọn gói khác. Bạn chắc chắn muốn tiếp tục?'
                  : 'Thao tác này sẽ hủy hợp đồng hiện tại và các mã VietQR đang chờ trước khi tạo hợp đồng mới. Bạn chắc chắn muốn tiếp tục?'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    void (confirmAction === 'cancel_reselect'
                      ? handleCancelDraftAndReselect(true)
                      : handleInitiateContract(true))
                  }
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-700 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60 cursor-pointer"
                >
                  {confirmAction === 'cancel_reselect'
                    ? 'Xác nhận hủy & chọn lại gói'
                    : 'Xác nhận hủy & tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300 bg-white px-3.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 cursor-pointer"
                >
                  Giữ hợp đồng hiện tại
                </button>
              </div>
            </div>
          )}

          {/* Mobile: gói + giá + CTA trong thanh dính đáy */}
          <div className="space-y-2 lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  data-testid="mobile-package-name"
                  className="truncate text-xs font-semibold text-slate-900"
                >
                  {selectedPackage.packageName}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedPackage.durationMonths} tháng ·{' '}
                  {effectiveCount} thành viên
                </p>
              </div>
              <p className="shrink-0 text-lg font-bold tabular-nums text-primary">
                {pricing.totalPrice.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting || !doctor.isAvailable}
                onClick={() => void handleInitiateContract()}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? 'Đang khởi tạo...'
                  : isExistingUnpaid && !isDirty
                    ? 'Tiếp tục hợp đồng'
                    : 'Xác nhận & Ký'}
              </button>
              <Link
                href={reselectPackageHref}
                data-testid="mobile-reselect-package"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Chọn lại gói
              </Link>
            </div>
            {isExistingUnpaid && blocksPackageReselect && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleCancelDraftAndReselect(false)}
                className="w-full rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60 cursor-pointer"
              >
                Hủy hợp đồng nháp &amp; chọn lại gói
              </button>
            )}
          </div>

          {/* Desktop: bảng tóm tắt đầy đủ */}
          <div className="hidden space-y-4 lg:block">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tổng thanh toán
              </p>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {pricing.totalPrice.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-sm tabular-nums text-slate-600">
                Áp dụng cho {effectiveCount} thành viên (tối đa {selectedPackage.maxMembers} người)
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-slate-900">{selectedPackage.packageName}</p>
              <p className="text-slate-600">
                {selectedPackage.durationMonths} tháng · Giá gốc{' '}
                <span className="tabular-nums">
                  {selectedPackage.basePrice.toLocaleString('vi-VN')}đ
                </span>
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <button
                type="button"
                disabled={isSubmitting || !doctor.isAvailable}
                onClick={() => void handleInitiateContract()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? 'Đang khởi tạo hợp đồng Documenso...'
                  : isExistingUnpaid && !isDirty
                    ? 'Tiếp tục hợp đồng hiện có'
                    : 'Xác nhận khởi tạo hợp đồng 4 bên & Ký Documenso'}
              </button>
              <Link
                href={reselectPackageHref}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Chọn lại gói
              </Link>
              {isExistingUnpaid && blocksPackageReselect && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleCancelDraftAndReselect(false)}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60 cursor-pointer"
                >
                  Hủy hợp đồng nháp &amp; chọn lại gói
                </button>
              )}
              <p className="pt-1 text-center text-xs text-slate-500">
                Bước tiếp theo: ký số trên Documenso
              </p>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
