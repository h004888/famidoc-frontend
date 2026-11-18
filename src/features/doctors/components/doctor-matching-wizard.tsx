'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LandingHeader, LandingFooter } from '@/features/landing';
import {
  extractErrorMessage,
  matchingApi,
  publicApi,
  type DoctorClinicalTier,
  type PublicPackageItemDto,
  type QueuedMatchingResultDto,
} from '@/lib/api';

const AGE_GROUP_OPTIONS = [
  'Trẻ nhỏ (< 12 tuổi)',
  'Người trưởng thành',
  'Người cao tuổi (> 60 tuổi)',
  'Mẹ bầu / Sau sinh',
];

const CARE_CATEGORY_OPTIONS = [
  'Tăng huyết áp / Tim mạch',
  'Đái tháo đường / Nội tiết',
  'Nhi khoa & Dinh dưỡng',
  'Hô hấp / Tai mũi họng',
  'Khám sức khỏe định kỳ',
  'Phục hồi chức năng',
];

const DISTRICT_SUGGESTIONS = [
  'Quận 1, TP.HCM',
  'Quận 3, TP.HCM',
  'Quận 7, TP.HCM',
  'Đống Đa, Hà Nội',
  'Cầu Giấy, Hà Nội',
  'Hải Châu, Đà Nẵng',
];

const TIER_OPTIONS: Array<{
  value: DoctorClinicalTier | 'ANY';
  label: string;
  desc: string;
}> = [
  {
    value: 'ANY',
    label: 'Linh hoạt mọi trình độ',
    desc: 'Ưu tiên độ phù hợp chuyên môn và bác sĩ còn nhiều slot trống',
  },
  {
    value: 'JUNIOR',
    label: 'Bác sĩ trẻ (JUNIOR)',
    desc: 'Nhiệt huyết, nhiều thời gian theo sát từng gia đình',
  },
  {
    value: 'STANDARD',
    label: 'Bác sĩ gia đình (STANDARD)',
    desc: 'Kinh nghiệm ngoại trú ổn định 5+ năm / ThS / CKI',
  },
  {
    value: 'SENIOR',
    label: 'Chuyên gia cao cấp (SENIOR)',
    desc: '12+ năm kinh nghiệm hoặc CKII / TS / PGS',
  },
];

function toggleTag(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function DoctorMatchingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPackageParam = searchParams?.get('packageId') ?? '';
  const initialMembersParam = Number(searchParams?.get('members') ?? '');

  const [packages, setPackages] = useState<PublicPackageItemDto[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [memberCount, setMemberCount] = useState<number>(1);
  const [requestedTier, setRequestedTier] = useState<DoctorClinicalTier | 'ANY'>('ANY');
  const [ageGroups, setAgeGroups] = useState<string[]>(['Người cao tuổi (> 60 tuổi)']);
  const [careCategories, setCareCategories] = useState<string[]>(['Khám sức khỏe định kỳ']);
  const [districtArea, setDistrictArea] = useState<string>('');
  const [careDescription, setCareDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [queuedResult, setQueuedResult] = useState<QueuedMatchingResultDto | null>(null);

  useEffect(() => {
    let active = true;
    async function loadPackages() {
      setIsLoadingPackages(true);
      try {
        const res = await publicApi.getPackages({ limit: 50 });
        if (!active) return;
        const list = res.items ?? [];
        setPackages(list);
        if (list.length > 0) {
          const wanted = initialPackageParam.trim().toLowerCase();
          const matched =
            (wanted &&
              list.find(
                (p) =>
                  p.id.toLowerCase() === wanted ||
                  p.packageCode.toLowerCase() === wanted
              )) ||
            list[0]!;
          setSelectedPackageId(matched.id);
          const minM = Math.min(
            Math.max(1, matched.includedMembers),
            Math.max(1, matched.maxMembers)
          );
          const defaultM =
            Number.isFinite(initialMembersParam) && initialMembersParam >= 1
              ? Math.min(Math.max(minM, Math.trunc(initialMembersParam)), matched.maxMembers)
              : minM;
          setMemberCount(defaultM);
        }
      } catch {
        if (!active) return;
        setPackages([]);
      } finally {
        if (active) setIsLoadingPackages(false);
      }
    }
    void loadPackages();
    return () => {
      active = false;
    };
  }, [initialPackageParam, initialMembersParam]);

  const selectedPackage = useMemo(() => {
    return packages.find((p) => p.id === selectedPackageId) ?? packages[0] ?? null;
  }, [packages, selectedPackageId]);

  const minMembers = selectedPackage
    ? Math.min(
        Math.max(1, selectedPackage.includedMembers),
        Math.max(1, selectedPackage.maxMembers)
      )
    : 1;
  const maxMembers = selectedPackage ? Math.max(1, selectedPackage.maxMembers) : 1;
  const clampedMembers = Math.min(Math.max(minMembers, memberCount), maxMembers);

  const handleSelectPackage = (pkg: PublicPackageItemDto) => {
    setSelectedPackageId(pkg.id);
    setMemberCount(
      Math.min(
        Math.max(1, pkg.includedMembers),
        Math.max(1, pkg.maxMembers)
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      setSubmitError('Vui lòng chọn gói chăm sóc sức khỏe trước khi ghép nối.');
      return;
    }

    if (
      ageGroups.length === 0 &&
      careCategories.length === 0 &&
      !districtArea.trim() &&
      !careDescription.trim()
    ) {
      setSubmitError(
        'Vui lòng chọn ít nhất một thẻ nhu cầu nhanh hoặc nhập mô tả nhu cầu gia đình.'
      );
      return;
    }

    setSubmitError(null);
    setQueuedResult(null);
    setIsSubmitting(true);

    try {
      const result = await matchingApi.matchDoctors({
        packageId: selectedPackage.id,
        memberCount: clampedMembers,
        ...(requestedTier !== 'ANY' ? { requestedTier } : {}),
        ageGroups,
        careCategories,
        ...(districtArea.trim() ? { districtArea: districtArea.trim() } : {}),
        ...(careDescription.trim()
          ? { careDescription: careDescription.trim() }
          : {}),
      });

      if (result.outcome === 'MATCHED') {
        router.push(
          `/booking?matchSessionId=${encodeURIComponent(result.matchingSessionId)}`
        );
        return;
      }

      setQueuedResult(result);
    } catch (err) {
      setSubmitError(
        extractErrorMessage(
          err,
          'Không thể thực hiện ghép nối bác sĩ lúc này. Vui lòng thử lại.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col font-sans text-[#20283d] antialiased">
      <LandingHeader />

      <main className="flex-1 pb-20">
        <section
          className="relative bg-cover bg-center py-16 sm:py-20 text-center text-white"
          style={{ backgroundImage: "url('/images/medsev/doctor/1.jpg')" }}
        >
          <div className="absolute inset-0 bg-[#0037c1]/85" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>Track B · Ghép Nối Bác Sĩ Thông Minh</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Hệ Thống Gợi Ý Bác Sĩ Gia Đình Phù Hợp
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto">
              Chọn gói chăm sóc, trình độ bác sĩ và nhu cầu sức khỏe. Hệ thống cân bằng độ phù hợp chuyên môn và tải hộ gia đình để gợi ý 1 bác sĩ tối ưu nhất cho bạn xác nhận.
            </p>
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center justify-center gap-2 text-xs text-blue-100 font-medium pt-1"
            >
              <Link href="/" className="hover:text-white">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/packages" className="hover:text-white">
                Gói dịch vụ
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">Gợi ý bác sĩ (Track B)</span>
            </nav>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-6">
          {queuedResult ? (
            <div
              data-testid="matching-queued-banner"
              className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 shadow-md space-y-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">hourglass_top</span>
                </div>
                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-200 text-xs"
                  >
                    Đã đưa vào Hàng chờ điều phối Admin
                  </Badge>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Yêu cầu tìm bác sĩ đã được tiếp nhận vào hàng chờ
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {queuedResult.message}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs tabular-nums">
                <div>
                  <span className="text-slate-500 block">Mã yêu cầu hàng chờ</span>
                  <strong className="text-slate-900">{queuedResult.queueRequestId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Trạng thái</span>
                  <strong className="text-amber-700">{queuedResult.status}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Hạn phản hồi SLA</span>
                  <strong className="text-slate-900">
                    {new Date(queuedResult.slaExpiresAt).toLocaleString('vi-VN')}
                  </strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/family/subscription"
                  className="px-5 py-2.5 rounded-xl bg-[#0037c1] hover:bg-[#002c9a] text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  Theo dõi hàng chờ tại Cổng Gia đình
                </Link>
                <Link
                  href="/doctors"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Tự chọn bác sĩ còn slot (Track A)
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-7"
            >
              {submitError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-800"
                >
                  {submitError}
                </div>
              )}

              {/* Step 1: Service Package + Member Count */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase">
                  1. Chọn gói chăm sóc &amp; Số lượng thành viên
                </h2>

                {isLoadingPackages ? (
                  <div className="py-6 text-xs text-slate-500">
                    Đang tải danh sách gói chăm sóc...
                  </div>
                ) : packages.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    Hiện chưa có gói dịch vụ hoạt động. Vui lòng quay lại{' '}
                    <Link href="/packages" className="font-bold underline">
                      danh mục gói
                    </Link>
                    .
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {packages.map((pkg) => {
                      const active = selectedPackage?.id === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#0037c1] bg-blue-50/60 ring-2 ring-[#0037c1]/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {pkg.packageName}
                            </span>
                            <span className="text-xs font-bold text-[#0037c1] tabular-nums">
                              {pkg.basePrice.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                            {pkg.durationMonths} tháng · {pkg.includedMembers}–{pkg.maxMembers} thành viên · {pkg.periodicVisitsQuota} lượt tại nhà
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedPackage && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Số thành viên đăng ký
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        Giới hạn gói {selectedPackage.packageName}: {minMembers} – {maxMembers} người
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                      <button
                        type="button"
                        aria-label="Giảm số thành viên"
                        disabled={clampedMembers <= minMembers}
                        onClick={() =>
                          setMemberCount(Math.max(minMembers, clampedMembers - 1))
                        }
                        className="w-8 h-8 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <span
                        data-testid="matching-member-count"
                        className="min-w-[3.5rem] text-center text-xs font-bold text-slate-900 tabular-nums"
                      >
                        {clampedMembers} người
                      </span>
                      <button
                        type="button"
                        aria-label="Tăng số thành viên"
                        disabled={clampedMembers >= maxMembers}
                        onClick={() =>
                          setMemberCount(Math.min(maxMembers, clampedMembers + 1))
                        }
                        className="w-8 h-8 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Doctor Clinical Tier */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase">
                  2. Trình độ bác sĩ mong muốn
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TIER_OPTIONS.map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => setRequestedTier(tier.value)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        requestedTier === tier.value
                          ? 'border-[#0037c1] bg-blue-50/60 ring-1 ring-[#0037c1]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">
                        {tier.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {tier.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Quick-Select Tags */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase">
                  3. Nhu cầu chăm sóc &amp; Khu vực sinh sống
                </h2>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Nhóm đối tượng trong gia đình
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AGE_GROUP_OPTIONS.map((item) => {
                      const active = ageGroups.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setAgeGroups((prev) => toggleTag(prev, item))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#0037c1] text-white border-[#0037c1]'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-[#0037c1]'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Nhóm bệnh lý / Nhu cầu ưu tiên
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CARE_CATEGORY_OPTIONS.map((item) => {
                      const active = careCategories.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setCareCategories((prev) => toggleTag(prev, item))
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#0037c1] text-white border-[#0037c1]'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-[#0037c1]'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="matching-district-input"
                    className="text-xs font-semibold text-slate-700 block"
                  >
                    Quận / Huyện hoặc khu vực ưu tiên
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {DISTRICT_SUGGESTIONS.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setDistrictArea(area)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${
                          districtArea === area
                            ? 'bg-blue-50 border-[#0037c1] text-[#0037c1]'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  <input
                    id="matching-district-input"
                    type="text"
                    value={districtArea}
                    onChange={(e) => setDistrictArea(e.target.value)}
                    placeholder="VD: Quận 1, TP.HCM hoặc Đống Đa, Hà Nội"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:border-[#0037c1]"
                  />
                </div>
              </div>

              {/* Step 4: Care Description */}
              <div className="space-y-2">
                <label
                  htmlFor="matching-care-description"
                  className="text-xs font-semibold text-slate-700 block"
                >
                  Mô tả thêm nhu cầu chăm sóc (tùy chọn)
                </label>
                <textarea
                  id="matching-care-description"
                  rows={3}
                  value={careDescription}
                  onChange={(e) => setCareDescription(e.target.value)}
                  placeholder="VD: Gia đình có người cao tuổi tăng huyết áp nhẹ, cần bác sĩ theo dõi định kỳ tại nhà vào cuối tuần..."
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-900 focus:outline-hidden focus:border-[#0037c1]"
                />
                <p className="text-[11px] text-slate-500">
                  Lưu ý bảo mật: Vui lòng không nhập họ tên thật, số điện thoại, email, CCCD hoặc số nhà cụ thể vào ô mô tả.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  href="/doctors"
                  className="text-xs font-semibold text-slate-600 hover:text-[#0037c1]"
                >
                  ← Chuyển sang tự chọn bác sĩ (Track A)
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedPackage}
                  className="w-full sm:w-auto px-6 py-3 h-auto rounded-xl bg-[#0037c1] hover:bg-[#002c9a] text-white text-sm font-semibold cursor-pointer"
                >
                  {isSubmitting
                    ? 'Đang phân tích bác sĩ phù hợp...'
                    : 'Tìm bác sĩ phù hợp ngay'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
