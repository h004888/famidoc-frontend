"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { FilePenLine, Pill, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  eligibleForLongTermPrescription,
  patientAgeMonths,
  prescriptionDrugName,
} from "@/lib/prescription-rules";
import {
  medicalBooksApi,
  type BookVisitDetail,
  type FamilyPrescriptionEntry,
} from "@/lib/api/medical-books.api";
import {
  prescriptionErrorMessage,
  prescriptionsApi,
  type PrescriptionExam,
  type PrescriptionContext,
} from "@/lib/api/prescriptions.api";
import {
  PrescriptionContextFields,
  emptyPrescriptionContext,
} from "./prescription-context-fields";
import { buildClinicalContext } from "../lib/prescription-context";

const emptyExam: PrescriptionExam = {
  chiefComplaint: "",
  clinicalFindings: "",
  icd10Code: "",
  icd10Diagnosis: "",
  treatmentPlan: "",
};

const examFields: {
  name: keyof PrescriptionExam;
  label: string;
  maxLength: number;
  multiline?: boolean;
}[] = [
  {
    name: "chiefComplaint",
    label: "Lý do khám",
    maxLength: 4000,
    multiline: true,
  },
  {
    name: "clinicalFindings",
    label: "Kết quả thăm khám",
    maxLength: 4000,
    multiline: true,
  },
  { name: "icd10Code", label: "Mã ICD-10", maxLength: 10 },
  { name: "icd10Diagnosis", label: "Chẩn đoán", maxLength: 255 },
  {
    name: "treatmentPlan",
    label: "Kế hoạch điều trị",
    maxLength: 4000,
    multiline: true,
  },
];

type DrugEditableField =
  | "medicationCode"
  | "activeIngredient"
  | "medicationName"
  | "strength"
  | "administrationRoute"
  | "dosage"
  | "frequency"
  | "quantity"
  | "unit"
  | "durationDays";
type DrugRow = Record<DrugEditableField, string> & {
  rowId: number;
  medicationType: "SINGLE_INGREDIENT" | "COMBINATION" | "BIOLOGICAL";
};
const blankDrug = (rowId: number): DrugRow => ({
  rowId,
  medicationType: "SINGLE_INGREDIENT",
  medicationCode: "",
  activeIngredient: "",
  medicationName: "",
  strength: "",
  administrationRoute: "",
  dosage: "",
  frequency: "",
  quantity: "",
  unit: "",
  durationDays: "",
});
const drugFields: {
  name: DrugEditableField;
  label: string;
  maxLength?: number;
  optional?: boolean;
  max?: number;
}[] = [
  { name: "medicationCode", label: "Mã thuốc", maxLength: 100, optional: true },
  {
    name: "activeIngredient",
    label: "Hoạt chất",
    maxLength: 255,
    optional: true,
  },
  { name: "medicationName", label: "Tên thuốc", maxLength: 150 },
  { name: "strength", label: "Hàm lượng / nồng độ", maxLength: 50 },
  { name: "administrationRoute", label: "Đường dùng", maxLength: 50 },
  { name: "dosage", label: "Liều mỗi lần", maxLength: 50 },
  {
    name: "frequency",
    label: "Tần suất và thời điểm dùng",
    maxLength: 100,
  },
  { name: "durationDays", label: "Số ngày dùng", max: 90 },
  { name: "quantity", label: "Tổng số lượng", max: 100000 },
  { name: "unit", label: "Đơn vị", maxLength: 30 },
];
export function PrescriptionForm({
  visit,
  onConfirmed,
  onPendingChange,
  onSaveFamilyDraft,
  onDraftChange,
  disabled = false,
  isReplacement = false,
}: {
  visit: BookVisitDetail;
  onConfirmed: () => void;
  onPendingChange?: (pending: boolean) => void;
  onSaveFamilyDraft?: (entry: FamilyPrescriptionEntry) => void;
  onDraftChange?: () => void;
  disabled?: boolean;
  isReplacement?: boolean;
}) {
  const formId = useId();
  const [context, setContext] = useState(
    () =>
      Object.fromEntries(
        Object.entries(emptyPrescriptionContext).map(([key, value]) => [
          key,
          isReplacement
            ? String(
                visit.prescription?.clinicalContext?.[
                  key as keyof PrescriptionContext
                ] ?? value,
              )
            : value,
        ]),
      ) as typeof emptyPrescriptionContext,
  );
  const [exam, setExam] = useState(() => visit.exam ?? emptyExam);
  const [includePrescription, setIncludePrescription] = useState(
    Boolean(isReplacement || onSaveFamilyDraft || visit.isFinalized),
  );
  const [drugs, setDrugs] = useState<DrugRow[]>(() =>
    isReplacement && visit.prescription
      ? visit.prescription.details.map((line, index) => ({
          ...blankDrug(index + 1),
          ...Object.fromEntries(
            Object.entries(line)
              .filter(([key]) => key !== "id")
              .map(([key, value]) => [key, value == null ? "" : String(value)]),
          ),
          medicationType: line.medicationType ?? "SINGLE_INGREDIENT",
        }))
      : [blankDrug(1)],
  );
  const nextRowId = useRef(drugs.length + 1);
  const [instructions, setInstructions] = useState(
    isReplacement ? (visit.prescription?.instructions ?? "") : "",
  );
  const [replacementReason, setReplacementReason] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceDrugs, setReplaceDrugs] = useState<DrugRow[]>(() =>
    visit.prescription
      ? visit.prescription.details.map((line, index) => ({
          ...blankDrug(index + 1),
          ...Object.fromEntries(
            Object.entries(line)
              .filter(([key]) => key !== "id")
              .map(([key, value]) => [key, value == null ? "" : String(value)]),
          ),
          medicationType: line.medicationType ?? "SINGLE_INGREDIENT",
        }))
      : [blankDrug(1)],
  );
  const { recipient } = visit;

  if (visit.prescription && visit.prescription.status === "ISSUED" && !isReplacement) {
    const canSubmitReplacement = replacementReason.trim().length >= 10 && !pending;
    const handleConfirmReplacement = async () => {
      if (!canSubmitReplacement || !visit.prescription) return;
      setPending(true);
      setError("");
      try {
        await prescriptionsApi.replace(visit.prescription.id, {
          clinicalContext: visit.prescription.clinicalContext ?? undefined,
          replacementReason: replacementReason.trim(),
          instructions: instructions.trim() || visit.prescription.instructions || "",
          recipientUserId: recipient?.id ?? "",
          recipientAuthorized: true,
          details: replaceDrugs.map((row) => ({
            medicationType: row.medicationType,
            medicationCode: row.medicationCode.trim() || undefined,
            activeIngredient: row.activeIngredient.trim() || undefined,
            medicationName: row.medicationName.trim(),
            strength: row.strength.trim(),
            administrationRoute: row.administrationRoute.trim() || "Uống",
            dosage: row.dosage.trim(),
            frequency: row.frequency.trim(),
            durationDays: Number(row.durationDays) || 1,
            quantity: Number(row.quantity) || 1,
            unit: row.unit.trim() || "viên",
          })),
        });
        setShowReplaceModal(false);
        onConfirmed();
      } catch (failure) {
        setError(
          prescriptionErrorMessage(
            failure,
            "Không thể phát hành đơn thay thế. Vui lòng thử lại.",
          ),
        );
      } finally {
        setPending(false);
      }
    };

    return (
      <Card className="space-y-4 border-amber-200 bg-amber-50/50 p-4 sm:p-5">
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-950">
            Đơn thuốc #{visit.prescription.prescriptionCode} — Đơn thuốc đã phát hành (Đã khóa — Không thể sửa đè)
          </p>
          <p className="text-xs text-slate-700">
            Quy định y khoa: Để điều chỉnh thuốc, bác sĩ cần hủy đơn cũ và lập đơn mới thay thế để giữ vết y khoa.
          </p>
        </div>

        <ul className="space-y-1 rounded-lg border border-amber-200 bg-white p-3 text-xs text-slate-800">
          {visit.prescription.details.map((line, i) => (
            <li key={line.id || i}>
              {i + 1}. {line.medicationName} {line.strength} · {line.dosage} · {line.frequency} · {line.durationDays} ngày ({line.quantity} {line.unit})
            </li>
          ))}
        </ul>

        {!showReplaceModal ? (
          <Button
            type="button"
            variant="outline"
            className="border-amber-400 bg-white text-amber-950 hover:bg-amber-100"
            onClick={() => setShowReplaceModal(true)}
          >
            Hủy đơn cũ &amp; Lập đơn thay thế
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900">
              Lập đơn thuốc thay thế cho #{visit.prescription.prescriptionCode}
            </h3>
            <div className="space-y-1">
              <Label htmlFor={`${formId}-d4-reason`}>Lý do hủy đơn cũ (Bắt buộc)</Label>
              <Textarea
                id={`${formId}-d4-reason`}
                rows={2}
                placeholder="Nhập lý do hủy đơn cũ (tối thiểu 10 ký tự)..."
                value={replacementReason}
                onChange={(e) => setReplacementReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Nội dung đơn thay thế:</p>
              {replaceDrugs.map((drug, idx) => (
                <div key={drug.rowId} className="grid grid-cols-2 gap-2 rounded-lg border p-2.5 sm:grid-cols-4">
                  <Input
                    aria-label={`Tên thuốc thay thế ${idx + 1}`}
                    value={drug.medicationName}
                    onChange={(e) =>
                      setReplaceDrugs((cur) =>
                        cur.map((r) => (r.rowId === drug.rowId ? { ...r, medicationName: e.target.value } : r)),
                      )
                    }
                  />
                  <Input
                    aria-label={`Hàm lượng thay thế ${idx + 1}`}
                    value={drug.strength}
                    onChange={(e) =>
                      setReplaceDrugs((cur) =>
                        cur.map((r) => (r.rowId === drug.rowId ? { ...r, strength: e.target.value } : r)),
                      )
                    }
                  />
                  <Input
                    aria-label={`Liều dùng thay thế ${idx + 1}`}
                    value={drug.dosage}
                    onChange={(e) =>
                      setReplaceDrugs((cur) =>
                        cur.map((r) => (r.rowId === drug.rowId ? { ...r, dosage: e.target.value } : r)),
                      )
                    }
                  />
                  <Input
                    aria-label={`Số lượng thay thế ${idx + 1}`}
                    value={drug.quantity}
                    onChange={(e) =>
                      setReplaceDrugs((cur) =>
                        cur.map((r) => (r.rowId === drug.rowId ? { ...r, quantity: e.target.value } : r)),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-xs text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowReplaceModal(false)}>
                Đóng
              </Button>
              <Button
                type="button"
                disabled={!canSubmitReplacement}
                onClick={() => void handleConfirmReplacement()}
              >
                ✓ Xác nhận Hủy đơn cũ &amp; Phát hành đơn thay thế
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authorized || pending || (includePrescription && !recipient)) return;
    if (!visit.exam && Object.values(exam).some((value) => !value.trim())) {
      setError("Vui lòng điền đầy đủ thông tin khám.");
      return;
    }
    if (includePrescription) {
      if (!context.address.trim() || !context.phone.trim()) {
        setError(
          "Vui lòng nhập nơi cư trú và số điện thoại liên hệ của người bệnh hoặc người đại diện.",
        );
        return;
      }
      const today = new Date(Date.now() + 7 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const ageMonths = patientAgeMonths(visit.patient.dateOfBirth, today);
      if (ageMonths === null) {
        setError("Ngày sinh người bệnh không hợp lệ. Vui lòng cập nhật hồ sơ.");
        return;
      }
      if (
        ageMonths < 72 &&
        (!context.weightKg.trim() || !context.caregiverName.trim())
      ) {
        setError(
          "Trẻ dưới 72 tháng tuổi cần có cân nặng và họ tên người đưa trẻ đến khám.",
        );
        return;
      }
      if (
        isReplacement &&
        (replacementReason.trim().length < 10 ||
          replacementReason.trim().length > 2000)
      ) {
        setError("Lý do thay thế phải từ 10 đến 2000 ký tự.");
        return;
      }
      if (context.weightKg.trim()) {
        const w = Number(context.weightKg);
        if (!Number.isFinite(w) || w < 0.1 || w > 500) {
          setError("Cân nặng phải nằm trong khoảng từ 0.1 đến 500 kg.");
          return;
        }
      }
      if (
        context.citizenId.trim() &&
        !/^\d{12}$/.test(context.citizenId.trim())
      ) {
        setError("Mã định danh công dân phải gồm đúng 12 chữ số.");
        return;
      }
      if (
        context.phone.trim() &&
        !/^\+?[0-9]{9,15}$/.test(context.phone.trim())
      ) {
        setError("Số điện thoại phải gồm từ 9 đến 15 chữ số.");
        return;
      }
      if (context.followUpDays.trim()) {
        const days = Number(context.followUpDays);
        if (!Number.isInteger(days) || days < 1 || days > 365) {
          setError("Số ngày hẹn tái khám phải là số nguyên từ 1 đến 365.");
          return;
        }
      }
      if (drugs.length === 0) {
        setError("Vui lòng kê ít nhất 1 dòng thuốc.");
        return;
      }
      for (let idx = 0; idx < drugs.length; idx++) {
        const row = drugs[idx];
        const stt = idx + 1;
        if (prescriptionDrugName(row).length > 150) {
          setError(
            `Thuốc ${stt}: tên INN và tên thương mại kết hợp không được vượt quá 150 ký tự.`,
          );
          return;
        }
        if (
          row.medicationType === "SINGLE_INGREDIENT" &&
          !row.activeIngredient.trim()
        ) {
          setError(`Thuốc ${stt}: vui lòng nhập tên hoạt chất (INN).`);
          return;
        }
        if (
          !row.medicationName.trim() ||
          !row.strength.trim() ||
          !row.administrationRoute.trim() ||
          !row.dosage.trim() ||
          !row.frequency.trim() ||
          !row.unit.trim()
        ) {
          setError(`Vui lòng điền đầy đủ thông tin bắt buộc cho Thuốc ${stt}.`);
          return;
        }
        const duration = Number(row.durationDays);
        if (!Number.isInteger(duration) || duration < 1 || duration > 90) {
          setError(
            `Số ngày dùng của Thuốc ${stt} phải là số nguyên từ 1 đến 90.`,
          );
          return;
        }
        if (
          duration > 30 &&
          (!eligibleForLongTermPrescription(exam.icd10Code) ||
            context.longTermReason.trim().length < 10 ||
            context.longTermReason.trim().length > 2000)
        ) {
          setError(
            `Thuốc ${stt}: kê trên 30 ngày cần chẩn đoán thuộc Phụ lục VII và lý do chuyên môn từ 10 đến 2000 ký tự.`,
          );
          return;
        }
        const qty = Number(row.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 100000) {
          setError(
            `Tổng số lượng của Thuốc ${stt} phải là số nguyên từ 1 đến 100.000.`,
          );
          return;
        }
      }
    }
    const hasLongTermDrug = drugs.some((row) => Number(row.durationDays) > 30);
    setPending(true);
    onPendingChange?.(true);
    setError("");
    try {
      const body = {
        patientId: visit.patient.id,
        confirmed: true as const,
        ...(!visit.exam ? { exam } : {}),
        ...(includePrescription && recipient
          ? {
              prescription: {
                clinicalContext: buildClinicalContext(context, hasLongTermDrug),
                details: drugs.map(
                  ({
                    rowId: _rowId,
                    quantity,
                    durationDays,
                    medicationCode,
                    activeIngredient,
                    ...drug
                  }) => ({
                    ...drug,
                    ...(medicationCode?.trim()
                      ? { medicationCode: medicationCode.trim() }
                      : {}),
                    ...(activeIngredient?.trim()
                      ? { activeIngredient: activeIngredient.trim() }
                      : {}),
                    quantity: Number(quantity),
                    durationDays: Number(durationDays),
                  }),
                ),
                instructions,
                recipientUserId: recipient.id,
                recipientAuthorized: true as const,
              },
            }
          : {}),
      };
      if (onSaveFamilyDraft && body.prescription) {
        onSaveFamilyDraft({
          ...body.prescription,
          encounterId: visit.id,
          patientId: visit.patient.id,
        });
      } else {
        if (isReplacement && visit.prescription && body.prescription) {
          await prescriptionsApi.replace(visit.prescription.id, {
            ...body.prescription,
            replacementReason: replacementReason.trim(),
          });
        } else if (visit.isFinalized && body.prescription) {
          await prescriptionsApi.share(visit.id, {
            ...body.prescription,
            patientId: visit.patient.id,
          });
        } else {
          await medicalBooksApi.confirm(visit.id, body);
        }
        onConfirmed();
      }
    } catch (failure) {
      setError(
        prescriptionErrorMessage(
          failure,
          "Chưa xác nhận được trang khám. Vui lòng thử lại.",
        ),
      );
    } finally {
      setPending(false);
      onPendingChange?.(false);
    }
  }

  return (
    <form
      noValidate
      aria-label={`Kê đơn cho ${visit.patient.fullName}`}
      className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      onSubmit={submit}
      onChange={onDraftChange}
    >
      <fieldset disabled={pending || disabled} className="min-w-0 space-y-5">
        <PrescriptionContextFields
          idPrefix={formId}
          visit={visit}
          value={context}
          onChange={setContext}
        />
        {!visit.exam && (
          <Card className="gap-4 border-slate-200/80 shadow-none p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Thông tin khám</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {examFields.map((field) => {
                const props = {
                  id: `${formId}-${field.name}`,
                  required: true,
                  value: exam[field.name],
                  maxLength: field.maxLength,
                  onChange: (
                    event: React.ChangeEvent<
                      HTMLInputElement | HTMLTextAreaElement
                    >,
                  ) =>
                    setExam((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    })),
                };
                return (
                  <div
                    key={field.name}
                    className={
                      field.name === "treatmentPlan"
                        ? "space-y-2 sm:col-span-2"
                        : "space-y-2"
                    }
                  >
                    <Label htmlFor={props.id}>{field.label}</Label>
                    {field.multiline ? (
                      <Textarea {...props} rows={2} />
                    ) : (
                      <Input {...props} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {(!visit.prescription || isReplacement) && (
          <Card className="gap-4 border-slate-200/80 shadow-none p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Pill size={20} className="text-teal-700" aria-hidden="true" />{" "}
                Đơn thuốc
              </h2>
              <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="size-4 accent-teal-700"
                  checked={includePrescription}
                  disabled={
                    isReplacement ||
                    !recipient ||
                    Boolean(onSaveFamilyDraft) ||
                    visit.isFinalized
                  }
                  onChange={(event) => {
                    setIncludePrescription(event.target.checked);
                    setAuthorized(false);
                  }}
                />
                Kê đơn cho lần khám này
              </label>
            </div>
            {isReplacement && (
              <div className="space-y-2">
                <Label htmlFor={`${formId}-replacement-reason`}>
                  Lý do thay thế đơn *
                </Label>
                <Textarea
                  id={`${formId}-replacement-reason`}
                  required
                  minLength={10}
                  maxLength={2000}
                  value={replacementReason}
                  onChange={(event) => setReplacementReason(event.target.value)}
                />
                <p className="text-xs text-slate-600">
                  Khi lưu thành công, bản cũ được đánh dấu đã thay thế và vẫn
                  xem lại được.
                </p>
              </div>
            )}
            {!recipient && (
              <p className="text-sm text-slate-600">
                Chưa có người nhận đơn thuốc hợp lệ.
              </p>
            )}
            {includePrescription && (
              <>
                {drugs.map((drug, index) => (
                  <fieldset
                    key={drug.rowId}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:p-4"
                  >
                    <legend className="px-2 text-sm font-semibold text-slate-800">
                      Thuốc {index + 1}
                    </legend>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor={`${formId}-drug-${drug.rowId}-type`}>
                          Loại thuốc
                        </Label>
                        <select
                          id={`${formId}-drug-${drug.rowId}-type`}
                          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          value={drug.medicationType}
                          onChange={(event) =>
                            setDrugs((current) =>
                              current.map((row) =>
                                row.rowId === drug.rowId
                                  ? {
                                      ...row,
                                      medicationType: event.target
                                        .value as DrugRow["medicationType"],
                                    }
                                  : row,
                              ),
                            )
                          }
                        >
                          <option value="SINGLE_INGREDIENT">
                            Một hoạt chất — ghi tên INN
                          </option>
                          <option value="COMBINATION">
                            Thuốc phối hợp — ghi tên thương mại
                          </option>
                          <option value="BIOLOGICAL">
                            Sinh phẩm — ghi tên thương mại
                          </option>
                        </select>
                      </div>
                      {drugFields.map((field) => {
                        const id = `${formId}-drug-${drug.rowId}-${field.name}`;
                        return (
                          <div key={id} className="min-w-0 space-y-2">
                            <Label
                              htmlFor={id}
                              className="text-xs leading-snug"
                            >
                              {field.label}
                            </Label>
                            {field.name === "medicationName" && (
                              <p className="text-xs text-slate-600">
                                {drug.medicationType === "SINGLE_INGREDIENT"
                                  ? "Ghi tên INN hoặc INN (tên thương mại)."
                                  : "Ghi tên thương mại của thuốc phối hợp hoặc sinh phẩm."}
                              </p>
                            )}
                            <Input
                              id={id}
                              required={!field.optional}
                              type={field.max ? "number" : "text"}
                              min={field.max ? 1 : undefined}
                              max={field.max}
                              maxLength={field.maxLength}
                              value={drug[field.name]}
                              className="bg-white"
                              onChange={(event) => {
                                const value = event.target.value;
                                setDrugs((current) =>
                                  current.map((row) =>
                                    row.rowId === drug.rowId
                                      ? { ...row, [field.name]: value }
                                      : row,
                                  ),
                                );
                              }}
                            />
                          </div>
                        );
                      })}
                      <div className="space-y-2 text-xs">
                        <p className="font-medium">Đã bán</p>
                        <p className="text-slate-500">
                          Chưa có dữ liệu từ nhà thuốc
                        </p>
                      </div>
                    </div>
                    {drugs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-3 text-red-700"
                        aria-label={`Bỏ thuốc ${index + 1}`}
                        onClick={() =>
                          setDrugs((current) =>
                            current.filter((row) => row.rowId !== drug.rowId),
                          )
                        }
                      >
                        <Trash2 size={16} /> Bỏ thuốc
                      </Button>
                    )}
                  </fieldset>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  disabled={drugs.length >= 30}
                  onClick={() => {
                    const next = blankDrug(nextRowId.current++);
                    setDrugs((current) => [...current, next]);
                  }}
                >
                  <Plus size={16} /> Thêm thuốc
                </Button>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-prescription-instructions`}>
                    Lời dặn
                  </Label>
                  <Textarea
                    id={`${formId}-prescription-instructions`}
                    value={instructions}
                    maxLength={4000}
                    rows={3}
                    onChange={(event) => setInstructions(event.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-600">
                  Đơn thuốc có giá trị mua, lĩnh thuốc trong thời hạn tối đa 05
                  ngày kể từ ngày kê đơn. Khám lại khi có biểu hiện bất thường.
                  Mang theo đơn khi tái khám.
                </p>
              </>
            )}
          </Card>
        )}

        <Card className="gap-4 border-teal-200 bg-teal-50/70 shadow-none p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Xác nhận trang khám</h2>
            <p className="mt-1 text-sm text-slate-600">
              Bác sĩ kê đơn · {visit.doctorName}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Người được khám{" "}
              <strong className="text-slate-900">
                {visit.patient.fullName}
              </strong>
            </p>
            {includePrescription && recipient && (
              <p className="mt-1 text-sm text-slate-600">
                Người nhận đơn{" "}
                <strong className="text-slate-900">{recipient.name}</strong>
              </p>
            )}
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-teal-200 bg-white p-3 text-sm text-teal-950">
            <input
              type="checkbox"
              required
              className="mt-1 size-4 shrink-0 accent-teal-700"
              checked={authorized}
              onChange={(event) => setAuthorized(event.target.checked)}
            />
            <span>
              Tôi xác nhận nội dung và người được khám.
              {includePrescription &&
                " Tôi đã kiểm tra đơn và quyền của người nhận."}
            </span>
          </label>
          <p className="text-sm text-slate-600">
            Xác nhận nội bộ bằng tài khoản bác sĩ. Trang đã xác nhận sẽ được mở
            cho gia đình xem. Phần mã liên thông bác sĩ, mã CSYT và chữ ký số sẽ
            được bổ sung ở bước tích hợp ký số chính thức.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={!authorized || pending}
            className="self-start bg-teal-700 hover:bg-teal-800"
          >
            <FilePenLine size={16} aria-hidden="true" />{" "}
            {pending
              ? "Đang xác nhận…"
              : onSaveFamilyDraft
                ? "Thêm vào đơn gia đình"
                : isReplacement
                  ? "Lưu đơn thay thế và thông báo gia đình"
                  : includePrescription
                    ? "Xác nhận và gửi đơn"
                    : "Xác nhận trang khám"}
          </Button>
        </Card>
      </fieldset>
    </form>
  );
}
