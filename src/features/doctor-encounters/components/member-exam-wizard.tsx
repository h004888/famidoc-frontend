'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EncounterItem, EncounterPatient } from '@/lib/api/encounters.api';
import {
  medicalBooksApi,
  type BookVisitDetail,
  type VisitVitals,
} from '@/lib/api/medical-books.api';
import { patientAgeMonths } from '@/lib/prescription-rules';
import {
  emptyPrescriptionContext,
  PrescriptionContextFields,
} from './prescription-context-fields';
import { buildClinicalContext } from '../lib/prescription-context';
import { findAllergyConflicts } from '../lib/drug-allergy-check';
import { validateVitals, VITAL_RANGES } from '../lib/vital-ranges';
import type { MemberCompletionSummary } from './visit-completion-summary';

type MedicationType = 'SINGLE_INGREDIENT' | 'COMBINATION' | 'BIOLOGICAL';

interface DraftDrugLine {
  medicationName: string;
  medicationType: MedicationType;
  activeIngredient: string;
  strength: string;
  administrationRoute: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  quantity: string;
  unit: string;
}

const emptyDrugLine = (): DraftDrugLine => ({
  medicationName: '',
  medicationType: 'SINGLE_INGREDIENT',
  activeIngredient: '',
  strength: '',
  administrationRoute: '',
  dosage: '',
  frequency: '',
  durationDays: '',
  quantity: '',
  unit: '',
});

const ICD10_REGEX = /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/i;

function toOptionalNumber(raw: string): number | undefined {
  const n = Number(raw.trim());
  return raw.trim() && Number.isFinite(n) ? n : undefined;
}

function formatAllergies(allergies: EncounterPatient['allergies']): string[] {
  if (!Array.isArray(allergies)) return [];
  return allergies
    .map((item) =>
      typeof item === 'string'
        ? item
        : item?.allergen ?? (item as { allergenName?: string })?.allergenName,
    )
    .filter((item): item is string => Boolean(item && item.trim()));
}

function formatVnDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
}

function initialVitalValue(
  vitals: BookVisitDetail['vitals'],
  key: keyof VisitVitals,
): string {
  if (!vitals || vitals.source !== 'DRAFT') return '';
  const v = vitals[key];
  return v !== undefined && v !== null ? String(v) : '';
}

export interface MemberExamWizardProps {
  encounterId: string;
  encounter: EncounterItem;
  member: EncounterPatient;
  initialVisitDetail?: BookVisitDetail;
  onBackToOverview: () => void;
  onFinalized: (summary: MemberCompletionSummary) => Promise<void> | void;
}

export function MemberExamWizard({
  encounterId,
  encounter,
  member,
  initialVisitDetail,
  onBackToOverview,
  onFinalized,
}: MemberExamWizardProps) {
  const initialVitals = initialVisitDetail?.vitals ?? null;
  const previousVitalsDate =
    initialVitals?.source === 'PREVIOUS' ? formatVnDate(initialVitals.recordedAt) : '';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [chiefComplaint, setChiefComplaint] = useState(
    initialVisitDetail?.exam?.chiefComplaint ?? '',
  );
  const [clinicalFindings, setClinicalFindings] = useState(
    initialVisitDetail?.exam?.clinicalFindings ?? '',
  );
  const [icd10Code, setIcd10Code] = useState(
    initialVisitDetail?.exam?.icd10Code ?? '',
  );
  const [icd10Diagnosis, setIcd10Diagnosis] = useState(
    initialVisitDetail?.exam?.icd10Diagnosis ?? '',
  );
  const [treatmentPlan, setTreatmentPlan] = useState(
    initialVisitDetail?.exam?.treatmentPlan ?? '',
  );

  const [systolicBp, setSystolicBp] = useState(() =>
    initialVitalValue(initialVitals, 'systolicBp'),
  );
  const [diastolicBp, setDiastolicBp] = useState(() =>
    initialVitalValue(initialVitals, 'diastolicBp'),
  );
  const [heartRate, setHeartRate] = useState(() =>
    initialVitalValue(initialVitals, 'heartRate'),
  );
  const [temperature, setTemperature] = useState(() =>
    initialVitalValue(initialVitals, 'temperature'),
  );
  const [spo2, setSpo2] = useState(() =>
    initialVitalValue(initialVitals, 'spo2'),
  );
  const [respiratoryRate, setRespiratoryRate] = useState(() =>
    initialVitalValue(initialVitals, 'respiratoryRate'),
  );
  const [weightKg, setWeightKg] = useState(() =>
    initialVitalValue(initialVitals, 'weightKg'),
  );

  const [includePrescription, setIncludePrescription] = useState(false);
  const [drugs, setDrugs] = useState<DraftDrugLine[]>([emptyDrugLine()]);
  const [prescriptionInstructions, setPrescriptionInstructions] = useState('');
  const [rxContext, setRxContext] = useState(() => ({
    ...emptyPrescriptionContext,
    weightKg: initialVitalValue(initialVitals, 'weightKg'),
  }));
  const [allergyConfirmed, setAllergyConfirmed] = useState(false);

  const [stepError, setStepError] = useState<string | null>(null);
  const [draftFailed, setDraftFailed] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allergies = formatAllergies(member.allergies);

  const buildVitalsPayload = (): VisitVitals => ({
    systolicBp: toOptionalNumber(systolicBp),
    diastolicBp: toOptionalNumber(diastolicBp),
    heartRate: toOptionalNumber(heartRate),
    temperature: toOptionalNumber(temperature),
    spo2: toOptionalNumber(spo2),
    respiratoryRate: toOptionalNumber(respiratoryRate),
    weightKg: toOptionalNumber(weightKg),
  });

  const cleanVitalsPayload = (): VisitVitals | undefined => {
    const raw = buildVitalsPayload();
    const entries = Object.entries(raw).filter(([, v]) => v !== undefined);
    return entries.length > 0 ? (Object.fromEntries(entries) as VisitVitals) : undefined;
  };

  const namedDrugs = useMemo(
    () => drugs.filter((d) => d.medicationName.trim().length > 0),
    [drugs],
  );
  const hasNamedDrugs = namedDrugs.length > 0;

  const allergyConflicts = useMemo(
    () =>
      findAllergyConflicts(
        namedDrugs,
        Array.isArray(member.allergies) ? (member.allergies as any[]) : [],
      ),
    [namedDrugs, member.allergies],
  );

  const visitForContext: BookVisitDetail = useMemo(
    () =>
      initialVisitDetail ?? {
        id: encounterId,
        encounterType: String(encounter.encounterType),
        scheduledDate: encounter.scheduledDate,
        scheduledTime: encounter.scheduledTime,
        doctorName: encounter.doctor?.doctorName ?? '',
        isFinalized: false,
        finalizedAt: null,
        patient: {
          id: member.id,
          fullName: member.fullName,
          dateOfBirth: member.dateOfBirth ?? '',
          relationshipToHead: '',
          familyId: encounter.contract?.familyUnit?.id ?? '',
          gender: member.gender,
        },
        exam: null,
        recipient: encounter.contract?.familyUnit?.representativeUser?.id
          ? {
              id: encounter.contract.familyUnit.representativeUser.id,
              name:
                encounter.contract.familyUnit.representativeUser.fullName ??
                encounter.contract.familyUnit.representativeUser.name ??
                '',
            }
          : null,
        prescription: null,
      },
    [initialVisitDetail, encounterId, encounter, member],
  );

  const saveDraftToDb = async (): Promise<boolean> => {
    setSavingDraft(true);
    setDraftFailed(false);
    try {
      const vitals = cleanVitalsPayload();
      await medicalBooksApi.saveDraft(encounterId, {
        patientId: member.id,
        exam: {
          chiefComplaint: chiefComplaint.trim(),
          clinicalFindings: clinicalFindings.trim(),
          icd10Code: icd10Code.trim().toUpperCase(),
          icd10Diagnosis: icd10Diagnosis.trim(),
          treatmentPlan: treatmentPlan.trim(),
        },
        ...(vitals ? { vitals } : {}),
      });
      return true;
    } catch (err) {
      setDraftFailed(true);
      setStepError(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể lưu nháp hồ sơ khám.',
      );
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  const handleNextFromStep1 = async () => {
    if (!chiefComplaint.trim()) {
      setStepError('Vui lòng nhập lý do khám.');
      return;
    }
    if (!clinicalFindings.trim()) {
      setStepError('Vui lòng nhập kết quả thăm khám.');
      return;
    }
    const vitalErrors = validateVitals(buildVitalsPayload());
    const firstVitalError = Object.values(vitalErrors)[0];
    if (firstVitalError) {
      setStepError(firstVitalError);
      return;
    }
    setStepError(null);
    if (weightKg.trim() && !rxContext.weightKg.trim()) {
      setRxContext((prev) => ({ ...prev, weightKg: weightKg.trim() }));
    }
    const ok = await saveDraftToDb();
    if (ok) setStep(2);
  };

  const handleNextFromStep2 = async () => {
    const code = icd10Code.trim();
    if (!code || !ICD10_REGEX.test(code)) {
      setStepError('Mã ICD-10 không đúng định dạng (ví dụ: I10, J06.9, U07.1).');
      return;
    }
    if (!icd10Diagnosis.trim()) {
      setStepError('Vui lòng nhập chẩn đoán.');
      return;
    }
    if (!treatmentPlan.trim()) {
      setStepError('Vui lòng nhập kế hoạch điều trị.');
      return;
    }
    setStepError(null);
    const ok = await saveDraftToDb();
    if (ok) setStep(3);
  };

  const handleSkipPrescription = () => {
    setIncludePrescription(false);
    setStepError(null);
    setStep(4);
  };

  const validatePrescriptionStep = (): string | null => {
    if (!includePrescription || !hasNamedDrugs) return null;

    for (let i = 0; i < drugs.length; i += 1) {
      const d = drugs[i];
      if (!d.medicationName.trim()) continue;
      const missing: string[] = [];
      if (!d.strength.trim()) missing.push('Hàm lượng');
      if (!d.dosage.trim()) missing.push('Liều mỗi lần');
      if (!d.administrationRoute.trim()) missing.push('Đường dùng');
      if (!d.frequency.trim()) missing.push('Tần suất');
      const days = Number(d.durationDays);
      if (!d.durationDays.trim() || !Number.isFinite(days) || days < 1 || days > 90) {
        missing.push('Số ngày');
      }
      const qty = Number(d.quantity);
      if (!d.quantity.trim() || !Number.isFinite(qty) || qty < 1) {
        missing.push('Tổng số lượng');
      }
      if (!d.unit.trim()) missing.push('Đơn vị');
      if (missing.length > 0) {
        return `Dòng ${i + 1}: thiếu ${missing.join(', ')}.`;
      }
      if (d.medicationType === 'SINGLE_INGREDIENT' && !d.activeIngredient.trim()) {
        return `Thuốc ${i + 1}: vui lòng nhập tên hoạt chất (INN).`;
      }
    }

    if (!rxContext.address.trim()) {
      return 'Vui lòng nhập nơi cư trú của người bệnh.';
    }
    if (!rxContext.phone.trim()) {
      return 'Vui lòng nhập số điện thoại liên hệ của người bệnh hoặc người đại diện.';
    }
    const todayVn = new Date(Date.now() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const ageMonths = patientAgeMonths(visitForContext.patient.dateOfBirth, todayVn);
    if (
      ageMonths !== null &&
      ageMonths < 72 &&
      (!rxContext.weightKg.trim() || !rxContext.caregiverName.trim())
    ) {
      return 'Trẻ dưới 72 tháng tuổi cần có cân nặng và họ tên người đưa trẻ đến khám.';
    }
    return null;
  };

  const handleNextFromStep3 = () => {
    if (includePrescription && !hasNamedDrugs) {
      setStepError('Vui lòng thêm ít nhất 1 thuốc hoặc chọn Không kê đơn.');
      return;
    }
    const rxErr = validatePrescriptionStep();
    if (rxErr) {
      setStepError(rxErr);
      return;
    }
    setStepError(null);
    setStep(4);
  };

  const handleConfirmMember = async () => {
    const validDrugs = includePrescription ? namedDrugs : [];
    const recipientId = encounter.contract?.familyUnit?.representativeUser?.id ?? '';
    if (validDrugs.length > 0 && !recipientId) {
      setStepError(
        'Hộ gia đình chưa có người đại diện nhận đơn — không thể gửi đơn thuốc. Liên hệ quản trị.',
      );
      return;
    }

    setSubmitting(true);
    setStepError(null);
    try {
      const vitals = cleanVitalsPayload();
      const hasLongTermDrug = validDrugs.some(
        (d) => Number(d.durationDays) > 30,
      );

      await medicalBooksApi.confirm(encounterId, {
        patientId: member.id,
        confirmed: true,
        exam: {
          chiefComplaint: chiefComplaint.trim(),
          clinicalFindings: clinicalFindings.trim(),
          icd10Code: icd10Code.trim().toUpperCase(),
          icd10Diagnosis: icd10Diagnosis.trim(),
          treatmentPlan: treatmentPlan.trim(),
        },
        ...(vitals ? { vitals } : {}),
        ...(validDrugs.length > 0
          ? {
              prescription: {
                recipientUserId: recipientId,
                recipientAuthorized: true,
                clinicalContext: buildClinicalContext(rxContext, hasLongTermDrug),
                instructions:
                  prescriptionInstructions.trim() ||
                  'Dùng thuốc theo đúng chỉ dẫn bác sĩ.',
                details: validDrugs.map((d) => ({
                  medicationName: d.medicationName.trim(),
                  medicationType: d.medicationType,
                  ...(d.activeIngredient.trim()
                    ? { activeIngredient: d.activeIngredient.trim() }
                    : {}),
                  strength: d.strength.trim(),
                  administrationRoute: d.administrationRoute.trim(),
                  dosage: d.dosage.trim(),
                  frequency: d.frequency.trim(),
                  durationDays: Number(d.durationDays),
                  quantity: Number(d.quantity),
                  unit: d.unit.trim(),
                })),
              },
            }
          : {}),
      });

      await onFinalized({
        patientId: member.id,
        patientName: member.fullName,
        attendanceStatus: 'EXAMINED',
        icd10Code: icd10Code.trim().toUpperCase(),
        icd10Diagnosis: icd10Diagnosis.trim(),
        prescriptionSummary:
          validDrugs.length > 0
            ? `${validDrugs[0].medicationName} (${validDrugs.length} thuốc)`
            : 'Không kê đơn thuốc',
      });
    } catch (err) {
      setStepError(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể chốt hồ sơ thành viên.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const vitalFields: Array<{
    key: keyof typeof VITAL_RANGES;
    id: string;
    label: string;
    value: string;
    setter: (v: string) => void;
    fallbackPlaceholder: string;
  }> = [
    {
      key: 'systolicBp',
      id: 'systolic-bp',
      label: 'Huyết áp tâm thu',
      value: systolicBp,
      setter: setSystolicBp,
      fallbackPlaceholder: '120',
    },
    {
      key: 'diastolicBp',
      id: 'diastolic-bp',
      label: 'Huyết áp tâm trương',
      value: diastolicBp,
      setter: setDiastolicBp,
      fallbackPlaceholder: '80',
    },
    {
      key: 'heartRate',
      id: 'heart-rate',
      label: 'Nhịp tim (lần/phút)',
      value: heartRate,
      setter: setHeartRate,
      fallbackPlaceholder: '75',
    },
    {
      key: 'temperature',
      id: 'temperature',
      label: 'Nhiệt độ (°C)',
      value: temperature,
      setter: setTemperature,
      fallbackPlaceholder: '36.8',
    },
    {
      key: 'spo2',
      id: 'spo2',
      label: 'SpO2 (%)',
      value: spo2,
      setter: setSpo2,
      fallbackPlaceholder: '98',
    },
    {
      key: 'respiratoryRate',
      id: 'respiratory-rate',
      label: 'Nhịp thở (lần/phút)',
      value: respiratoryRate,
      setter: setRespiratoryRate,
      fallbackPlaceholder: '18',
    },
    {
      key: 'weightKg',
      id: 'weight-kg',
      label: 'Cân nặng (kg)',
      value: weightKg,
      setter: setWeightKg,
      fallbackPlaceholder: '60',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBackToOverview}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách thành viên
        </Button>
        <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 font-bold">
          Bước {step}/4
        </Badge>
      </div>

      {allergies.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Cảnh báo dị ứng ({member.fullName}):</strong> {allergies.join(', ')}
          </span>
        </div>
      )}

      <Card className="p-4 sm:p-5 border border-slate-200 bg-white space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Phiếu khám: {member.fullName}
            </h2>
            <p className="text-xs text-slate-500">
              {step === 1 && 'Bước 1/4: Khám lâm sàng & Chỉ số sinh hiệu'}
              {step === 2 && 'Bước 2/4: Chẩn đoán ICD-10 & Kế hoạch điều trị'}
              {step === 3 && 'Bước 3/4: Kê đơn thuốc (tùy chọn)'}
              {step === 4 && 'Bước 4/4: Xem lại & Chốt hồ sơ thành viên'}
            </p>
          </div>
          {savingDraft && (
            <span className="text-[11px] text-slate-500">Đang lưu nháp...</span>
          )}
        </div>

        {stepError && (
          <div
            role="alert"
            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 flex items-center justify-between gap-2"
          >
            <span>{stepError}</span>
            {draftFailed && (step === 1 || step === 2) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={savingDraft}
                onClick={step === 1 ? handleNextFromStep1 : handleNextFromStep2}
              >
                Thử lại
              </Button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="chief-complaint">Lý do khám *</Label>
              <Textarea
                id="chief-complaint"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Triệu chứng chính, lý do thăm khám..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinical-findings">Kết quả thăm khám *</Label>
              <Textarea
                id="clinical-findings"
                value={clinicalFindings}
                onChange={(e) => setClinicalFindings(e.target.value)}
                placeholder="Ghi nhận khám lâm sàng các cơ quan..."
                rows={3}
              />
            </div>
            {previousVitalsDate && (
              <p className="text-xs text-slate-500">
                Lần đo trước: {previousVitalsDate}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {vitalFields.map((field) => {
                const range = VITAL_RANGES[field.key];
                const prevVal =
                  initialVitals?.source === 'PREVIOUS'
                    ? initialVitals[field.key]
                    : undefined;
                return (
                  <div key={field.key} className="space-y-1">
                    <Label htmlFor={field.id} className="text-xs">
                      {field.label}
                    </Label>
                    <Input
                      id={field.id}
                      type="number"
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      placeholder={
                        prevVal !== undefined && prevVal !== null
                          ? String(prevVal)
                          : field.fallbackPlaceholder
                      }
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" disabled={savingDraft} onClick={handleNextFromStep1}>
                Tiếp tục
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="icd10-code">Mã ICD-10 *</Label>
                <Input
                  id="icd10-code"
                  value={icd10Code}
                  onChange={(e) => setIcd10Code(e.target.value)}
                  placeholder="I10"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="icd10-diagnosis">Chẩn đoán *</Label>
                <Input
                  id="icd10-diagnosis"
                  value={icd10Diagnosis}
                  onChange={(e) => setIcd10Diagnosis(e.target.value)}
                  placeholder="Tăng huyết áp vô căn"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="treatment-plan">Kế hoạch điều trị *</Label>
              <Textarea
                id="treatment-plan"
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder="Hướng dẫn theo dõi, chế độ sinh hoạt, tái khám..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
              <Button type="button" disabled={savingDraft} onClick={handleNextFromStep2}>
                Tiếp tục
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs text-slate-700">
                Nếu bệnh nhân không cần dùng thuốc mới, bấm nút bên phải để bỏ qua nhanh.
              </span>
              <Button type="button" variant="secondary" onClick={handleSkipPrescription}>
                Không kê đơn — Chuyển sang Xem lại →
              </Button>
            </div>

            {drugs.map((drug, idx) => {
              const lineConflicts = allergyConflicts.filter(
                (c) => c.drugIndex === idx,
              );
              return (
                <div key={idx} className="rounded-xl border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Thuốc #{idx + 1}</span>
                    {drugs.length > 1 && (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDrugs((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Tên thuốc"
                      value={drug.medicationName}
                      onChange={(e) => {
                        setIncludePrescription(true);
                        setAllergyConfirmed(false);
                        setDrugs((prev) =>
                          prev.map((d, i) =>
                            i === idx ? { ...d, medicationName: e.target.value } : d,
                          ),
                        );
                      }}
                    />
                    <select
                      aria-label={`Loại thuốc ${idx + 1}`}
                      value={drug.medicationType}
                      onChange={(e) =>
                        setDrugs((prev) =>
                          prev.map((d, i) =>
                            i === idx
                              ? { ...d, medicationType: e.target.value as MedicationType }
                              : d,
                          ),
                        )
                      }
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
                    >
                      <option value="SINGLE_INGREDIENT">Đơn thành phần</option>
                      <option value="COMBINATION">Phối hợp</option>
                      <option value="BIOLOGICAL">Sinh phẩm</option>
                    </select>
                    <Input
                      placeholder="Hoạt chất (INN)"
                      value={drug.activeIngredient}
                      onChange={(e) => {
                        setAllergyConfirmed(false);
                        setDrugs((prev) =>
                          prev.map((d, i) =>
                            i === idx ? { ...d, activeIngredient: e.target.value } : d,
                          ),
                        );
                      }}
                    />
                    <Input
                      placeholder="Hàm lượng (500mg)"
                      value={drug.strength}
                      onChange={(e) =>
                        setDrugs((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, strength: e.target.value } : d)),
                        )
                      }
                    />
                    <select
                      aria-label={`Đường dùng ${idx + 1}`}
                      value={drug.administrationRoute}
                      onChange={(e) =>
                        setDrugs((prev) =>
                          prev.map((d, i) =>
                            i === idx ? { ...d, administrationRoute: e.target.value } : d,
                          ),
                        )
                      }
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
                    >
                      <option value="">-- Đường dùng --</option>
                      <option value="Uống">Uống</option>
                      <option value="Tiêm">Tiêm</option>
                      <option value="Bôi">Bôi</option>
                      <option value="Nhỏ">Nhỏ</option>
                      <option value="Khác">Khác</option>
                    </select>
                    <Input
                      placeholder="Liều dùng (1 viên)"
                      value={drug.dosage}
                      onChange={(e) =>
                        setDrugs((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, dosage: e.target.value } : d)),
                        )
                      }
                    />
                    <Input
                      placeholder="Tần suất (2 lần/ngày)"
                      value={drug.frequency}
                      onChange={(e) =>
                        setDrugs((prev) =>
                          prev.map((d, i) =>
                            i === idx ? { ...d, frequency: e.target.value } : d,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      placeholder="Số ngày (1–90)"
                      value={drug.durationDays}
                      onChange={(e) =>
                        setDrugs((prev) =>
                          prev.map((d, i) =>
                            i === idx ? { ...d, durationDays: e.target.value } : d,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Tổng số lượng"
                      value={drug.quantity}
                      onChange={(e) =>
                        setDrugs((prev) =>
                          prev.map((d, i) =>
                            i === idx ? { ...d, quantity: e.target.value } : d,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder="Đơn vị (viên)"
                      value={drug.unit}
                      onChange={(e) =>
                        setDrugs((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, unit: e.target.value } : d)),
                        )
                      }
                    />
                  </div>
                  {lineConflicts.length > 0 && (
                    <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-800 font-medium">
                      Cảnh báo xung đột dị ứng:{' '}
                      {lineConflicts
                        .map((c) => `${c.allergenName} (${c.severity})`)
                        .join(', ')}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIncludePrescription(true);
                  setDrugs((prev) => [...prev, emptyDrugLine()]);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Thêm thuốc
              </Button>
            </div>

            {hasNamedDrugs && (
              <div className="rounded-xl border border-slate-200 p-3">
                <PrescriptionContextFields
                  visit={visitForContext}
                  idPrefix="wizard-rx"
                  value={rxContext}
                  onChange={setRxContext}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="rx-instructions">Lời dặn dùng thuốc</Label>
              <Textarea
                id="rx-instructions"
                value={prescriptionInstructions}
                onChange={(e) => setPrescriptionInstructions(e.target.value)}
                placeholder="Uống sau ăn, theo dõi tác dụng phụ..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
              <Button type="button" onClick={handleNextFromStep3}>
                Tiếp tục
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div>
                <span className="text-slate-500">Lý do khám: </span>
                <strong className="text-slate-900">{chiefComplaint}</strong>
              </div>
              <div>
                <span className="text-slate-500">Kết quả thăm khám: </span>
                <strong className="text-slate-900">{clinicalFindings}</strong>
              </div>
              <div>
                <span className="text-slate-500">Chẩn đoán: </span>
                <strong className="text-slate-900">
                  {icd10Code.toUpperCase()} — {icd10Diagnosis}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Kế hoạch điều trị: </span>
                <strong className="text-slate-900">{treatmentPlan}</strong>
              </div>
              <div>
                <span className="text-slate-500">Đơn thuốc: </span>
                <strong className="text-slate-900">
                  {includePrescription && hasNamedDrugs
                    ? namedDrugs.map((d) => d.medicationName).join(', ')
                    : 'Không kê đơn thuốc'}
                </strong>
              </div>
            </div>

            {includePrescription && allergyConflicts.length > 0 && (
              <label className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-rose-900 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={allergyConfirmed}
                  onChange={(e) => setAllergyConfirmed(e.target.checked)}
                />
                <span>Tôi đã kiểm tra dị ứng và vẫn kê thuốc này</span>
              </label>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
              <Button
                type="button"
                disabled={
                  submitting ||
                  (includePrescription &&
                    allergyConflicts.length > 0 &&
                    !allergyConfirmed)
                }
                onClick={handleConfirmMember}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                ✓ Chốt hồ sơ thành viên này
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
