'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
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
  type GlucoseContext,
  type MeasurementState,
  type VitalSignDto,
} from '@/lib/api';
import {
  computeVitalMetricDeltas,
  getAbnormalMetricSummaries,
  getVitalMetricAlerts,
  VITAL_REFERENCE_LABELS,
  type VitalMetricKey,
} from '../utils/vital-metrics.util';

const VN_TZ = 'Asia/Ho_Chi_Minh';

const GLUCOSE_CONTEXT_OPTIONS: { value: GlucoseContext; label: string }[] = [
  { value: 'FASTING', label: 'Lúc đói' },
  { value: 'BEFORE_MEAL', label: 'Trước ăn' },
  { value: 'AFTER_MEAL', label: 'Sau ăn 2h' },
  { value: 'RANDOM', label: 'Ngẫu nhiên' },
];

const MEASUREMENT_STATE_OPTIONS: { value: MeasurementState; label: string }[] = [
  { value: 'RESTING', label: 'Nghỉ ngơi' },
  { value: 'AFTER_MEDICATION', label: 'Sau uống thuốc' },
  { value: 'AFTER_EXERCISE', label: 'Sau vận động' },
  { value: 'UNWELL', label: 'Đang mệt / khó chịu' },
];

function getGlucoseContextLabel(value?: GlucoseContext | null): string | null {
  if (!value) return null;
  return GLUCOSE_CONTEXT_OPTIONS.find((opt) => opt.value === value)?.label ?? null;
}

function getMeasurementStateLabel(value?: MeasurementState | null): string | null {
  if (!value) return null;
  return MEASUREMENT_STATE_OPTIONS.find((opt) => opt.value === value)?.label ?? null;
}

type ChartMetricKey = 'bp' | 'spo2' | 'bloodGlucose' | 'temperature';

const METRIC_OPTIONS: { key: ChartMetricKey; label: string; unit: string }[] = [
  { key: 'bp', label: 'Huyết áp', unit: 'mmHg' },
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

function formatBpDisplay(v: VitalSignDto): string {
  if (v.systolicBp != null && v.diastolicBp != null) {
    return `${v.systolicBp}/${v.diastolicBp}`;
  }
  if (v.systolicBp != null) return `${v.systolicBp}`;
  if (v.diastolicBp != null) return `${v.diastolicBp}`;
  return '--';
}

function formatMetricSummary(v: VitalSignDto): string {
  const parts: string[] = [];
  if (v.systolicBp != null || v.diastolicBp != null) {
    parts.push(`HA ${formatBpDisplay(v)} mmHg`);
  }
  if (v.spo2 != null) parts.push(`SpO2 ${v.spo2}%`);
  if (v.temperature != null) parts.push(`${v.temperature}°C`);
  if (v.bloodGlucose != null) parts.push(`ĐH ${v.bloodGlucose} mmol/L`);
  return parts.join(' • ') || 'Chưa có thông số';
}

export interface MemberVitalSignsSectionProps {
  memberId: string;
  memberName: string;
  memberHref?: string;
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
  memberHref,
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
  const [formError, setFormError] = useState<string | null>(null);

  const [systolicInput, setSystolicInput] = useState('');
  const [temperatureInput, setTemperatureInput] = useState('');
  const [spo2Input, setSpo2Input] = useState('');
  const [bloodGlucoseInput, setBloodGlucoseInput] = useState('');
  const [glucoseContextInput, setGlucoseContextInput] = useState<GlucoseContext | ''>('');
  const [measurementStateInput, setMeasurementStateInput] = useState<MeasurementState | ''>('RESTING');
  const [notesInput, setNotesInput] = useState('');

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
          spo2: v.spo2 ?? undefined,
          bloodGlucose: v.bloodGlucose ?? undefined,
          temperature: v.temperature ?? undefined,
        })),
    [filteredRangeDesc]
  );

  const openCreateModal = () => {
    setEditingVital(null);
    setFormError(null);
    setSystolicInput('');
    setTemperatureInput('');
    setSpo2Input('');
    setBloodGlucoseInput('');
    setGlucoseContextInput('');
    setMeasurementStateInput('RESTING');
    setNotesInput('');
    setShowVitalModal(true);
  };

  const openEditModal = (vital: VitalSignDto) => {
    setEditingVital(vital);
    setFormError(null);
    setSystolicInput(vital.systolicBp != null ? String(vital.systolicBp) : '');
    setTemperatureInput(vital.temperature != null ? String(vital.temperature) : '');
    setSpo2Input(vital.spo2 != null ? String(vital.spo2) : '');
    setBloodGlucoseInput(vital.bloodGlucose != null ? String(vital.bloodGlucose) : '');
    setGlucoseContextInput(vital.glucoseContext ?? '');
    setMeasurementStateInput(vital.measurementState ?? '');
    setNotesInput(vital.notes ?? '');
    setShowVitalModal(true);
  };

  const draftMetricSnapshot = useMemo(() => {
    const toNum = (raw: string): number | undefined => {
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    return {
      systolicBp: toNum(systolicInput),
      temperature: toNum(temperatureInput),
      spo2: toNum(spo2Input),
      bloodGlucose: toNum(bloodGlucoseInput),
    };
  }, [systolicInput, temperatureInput, spo2Input, bloodGlucoseInput]);

  const enteredMetricCount = useMemo(
    () => Object.values(draftMetricSnapshot).filter((v) => v !== undefined).length,
    [draftMetricSnapshot]
  );

  const liveModalAlerts = useMemo(
    () => getVitalMetricAlerts(draftMetricSnapshot),
    [draftMetricSnapshot]
  );

  const liveAbnormalSummaries = useMemo(
    () => getAbnormalMetricSummaries(draftMetricSnapshot),
    [draftMetricSnapshot]
  );

  const handleVitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload: CreateVitalSignDto = {};
    if (systolicInput.trim()) payload.systolicBp = Number(systolicInput.trim());
    if (temperatureInput.trim()) payload.temperature = Number(temperatureInput.trim());
    if (spo2Input.trim()) payload.spo2 = Number(spo2Input.trim());
    if (bloodGlucoseInput.trim()) payload.bloodGlucose = Number(bloodGlucoseInput.trim());
    if (glucoseContextInput) payload.glucoseContext = glucoseContextInput;
    if (measurementStateInput) payload.measurementState = measurementStateInput;
    if (notesInput.trim()) payload.notes = notesInput.trim();

    const metricKeys: (keyof CreateVitalSignDto)[] = [
      'systolicBp',
      'temperature',
      'spo2',
      'bloodGlucose',
    ];
    const hasMetric = metricKeys.some((k) => Number.isFinite(payload[k] as number));
    if (!hasMetric) {
      setFormError('Vui lòng nhập ít nhất một chỉ số sức khỏe.');
      return;
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
            Theo dõi huyết áp, SpO2, nhiệt độ và đường huyết hằng ngày của {memberName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {memberHref && (
            <Button asChild variant="outline">
              <Link href={memberHref}>Mở hồ sơ y bạ</Link>
            </Button>
          )}
          <Button
            type="button"
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <span className="material-symbols-outlined text-[18px]">add_chart</span>
            <span>Nhập chỉ số hôm nay</span>
          </Button>
        </div>
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
                          className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Xóa chỉ số lúc ${formatVnTime(item.recordedAt)}`}
                          onClick={() => setDeletingVital(item)}
                          className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
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
        {/* Top row — Title + Metric selectors + Range buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Left — Section title (desktop only) */}
          <span className="hidden lg:block text-sm font-bold text-slate-800 shrink-0 w-44 truncate">
            Biểu đồ xu hướng
          </span>

          {/* Middle — Metric type tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveMetric(opt.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-none ${
                  activeMetric === opt.key
                    ? 'bg-[#2E37A4] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Right — Range toggle pills */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 self-start lg:self-center">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRangeDays(d)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  rangeDays === d
                    ? 'bg-indigo-50 text-[#2E37A4] shadow-sm'
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
            <div className="w-full min-w-0 h-72 rounded-xl border border-slate-200 bg-white p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    unit={
                      activeMetric === 'bp'
                        ? ' mmHg'
                        : activeMetric === 'spo2'
                          ? '%'
                          : activeMetric === 'temperature'
                            ? '°C'
                            : ''
                    }
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {activeMetric === 'bp' && (
                    <ReferenceLine
                      y={140}
                      stroke="#e11d48"
                      strokeDasharray="4 4"
                      label={{ value: 'Ngưỡng 140', position: 'insideTopRight', fontSize: 10, fill: '#e11d48' }}
                    />
                  )}
                  {activeMetric === 'spo2' && (
                    <ReferenceLine
                      y={95}
                      stroke="#e11d48"
                      strokeDasharray="4 4"
                      label={{ value: 'Ngưỡng 95%', position: 'insideBottomRight', fontSize: 10, fill: '#e11d48' }}
                    />
                  )}
                  {activeMetric === 'temperature' && (
                    <ReferenceLine
                      y={38}
                      stroke="#e11d48"
                      strokeDasharray="4 4"
                      label={{ value: 'Sốt 38°C', position: 'insideTopRight', fontSize: 10, fill: '#e11d48' }}
                    />
                  )}
                  {activeMetric === 'bp' ? (
                    <Line
                      type="monotone"
                      dataKey="systolicBp"
                      name="Huyết áp (mmHg)"
                      stroke="#2E37A4"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
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
                        <div>{formatVnFullDate(v.recordedAt)} • {formatVnTime(v.recordedAt)}</div>
                        {(getMeasurementStateLabel(v.measurementState) || v.notes) && (
                          <div className="mt-0.5 text-[11px] font-normal text-slate-500 max-w-[200px] truncate">
                            {[getMeasurementStateLabel(v.measurementState), v.notes].filter(Boolean).join(' — ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-semibold">
                        {formatBpDisplay(v)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {v.spo2 != null ? `${v.spo2}%` : '--'}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {v.temperature != null ? `${v.temperature}°C` : '--'}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {v.bloodGlucose != null ? (
                          <div>
                            <span>{v.bloodGlucose} mmol/L</span>
                            {getGlucoseContextLabel(v.glucoseContext) && (
                              <span className="block text-[11px] text-slate-500">
                                {getGlucoseContextLabel(v.glucoseContext)}
                              </span>
                            )}
                          </div>
                        ) : (
                          '--'
                        )}
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
                  {(getMeasurementStateLabel(v.measurementState) ||
                    getGlucoseContextLabel(v.glucoseContext) ||
                    v.notes) && (
                    <p className="text-[11px] text-slate-500">
                      {[
                        getMeasurementStateLabel(v.measurementState),
                        getGlucoseContextLabel(v.glucoseContext)
                          ? `Đường huyết: ${getGlucoseContextLabel(v.glucoseContext)}`
                          : null,
                        v.notes,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                  {!v.emrId && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(v)}
                        className="h-8 px-3 text-xs"
                      >
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingVital(v)}
                        className="h-8 px-3 text-xs text-rose-600 hover:text-rose-700"
                      >
                        Xóa
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Vital Sign Dialog */}
      <Dialog open={showVitalModal} onOpenChange={setShowVitalModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-white shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingVital ? 'Chỉnh sửa chỉ số sức khỏe' : 'Nhập chỉ số sức khỏe hôm nay'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Nhập tối thiểu một chỉ số đo được cho{' '}
              <span className="font-semibold text-slate-700">{memberName}</span>. Hệ thống tự động
              kiểm tra ngưỡng cảnh báo theo thời gian thực.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVitalSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {formError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
                >
                  {formError}
                </p>
              )}

              {/* Live Threshold Status Banner */}
              {liveAbnormalSummaries.length > 0 ? (
                <div
                  role="status"
                  className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 flex items-start gap-2.5"
                >
                  <span className="material-symbols-outlined text-[18px] text-rose-600 mt-0.5 shrink-0">
                    warning
                  </span>
                  <div className="text-xs text-rose-800">
                    <span className="font-semibold">Phát hiện chỉ số vượt ngưỡng an toàn: </span>
                    <span>{liveAbnormalSummaries.join(' • ')}</span>
                  </div>
                </div>
              ) : enteredMetricCount > 0 ? (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2 flex items-center gap-2 text-xs text-emerald-800"
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-600 shrink-0">
                    check_circle
                  </span>
                  <span>
                    Các chỉ số đã nhập ({enteredMetricCount}) đang nằm trong ngưỡng an toàn.
                  </span>
                </div>
              ) : null}

              {/* Group 1: Tim mạch & Hô hấp */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-rose-600">
                      favorite
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Tim mạch &amp; Hô hấp</h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Ưu tiên theo dõi hằng ngày
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Single Blood Pressure Input */}
                  <div
                    className={`rounded-lg border p-3.5 space-y-1.5 transition-colors ${
                      liveModalAlerts.bp.abnormal
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="vital-bp" className="text-xs font-semibold text-slate-800">
                        Huyết áp (mmHg)
                      </Label>
                      <span className="text-[11px] text-slate-500 tabular-nums">90–139 mmHg</span>
                    </div>
                    <Input
                      id="vital-bp"
                      type="number"
                      min={40}
                      max={300}
                      value={systolicInput}
                      onChange={(e) => setSystolicInput(e.target.value)}
                      placeholder="VD: 120"
                      className="bg-white tabular-nums"
                    />
                    {liveModalAlerts.bp.abnormal && liveModalAlerts.bp.message && (
                      <p className="text-[11px] font-medium text-rose-700">
                        {liveModalAlerts.bp.message}
                      </p>
                    )}
                  </div>

                  {/* SpO2 */}
                  <div
                    className={`rounded-lg border p-3.5 space-y-1.5 transition-colors ${
                      liveModalAlerts.spo2.abnormal
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="vital-spo2" className="text-xs font-semibold text-slate-800">
                        SpO2 (%)
                      </Label>
                      <span className="text-[11px] text-slate-500 tabular-nums">&gt;= 95%</span>
                    </div>
                    <Input
                      id="vital-spo2"
                      type="number"
                      min={50}
                      max={100}
                      value={spo2Input}
                      onChange={(e) => setSpo2Input(e.target.value)}
                      placeholder="VD: 98"
                      className="bg-white tabular-nums"
                    />
                    {liveModalAlerts.spo2.abnormal && liveModalAlerts.spo2.message && (
                      <p className="text-[11px] font-medium text-rose-700">
                        {liveModalAlerts.spo2.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 2: Thân nhiệt & Đường huyết */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">
                    thermostat
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Thân nhiệt &amp; Đường huyết</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`rounded-lg border p-3.5 space-y-1.5 transition-colors ${
                      liveModalAlerts.temperature.abnormal
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="vital-temp" className="text-xs font-semibold text-slate-800">
                        Nhiệt độ (°C)
                      </Label>
                      <span className="text-[11px] text-slate-500 tabular-nums">35.5–37.9 °C</span>
                    </div>
                    <Input
                      id="vital-temp"
                      type="number"
                      step="0.1"
                      min={30}
                      max={45}
                      value={temperatureInput}
                      onChange={(e) => setTemperatureInput(e.target.value)}
                      placeholder="VD: 36.7"
                      className="bg-white tabular-nums"
                    />
                    {liveModalAlerts.temperature.abnormal &&
                      liveModalAlerts.temperature.message && (
                        <p className="text-[11px] font-medium text-rose-700">
                          {liveModalAlerts.temperature.message}
                        </p>
                      )}
                  </div>

                  <div
                    className={`rounded-lg border p-3.5 space-y-2 transition-colors ${
                      liveModalAlerts.bloodGlucose.abnormal
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label
                        htmlFor="vital-glucose"
                        className="text-xs font-semibold text-slate-800"
                      >
                        Đường huyết (mmol/L)
                      </Label>
                      <span className="text-[11px] text-slate-500 tabular-nums">3.9–11.0 mmol/L</span>
                    </div>
                    <Input
                      id="vital-glucose"
                      type="number"
                      step="0.1"
                      min={1}
                      max={40}
                      value={bloodGlucoseInput}
                      onChange={(e) => setBloodGlucoseInput(e.target.value)}
                      placeholder="VD: 5.5"
                      className="bg-white tabular-nums"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {GLUCOSE_CONTEXT_OPTIONS.map((opt) => {
                        const selected = glucoseContextInput === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setGlucoseContextInput(selected ? '' : opt.value)
                            }
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                              selected
                                ? 'border-[#2E37A4] bg-[#2E37A4] text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {liveModalAlerts.bloodGlucose.abnormal &&
                      liveModalAlerts.bloodGlucose.message && (
                        <p className="text-[11px] font-medium text-rose-700">
                          {liveModalAlerts.bloodGlucose.message}
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Group 3: Bối cảnh đo & Ghi chú */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">
                      clinical_notes
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Bối cảnh đo &amp; Ghi chú</h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Tự động ghi nhận theo giờ hiện tại
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-800">
                    Trạng thái cơ thể khi đo
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {MEASUREMENT_STATE_OPTIONS.map((opt) => {
                      const selected = measurementStateInput === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setMeasurementStateInput(selected ? '' : opt.value)
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            selected
                              ? 'border-[#2E37A4] bg-[#2E37A4] text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vital-notes" className="text-xs font-semibold text-slate-800">
                    Ghi chú triệu chứng / hoàn cảnh (không bắt buộc)
                  </Label>
                  <textarea
                    id="vital-notes"
                    rows={2}
                    maxLength={500}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="VD: Đo sau khi nghỉ ngơi 10 phút, hơi chóng mặt nhẹ..."
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-xs text-slate-500 text-center sm:text-left">
                {enteredMetricCount > 0
                  ? `Đã nhập ${enteredMetricCount} chỉ số`
                  : 'Chưa nhập chỉ số nào'}
              </span>
              <div className="flex items-center justify-end gap-2">
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
                  {isSubmittingVital
                    ? 'Đang lưu...'
                    : editingVital
                      ? 'Cập nhật chỉ số'
                      : 'Lưu chỉ số'}
                </Button>
              </div>
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
