'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, CheckCircle2, FilePenLine, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { encountersApi, type EncounterItem, type EncounterPatient } from '@/lib/api/encounters.api';
import { medicalBooksApi, type BookVisitDetail } from '@/lib/api/medical-books.api';
import { patientsApi } from '@/lib/api/patients.api';
import { DoctorBookVisitView } from '@/features/prescriptions/components/medical-book-view';
import {
  deriveDualLaneState,
  formatEncounterTime,
  formatRemainingRecordDeadline,
} from '@/lib/encounter-dual-lane';

interface DraftDrugLine {
  medicationName: string;
  strength: string;
  administrationRoute: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  quantity: string;
  unit: string;
}

interface MemberVisitDraft {
  chiefComplaint: string;
  clinicalFindings: string;
  icd10Code: string;
  icd10Diagnosis: string;
  treatmentPlan: string;
  systolicBp: string;
  diastolicBp: string;
  heartRate: string;
  spo2: string;
  bloodGlucose: string;
  weightKg: string;
  newChronicDisease: string;
  newAllergy: string;
  includePrescription: boolean;
  drugs: DraftDrugLine[];
  prescriptionInstructions: string;
}

const emptyDrugLine = (): DraftDrugLine => ({
  medicationName: '',
  strength: '',
  administrationRoute: 'Uống',
  dosage: '',
  frequency: '',
  durationDays: '',
  quantity: '',
  unit: '',
});

const emptyDraft = (): MemberVisitDraft => ({
  chiefComplaint: '',
  clinicalFindings: '',
  icd10Code: '',
  icd10Diagnosis: '',
  treatmentPlan: '',
  systolicBp: '',
  diastolicBp: '',
  heartRate: '',
  spo2: '',
  bloodGlucose: '',
  weightKg: '',
  newChronicDisease: '',
  newAllergy: '',
  includePrescription: false,
  drugs: [emptyDrugLine()],
  prescriptionInstructions: '',
});

function draftStorageKey(encounterId: string, patientId: string): string {
  return `famidoc_visit_draft:${encounterId}:${patientId}`;
}

export function loadVisitDraft(encounterId: string, patientId: string): MemberVisitDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftStorageKey(encounterId, patientId));
    if (!raw) return null;
    return { ...emptyDraft(), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function saveVisitDraft(
  encounterId: string,
  patientId: string,
  draft: MemberVisitDraft,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(draftStorageKey(encounterId, patientId), JSON.stringify(draft));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearVisitDraft(encounterId: string, patientId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(draftStorageKey(encounterId, patientId));
  } catch {
    // Ignore storage errors
  }
}

function toOptionalNumber(raw: string): number | undefined {
  const n = Number(raw.trim());
  return raw.trim() && Number.isFinite(n) ? n : undefined;
}

export function DoctorVisitWorkspace({
  encounterId,
  initialPatientId,
}: {
  encounterId: string;
  initialPatientId?: string;
}) {
  const [encounter, setEncounter] = useState<EncounterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [activePatientId, setActivePatientId] = useState<string>('');
  const [draftsByPatient, setDraftsByPatient] = useState<Record<string, MemberVisitDraft>>({});
  const [savedDraftIds, setSavedDraftIds] = useState<Record<string, boolean>>({});
  const [finalizedIds, setFinalizedIds] = useState<Record<string, boolean>>({});
  const [visitDetailsByPatient, setVisitDetailsByPatient] = useState<
    Record<string, BookVisitDetail>
  >({});
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const detail = await encountersApi.getEncounterDetail(encounterId);
      if (!detail) {
        throw new Error('Không tìm thấy ca khám.');
      }
      setEncounter(detail);

      const finalizedMap: Record<string, boolean> = {};
      for (const emr of detail.clinicalEmrs ?? []) {
        if (emr.isFinalized) finalizedMap[emr.patientId] = true;
      }
      setFinalizedIds(finalizedMap);

      const members =
        detail.contract?.members?.map((m) => m.patient).filter(Boolean) ??
        (detail.patient ? [detail.patient] : []);
      const validMembers = members as EncounterPatient[];

      const initialSelected = validMembers.map((m) => m.id);
      setSelectedPatientIds((prev) => (prev.length > 0 ? prev : initialSelected));
      const firstId =
        (initialPatientId && validMembers.some((m) => m.id === initialPatientId)
          ? initialPatientId
          : validMembers[0]?.id) ?? '';
      setActivePatientId((prev) => prev || firstId);

      const loadedDrafts: Record<string, MemberVisitDraft> = {};
      const hasDraftFlags: Record<string, boolean> = {};
      for (const m of validMembers) {
        const stored = loadVisitDraft(encounterId, m.id);
        if (stored) {
          loadedDrafts[m.id] = stored;
          hasDraftFlags[m.id] = true;
        }
      }
      setDraftsByPatient((prev) => ({ ...loadedDrafts, ...prev }));
      setSavedDraftIds((prev) => ({ ...hasDraftFlags, ...prev }));
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể tải thông tin ca khám.',
      );
    } finally {
      setLoading(false);
    }
  }, [encounterId, initialPatientId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const members = useMemo<EncounterPatient[]>(() => {
    if (!encounter) return [];
    const fromContract = encounter.contract?.members
      ?.map((m) => m.patient)
      .filter((p): p is EncounterPatient => Boolean(p));
    if (fromContract && fromContract.length > 0) return fromContract;
    return encounter.patient ? [encounter.patient] : [];
  }, [encounter]);

  const familyId = encounter?.contract?.familyUnit?.id ?? '';

  useEffect(() => {
    if (!familyId || !activePatientId || visitDetailsByPatient[activePatientId]) return;
    const controller = new AbortController();
    medicalBooksApi
      .visit(encounterId, controller.signal, activePatientId)
      .then((detail) => {
        if (controller.signal.aborted) return;
        setVisitDetailsByPatient((prev) => ({ ...prev, [activePatientId]: detail }));
        if (detail.isFinalized) {
          setFinalizedIds((prev) => ({ ...prev, [activePatientId]: true }));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [familyId, activePatientId, encounterId, visitDetailsByPatient]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6 text-sm text-slate-600">
        Đang mở không gian làm việc ca khám...
      </div>
    );
  }

  if (error || !encounter) {
    if (initialPatientId) {
      return <DoctorBookVisitView id={encounterId} patientId={initialPatientId} />;
    }
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card className="p-5 space-y-3">
          <p role="alert" className="text-sm text-red-700">
            {error || 'Không tìm thấy ca khám.'}
          </p>
          <Link href="/doctor" className="text-sm font-semibold text-teal-800 hover:underline">
            ◄ Về Bảng lâm sàng
          </Link>
        </Card>
      </div>
    );
  }

  const lane = deriveDualLaneState(encounter);
  const activeMember = members.find((m) => m.id === activePatientId) ?? members[0];
  const currentDraft = (activeMember && draftsByPatient[activeMember.id]) || emptyDraft();
  const finalizedCount = selectedPatientIds.filter((id) => finalizedIds[id]).length;
  const isMemberFinalized = activeMember ? Boolean(finalizedIds[activeMember.id]) : false;

  const updateCurrentDraft = (patch: Partial<MemberVisitDraft>) => {
    if (!activeMember) return;
    setDraftsByPatient((prev) => ({
      ...prev,
      [activeMember.id]: { ...(prev[activeMember.id] ?? emptyDraft()), ...patch },
    }));
  };

  const handleSaveDraft = () => {
    if (!activeMember) return;
    saveVisitDraft(encounterId, activeMember.id, currentDraft);
    setSavedDraftIds((prev) => ({ ...prev, [activeMember.id]: true }));
    setStatusMessage(`Đã lưu nháp cho ${activeMember.fullName} (Gia đình chưa thấy).`);
  };

  const handleFinalizeMember = async () => {
    if (!activeMember) return;
    setSubmitting(true);
    setStatusMessage('');
    setError('');
    try {
      const recipientId =
        visitDetailsByPatient[activeMember.id]?.recipient?.id ??
        (encounter.contract?.familyUnit?.representativeUser as { id?: string } | undefined)?.id ??
        '';

      const validDrugs = currentDraft.drugs.filter((d) => d.medicationName.trim().length > 0);
      await medicalBooksApi.confirm(encounterId, {
        patientId: activeMember.id,
        confirmed: true,
        exam: {
          chiefComplaint: currentDraft.chiefComplaint,
          clinicalFindings: currentDraft.clinicalFindings,
          icd10Code: currentDraft.icd10Code,
          icd10Diagnosis: currentDraft.icd10Diagnosis,
          treatmentPlan: currentDraft.treatmentPlan,
        },
        prescription:
          currentDraft.includePrescription && validDrugs.length > 0
            ? {
                details: validDrugs.map((d) => ({
                  medicationType: 'SINGLE_INGREDIENT',
                  medicationName: d.medicationName.trim(),
                  strength: d.strength.trim(),
                  administrationRoute: d.administrationRoute.trim() || 'Uống',
                  dosage: d.dosage.trim(),
                  frequency: d.frequency.trim(),
                  durationDays: Number(d.durationDays) || 1,
                  quantity: Number(d.quantity) || 1,
                  unit: d.unit.trim() || 'viên',
                })),
                instructions: currentDraft.prescriptionInstructions.trim(),
                recipientUserId: recipientId,
                recipientAuthorized: true,
              }
            : undefined,
      });

      const systolicBp = toOptionalNumber(currentDraft.systolicBp);
      const diastolicBp = toOptionalNumber(currentDraft.diastolicBp);
      const heartRate = toOptionalNumber(currentDraft.heartRate);
      const spo2 = toOptionalNumber(currentDraft.spo2);
      const bloodGlucose = toOptionalNumber(currentDraft.bloodGlucose);
      const weightKg = toOptionalNumber(currentDraft.weightKg);

      if (
        systolicBp !== undefined ||
        diastolicBp !== undefined ||
        heartRate !== undefined ||
        spo2 !== undefined ||
        bloodGlucose !== undefined
      ) {
        await patientsApi.addMemberVitalSign(activeMember.id, {
          systolicBp,
          diastolicBp,
          heartRate,
          spo2,
          bloodGlucose,
        });
      }

      if (currentDraft.newAllergy.trim()) {
        await patientsApi.addMemberAllergy(activeMember.id, {
          allergenName: currentDraft.newAllergy.trim(),
          allergenType: 'DRUG',
          severity: 'MODERATE',
        });
      }

      if (currentDraft.newChronicDisease.trim() || weightKg !== undefined) {
        const existing = Array.isArray(activeMember.chronicDiseases)
          ? activeMember.chronicDiseases.join(', ')
          : activeMember.chronicDiseases || '';
        const merged = currentDraft.newChronicDisease.trim()
          ? existing
            ? `${existing}, ${currentDraft.newChronicDisease.trim()}`
            : currentDraft.newChronicDisease.trim()
          : undefined;
        await patientsApi.updateFamilyMember(activeMember.id, {
          ...(merged ? { chronicDiseases: merged } : {}),
          ...(weightKg !== undefined ? { weightKg } : {}),
        });
      }

      clearVisitDraft(encounterId, activeMember.id);
      setSavedDraftIds((prev) => ({ ...prev, [activeMember.id]: false }));
      setFinalizedIds((prev) => ({ ...prev, [activeMember.id]: true }));
      setStatusMessage(
        `Đã chốt hồ sơ cho ${activeMember.fullName}, đồng bộ EHR và gửi kết quả cho gia đình.`,
      );
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể chốt hồ sơ. Vui lòng kiểm tra lại thông tin.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/doctor"
          className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Về Bảng lâm sàng
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">
            Làn Gia đình: {lane.familyConfirmed ? '✓ Đã xác nhận có đến' : 'Chưa xác nhận'}
          </Badge>
          {lane.remainingRecordHours !== null && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
              Hạn chốt hồ sơ: {formatRemainingRecordDeadline(lane.remainingRecordHours)}
            </Badge>
          )}
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-slate-900">
            CA KHÁM: {encounter.contract?.familyUnit?.familyName || 'Hộ gia đình'} •{' '}
            {String(encounter.scheduledDate).slice(0, 10)} ({formatEncounterTime(encounter.scheduledTime)})
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700 sm:grid-cols-4">
          <span>1. Chọn thành viên</span>
          <span>2. Ghi khám &amp; EHR</span>
          <span>3. Đơn thuốc</span>
          <span>4. Chốt hồ sơ</span>
        </div>
      </Card>

      {statusMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-900"
        >
          {statusMessage}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* BƯỚC 1: CHỌN THÀNH VIÊN KHÁM */}
        <Card className="p-4 space-y-3 lg:col-span-4">
          <h2 className="text-sm font-bold text-slate-900">BƯỚC 1: CHỌN THÀNH VIÊN KHÁM</h2>
          <p className="text-xs text-slate-600">Tích chọn thành viên thực tế có thăm khám hôm nay:</p>
          <ul className="space-y-2">
            {members.map((member) => {
              const checked = selectedPatientIds.includes(member.id);
              const isCurrent = activeMember?.id === member.id;
              const isFinal = Boolean(finalizedIds[member.id]);
              const isDraft = Boolean(savedDraftIds[member.id]) && !isFinal;
              return (
                <li
                  key={member.id}
                  className={`rounded-xl border p-3 ${
                    isCurrent ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Chọn khám ${member.fullName}`}
                      checked={checked}
                      onChange={(e) => {
                        setSelectedPatientIds((prev) =>
                          e.target.checked
                            ? [...prev, member.id]
                            : prev.filter((id) => id !== member.id),
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => setActivePatientId(member.id)}
                    >
                      <div className="text-sm font-semibold text-slate-900">{member.fullName}</div>
                      <div className="mt-1 text-xs">
                        {isFinal ? (
                          <span className="font-semibold text-emerald-700">✓ Đã chốt hồ sơ</span>
                        ) : isDraft ? (
                          <span className="font-semibold text-amber-700">● Đang ghi (Nháp)</span>
                        ) : checked ? (
                          <span className="text-slate-600">Chưa ghi nhận</span>
                        ) : (
                          <span className="text-slate-400">Không khám ca này</span>
                        )}
                      </div>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-slate-200 pt-3 text-xs text-slate-700 space-y-1">
            <div>Đã chọn: {selectedPatientIds.length} người</div>
            <div className="font-semibold">
              Đã chốt: {finalizedCount}/{selectedPatientIds.length} người
            </div>
          </div>
        </Card>

        {/* BƯỚC 2, 3, 4 */}
        <Card className="p-4 sm:p-5 space-y-5 lg:col-span-8">
          {activeMember ? (
            <>
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Đang làm việc với: {activeMember.fullName}
                </h2>
                <p className="text-xs text-slate-600">
                  Tiền sử:{' '}
                  {Array.isArray(activeMember.chronicDiseases)
                    ? activeMember.chronicDiseases.join(', ')
                    : activeMember.chronicDiseases || 'Chưa ghi nhận'}
                </p>
              </div>

              {/* BƯỚC 2A */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  BƯỚC 2A: DIỄN BIẾN BUỔI KHÁM (Encounter)
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="ws-chief-complaint">Lý do khám</Label>
                    <Textarea
                      id="ws-chief-complaint"
                      rows={2}
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.chiefComplaint}
                      onChange={(e) => updateCurrentDraft({ chiefComplaint: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="ws-clinical-findings">Triệu chứng &amp; Khám thực thể</Label>
                    <Textarea
                      id="ws-clinical-findings"
                      rows={2}
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.clinicalFindings}
                      onChange={(e) => updateCurrentDraft({ clinicalFindings: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ws-icd10">Mã ICD-10</Label>
                    <Input
                      id="ws-icd10"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.icd10Code}
                      onChange={(e) => updateCurrentDraft({ icd10Code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ws-diagnosis">Chẩn đoán</Label>
                    <Input
                      id="ws-diagnosis"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.icd10Diagnosis}
                      onChange={(e) => updateCurrentDraft({ icd10Diagnosis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="ws-treatment-plan">Dặn dò / Kế hoạch tái khám</Label>
                    <Textarea
                      id="ws-treatment-plan"
                      rows={2}
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.treatmentPlan}
                      onChange={(e) => updateCurrentDraft({ treatmentPlan: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              {/* BƯỚC 2B */}
              <section className="space-y-3 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-bold text-slate-900">
                  BƯỚC 2B: ĐỒNG BỘ EHR DÀI HẠN (Tự đẩy khi Chốt)
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="ws-sbp">Huyết áp tâm thu (mmHg)</Label>
                    <Input
                      id="ws-sbp"
                      type="number"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.systolicBp}
                      onChange={(e) => updateCurrentDraft({ systolicBp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ws-dbp">Huyết áp tâm trương (mmHg)</Label>
                    <Input
                      id="ws-dbp"
                      type="number"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.diastolicBp}
                      onChange={(e) => updateCurrentDraft({ diastolicBp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ws-hr">Nhịp tim (lần/phút)</Label>
                    <Input
                      id="ws-hr"
                      type="number"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.heartRate}
                      onChange={(e) => updateCurrentDraft({ heartRate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ws-spo2">SpO2 (%)</Label>
                    <Input
                      id="ws-spo2"
                      type="number"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.spo2}
                      onChange={(e) => updateCurrentDraft({ spo2: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ws-glucose">Đường huyết (mmol/L)</Label>
                    <Input
                      id="ws-glucose"
                      type="number"
                      step="0.1"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.bloodGlucose}
                      onChange={(e) => updateCurrentDraft({ bloodGlucose: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ws-weight">Cân nặng (kg)</Label>
                    <Input
                      id="ws-weight"
                      type="number"
                      step="0.1"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.weightKg}
                      onChange={(e) => updateCurrentDraft({ weightKg: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="ws-chronic">Bệnh nền mới (nếu phát hiện)</Label>
                    <Input
                      id="ws-chronic"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.newChronicDisease}
                      onChange={(e) => updateCurrentDraft({ newChronicDisease: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ws-allergy">Dị ứng mới (nếu phát hiện)</Label>
                    <Input
                      id="ws-allergy"
                      disabled={isMemberFinalized || submitting}
                      value={currentDraft.newAllergy}
                      onChange={(e) => updateCurrentDraft({ newAllergy: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              {/* BƯỚC 3 */}
              <section className="space-y-3 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-bold text-slate-900">
                  BƯỚC 3: ĐƠN THUỐC ĐIỆN TỬ (Tùy chọn)
                </h3>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <input
                    type="checkbox"
                    checked={currentDraft.includePrescription}
                    disabled={isMemberFinalized || submitting}
                    onChange={(e) => updateCurrentDraft({ includePrescription: e.target.checked })}
                  />
                  <span>Có phát sinh đơn thuốc cho thành viên này</span>
                </label>

                {currentDraft.includePrescription && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    {currentDraft.drugs.map((drug, idx) => (
                      <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border bg-white p-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label htmlFor={`drug-name-${idx}`}>Tên thuốc</Label>
                          <Input
                            id={`drug-name-${idx}`}
                            value={drug.medicationName}
                            disabled={isMemberFinalized || submitting}
                            onChange={(e) => {
                              const next = [...currentDraft.drugs];
                              next[idx] = { ...drug, medicationName: e.target.value };
                              updateCurrentDraft({ drugs: next });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`drug-strength-${idx}`}>Hàm lượng</Label>
                          <Input
                            id={`drug-strength-${idx}`}
                            value={drug.strength}
                            disabled={isMemberFinalized || submitting}
                            onChange={(e) => {
                              const next = [...currentDraft.drugs];
                              next[idx] = { ...drug, strength: e.target.value };
                              updateCurrentDraft({ drugs: next });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`drug-dosage-${idx}`}>Liều mỗi lần</Label>
                          <Input
                            id={`drug-dosage-${idx}`}
                            value={drug.dosage}
                            disabled={isMemberFinalized || submitting}
                            onChange={(e) => {
                              const next = [...currentDraft.drugs];
                              next[idx] = { ...drug, dosage: e.target.value };
                              updateCurrentDraft({ drugs: next });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`drug-freq-${idx}`}>Tần suất</Label>
                          <Input
                            id={`drug-freq-${idx}`}
                            value={drug.frequency}
                            disabled={isMemberFinalized || submitting}
                            onChange={(e) => {
                              const next = [...currentDraft.drugs];
                              next[idx] = { ...drug, frequency: e.target.value };
                              updateCurrentDraft({ drugs: next });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`drug-days-${idx}`}>Số ngày dùng</Label>
                          <Input
                            id={`drug-days-${idx}`}
                            type="number"
                            value={drug.durationDays}
                            disabled={isMemberFinalized || submitting}
                            onChange={(e) => {
                              const next = [...currentDraft.drugs];
                              next[idx] = { ...drug, durationDays: e.target.value };
                              updateCurrentDraft({ drugs: next });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`drug-qty-${idx}`}>Tổng số lượng</Label>
                          <Input
                            id={`drug-qty-${idx}`}
                            type="number"
                            value={drug.quantity}
                            disabled={isMemberFinalized || submitting}
                            onChange={(e) => {
                              const next = [...currentDraft.drugs];
                              next[idx] = { ...drug, quantity: e.target.value };
                              updateCurrentDraft({ drugs: next });
                            }}
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor={`drug-unit-${idx}`}>Đơn vị</Label>
                          <Input
                            id={`drug-unit-${idx}`}
                            value={drug.unit}
                            disabled={isMemberFinalized || submitting}
                            onChange={(e) => {
                              const next = [...currentDraft.drugs];
                              next[idx] = { ...drug, unit: e.target.value };
                              updateCurrentDraft({ drugs: next });
                            }}
                          />
                        </div>
                        {currentDraft.drugs.length > 1 && (
                          <div className="flex items-end justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isMemberFinalized || submitting}
                              onClick={() =>
                                updateCurrentDraft({
                                  drugs: currentDraft.drugs.filter((_, i) => i !== idx),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isMemberFinalized || submitting}
                      onClick={() =>
                        updateCurrentDraft({ drugs: [...currentDraft.drugs, emptyDrugLine()] })
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Thêm dòng thuốc
                    </Button>
                    <div className="space-y-1">
                      <Label htmlFor="ws-rx-instructions">Lời dặn đơn thuốc</Label>
                      <Textarea
                        id="ws-rx-instructions"
                        rows={2}
                        disabled={isMemberFinalized || submitting}
                        value={currentDraft.prescriptionInstructions}
                        onChange={(e) =>
                          updateCurrentDraft({ prescriptionInstructions: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* BƯỚC 4 */}
              <section className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                {isMemberFinalized ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Hồ sơ thành viên này đã chốt &amp; đồng bộ EHR.</span>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      onClick={handleSaveDraft}
                    >
                      <FilePenLine className="mr-1.5 h-4 w-4" />
                      Lưu Nháp (Gia đình chưa thấy)
                    </Button>
                    <Button
                      type="button"
                      className="bg-teal-700 text-white hover:bg-teal-800"
                      disabled={submitting}
                      onClick={handleFinalizeMember}
                    >
                      {currentDraft.includePrescription
                        ? '✓ Chốt hồ sơ & Phát hành đơn'
                        : '✓ Chốt hồ sơ'}
                    </Button>
                  </>
                )}
              </section>
            </>
          ) : (
            <p className="text-sm text-slate-600">Chưa có thành viên trong hộ gia đình.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
