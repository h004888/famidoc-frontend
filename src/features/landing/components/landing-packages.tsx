'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/context/auth-context';
import type { LandingPackageItem } from '../types';

export interface LandingPackagesProps {
  packages?: LandingPackageItem[];
}

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
}

export function LandingPackages({ packages = [] }: LandingPackagesProps = {}) {
  const { isAuthenticated, isLoading } = useAuth();
  const displayPackages = packages.slice(0, 4);

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Gói Chăm Sóc Sức Khỏe Gia Đình &amp; Bảng Giá
          </h2>

          <p className="text-base text-slate-600">
            Giá gói = số lần khám tại nhà × đơn giá theo gói. Lịch khám linh hoạt do gia đình và bác sĩ thống nhất, video và nhắn tin đã bao gồm trọn gói.
          </p>
        </div>

        {displayPackages.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <p className="text-sm text-slate-600">
              Danh mục gói chăm sóc đang được cập nhật. Vui lòng xem bảng giá đầy đủ tại trang gói dịch vụ.
            </p>
            <Button asChild className="bg-[#0046c0] hover:bg-[#003899] text-white">
              <Link href="/packages">Xem tất cả gói dịch vụ</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Pricing Cards */}
            <div className="flex md:grid overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory md:snap-none -mx-4 px-4 sm:mx-0 sm:px-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayPackages.map((pkg, idx) => {
                const isPopular = idx === 1 || pkg.packageCode.toUpperCase().includes('FAMILY');
                const includedCount = pkg.includedMembers ?? pkg.maxMembers;
                const features = [
                  {
                    text: `Quy mô: ${includedCount} người (tối đa ${pkg.maxMembers} người)`,
                    strong: true,
                  },
                  {
                    text: `${pkg.periodicVisitsQuota} lần bác sĩ khám tận nhà / kỳ`,
                  },
                  {
                    text: `${pkg.telehealthQuota} lượt video tư vấn cùng bác sĩ`,
                  },
                  {
                    text: 'Nhắn tin miễn phí với bác sĩ trong kỳ',
                  },
                  {
                    text: 'Hồ sơ bệnh án điện tử (EHR) & theo dõi chỉ số',
                  },
                ];

                if (pkg.additionalMemberMonthlyPrice && pkg.additionalMemberMonthlyPrice > 0) {
                  features.push({
                    text: `Phụ phí thêm người: ${formatVnd(pkg.additionalMemberMonthlyPrice)}/người/tháng`,
                  });
                }

                return (
                  <Card
                    key={pkg.id}
                    className={`w-[85vw] sm:w-[320px] md:w-auto shrink-0 md:shrink snap-center rounded-xl p-6 flex flex-col justify-between relative bg-white hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ease-out group cursor-default gap-0 ${
                      isPopular
                        ? 'border-2 border-[#0046c0] shadow-md ring-4 ring-[#0046c0]/10'
                        : 'border border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0046c0] text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm gap-1 border-none">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Phổ biến nhất</span>
                      </Badge>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-[#0046c0]">
                          Kỳ hạn {pkg.durationMonths} Tháng
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors">
                          {pkg.packageName}
                        </h3>
                        <div className="text-xs text-slate-500 line-clamp-2">{pkg.description}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight animate-fade-in">
                            {formatVnd(pkg.basePrice)}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/kỳ</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Trọn gói {pkg.durationMonths} tháng • {pkg.periodicVisitsQuota} lần khám tại nhà
                        </div>
                      </div>

                      <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs leading-relaxed text-slate-700">
                        {features.map((f, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                              check
                            </span>
                            <span className={f.strong ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                              {f.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      {isLoading ? (
                        <div
                          aria-hidden="true"
                          className="w-full h-10 rounded-lg bg-slate-100 animate-pulse"
                        />
                      ) : (
                        <Button
                          asChild
                          variant={isPopular ? 'default' : 'outline'}
                          className={`w-full py-2.5 h-auto rounded-lg font-medium text-xs sm:text-sm gap-1.5 shadow-xs ${
                            isPopular
                              ? 'bg-[#0046c0] hover:bg-[#003899] text-white hover:shadow-md'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <Link
                            href={
                              isAuthenticated
                                ? `/doctors?packageId=${pkg.id}`
                                : `/register?packageId=${pkg.id}`
                            }
                          >
                            <span>{isAuthenticated ? 'Chọn gói này' : 'Đăng ký ngay'}</span>
                            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                              arrow_forward
                            </span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <p className="md:hidden text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 -mt-6">
              <span className="material-symbols-outlined text-sm text-[#0046c0]">swipe</span>
              <span>Vuốt ngang để so sánh {displayPackages.length} gói dịch vụ</span>
            </p>
          </>
        )}

        {/* Additional Transparent Terms & Policy */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-3">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
            <span className="material-symbols-outlined text-[#0046c0] text-lg">verified</span>
            <span>Quy chuẩn &amp; Quyền lợi chung đã bao gồm trong bảng giá</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-slate-800">Lịch Khám Linh Hoạt</div>
              <p className="text-slate-500 leading-relaxed">
                Gia đình và bác sĩ chủ động thống nhất thời điểm khám trong kỳ, không khóa cứng 1 lần/tháng.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-800">Bác Sĩ Phụ Trách</div>
              <p className="text-slate-500 leading-relaxed">
                Đã bao gồm bác sĩ cơ sở (250k). Có thể nâng cấp Thạc sĩ (+50k), Tiến sĩ (+100k), GS/PGS (+200k)/lần khám tại nhà.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-800">Thêm Thành Viên</div>
              <p className="text-slate-500 leading-relaxed">
                75.000đ/người/tháng trong trần gói. Sử dụng chung số lượt khám &amp; video của gói.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-800">Minh Bạch Chi Phí</div>
              <p className="text-slate-500 leading-relaxed">
                Nhắn tin miễn phí trong kỳ. Không bao gồm chi phí thuốc và xét nghiệm chuyên sâu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
