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
  publicApi,
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
  homeVisitAddress: string;
  familyRepSigned: boolean;
}

interface AdminAreaOption {
  city: string;
  districts: string[];
}

const PLACEHOLDER_ADDRESS = 'chưa cập nhật địa chỉ';

function isRealAddress(value?: string | null): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.toLocaleLowerCase('vi') !== PLACEHOLDER_ADDRESS;
}

function splitExistingAddress(
  rawAddress: string,
  areas: AdminAreaOption[],
): { city: string; ward: string; detail: string } {
  const trimmed = rawAddress.trim();
  if (!trimmed) return { city: '', ward: '', detail: '' };
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const candidateCity = parts[parts.length - 1]!;
    const candidateWard = parts[parts.length - 2]!;
    const matchedCity = areas.find(
      (a) => a.city.toLocaleLowerCase('vi') === candidateCity.toLocaleLowerCase('vi'),
    );
    if (matchedCity) {
      const matchedWard = matchedCity.districts.find(
        (w) => w.toLocaleLowerCase('vi') === candidateWard.toLocaleLowerCase('vi'),
      );
      if (matchedWard) {
        return {
          city: matchedCity.city,
          ward: matchedWard,
          detail: parts.slice(0, -2).join(', '),
        };
      }
      return {
        city: matchedCity.city,
        ward: '',
        detail: parts.slice(0, -1).join(', '),
      };
    }
  }
  return { city: '', ward: '', detail: trimmed };
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
  const [areas, setAreas] = useState<AdminAreaOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [addressDetail, setAddressDetail] = useState<string>('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [sourceMeta, setSourceMeta] = useState<SourceMeta>({
    kind: 'TRACK_A',
    badgeText: 'Track A · Bác sĩ gia đình đã chọn',
  });
  const [memberCount, setMemberCount] = useState<number>(1);
  const [additionalTerms, setAdditionalTerms] = useState<string>('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
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

        const [doctorDetail, matchingOptions, gateStatus] = await Promise.all([
          publicApi.getDoctorDetail(targetDoctorId),
          typeof matchingApi.getMatchingOptions === 'function'
            ? matchingApi.getMatchingOptions().catch(() => null)
            : Promise.resolve(null),
          typeof contractsApi.getFamilyGateStatus === 'function'
            ? contractsApi.getFamilyGateStatus().catch(() => null)
            : Promise.resolve(null),
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
              homeVisitAddress: isRealAddress(contract.homeVisitAddress)
                ? contract.homeVisitAddress.trim()
                : '',
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

        const loadedAreas: AdminAreaOption[] = Array.isArray(matchingOptions?.areas)
          ? matchingOptions.areas
          : [];
        const prefillSource = isRealAddress(contract?.homeVisitAddress)
          ? contract.homeVisitAddress.trim()
          : isRealAddress(gateStatus?.familyUnit?.homeAddress)
            ? gateStatus.familyUnit.homeAddress.trim()
            : '';
        const parsedAddr = splitExistingAddress(prefillSource, loadedAreas);

        setDoctor(effectiveDoctor);
        setSelectedPackage(matchedPackage);
        setExistingContract(contractContext);
        setAreas(loadedAreas);
        setSelectedCity(parsedAddr.city);
        setSelectedWard(parsedAddr.ward);
        setAddressDetail(parsedAddr.detail);
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

  const availableWards = useMemo(() => {
    if (!selectedCity) return [];
    return areas.find((a) => a.city === selectedCity)?.districts ?? [];
  }, [areas, selectedCity]);

  const composedHomeVisitAddress = useMemo(() => {
    const detail = addressDetail.trim();
    if (!detail) return '';
    if (selectedCity && selectedWard) {
      return `${detail}, ${selectedWard}, ${selectedCity}`;
    }
    return detail;
  }, [addressDetail, selectedCity, selectedWard]);

  /** Có thay đổi so với hợp đồng cũ hay không. */
  const isDirty = useMemo(() => {
    if (!existingContract) return false;
    return (
      existingContract.memberCount !== effectiveCount ||
      existingContract.additionalTerms !== additionalTerms.trim() ||
      existingContract.homeVisitAddress !== composedHomeVisitAddress
    );
  }, [additionalTerms, composedHomeVisitAddress, effectiveCount, existingContract]);

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

    const trimmedDetail = addressDetail.trim();
    if (areas.length > 0 && !selectedCity) {
      const msg = 'Vui lòng chọn Tỉnh/Thành phố cho địa chỉ Khám tại nhà.';
      setAddressError(msg);
      setSubmitError(msg);
      return;
    }
    if (areas.length > 0 && !selectedWard) {
      const msg = 'Vui lòng chọn Phường/Xã cho địa chỉ Khám tại nhà.';
      setAddressError(msg);
      setSubmitError(msg);
      return;
    }
    if (!isRealAddress(trimmedDetail)) {
      const msg = 'Vui lòng nhập đầy đủ địa chỉ chi tiết (số nhà, tên đường, ngõ/ngách).';
      setAddressError(msg);
      setSubmitError(msg);
      return;
    }

    setAddressError(null);
    setSubmitError(null);
    setIsSlotConflict(false);
    setConfirmAction(null);
    setIsSubmitting(true);
    try {
      const trimmedTerms = additionalTerms.trim();
      const created = await contractsApi.initiateFourPartyContract({
        packageId: selectedPackage.id,
        ...(resolvedFacilityId ? { facilityId: resolvedFacilityId } : {}),
        doctorId: resolvedDoctorId,
        memberCount: effectiveCount,
        homeVisitAddress: composedHomeVisitAddress,
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

  useEffect(() => {
    if (!selectedPackage || !doctor) return;
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      setIsPreviewLoading(true);
      setPreviewError(null);

      contractsApi
        .previewFourPartyDraftPdf({
          packageId: selectedPackage.id,
          doctorId: resolvedDoctorId,
          ...(resolvedFacilityId ? { facilityId: resolvedFacilityId } : {}),
          memberCount: effectiveCount,
          ...(composedHomeVisitAddress
            ? { homeVisitAddress: composedHomeVisitAddress }
            : {}),
        })
        .then((blob) => {
          if (!active) return;
          const url = URL.createObjectURL(blob);
          setPreviewPdfUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        })
        .catch((err) => {
          if (!active) return;
          setPreviewError(
            err instanceof Error
              ? err.message
              : 'Không thể kết xuất bản xem trước PDF lúc này.'
          );
        })
        .finally(() => {
          if (active) setIsPreviewLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    selectedPackage,
    doctor,
    resolvedDoctorId,
    resolvedFacilityId,
    effectiveCount,
    composedHomeVisitAddress,
  ]);

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
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
    >
      {/* Cột nội dung chính: Banner hợp đồng nháp (nếu có) + Xem trước PDF + Ghi chú */}
      <div className="space-y-4">
        {isExistingUnpaid && existingContract && (
          <div
            data-testid="booking-existing-contract-banner"
            className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-bold text-blue-950">
                Đang xem lại hợp đồng #{existingContract.contractNumber}
              </p>
              <p className="text-xs leading-relaxed text-blue-900">
                {isDirty
                  ? 'Bạn đã thay đổi ghi chú. Bấm xác nhận để hủy bản nháp cũ và tạo hợp đồng mới.'
                  : 'Hợp đồng này chưa thanh toán. Bạn có thể đi tiếp sang bước ký mà không tạo hợp đồng mới.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleContinueExisting}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary/90 cursor-pointer"
            >
              <span>Tiếp tục tới bước ký</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Xem trước hợp đồng mẫu PDF trực tiếp */}
        <div
          data-testid="contract-legal-preview"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Xem trước hợp đồng dịch vụ bác sĩ gia đình 4 bên
            </h1>
          </div>

          {previewError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {previewError}
            </p>
          )}

          {isPreviewLoading ? (
            <div className="flex h-[75vh] min-h-[760px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600">
              Đang tải nội dung hợp đồng PDF...
            </div>
          ) : previewPdfUrl ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <iframe
                title="Xem trước hợp đồng dịch vụ bác sĩ gia đình 4 bên"
                src={previewPdfUrl}
                className="h-[75vh] min-h-[760px] w-full border-0"
              />
            </div>
          ) : null}

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Địa chỉ Khám tại nhà <span className="text-rose-600">*</span>
              </p>
              <p className="text-xs text-slate-600">
                Hệ thống dùng địa chỉ này để đưa vào hợp đồng và tự động xếp lịch Khám tại nhà ngay sau khi thanh toán thành công. Danh sách thành viên (tối đa {effectiveCount} người) sẽ được thêm sau khi hợp đồng kích hoạt.
              </p>
            </div>

            {areas.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="home-visit-city-select"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    1. Tỉnh / Thành phố
                  </label>
                  <select
                    id="home-visit-city-select"
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedWard('');
                      setAddressError(null);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    {areas.map((area) => (
                      <option key={area.city} value={area.city}>
                        {area.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="home-visit-ward-select"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Phường / Xã
                  </label>
                  <select
                    id="home-visit-ward-select"
                    value={selectedWard}
                    disabled={!selectedCity}
                    onChange={(e) => {
                      setSelectedWard(e.target.value);
                      setAddressError(null);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <option value="">-- Chọn Phường / Xã --</option>
                    {availableWards.map((ward) => (
                      <option key={ward} value={ward}>
                        {ward}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="home-visit-detail-input"
                className="block text-xs font-semibold text-slate-700"
              >
                {areas.length > 0 ? '2. Địa chỉ chi tiết (Số nhà, tên đường, ngõ/ngách, tòa nhà)' : 'Địa chỉ Khám tại nhà chi tiết'}
              </label>
              <input
                id="home-visit-detail-input"
                type="text"
                value={addressDetail}
                onChange={(e) => {
                  setAddressDetail(e.target.value);
                  setAddressError(null);
                }}
                placeholder="Ví dụ: Số 12, Ngõ 34 Đường Nguyễn Trãi, Tòa B"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>

            {addressError && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {addressError}
              </p>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
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
              <p className="text-xs text-slate-600">
                Bác sĩ:{' '}
                <span className="font-medium text-slate-900">
                  {doctor.academicTitle
                    ? `${doctor.academicTitle} ${doctor.doctorName}`
                    : doctor.doctorName}
                </span>
              </p>
              {doctor.facility?.facilityName && (
                <p className="text-xs text-slate-600">
                  Cơ sở y tế:{' '}
                  <span className="font-medium text-slate-900">
                    {doctor.facility.facilityName}
                  </span>
                </p>
              )}
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
                    : 'Tiếp tục ký hợp đồng'}
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
