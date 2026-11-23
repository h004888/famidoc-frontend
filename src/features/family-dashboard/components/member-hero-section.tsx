'use client';

import Link from 'next/link';
import type { PatientDto } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import * as MP from '../utils/member-profile.util';

/* ═══════════════════════════════════════════════════
   Hero banner — personal info card
   ═══════════════════════════════════════════════════ */

function getBmiCategory(bmi: number): { label: string; toneClass: string } {
  if (bmi < 18.5) return { label: 'Thiếu cân', toneClass: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (bmi < 25) return { label: 'Bình thường', toneClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (bmi < 30) return { label: 'Thừa cân', toneClass: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Béo phì', toneClass: 'text-rose-700 bg-rose-50 border-rose-200' };
}

export function MemberHeroBanner({ member, age, initials }: { member: PatientDto; age: number | null; initials: string }) {
  const hasBmi =
    member.heightCm != null &&
    member.weightKg != null &&
    member.heightCm > 0 &&
    member.weightKg > 0;
  const bmiValue = hasBmi
    ? member.weightKg! / Math.pow(member.heightCm! / 100, 2)
    : null;
  const bmiMeta = bmiValue !== null ? getBmiCategory(bmiValue) : null;

  return (
    <section aria-label="Hồ sơ cá nhân" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 space-y-5">
        {/* Tầng 1: Định danh nhân khẩu học + Hành động chính */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`size-14 sm:size-16 rounded-2xl ${
                MP.memberIsHead(member)
                  ? 'bg-gradient-to-br from-primary to-indigo-500 text-white'
                  : 'bg-indigo-50 text-primary'
              } flex items-center justify-center text-lg sm:text-xl font-bold shrink-0`}
            >
              {initials}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                  {member.fullName}
                </h1>
                <Badge variant="outline" className="bg-indigo-50/80 text-primary border-indigo-200 text-xs font-semibold shrink-0">
                  {MP.getRelationLabel(member.relationshipToHead)}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
                <span className="font-medium text-slate-800">
                  {age !== null ? `${age} tuổi` : 'Chưa rõ tuổi'}
                </span>
                <span className="text-slate-400">({MP.formatDateDisplay(member.dateOfBirth)})</span>
                <span className="text-slate-300" aria-hidden="true">•</span>
                <span>Giới tính: <strong className="font-medium text-slate-800">{MP.getGenderLabel(member.gender)}</strong></span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
              <Link href={`/family/medical-book?patientId=${encodeURIComponent(member.id)}`}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">history_edu</span>
                Lịch sử khám
              </Link>
            </Button>
          </div>
        </div>

        {/* Tầng 2: Chỉ số nền tảng y tế (4 ô độc lập, dễ quét trong 5 giây) */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Nhóm máu
            </span>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <span className="material-symbols-outlined text-[17px] text-rose-500" aria-hidden="true">bloodtype</span>
              {member.bloodType ? (
                <span>{member.bloodType}</span>
              ) : (
                <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Chiều cao
            </span>
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {member.heightCm != null ? (
                <span>{member.heightCm} cm</span>
              ) : (
                <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Cân nặng
            </span>
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {member.weightKg != null ? (
                <span>{member.weightKg} kg</span>
              ) : (
                <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Chỉ số BMI
            </span>
            {bmiValue !== null && bmiMeta ? (
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-sm font-bold text-slate-900">{bmiValue.toFixed(1)}</span>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${bmiMeta.toneClass}`}>
                  {bmiMeta.label}
                </span>
              </div>
            ) : (
              <span className="text-sm text-slate-400 italic">Chưa có dữ liệu</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
