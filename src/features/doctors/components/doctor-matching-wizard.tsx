'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LandingHeader, LandingFooter } from '@/features/landing';
import {
  extractErrorMessage,
  matchingApi,
  publicApi,
  type MatchedDoctorPreviewDto,
  type MatchingOptionsDto,
  type PlatformFullMatchingResultDto,
  type PublicPackageItemDto,
} from '@/lib/api';
import { DOCTOR_ACADEMIC_TITLE_OPTIONS } from '@/lib/constants/doctor-academic-titles';

const FALLBACK_AGE_GROUPS = [
  'Trẻ nhỏ (<12 tuổi)',
  'Người lớn (12–59 tuổi)',
  'Người cao tuổi (≥60 tuổi)',
  'Mẹ bầu & sau sinh',
];

const FALLBACK_CARE_CATEGORIES = [
  'Khám định kỳ cả nhà',
  'Tim mạch · Huyết áp',
  'Tiểu đường · Nội tiết',
  'Nhi · Dinh dưỡng',
  'Hô hấp · Tai mũi họng',
  'Xương khớp · Phục hồi',
];

const FALLBACK_AREAS: Array<{ city: string; districts: string[] }> = [
  { city: 'TP. Hồ Chí Minh', districts: ['Quận 1', 'Quận 3', 'Quận 7'] },
  { city: 'Hà Nội', districts: ['Đống Đa', 'Cầu Giấy'] },
  { city: 'Đà Nẵng', districts: ['Hải Châu'] },
];

function toggleTag(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function DoctorMatchingWizard() {
  const searchParams = useSearchParams();
  const initialPackageParam = searchParams?.get('packageId') ?? '';
  const initialMembersParam = Number(searchParams?.get('members') ?? '');

  const [packages, setPackages] = useState<PublicPackageItemDto[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [memberCount, setMemberCount] = useState<number>(1);
  const [requestedAcademicTitle, setRequestedAcademicTitle] = useState<string>('ANY');
  const [ageGroups, setAgeGroups] = useState<string[]>(['Người cao tuổi (≥60 tuổi)']);
  const [careCategories, setCareCategories] = useState<string[]>(['Khám định kỳ cả nhà']);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [matchingOptions, setMatchingOptions] = useState<MatchingOptionsDto | null>(null);
  const [careDescription, setCareDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [matchedResult, setMatchedResult] = useState<MatchedDoctorPreviewDto | null>(null);
  const [platformFullResult, setPlatformFullResult] =
    useState<PlatformFullMatchingResultDto | null>(null);

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

  useEffect(() => {
    let active = true;
    if (typeof matchingApi.getMatchingOptions === 'function') {
      matchingApi
        .getMatchingOptions()
        .then((opts) => {
          if (active && opts) {
            setMatchingOptions(opts);
          }
        })
        .catch(() => {
          // Fallback sang danh mục mặc định nếu API tạm thời chưa phản hồi
        });
    }
    return () => {
      active = false;
    };
  }, []);

  const areaOptions = useMemo(
    () => (matchingOptions?.areas?.length ? matchingOptions.areas : FALLBACK_AREAS),
    [matchingOptions]
  );

  const ageGroupOptions = useMemo(
    () =>
      matchingOptions?.ageGroups?.length
        ? matchingOptions.ageGroups.map((a) => a.label)
        : FALLBACK_AGE_GROUPS,
    [matchingOptions]
  );

  const careCategoryOptions = useMemo(
    () =>
      matchingOptions?.careCategories?.length
        ? matchingOptions.careCategories.map((c) => c.label)
        : FALLBACK_CARE_CATEGORIES,
    [matchingOptions]
  );

  const academicTitleOptions = useMemo(
    () =>
      matchingOptions?.academicTitles?.length
        ? matchingOptions.academicTitles
        : DOCTOR_ACADEMIC_TITLE_OPTIONS,
    [matchingOptions]
  );

  const availableDistricts = useMemo(() => {
    if (!selectedCity) return [];
    return areaOptions.find((a) => a.city === selectedCity)?.districts ?? [];
  }, [areaOptions, selectedCity]);

  const effectiveDistrictArea = useMemo(() => {
    if (selectedDistrict && selectedCity) {
      return `${selectedDistrict}, ${selectedCity}`;
    }
    return selectedCity || '';
  }, [selectedCity, selectedDistrict]);

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
      !effectiveDistrictArea &&
      !careDescription.trim()
    ) {
      setSubmitError(
        'Vui lòng chọn ít nhất một thẻ nhu cầu nhanh hoặc nhập mô tả nhu cầu gia đình.'
      );
      return;
    }

    setSubmitError(null);
    setMatchedResult(null);
    setPlatformFullResult(null);
    setIsSubmitting(true);

    try {
      const result = await matchingApi.matchDoctors({
        packageId: selectedPackage.id,
        memberCount: clampedMembers,
        ...(requestedAcademicTitle !== 'ANY' ? { requestedAcademicTitle } : {}),
        ageGroups,
        careCategories,
        ...(effectiveDistrictArea ? { districtArea: effectiveDistrictArea } : {}),
        ...(careDescription.trim()
          ? { careDescription: careDescription.trim() }
          : {}),
      });

      if (result.outcome === 'MATCHED') {
        setMatchedResult(result);
        return;
      }

      if (result.outcome === 'PLATFORM_FULL') {
        setPlatformFullResult(result);
        return;
      }

      setSubmitError('Không thể tải kết quả gợi ý bác sĩ lúc này. Vui lòng thử lại.');
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
              <span>Gợi ý bác sĩ phù hợp cho gia đình</span>
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
              <span className="text-white font-semibold">Gợi ý bác sĩ</span>
            </nav>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-6">
          {matchedResult ? (
            <div data-testid="matching-results-screen" className="space-y-6">
              {matchedResult.relaxedAcademicTitle && (
                <div
                  data-testid="matching-relaxed-banner"
                  className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-xs sm:text-sm text-[#0037c1] flex items-start gap-3 shadow-xs"
                >
                  <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
                    info
                  </span>
                  <p className="leading-relaxed">
                    Hiện chưa còn bác sĩ{' '}
                    {matchedResult.requestedAcademicTitle
                      ? `(${matchedResult.requestedAcademicTitle}) `
                      : ''}
                    trống lịch. Hệ thống đã mở rộng sang các bác sĩ phù hợp nhất với nhu cầu gia
                    đình bạn.
                  </p>
                </div>
              )}

              {/* Top 1 Card */}
              <div
                data-testid="matching-top1-card"
                className="bg-white rounded-2xl border-2 border-[#0037c1]/25 p-6 sm:p-8 shadow-md space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0037c1]">
                    <span className="material-symbols-outlined text-base material-symbols-filled">
                      star
                    </span>
                    <span>Bác sĩ phù hợp nhất với gia đình bạn (Top 1)</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-[#03864b] border-emerald-200 text-xs font-semibold"
                  >
                    Còn nhận gia đình
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
                    {matchedResult.doctor.avatarUrl ? (
                      <img
                        src={matchedResult.doctor.avatarUrl}
                        alt={matchedResult.doctor.doctorName}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-500">
                        {matchedResult.doctor.doctorName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                      {matchedResult.doctor.academicTitle
                        ? `${matchedResult.doctor.academicTitle} `
                        : ''}
                      {matchedResult.doctor.doctorName}
                    </h2>
                    <p className="text-sm font-semibold text-[#0037c1]">
                      {matchedResult.doctor.specialty} · {matchedResult.doctor.experienceYears} năm
                      kinh nghiệm
                    </p>
                    <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                      <p className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-base text-slate-400 shrink-0 mt-0.5">
                          domain
                        </span>
                        <span className="font-medium text-slate-800">
                          {matchedResult.facility.facilityName}
                        </span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-base text-slate-400 shrink-0 mt-0.5">
                          location_on
                        </span>
                        <span>{matchedResult.facility.address}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    So sánh độ phù hợp với nhu cầu gia đình
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="py-2.5 px-3.5 font-semibold w-[28%]">Tiêu chí</th>
                          <th className="py-2.5 px-3.5 font-semibold w-[36%]">Gia đình bạn cần</th>
                          <th className="py-2.5 px-3.5 font-semibold w-[36%]">Bác sĩ đáp ứng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(matchedResult.comparisonRows && matchedResult.comparisonRows.length > 0
                          ? matchedResult.comparisonRows
                          : [
                              {
                                criterion: 'Nhu cầu sức khỏe',
                                familyNeed: careCategories.join(', ') || 'Chăm sóc gia đình',
                                doctorMatch: `Chuyên khoa ${matchedResult.doctor.specialty}`,
                                isMatched: true,
                              },
                              {
                                criterion: 'Khu vực sống',
                                familyNeed: effectiveDistrictArea || 'Mọi khu vực',
                                doctorMatch: matchedResult.facility.address,
                                isMatched: true,
                              },
                              {
                                criterion: 'Học hàm / Học vị',
                                familyNeed:
                                  matchedResult.requestedAcademicTitle || 'Linh hoạt phù hợp nhất',
                                doctorMatch: matchedResult.doctor.academicTitle || 'Bác sĩ',
                                isMatched: !matchedResult.relaxedAcademicTitle,
                              },
                              {
                                criterion: 'Lịch nhận hộ',
                                familyNeed: 'Cần tiếp nhận ngay',
                                doctorMatch: 'Đang còn lịch trống',
                                isMatched: true,
                              },
                            ]
                        ).map((row) => (
                          <tr key={row.criterion}>
                            <td className="py-2.5 px-3.5 font-semibold text-slate-800 align-top">
                              {row.criterion}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-600 align-top">
                              {row.familyNeed}
                            </td>
                            <td className="py-2.5 px-3.5 align-top">
                              <span className="inline-flex items-start gap-1.5 font-medium text-slate-900">
                                <span
                                  className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${
                                    row.isMatched ? 'text-[#03864b]' : 'text-amber-600'
                                  }`}
                                  aria-hidden="true"
                                >
                                  {row.isMatched ? 'check_circle' : 'info'}
                                </span>
                                <span>{row.doctorMatch}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setMatchedResult(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer transition-colors"
                  >
                    ← Chỉnh lại nhu cầu
                  </button>
                  <Link
                    href={`/booking?matchSessionId=${encodeURIComponent(matchedResult.matchingSessionId)}`}
                    className="px-6 py-3 rounded-xl bg-[#0037c1] hover:bg-[#002c9a] text-white text-xs sm:text-sm font-semibold text-center transition-colors shadow-xs"
                  >
                    Chọn bác sĩ này &amp; Tiếp tục đặt gói →
                  </Link>
                </div>
              </div>

              {/* Top 2 - 4 Alternatives */}
              {matchedResult.alternatives && matchedResult.alternatives.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Các bác sĩ phù hợp tiếp theo (Xếp hạng 2 – {matchedResult.alternatives.length + 1})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {matchedResult.alternatives.map((alt) => (
                      <div
                        key={alt.doctor.id}
                        data-testid={`matching-alt-card-${alt.rank}`}
                        className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-full gap-3.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0037c1]">
                            #{alt.rank}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#03864b] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#03864b]" />
                            Còn nhận
                          </span>
                        </div>

                        <div className="flex items-center gap-3 min-h-[3.5rem]">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
                            {alt.doctor.avatarUrl ? (
                              <img
                                src={alt.doctor.avatarUrl}
                                alt={alt.doctor.doctorName}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base font-bold text-slate-500">
                                {alt.doctor.doctorName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            {alt.doctor.academicTitle && (
                              <p className="text-[11px] font-semibold text-[#0037c1] uppercase tracking-wide truncate">
                                {alt.doctor.academicTitle}
                              </p>
                            )}
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
                              {alt.doctor.doctorName}
                            </h4>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs min-h-[3.75rem]">
                          <p className="font-semibold text-[#0037c1] line-clamp-2 leading-snug">
                            {alt.doctor.specialty} · {alt.doctor.experienceYears} năm KN
                          </p>
                          <p className="text-slate-500 truncate">
                            {alt.facility.facilityName}
                          </p>
                        </div>

                        <div className="flex-1 rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-xs text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-800 block mb-1">
                            Vì sao xếp sau:
                          </span>
                          {alt.shortReason ||
                            (alt.rationale.startsWith('Độ phù hợp')
                              ? `Bác sĩ ${alt.doctor.specialty} (${alt.doctor.experienceYears} năm kinh nghiệm) tại ${alt.facility.facilityName}, hiện vẫn còn lịch trống nhận gia đình.`
                              : alt.rationale)}
                        </div>

                        <Link
                          href={`/booking?packageId=${encodeURIComponent(matchedResult.package.id)}&doctorId=${encodeURIComponent(alt.doctor.id)}&facilityId=${encodeURIComponent(alt.facility.id)}&members=${matchedResult.memberCount}`}
                          className="mt-auto w-full py-2.5 px-3 rounded-xl border border-[#0037c1] bg-blue-50 hover:bg-blue-100 text-[#0037c1] text-xs font-semibold text-center transition-colors"
                        >
                          Chọn bác sĩ này
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
                <Link
                  href="/doctors"
                  className="text-xs sm:text-sm font-semibold text-[#0037c1] hover:underline"
                >
                  Xem toàn bộ danh sách bác sĩ →
                </Link>
              </div>
            </div>
          ) : platformFullResult ? (
            <div
              data-testid="matching-platform-full-banner"
              className="bg-white rounded-2xl border border-amber-200 p-8 sm:p-10 shadow-md text-center space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">event_busy</span>
              </div>
              <div className="space-y-2 max-w-xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Hiện toàn bộ bác sĩ đều đã kín lịch nhận gia đình
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {platformFullResult.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={`tel:${platformFullResult.hotline.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0037c1] hover:bg-[#002c9a] text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-base">call</span>
                  <span>Gọi Hotline: {platformFullResult.hotline}</span>
                </a>
                <Link
                  href="/doctors"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Xem danh sách bác sĩ
                </Link>
                <button
                  type="button"
                  onClick={() => setPlatformFullResult(null)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0037c1] cursor-pointer"
                >
                  ← Chỉnh lại nhu cầu
                </button>
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

              {/* Step 2: Doctor Academic Title */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase">
                  2. Học hàm / Học vị bác sĩ mong muốn
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRequestedAcademicTitle('ANY')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer sm:col-span-2 lg:col-span-3 ${
                      requestedAcademicTitle === 'ANY'
                        ? 'border-[#0037c1] bg-blue-50/60 ring-1 ring-[#0037c1]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      Hệ thống tự chọn phù hợp nhất
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      Ưu tiên bác sĩ đúng chuyên khoa và còn lịch trống
                    </div>
                  </button>
                  {academicTitleOptions.map((titleOpt) => (
                    <button
                      key={titleOpt.value}
                      type="button"
                      onClick={() => setRequestedAcademicTitle(titleOpt.value)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        requestedAcademicTitle === titleOpt.value
                          ? 'border-[#0037c1] bg-blue-50/60 ring-1 ring-[#0037c1]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        {titleOpt.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {titleOpt.desc}
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
                    Thành viên trong gia đình
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ageGroupOptions.map((item) => {
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
                    Nhu cầu chăm sóc chính
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {careCategoryOptions.map((item) => {
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="matching-city-select"
                      className="text-xs font-semibold text-slate-700 block"
                    >
                      Tỉnh / Thành phố
                    </label>
                    <div className="relative">
                      <select
                        id="matching-city-select"
                        value={selectedCity}
                        onChange={(e) => {
                          setSelectedCity(e.target.value);
                          setSelectedDistrict('');
                        }}
                        className="w-full h-11 pl-3.5 pr-10 appearance-none rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-hidden focus:border-[#0037c1] cursor-pointer"
                      >
                        <option value="">Tất cả khu vực đang hoạt động</option>
                        {areaOptions.map((area) => (
                          <option key={area.city} value={area.city}>
                            {area.city}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl"
                      >
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="matching-district-select"
                      className="text-xs font-semibold text-slate-700 block"
                    >
                      Phường / Xã
                    </label>
                    <div className="relative">
                      <select
                        id="matching-district-select"
                        disabled={!selectedCity || availableDistricts.length === 0}
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full h-11 pl-3.5 pr-10 appearance-none rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-hidden focus:border-[#0037c1] disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {selectedCity ? 'Toàn tỉnh / thành phố' : 'Chọn Tỉnh / TP trước'}
                        </option>
                        {availableDistricts.map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl"
                      >
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>
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
                  ← Chuyển sang tự chọn bác sĩ
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
