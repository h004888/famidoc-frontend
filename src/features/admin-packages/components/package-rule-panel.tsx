'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import {
  adminPackagesApi,
  type PackageRuleFinding,
  type PackageTerms,
  type PackageValidationResult,
} from '@/lib/api/admin-packages.api';
import { cn } from '@/lib/utils';

// Kết quả kiểm tra quy tắc mà form cần để quyết định có cho lưu hay không.
export interface PackageRuleState {
  result: PackageValidationResult | null;
  acknowledged: string[];
  blocked: boolean;
  missingAck: boolean;
}

// Gọi POST /validate sau khi người dùng ngừng gõ 400 ms; backend là nguồn quy tắc duy nhất.
export function usePackageRules(
  terms: (Omit<PackageTerms, 'quotaPeriod'> & { code?: string }) | null,
  packageId?: string,
) {
  const [result, setResult] = useState<PackageValidationResult | null>(null);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const key = terms ? JSON.stringify(terms) : '';

  useEffect(() => {
    if (!key) {
      setResult(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      adminPackagesApi
        .validatePackage({ ...JSON.parse(key), quotaPeriod: 'PER_TERM', packageId })
        .then((value) => {
          if (!cancelled) setResult(value);
        })
        .catch(() => {
          if (!cancelled) setResult(null);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, packageId]);

  const required = result?.requiresAcknowledgement ?? [];
  const state: PackageRuleState = {
    result,
    acknowledged: acknowledged.filter((code) => required.includes(code)),
    blocked: Boolean(result && !result.ok),
    missingAck: required.some((code) => !acknowledged.includes(code)),
  };
  const toggle = (code: string, checked: boolean) =>
    setAcknowledged((previous) =>
      checked ? [...new Set([...previous, code])] : previous.filter((c) => c !== code),
    );
  return { state, toggle };
}

const gaugeTone = {
  SAFE: { bar: 'bg-emerald-500', text: 'text-emerald-700', label: 'An toàn' },
  WARN: { bar: 'bg-amber-500', text: 'text-amber-700', label: 'Sát trần' },
  OVER: { bar: 'bg-red-500', text: 'text-red-700', label: 'Vượt trần' },
} as const;

const findingStyle = {
  BLOCK: { icon: AlertCircle, box: 'border-red-200 bg-red-50 text-red-800' },
  WARN: { icon: AlertTriangle, box: 'border-amber-200 bg-amber-50 text-amber-900' },
  INFO: { icon: Info, box: 'border-slate-200 bg-slate-50 text-slate-700' },
} as const;

export function PackageRulePanel({
  state,
  onToggle,
  disabled,
}: {
  state: PackageRuleState;
  onToggle: (code: string, checked: boolean) => void;
  disabled?: boolean;
}) {
  const { result } = state;
  if (!result) return null;
  const { load } = result;
  const tone = gaugeTone[load.level];
  // Thang đo tới 8 lượt/tháng để thấy rõ vạch trần 7.
  const width = Math.min(100, (load.visitsPerMonth / 8) * 100);
  const findings = result.findings.filter((f) => f.code !== 'LOAD');

  return (
    <section aria-label="Kiểm tra quy tắc gói" className="space-y-3 rounded-xl border border-slate-200 p-3">
      <div>
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold text-slate-900">Tải lịch</span>
          <span className={cn('font-medium', tone.text)}>
            {load.visitsPerMonth.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} lượt/tháng · {tone.label}
          </span>
        </div>
        <div className="relative mt-2 h-2 rounded-full bg-slate-100" role="meter" aria-valuemin={0} aria-valuemax={8} aria-valuenow={load.visitsPerMonth} aria-label="Lượt khám mỗi tháng của một gia đình">
          <div className={cn('h-2 rounded-full', tone.bar)} style={{ width: `${width}%` }} />
          <div className="absolute inset-y-[-3px] w-px bg-slate-500" style={{ left: `${(7 / 8) * 100}%` }} aria-hidden="true" />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {load.totalVisits}/{load.maxTotalVisits} lượt cả kỳ · 5 gia đình dùng {Math.round(load.doctorUtilization * 100)}% số ca của bác sĩ. Trần 7 lượt/tháng.
        </p>
      </div>
      {findings.length > 0 && (
        <ul className="space-y-2">
          {findings.map((finding) => (
            <FindingRow
              key={finding.code}
              finding={finding}
              checked={state.acknowledged.includes(finding.code)}
              onToggle={onToggle}
              disabled={disabled}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FindingRow({
  finding,
  checked,
  onToggle,
  disabled,
}: {
  finding: PackageRuleFinding;
  checked: boolean;
  onToggle: (code: string, checked: boolean) => void;
  disabled?: boolean;
}) {
  const style = findingStyle[finding.level];
  const Icon = style.icon;
  return (
    <li className={cn('rounded-lg border p-2 text-sm', style.box)}>
      <div className="flex gap-2">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{finding.message}</span>
      </div>
      {finding.level === 'WARN' && (
        <label className="mt-2 flex items-center gap-2 pl-6 text-xs font-medium">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onToggle(finding.code, event.target.checked)}
          />
          Tôi đã hiểu rủi ro và vẫn muốn lưu
        </label>
      )}
    </li>
  );
}
