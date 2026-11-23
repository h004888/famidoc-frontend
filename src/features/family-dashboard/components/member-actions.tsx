'use client';

import type { PatientAllergyDto } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as MP from '../utils/member-profile.util';

const TASK_COLORS: Record<string, { bg: string; text: string; border: string; iconBg: string; ringHover: string }> = {
  emerald: { bg: 'bg-emerald-50/80', text: 'text-emerald-800', border: 'border-emerald-200', iconBg: 'bg-emerald-100', ringHover: 'hover:ring-emerald-300' },
  rose:    { bg: 'bg-rose-50/80',   text: 'text-rose-800',   border: 'border-rose-200',   iconBg: 'bg-rose-100',   ringHover: 'hover:ring-rose-300' },
  amber:   { bg: 'bg-amber-50/80',  text: 'text-amber-800',  border: 'border-amber-200',  iconBg: 'bg-amber-100',  ringHover: 'hover:ring-amber-300' },
};

/* ═══════════════════════════════════════════════════
   Alert bar — abnormal vitals warning
   ═══════════════════════════════════════════════════ */

export function MemberAlertBar({ memberName }: { memberName: string }) {
  return (
    <div role="alert" aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
      <span className="material-symbols-outlined text-[22px] text-amber-600 shrink-0" aria-hidden="true">warning_amber</span>
      <p className="text-sm font-medium text-amber-900 flex-1">
        Có chỉ số sức khỏe cần lưu ý — vui lòng theo dõi sát và thông báo cho{' '}
        <span className="font-semibold">{memberName}</span> hoặc bác sĩ nếu triệu chứng kéo dài.
      </p>
      <Button asChild variant="ghost" size="sm" className="shrink-0 h-8 px-3 text-xs text-amber-800 hover:bg-amber-100 border border-amber-300">
        <Link href="#vitals-section">Xem chi tiết</Link>
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Quick action task cards
   ═══════════════════════════════════════════════════ */

interface TaskItem { icon: string; label: string; href: string; color: string }

export function MemberQuickActionTasks({ memberId, allergies, severeNames, chronicStr }: {
  memberId: string;
  allergies: PatientAllergyDto[];
  severeNames: string[];
  chronicStr: string;
}) {
  const tasks: TaskItem[] = [];

  if (chronicStr) {
    tasks.push({
      icon: 'medication',
      label: 'Danh sách thuốc đang dùng',
      href: `/family/prescriptions?patientId=${memberId}`,
      color: 'emerald',
    });
  }

  if (severeNames.length > 0) {
    tasks.push({
      icon: 'warning',
      label: `Dị ứng nặng: ${severeNames.join(', ')}`,
      href: '#pathology-tab',
      color: 'rose',
    });
  } else if (allergies.length > 0) {
    tasks.push({
      icon: 'local_pharmacy',
      label: `Đã khai báo ${allergies.length} dị ứng`,
      href: '#pathology-tab',
      color: 'amber',
    });
  }

  if (tasks.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tasks.map(t => {
        const c = TASK_COLORS[t.color] ?? TASK_COLORS.amber;
        return (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-xl border ${c.border} ${c.bg} px-4 py-3 flex items-center gap-3 hover:ring-2 ${c.ringHover} transition-all group`}
          >
            <span className={`size-9 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-[20px] text-slate-700" aria-hidden="true">{t.icon}</span>
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${c.text}`}>{t.label}</p>
              <p className={`text-xs ${c.text} opacity-60 group-hover:opacity-100 transition-opacity`}>Xem chi tiết →</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Empty vital-signs state
   ═══════════════════════════════════════════════════ */

export function MemberEmptyVitalsState({ memberName }: { memberName: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center">
      <span className="material-symbols-outlined text-[26px] text-slate-400 mb-1" aria-hidden="true">monitor_heart</span>
      <p className="text-sm font-semibold text-slate-700">Chưa có chỉ số sinh hiệu được ghi nhận</p>
      <p className="text-xs text-slate-500 mt-0.5">
        Nhập chỉ số từ mục &ldquo;Chỉ số sinh hiệu&rdquo; bên dưới để theo dõi sức khỏe của <strong>{memberName}</strong>.
      </p>
    </div>
  );
}
