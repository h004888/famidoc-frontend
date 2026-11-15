'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  contractsApi,
  publicApi,
  type PublicDoctorCarePackageDto,
  type PublicDoctorDetailDto,
} from '@/lib/api';
import { calculatePackagePrice } from '@/features/doctors/components/doctor-package-selector';

export interface DoctorContractInitiationPanelProps {
  packageId: string;
  doctorId: string;
  facilityId: string;
  requestedMembers: number;
}

export function DoctorContractInitiationPanel({
  packageId,
  doctorId,
  facilityId,
  requestedMembers,
}: DoctorContractInitiationPanelProps) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<PublicDoctorDetailDto | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<PublicDoctorCarePackageDto | null>(null);
  const [memberCount, setMemberCount] = useState<number>(1);
  const [additionalTerms, setAdditionalTerms] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInitiationContext() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const doctorDetail = await publicApi.getDoctorDetail(doctorId);

        if (!active) return;

        const matchedPackage =
          doctorDetail.carePackages.find((pkg) => pkg.id === packageId) ??
          doctorDetail.carePackages[0] ??
          null;

        const packageCap = Math.max(1, matchedPackage?.maxMembers ?? 1);
        const clampedMembers =
          !Number.isFinite(requestedMembers) || Math.trunc(requestedMembers) < 1
            ? 1
            : Math.min(Math.trunc(requestedMembers), packageCap);

        setDoctor(doctorDetail);
        setSelectedPackage(matchedPackage);
        setMemberCount(clampedMembers);
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

    loadInitiationContext();
    return () => {
      active = false;
    };
  }, [doctorId, packageId, requestedMembers]);

  const handleInitiateContract = async () => {
    if (!selectedPackage) {
      setSubmitError('Không tìm thấy gói chăm sóc để khởi tạo hợp đồng.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const trimmedTerms = additionalTerms.trim();
      const created = await contractsApi.initiateFourPartyContract({
        packageId: selectedPackage.id,
        facilityId: doctor?.facility?.id || facilityId,
        doctorId,
        memberCount,
        ...(trimmedTerms ? { additionalTerms: trimmedTerms } : {}),
      });

      if (!created?.id) {
        throw new Error('Máy chủ không trả về mã hợp đồng vừa khởi tạo.');
      }

      router.push(
        `/family/subscription/tracking?contractId=${encodeURIComponent(created.id)}`
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Không thể khởi tạo hợp đồng 4 bên. Vui lòng thử lại.'
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
        <Link
          href={`/doctors/${encodeURIComponent(doctorId)}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0046c0] hover:underline"
        >
          <span>Quay lại hồ sơ bác sĩ</span>
        </Link>
      </div>
    );
  }

  const maxPkgMembers = Math.max(1, selectedPackage.maxMembers);
  const isMembersTooHigh =
    Number.isFinite(requestedMembers) && Math.trunc(requestedMembers) > maxPkgMembers;
  const isMembersTooLow =
    !Number.isFinite(requestedMembers) || Math.trunc(requestedMembers) < 1;

  const effectiveCount = Math.max(1, Math.min(memberCount, maxPkgMembers));
  const pricing = calculatePackagePrice(selectedPackage, effectiveCount);

  return (
    <section
      aria-label="Khởi tạo hợp đồng dịch vụ với bác sĩ"
      className="bg-white rounded-2xl border border-blue-200/80 p-5 sm:p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0046c0] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70">
            Đăng ký gói theo bác sĩ đã chọn
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-1.5">
            Xác Nhận Gói Chăm Sóc &amp; Ký Hợp Đồng 4 Bên Trên Documenso
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Bác sĩ:{' '}
            <span className="font-semibold text-slate-900">
              {doctor.academicTitle
                ? `${doctor.academicTitle} ${doctor.doctorName}`
                : doctor.doctorName}
            </span>
            {doctor.facility?.facilityName && (
              <>
                {' '}
                · Cơ sở:{' '}
                <span className="font-semibold text-slate-900">
                  {doctor.facility.facilityName}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold text-slate-900">
            {selectedPackage.packageName} ({selectedPackage.durationMonths} tháng)
          </p>
          <p className="text-base font-bold text-[#0046c0] tabular-nums">
            {pricing.totalPrice.toLocaleString('vi-VN')}đ
          </p>
          <p className="text-[11px] text-slate-500 tabular-nums">
            Áp dụng cho {effectiveCount} thành viên (tối đa {selectedPackage.maxMembers} người)
          </p>
        </div>
      </div>

      {(isMembersTooHigh || isMembersTooLow) && (
        <div
          role="status"
          className="rounded-lg bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-900"
        >
          {isMembersTooHigh
            ? `Số lượng thành viên từ liên kết (${Math.trunc(requestedMembers)}) vượt quá trần tối đa ${maxPkgMembers} người của gói ${selectedPackage.packageName}. Hệ thống đã tự điều chỉnh về ${maxPkgMembers} người.`
            : 'Số lượng thành viên từ liên kết không hợp lệ (< 1). Hệ thống đã tự điều chỉnh về tối thiểu 1 người.'}
        </div>
      )}

      {/* Số lượng suất thành viên & Chi tiết quyền lợi gói */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Số lượng suất thành viên bảo trợ
            </span>
            <span className="text-[11px] text-slate-500">
              Bao gồm sẵn {selectedPackage.includedMembers} người
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
              <button
                type="button"
                aria-label="Giảm số thành viên"
                disabled={effectiveCount <= 1 || isSubmitting}
                onClick={() => setMemberCount((c) => Math.max(1, c - 1))}
                className="px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
              <span
                data-testid="selected-member-count"
                className="px-4 py-1.5 text-sm font-bold text-slate-900 tabular-nums border-x border-slate-200"
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
                className="px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="text-right text-xs text-slate-600 tabular-nums">
              <p>
                Giá gốc: <strong className="text-slate-900">{selectedPackage.basePrice.toLocaleString('vi-VN')}đ</strong>
              </p>
              {pricing.extraMembers > 0 && (
                <p className="text-[11px] text-slate-500">
                  +{pricing.extraMembers} người phụ trội: +{pricing.additionalCost.toLocaleString('vi-VN')}đ
                </p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Hồ sơ thành viên chi tiết sẽ được mở khóa và kê khai tại mục{' '}
            <strong>Quản lý thành viên</strong> ngay sau khi hợp đồng hoàn tất ký 4 bên và kích hoạt thanh toán.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 text-xs text-slate-700">
          <p className="font-bold text-slate-900">Quyền lợi gói dịch vụ đã chọn</p>
          <ul className="space-y-1 text-[11px] sm:text-xs">
            <li>
              • Thời hạn hiệu lực: <strong className="text-slate-900">{selectedPackage.durationMonths} tháng</strong>
            </li>
            <li>
              • Lượt bác sĩ thăm khám tại nhà:{' '}
              <strong className="text-slate-900">{selectedPackage.periodicVisitsQuota} lượt</strong>
            </li>
            <li>
              • Lượt tư vấn Telehealth:{' '}
              <strong className="text-slate-900">{selectedPackage.telehealthQuota} lượt</strong>
            </li>
            <li>
              • Hình thức ký kết: <strong className="text-slate-900">Chứng thư số Documenso 4 bên</strong>
            </li>
          </ul>
        </div>
      </div>

      {/* Xem trước điều khoản hợp đồng chuẩn pháp lý Việt Nam */}
      <div
        data-testid="contract-legal-preview"
        className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5 space-y-3 text-xs text-slate-700"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
            Xem Trước Hợp Đồng Dịch Vụ Bác Sĩ Gia Đình 4 Bên
          </h3>
          <span className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            Chuẩn pháp lý Việt Nam • Ký trực tiếp trên Documenso
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] sm:text-xs">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <strong className="text-slate-900 block">Bên A: Đại diện Hộ gia đình</strong>
            <span>Người đăng ký gói cho {effectiveCount} thành viên (ký đầu tiên)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <strong className="text-slate-900 block">Bên B: Cơ sở Y tế phối hợp</strong>
            <span>{doctor.facility?.facilityName || 'Cơ sở y tế đối tác FamiDoc'}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <strong className="text-slate-900 block">Bên C: Bác sĩ Gia đình phụ trách</strong>
            <span>
              {doctor.academicTitle
                ? `${doctor.academicTitle} ${doctor.doctorName}`
                : doctor.doctorName}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <strong className="text-slate-900 block">Bên D: Nền tảng Công nghệ FamiDoc</strong>
            <span>Điều phối hợp đồng điện tử, VietQR &amp; bảo mật dữ liệu</span>
          </div>
        </div>

        <div className="space-y-1.5 text-[11px] sm:text-xs leading-relaxed text-slate-600">
          <p>
            • <strong>Căn cứ pháp lý:</strong> Bộ luật Dân sự 2015; Luật Khám bệnh, chữa bệnh số 15/2023/QH15 &amp; NĐ 96/2023/NĐ-CP; Thông tư 21/2019/TT-BYT (mô hình Bác sĩ gia đình); Luật Giao dịch điện tử 20/2023/QH15; Luật Bảo vệ quyền lợi người tiêu dùng 19/2023/QH15; Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 &amp; NĐ 13/2023/NĐ-CP.
          </p>
          <p>
            • <strong>Quy trình ký 2 pha:</strong> Gia đình (Bên A) ký xác nhận trước trên biểu mẫu Documenso. Ngay sau khi Bên A hoàn tất, Bên B (CSYT), Bên C (Bác sĩ) và Bên D (Nền tảng) sẽ mở khóa và ký song song. Đủ 4/4 chữ ký sẽ chuyển sang thanh toán VietQR để kích hoạt gói.
          </p>
        </div>

        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="additional-terms-input"
            className="block text-xs font-semibold text-slate-800"
          >
            Điều khoản / Ghi chú thỏa thuận bổ sung (tùy chọn)
          </label>
          <textarea
            id="additional-terms-input"
            rows={2}
            value={additionalTerms}
            onChange={(e) => setAdditionalTerms(e.target.value)}
            placeholder="Ví dụ: Yêu cầu khung giờ thăm khám ưu tiên, lưu ý tiền sử chăm sóc của gia đình..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0046c0] focus:outline-hidden"
          />
        </div>
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-800"
        >
          {submitError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <Link
          href={`/doctors/${encodeURIComponent(doctorId)}`}
          className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Chọn lại gói
        </Link>
        <button
          type="button"
          disabled={isSubmitting || !doctor.isAvailable}
          onClick={handleInitiateContract}
          className="px-5 py-2.5 rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting
            ? 'Đang khởi tạo hợp đồng Documenso...'
            : 'Xác nhận khởi tạo hợp đồng 4 bên & Ký Documenso'}
        </button>
      </div>
    </section>
  );
}
