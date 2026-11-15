import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';
import type { PublicDoctorDetailDto } from '@/lib/api';
import { DoctorPackageSelector } from './doctor-package-selector';

export interface DoctorDetailViewProps {
  initialDoctor: PublicDoctorDetailDto;
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function DoctorDetailView({ initialDoctor }: DoctorDetailViewProps) {
  const doctor = initialDoctor;
  const fullTitle = doctor.academicTitle
    ? `${doctor.academicTitle} ${doctor.doctorName}`
    : doctor.doctorName;
  const hasRating = doctor.stats.ratingAvg !== null;
  const hasCareModel =
    doctor.careModel.serviceModes.length > 0 ||
    doctor.careModel.commitments.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      <LandingHeader />

      <main className="flex-1 pb-16">
        <section className="bg-white border-b border-slate-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs text-slate-500"
            >
              <Link href="/" className="hover:text-[#0046c0] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/doctors"
                className="hover:text-[#0046c0] transition-colors"
              >
                Bác sĩ gia đình
              </Link>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-800 line-clamp-1">
                {fullTitle}
              </span>
            </nav>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {doctor.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doctor.avatarUrl}
                        alt={doctor.doctorName}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                        {doctor.doctorName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {doctor.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/70">
                          <span className="material-symbols-outlined text-xs">
                            verified
                          </span>
                          <span>Hồ sơ đã xác thực</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                          <span>Đang cập nhật xác thực</span>
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          doctor.isAvailable
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            doctor.isAvailable
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>
                          {doctor.isAvailable
                            ? 'Đang nhận hộ gia đình mới'
                            : 'Đã đủ hộ gia đình phụ trách'}
                        </span>
                      </span>
                    </div>

                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                        {fullTitle}
                      </h1>
                      <p className="text-xs sm:text-sm font-semibold text-[#0046c0] mt-0.5">
                        {doctor.specialty}
                      </p>
                    </div>

                    {doctor.facility && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-slate-400 text-sm">
                            domain
                          </span>
                          <span className="font-medium text-slate-800">
                            {doctor.facility.facilityName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-slate-400 text-sm">
                            location_on
                          </span>
                          <span>{doctor.facility.address}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-bold text-slate-900 tabular-nums">
                      {doctor.stats.experienceYears} năm
                    </span>
                    <span className="text-[10px] text-slate-500">Kinh nghiệm</span>
                  </div>
                  <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-bold text-amber-600 tabular-nums">
                      {hasRating ? (
                        <span className="inline-flex items-center justify-center gap-0.5">
                          <span className="material-symbols-outlined text-xs material-symbols-filled">
                            star
                          </span>
                          <span>{doctor.stats.ratingAvg?.toFixed(2)}</span>
                        </span>
                      ) : (
                        'Chưa có đánh giá'
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {doctor.stats.totalReviews} đánh giá
                    </span>
                  </div>
                  <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-bold text-[#0046c0] tabular-nums">
                      {doctor.stats.completedEncounters.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Ca đã hoàn tất
                    </span>
                  </div>
                  <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-bold text-slate-900 tabular-nums">
                      {doctor.panel.activeCount}/{doctor.panel.maxCapacity}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Hộ đang phụ trách
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0046c0] text-lg">
                    person
                  </span>
                  <span>Giới thiệu</span>
                </h2>
                {doctor.bio ? (
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {doctor.bio}
                  </p>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Chưa có thông tin giới thiệu.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0046c0] text-lg">
                    school
                  </span>
                  <span>Chứng Chỉ &amp; Bằng Cấp</span>
                </h2>

                {doctor.credentials.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {doctor.credentials.map((credential) => (
                      <li
                        key={credential.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-[#0046c0] text-base shrink-0 mt-0.5">
                            verified
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {credential.typeLabel}
                            </p>
                            <p className="text-slate-600">
                              {credential.issuingAuthority} ({credential.issueYear})
                            </p>
                          </div>
                        </div>
                        {credential.verified && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                            Đã xác thực
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Chưa có chứng chỉ được công bố.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0046c0] text-lg">
                    clinical_notes
                  </span>
                  <span>Ca Bệnh Tiêu Biểu Đã Xử Lý</span>
                </h2>
                {doctor.treatedCases.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {doctor.treatedCases.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-100"
                      >
                        <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                          clinical_notes
                        </span>
                        <span className="leading-snug font-medium">
                          {item.summary}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Chưa có ca bệnh tiêu biểu được công bố.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0046c0] text-lg">
                      home_health
                    </span>
                    <span>Phạm Vi Chăm Sóc</span>
                  </h2>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-100">
                    Chính sách nền tảng
                  </span>
                </div>

                {hasCareModel ? (
                  <>
                    {doctor.careModel.serviceModes.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {doctor.careModel.serviceModes.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-md border border-slate-200 bg-slate-50/60 space-y-1"
                          >
                            <div className="w-7 h-7 rounded bg-[#0046c0] text-white flex items-center justify-center">
                              <span className="material-symbols-outlined text-base">
                                {item.icon || 'home'}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-xs">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {doctor.careModel.commitments.length > 0 && (
                      <ul className="space-y-2 text-xs text-slate-700">
                        {doctor.careModel.commitments.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-100"
                          >
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                              {item.icon || 'verified_user'}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {item.title}
                              </p>
                              <p className="text-slate-600 leading-snug">
                                {item.description}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Chưa có thông tin phạm vi chăm sóc.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg material-symbols-filled">
                      reviews
                    </span>
                    <span>Đánh Giá Đã Xác Thực</span>
                  </h2>
                  <span className="text-xs text-amber-600 font-bold">
                    {doctor.reviews.totalReviews} đánh giá
                  </span>
                </div>

                {doctor.reviews.items.length > 0 ? (
                  <div className="space-y-2.5">
                    {doctor.reviews.items.map((review) => (
                      <div
                        key={review.id}
                        className="p-3.5 rounded-md bg-slate-50 border border-slate-100 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">
                              {review.patientDisplayName}
                            </span>
                            {review.packageName && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                {review.packageName}
                              </span>
                            )}
                            {review.district && (
                              <span className="text-[10px] text-slate-500">
                                {review.district}
                              </span>
                            )}
                          </div>
                          <div className="flex text-amber-500">
                            {Array.from({ length: review.ratingStars }).map(
                              (_, index) => (
                                <span
                                  key={index}
                                  className="material-symbols-outlined text-xs material-symbols-filled"
                                >
                                  star
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 italic leading-snug">
                          &quot;{review.comment}&quot;
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(review.reviewedAt)} · Đã xác thực buổi khám
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Bác sĩ chưa có đánh giá nào.
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-20">
              <DoctorPackageSelector
                doctorId={doctor.id}
                doctorName={fullTitle}
                isAvailable={doctor.isAvailable}
                facilityId={doctor.facility?.id ?? null}
                carePackages={doctor.carePackages}
              />
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
