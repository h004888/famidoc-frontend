'use client';

import * as MP from '../utils/member-profile.util';

/* ═══════════════════════════════════════════════════
   Metric card item
   ═══════════════════════════════════════════════════ */

function MetricCardItem({ label, value, unit, icon, normal, warningText }: {
  label: string; value: string; unit: string; icon: string; normal: boolean; warningText?: string;
}) {
  return (
    <div className={`rounded-xl border p-3 transition-all ${
      normal
        ? 'border-slate-200 bg-white hover:border-slate-300'
        : 'border-rose-200 bg-rose-50/60 hover:bg-rose-50/80'
    }`}>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <span className="material-symbols-outlined text-[16px] text-slate-400" aria-hidden="true">{icon}</span>
        {!normal && (
          <span className="rounded-full bg-rose-200/70 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 leading-none">
            Cảnh báo
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold tabular-nums leading-none ${!normal ? 'text-rose-700' : 'text-slate-900'}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-slate-500 font-normal">{unit}</span>}
      </div>
      <p className={`text-[11px] mt-0.5 leading-snug ${
        normal ? 'text-slate-500' : 'text-rose-700 font-medium'
      }`}>
        {label}: {normal ? 'Trong ngưỡng' : warningText || 'Vượt ngưỡng tham chiếu'}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Health metrics cards — BP, HR, SpO2, Temp
   ═══════════════════════════════════════════════════ */

export function HealthMetricsCards({ parsedVitals }: { parsedVitals: MP.ParsedVitals | null }) {
  if (!parsedVitals) return null;

  const sysHigh = (parsedVitals.systolicBp ?? 0) > 140;
  const diaHigh = (parsedVitals.diastolicBp ?? 0) > 90;

  return (
    <section aria-label="Chỉ số sinh hiệu gần nhất" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-3">
          Chỉ số sức khỏe gần nhất
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCardItem
            label="Huyết áp"
            value={MP.bpText(parsedVitals)}
            unit=""
            icon="pulse_alert"
            normal={!sysHigh && !diaHigh}
            warningText={sysHigh ? 'Tâm thu cao' : diaHigh ? 'Tâm trương cao' : undefined}
          />
          <MetricCardItem
            label="SpO2"
            value={parsedVitals.spo2 != null ? `${parsedVitals.spo2}%` : '--'}
            unit=""
            icon="oxygen"
            normal={parsedVitals.spo2 == null || parsedVitals.spo2 >= 95}
            warningText={parsedVitals.spo2 != null && parsedVitals.spo2 < 95 ? 'Thiếu oxy máu' : undefined}
          />
          <MetricCardItem
            label="Nhiệt độ"
            value={parsedVitals.temperature != null ? `${parsedVitals.temperature}°C` : '--'}
            unit=""
            icon="thermostat"
            normal={parsedVitals.temperature == null || parsedVitals.temperature <= 37.5}
            warningText={
              parsedVitals.temperature != null && parsedVitals.temperature > 38
                ? `Sốt ${parsedVitals.temperature}°C`
                : undefined
            }
          />
        </div>
      </div>
    </section>
  );
}
