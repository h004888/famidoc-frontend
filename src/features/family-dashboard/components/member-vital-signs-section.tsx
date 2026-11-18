'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  extractErrorMessage,
  patientsApi,
  type CreateVitalSignDto,
  type VitalSignDto,
} from '@/lib/api';
import {
  computeVitalMetricDeltas,
  getVitalMetricAlerts,
  VITAL_REFERENCE_LABELS,
  type VitalMetricKey,
} from '../utils/vital-metrics.util';

const VN_TZ = 'Asia/Ho_Chi_Minh';

type ChartMetricKey = 'bp' | 'heartRate' | 'spo2' | 'bloodGlucose' | 'temperature';

const METRIC_OPTIONS: { key: ChartMetricKey; label: string; unit: string }[] = [
  { key: 'bp', label: 'Huyết áp', unit: 'mmHg' },
  { key: 'heartRate', label: 'Nhịp tim', unit: 'bpm' },
  { key: 'spo2', label: 'SpO2', unit: '%' },
  { key: 'bloodGlucose', label: 'Đường huyết', unit: 'mmol/L' },
  { key: 'temperature', label: 'Nhiệt độ', unit: '°C' },
];

function getVnDateKey(rawIso: string): string {
  const parsed = new Date(rawIso);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: VN_TZ }).format(parsed);
}

function formatVnTime(rawIso: string): string {
  const parsed = new Date(rawIso);
  if (Number.isNaN(parsed.getTime())) return '--:--';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VN_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
}

function formatVnShortDateTime(rawIso: string): string {
  const parsed = new Date(rawIso);
  if (Number.isNaN(parsed.getTime())) return rawIso;
  const datePart = getVnDateKey(rawIso);
  const [, mm, dd] = datePart.split('-');
  return `${dd}/${mm} ${formatVnTime(rawIso)}`;
}

function formatVnFullDate(rawIso: string): string {
  const datePart = getVnDateKey(rawIso);
  if (!datePart) return rawIso;
  const [yyyy, mm, dd] = datePart.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function toVnDateTimeLocalInput(rawIso?: string): string {
  const target = rawIso ? new Date(rawIso) : new Date();
  const safe = Number.isNaN(target.getTime()) ? new Date() : target;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(safe);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  const hour = map.hour === '24' ? '00' : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

function fromVnDateTimeLocalInput(localVal: string): string | undefined {
  if (!localVal.trim()) return undefined;
  const parsed = new Date(`${localVal.trim()}:00+07:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function formatBpDisplay(v: VitalSignDto): string {
  if (v.systolicBp != null && v.diastolicBp != null) {
    return `${v.systolicBp}/${v.diastolicBp}`;
  }
  if (v.systolicBp != null) return `${v.systolicBp}/--`;
  if (v.diastolicBp != null) return `--/${v.diastolicBp}`;
  return '--';
}

function formatMetricSummary(v: VitalSignDto): string {
  const parts: string[] = [];
  if (v.systolicBp != null || v.diastolicBp != null) {
    parts.push(`HA ${formatBpDisplay(v)} mmHg`);
  }
  if (v.heartRate != null) parts.push(`Nhịp tim ${v.heartRate} bpm`);
  if (v.spo2 != null) parts.push(`SpO2 ${v.spo2}%`);
  if (v.temperature != null) parts.push(`${v.temperature}°C`);
  if (v.bloodGlucose != null) parts.push(`ĐH ${v.bloodGlucose} mmol/L`);
  if (v.respiratoryRate != null) parts.push(`Nhịp thở ${v.respiratoryRate}/ph`);
  return parts.join(' • ') || 'Chưa có thông số';
}

export interface MemberVitalSignsSectionProps {
  memberId: string;
  memberName: string;
  vitalSigns: VitalSignDto[];
  onVitalAdded: (vital: VitalSignDto) => void;
  onVitalUpdated: (vital: VitalSignDto) => void;
  onVitalDeleted: (vitalId: string) => void;
}

/**
 * Daily & multi-day vital signs dashboard block backed by /patients/:id/vital-signs.
 */
export function MemberVitalSignsSection({
  memberId,
  memberName,
  vitalSigns,
  onVitalAdded,
  onVitalUpdated,
  onVitalDeleted,
}: MemberVitalSignsSectionProps) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [activeMetric, setActiveMetric] = useState<ChartMetricKey>('bp');

  const [showVitalModal, setShowVitalModal] = useState(false);
  const [editingVital, setEditingVital] = useState<VitalSignDto | null>(null);
  const [isSubmittingVital, setIsSubmittingVital] = useState(false);

  const [systolicInput, setSystolicInput] = useState('');
  const [diastolicInput, setDiastolicInput] = useState('');
  const [heartRateInput, setHeartRateInput] = useState('');
  const [temperatureInput, setTemperatureInput] = useState('');
  const [spo2Input, setSpo2Input] = useState('');
  const [respiratoryRateInput, setRespiratoryRateInput] = useState('');
  const [bloodGlucoseInput, setBloodGlucoseInput] = useState('');
  const [recordedAtInput, setRecordedAtInput] = useState('');

  const [deletingVital, setDeletingVital] = useState<VitalSignDto | null>(null);
  const [isDeletingVital, setIsDeletingVital] = useState(false);
  const [referenceNow] = useState<number>(() => Date.now());

  const todayKey = getVnDateKey(new Date(referenceNow).toISOString());

  const sortedDesc = useMemo(
    () =>
      [...vitalSigns].sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      ),
    [vitalSigns]
  );

  const todayReadingsAsc = useMemo(
    () =>
      sortedDesc
        .filter((v) => getVnDateKey(v.recordedAt) === todayKey)
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [sortedDesc, todayKey]
  );

  const latestToday =
    todayReadingsAsc.length > 0 ? todayReadingsAsc[todayReadingsAsc.length - 1] : null;

  const previousBeforeLatestToday = useMemo(() => {
    if (!latestToday) return null;
    const latestIdx = sortedDesc.findIndex((v) => v.id === latestToday.id);
    if (latestIdx < 0) return null;
    return sortedDesc[latestIdx + 1] ?? null;
  }, [latestToday, sortedDesc]);

  const latestAlerts = useMemo(() => getVitalMetricAlerts(latestToday), [latestToday]);
  const latestDeltas = useMemo(
    () => computeVitalMetricDeltas(latestToday, previousBeforeLatestToday),
    [latestToday, previousBeforeLatestToday]
  );

  const todayMetricCards: {
    key: VitalMetricKey;
    label: string;
    value: string;
    unit: string;
  }[] = latestToday
    ? [
        { key: 'bp', label: 'Huyết áp', value: formatBpDisplay(latestToday), unit: 'mmHg' },
        {
          key: 'heartRate',
          label: 'Nhịp tim',
          value: latestToday.heartRate != null ? String(latestToday.heartRate) : '--',
          unit: 'bpm',
        },
        {
          key: 'spo2',
          label: 'SpO2',
          value: latestToday.spo2 != null ? String(latestToday.spo2) : '--',
          unit: '%',
        },
        {
          key: 'temperature',
          label: 'Nhiệt độ',
          value: latestToday.temperature != null ? String(latestToday.temperature) : '--',
          unit: '°C',
        },
        {
          key: 'bloodGlucose',
          label: 'Đường huyết',
          value: latestToday.bloodGlucose != null ? String(latestToday.bloodGlucose) : '--',
          unit: 'mmol/L',
        },
        {
          key: 'respiratoryRate',
          label: 'Nhịp thở',
          value: latestToday.respiratoryRate != null ? String(latestToday.respiratoryRate) : '--',
          unit: 'lần/ph',
        },
      ]
    : [];

  const filteredRangeDesc = useMemo(() => {
    const cutoff = referenceNow - rangeDays * 86_400_000;
    return sortedDesc.filter((v) => {
      const ts = new Date(v.recordedAt).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    });
  }, [sortedDesc, rangeDays, referenceNow]);

  const chartData = useMemo(
    () =>
      [...filteredRangeDesc]
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        .map((v) => ({
          id: v.id,
          label: formatVnShortDateTime(v.recordedAt),
          systolicBp: v.systolicBp ?? undefined,
          diastolicBp: v.diastolicBp ?? undefined,
          heartRate: v.heartRate ?? undefined,
          spo2: v.spo2 ?? undefined,
          bloodGlucose: v.bloodGlucose ?? undefined,
          temperature: v.temperature ?? undefined,
        })),
    [filteredRangeDesc]
  );

  const openCreateModal = () => {
    setEditingVital(null);
    setSystolicInput('');
    setDiastolicInput('');
    setHeartRateInput('');
    setTemperatureInput('');
    setSpo2Input('');
    setRespiratoryRateInput('');
    setBloodGlucoseInput('');
    setRecordedAtInput(toVnDateTimeLocalInput());
    setShowVitalModal(true);
  };

  const openEditModal = (vital: VitalSignDto) => {
    setEditingVital(vital);
    setSystolicInput(vital.systolicBp != null ? String(vital.systolicBp) : '');
    setDiastolicInput(vital.diastolicBp != null ? String(vital.diastolicBp) : '');
    setHeartRateInput(vital.heartRate != null ? String(vital.heartRate) : '');
    setTemperatureInput(vital.temperature != null ? String(vital.temperature) : '');
    setSpo2Input(vital.spo2 != null ? String(vital.spo2) : '');
    setRespiratoryRateInput(vital.respiratoryRate != null ? String(vital.respiratoryRate) : '');
    setBloodGlucoseInput(vital.bloodGlucose != null ? String(vital.bloodGlucose) : '');
    setRecordedAtInput(toVnDateTimeLocalInput(vital.recordedAt));
    setShowVitalModal(true);
  };

  const handleVitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateVitalSignDto = {};
    if (systolicInput.trim()) payload.systolicBp = Number(systolicInput.trim());
    if (diastolicInput.trim()) payload.diastolicBp = Number(diastolicInput.trim());
    if (heartRateInput.trim()) payload.heartRate = Number(heartRateInput.trim());
    if (temperatureInput.trim()) payload.temperature = Number(temperatureInput.trim());
    if (spo2Input.trim()) payload.spo2 = Number(spo2Input.trim());
    if (respiratoryRateInput.trim()) payload.respiratoryRate = Number(respiratoryRateInput.trim());
    if (bloodGlucoseInput.trim()) payload.bloodGlucose = Number(bloodGlucoseInput.trim());

    const hasMetric = Object.keys(payload).some((k) => Number.isFinite(payload[k as keyof CreateVitalSignDto] as number));
    if (!hasMetric) {
      toast.error('Vui lòng nhập ít nhất một chỉ số sức khỏe.');
      return;
    }

    const isoRecordedAt = fromVnDateTimeLocalInput(recordedAtInput);
    if (isoRecordedAt) {
      payload.recordedAt = isoRecordedAt;
    }

    setIsSubmittingVital(true);
    try {
      if (editingVital) {
        const updated = await patientsApi.updateMemberVitalSign(memberId, editingVital.id, payload);
        onVitalUpdated(updated);
        toast.success('Đã cập nhật chỉ số sức khỏe.');
      } else {
        const created = await patientsApi.addMemberVitalSign(memberId, payload);
        onVitalAdded(created);
        toast.success(
          created.isAbnormalAlert
            ? 'Đã lưu chỉ số — phát hiện chỉ số vượt ngưỡng cần lưu ý!'
            : 'Đã lưu chỉ số sức khỏe hôm nay.'
        );
      }
      setShowVitalModal(false);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể lưu chỉ số sinh tồn.'));
    } finally {
      setIsSubmittingVital(false);
    }
  };

  const handleConfirmDeleteVital = async () => {
    if (!deletingVital) return;
    setIsDeletingVital(true);
    try {
      await patientsApi.deleteMemberVitalSign(memberId, deletingVital.id);
      onVitalDeleted(deletingVital.id);
      toast.success('Đã xóa bản ghi chỉ số sinh tồn.');
      setDeletingVital(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể xóa bản ghi chỉ số sinh tồn.'));
    } finally {
      setIsDeletingVital(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-rose-600">
              monitor_heart
            </span>
            <span>Chỉ số sức khỏe hôm nay &amp; Xu hướng</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi huyết áp, nhịp tim, SpO2, nhiệt độ và đường huyết hằng ngày của {memberName}.
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreateModal}
          className="bg-[#2E37A4] hover:bg-[#222982] text-white"
        >
          <span className="material-symbols-outlined text-[18px]">add_chart</span>
          <span>Nhập chỉ số hôm nay</span>
        </Button>
      </div>

      {/* Latest Today Card + Today's Readings Log */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Latest Today Card */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Chỉ số mới nhất hôm nay</span>
              {latestToday && (
                <span className="text-xs text-slate-500">
                  Lúc {formatVnTime(latestToday.recordedAt)}
                </span>
              )}
            </div>
            {latestToday &&
              (latestToday.isAbnormalAlert ? (
                <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50">
                  Cảnh báo chỉ số bất thường
                </Badge>
              ) : (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                  Trong ngưỡng ổn định
                </Badge>
              ))}
          </div>

          {latestToday ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {todayMetricCards.map((card) => {
                const metricAlert = latestAlerts[card.key];
                const metricDelta = latestDeltas[card.key];
                const deltaIcon =
                  metricDelta.direction === 'up'
                    ? 'trending_up'
                    : metricDelta.direction === 'down'
                      ? 'trending_down'
                      : 'trending_flat';
                return (
                  <div
                    key={card.key}
                    data-testid={`vital-card-${card.key}`}
                    data-abnormal={metricAlert.abnormal ? 'true' : 'false'}
                    className={`rounded-xl border p-3 transition-colors ${
                      metricAlert.abnormal
                        ? 'border-rose-300 bg-rose-50/70'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-[11px] font-medium text-slate-600">{card.label}</p>
                      {metricAlert.abnormal && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                          Vượt ngưỡng
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-lg font-bold tabular-nums mt-0.5 ${
                        metricAlert.abnormal ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {card.value}{' '}
                      <span className="text-xs font-normal text-slate-500">{card.unit}</span>
                    </p>
                    <p
                      className={`mt-1 text-[11px] leading-snug ${
                        metricAlert.abnormal ? 'font-medium text-rose-700' : 'text-slate-500'
                      }`}
                    >
                      {metricAlert.abnormal && metricAlert.message
                        ? metricAlert.message
                        : VITAL_REFERENCE_LABELS[card.key]}
                    </p>
                    {metricDelta.label && (
                      <p
                        className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium tabular-nums ${
                          metricDelta.direction === 'up'
                            ? 'text-amber-700'
                            : metricDelta.direction === 'down'
                              ? 'text-sky-700'
                              : 'text-slate-500'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{deltaIcon}</span>
                        <span>{metricDelta.label}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                Hôm nay chưa có chỉ số sức khỏe nào được ghi nhận
              </p>
              <p className="text-xs text-slate-500">
                Nhấn &ldquo;Nhập chỉ số hôm nay&rdquo; để lưu lần đo huyết áp, SpO2, nhiệt độ hoặc
                đường huyết cho {memberName}.
              </p>
            </div>
          )}
        </div>

        {/* Today's Readings Chronological Log */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Nhật ký đo trong ngày ({todayReadingsAsc.length})
            </h3>
          </div>

          {todayReadingsAsc.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Chưa có lượt đo nào trong ngày hôm nay.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {todayReadingsAsc.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums text-[#2E37A4]">
                        {formatVnTime(item.recordedAt)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {item.emrId ? 'Bác sĩ khám' : 'Gia đình nhập'}
                      </Badge>
                      {item.isAbnormalAlert && (
                        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] hover:bg-rose-50">
                          Bất thường
                        </Badge>
                      )}
                    </div>

                    {!item.emrId && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Sửa chỉ số lúc ${formatVnTime(item.recordedAt)}`}
                          onClick={() => openEditModal(item)}
                          className="p-1 text-slate-500 hover:text-[#2E37A4] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Xóa chỉ số lúc ${formatVnTime(item.recordedAt)}`}
                          onClick={() => setDeletingVital(item)}
                          className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 tabular-nums">
                    {formatMetricSummary(item)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Day Trend Chart & History */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveMetric(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeMetric === opt.key
                    ? 'bg-[#2E37A4] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 self-start">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRangeDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  rangeDays === d
                    ? 'bg-indigo-50 text-[#2E37A4]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d} ngày
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
            Chưa có dữ liệu chỉ số sinh tồn trong {rangeDays} ngày qua.
          </div>
        ) : (
          <>
            <div className="w-full min-w-0 h-60 rounded-xl border border-slate-200 bg-white p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  {activeMetric === 'bp' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="systolicBp"
                        name="Tâm thu (mmHg)"
                        stroke="#2E37A4"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolicBp"
                        name="Tâm trương (mmHg)"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={activeMetric}
                      name={
                        METRIC_OPTIONS.find((m) => m.key === activeMetric)?.label || activeMetric
                      }
                      stroke="#2E37A4"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Desktop History Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Thời gian</th>
                    <th className="px-4 py-2.5">Huyết áp</th>
                    <th className="px-4 py-2.5">Nhịp tim</th>
                    <th className="px-4 py-2.5">SpO2</th>
                    <th className="px-4 py-2.5">Nhiệt độ</th>
                    <th className="px-4 py-2.5">Đường huyết</th>
                    <th className="px-4 py-2.5">Trạng thái</th>
                    <th className="px-4 py-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRangeDesc.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800 tabular-nums">
                        {formatVnFullDate(v.recordedAt)} • {formatVnTime(v.recordedAt)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-semibold">
                        {formatBpDisplay(v)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {v.heartRate != null ? `${v.heartRate} bpm` : '--'}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {v.spo2 != null ? `${v.spo2}%` : '--'}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {v.temperature != null ? `${v.temperature}°C` : '--'}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {v.bloodGlucose != null ? `${v.bloodGlucose} mmol/L` : '--'}
                      </td>
                      <td className="px-4 py-2.5">
                        {v.isAbnormalAlert ? (
                          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] hover:bg-rose-50">
                            Bất thường
                          </Badge>
                        ) : (
                          <span className="text-emerald-700 font-medium">Ổn định</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        {!v.emrId ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(v)}
                              className="h-7 px-2 text-[11px]"
                            >
                              Sửa
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingVital(v)}
                              className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700"
                            >
                              Xóa
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Từ bệnh án bác sĩ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile History Cards */}
            <div className="md:hidden space-y-2.5">
              {filteredRangeDesc.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      {formatVnFullDate(v.recordedAt)} • {formatVnTime(v.recordedAt)}
                    </span>
                    {v.isAbnormalAlert ? (
                      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] hover:bg-rose-50">
                        Bất thường
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-700">Ổn định</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 tabular-nums">
                    {formatMetricSummary(v)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Vital Sign Dialog */}
      <Dialog open={showVitalModal} onOpenChange={setShowVitalModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVital ? 'Chỉnh sửa chỉ số sức khỏe' : 'Nhập chỉ số sức khỏe hôm nay'}
            </DialogTitle>
            <DialogDescription>
              Nhập tối thiểu một chỉ số đo được cho {memberName}. Hệ thống tự động kiểm tra ngưỡng
              cảnh báo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVitalSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vital-sys">Huyết áp tâm thu (mmHg)</Label>
                <Input
                  id="vital-sys"
                  type="number"
                  min={40}
                  max={300}
                  value={systolicInput}
                  onChange={(e) => setSystolicInput(e.target.value)}
                  placeholder="VD: 120"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vital-dia">Huyết áp tâm trương (mmHg)</Label>
                <Input
                  id="vital-dia"
                  type="number"
                  min={30}
                  max={200}
                  value={diastolicInput}
                  onChange={(e) => setDiastolicInput(e.target.value)}
                  placeholder="VD: 80"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vital-hr">Nhịp tim (bpm)</Label>
                <Input
                  id="vital-hr"
                  type="number"
                  min={25}
                  max={250}
                  value={heartRateInput}
                  onChange={(e) => setHeartRateInput(e.target.value)}
                  placeholder="VD: 74"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vital-spo2">SpO2 (%)</Label>
                <Input
                  id="vital-spo2"
                  type="number"
                  min={50}
                  max={100}
                  value={spo2Input}
                  onChange={(e) => setSpo2Input(e.target.value)}
                  placeholder="VD: 98"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vital-temp">Nhiệt độ (°C)</Label>
                <Input
                  id="vital-temp"
                  type="number"
                  step="0.1"
                  min={30}
                  max={45}
                  value={temperatureInput}
                  onChange={(e) => setTemperatureInput(e.target.value)}
                  placeholder="VD: 36.7"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vital-glucose">Đường huyết (mmol/L)</Label>
                <Input
                  id="vital-glucose"
                  type="number"
                  step="0.1"
                  min={1}
                  max={40}
                  value={bloodGlucoseInput}
                  onChange={(e) => setBloodGlucoseInput(e.target.value)}
                  placeholder="VD: 5.5"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vital-resp">Nhịp thở (lần/phút)</Label>
                <Input
                  id="vital-resp"
                  type="number"
                  min={5}
                  max={60}
                  value={respiratoryRateInput}
                  onChange={(e) => setRespiratoryRateInput(e.target.value)}
                  placeholder="VD: 16"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vital-recorded-at">Thời điểm đo</Label>
                <Input
                  id="vital-recorded-at"
                  type="datetime-local"
                  value={recordedAtInput}
                  onChange={(e) => setRecordedAtInput(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVitalModal(false)}
                disabled={isSubmittingVital}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingVital}
                className="bg-[#2E37A4] hover:bg-[#222982] text-white"
              >
                {isSubmittingVital ? 'Đang lưu...' : editingVital ? 'Cập nhật chỉ số' : 'Lưu chỉ số'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Vital Sign Dialog */}
      <Dialog
        open={Boolean(deletingVital)}
        onOpenChange={(open) => {
          if (!open && !isDeletingVital) setDeletingVital(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa chỉ số sinh tồn</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa lần đo lúc{' '}
              {deletingVital ? formatVnTime(deletingVital.recordedAt) : ''} của {memberName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingVital(null)}
              disabled={isDeletingVital}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeleteVital}
              disabled={isDeletingVital}
            >
              {isDeletingVital ? 'Đang xóa...' : 'Xóa lần đo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
