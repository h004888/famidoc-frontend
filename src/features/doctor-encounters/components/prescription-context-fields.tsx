import type { BookVisitDetail } from "@/lib/api/medical-books.api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { patientAgeMonths } from "@/lib/prescription-rules";
import { useState } from "react";

export const emptyPrescriptionContext = {
  weightKg: "",
  citizenId: "",
  identityDocument: "",
  insuranceNumber: "",
  ethnicity: "",
  phone: "",
  address: "",
  conclusion: "",
  precautions: "",
  treatmentMode: "OUTPATIENT",
  followUpDays: "",
  caregiverName: "",
  longTermReason: "",
};
type ContextForm = typeof emptyPrescriptionContext;
const date = new Intl.DateTimeFormat("vi-VN", { timeZone: "UTC" });
const fields = [
  {
    key: "weightKg",
    label: "Cân nặng (kg)",
    type: "number",
    min: 0.1,
    max: 500,
    step: "0.01",
  },
  { key: "insuranceNumber", label: "Mã số BHYT (nếu có)", maxLength: 30 },
  {
    key: "identityDocument",
    label: "CMT/CCCD hoặc hộ chiếu (nếu có)",
    maxLength: 30,
  },
  { key: "ethnicity", label: "Dân tộc", maxLength: 50 },
  {
    key: "phone",
    label: "Số điện thoại",
    type: "tel",
    maxLength: 16,
    pattern: "\\+?[0-9]{9,15}",
    title: "Nhập từ 9 đến 15 chữ số, có thể bắt đầu bằng dấu +.",
  },
  {
    key: "citizenId",
    label: "Mã định danh công dân",
    maxLength: 12,
    pattern: "[0-9]{12}",
    title: "Nhập đủ 12 chữ số.",
  },
  { key: "address", label: "Nơi cư trú", maxLength: 500 },
] as const;

export function PrescriptionContextFields({
  visit,
  idPrefix,
  value,
  onChange,
}: {
  visit: BookVisitDetail;
  idPrefix: string;
  value: ContextForm;
  onChange: (value: ContextForm) => void;
}) {
  const [today] = useState(() =>
    new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const ageMonths = patientAgeMonths(visit.patient.dateOfBirth, today);
  const isYoungChild = ageMonths !== null && ageMonths < 72;
  return (
    <section aria-label="Thông tin đơn thuốc" className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 text-sm">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">
            Tên đơn vị ·{" "}
            {visit.facility?.facilityName || "Chưa có thông tin cơ sở y tế"}
          </p>
          <p className="text-slate-600">
            Địa chỉ · {visit.facility?.address || "Chưa có thông tin"}
          </p>
          <p className="text-xs text-slate-500">
            Mã cơ sở KCB liên thông · Chờ tích hợp
          </p>
          <p className="text-slate-600">
            Điện thoại đơn vị / bác sĩ ·{" "}
            {visit.facility?.phone || "Chưa có thông tin"}
          </p>
        </div>
        <div className="space-y-1 text-left text-xs text-slate-600 sm:text-right">
          <p>
            Loại đơn:{" "}
            <strong className="text-slate-900">Đơn thuốc thường (-c)</strong>
          </p>
          <div>
            Mã đơn thuốc
            <p className="mt-0.5 tabular-nums font-semibold text-slate-900">
              {visit.prescription?.prescriptionCode || "Cấp sau khi lưu đơn"}
            </p>
          </div>
        </div>
      </header>
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-wide text-slate-900">
          ĐƠN THUỐC
        </h2>
        <p className="text-xs text-slate-600">
          {visit.encounterType === "TELEHEALTH" ? "Khám từ xa" : "Khám tại nhà"}{" "}
          · Ngày khám {date.format(new Date(visit.scheduledDate))}
        </p>
        <p className="text-[11px] text-slate-500">
          Mô phỏng mẫu đơn ngoại trú theo Thông tư 26/2025/TT-BYT · Ngày kê và
          hạn lĩnh thuốc được cấp khi lưu
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rx-name`}>Họ tên</Label>
          <Input
            id={`${idPrefix}-rx-name`}
            readOnly
            value={visit.patient.fullName}
            className="bg-slate-50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rx-dob`}>Ngày sinh</Label>
          <Input
            id={`${idPrefix}-rx-dob`}
            readOnly
            value={date.format(new Date(visit.patient.dateOfBirth))}
            className="bg-slate-50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rx-gender`}>Giới tính</Label>
          <Input
            id={`${idPrefix}-rx-gender`}
            readOnly
            value={
              (
                { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" } as Record<
                  string,
                  string
                >
              )[visit.patient.gender ?? ""] || "Chưa có thông tin"
            }
            className="bg-slate-50"
          />
        </div>
        {isYoungChild && (
          <p className="self-center text-sm font-semibold text-teal-900">
            Tuổi tại ngày kê: {ageMonths} tháng · Cần cân nặng và người đưa trẻ
            đến khám
          </p>
        )}
        {fields.map(({ key, label, ...props }) => (
          <div
            key={key}
            className={
              key === "address" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"
            }
          >
            <Label htmlFor={`${idPrefix}-rx-${key}`} className="leading-snug">
              {label}
              {key === "address" ||
              key === "phone" ||
              (key === "weightKg" && isYoungChild)
                ? " *"
                : ""}
            </Label>
            <Input
              {...props}
              required={
                key === "address" ||
                key === "phone" ||
                (key === "weightKg" && isYoungChild)
              }
              id={`${idPrefix}-rx-${key}`}
              value={value[key]}
              onChange={(event) =>
                onChange({ ...value, [key]: event.target.value })
              }
            />
          </div>
        ))}
      </div>
      {visit.exam && (
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-[120px_1fr]">
          <div>
            <p className="text-xs text-slate-500">Mã ICD-10</p>
            <p className="mt-1 font-medium">{visit.exam.icd10Code}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Chẩn đoán</p>
            <p className="mt-1 font-medium">{visit.exam.icd10Diagnosis}</p>
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rx-conclusion`}>Kết luận</Label>
          <Textarea
            id={`${idPrefix}-rx-conclusion`}
            maxLength={2000}
            value={value.conclusion}
            onChange={(event) =>
              onChange({ ...value, conclusion: event.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rx-precautions`}>Lưu ý</Label>
          <Textarea
            id={`${idPrefix}-rx-precautions`}
            maxLength={2000}
            value={value.precautions}
            onChange={(event) =>
              onChange({ ...value, precautions: event.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rx-treatment`}>Hình thức điều trị</Label>
          <select
            id={`${idPrefix}-rx-treatment`}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={value.treatmentMode}
            onChange={(event) =>
              onChange({ ...value, treatmentMode: event.target.value })
            }
          >
            <option value="OUTPATIENT">Ngoại trú</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rx-followup`}>
            Hẹn tái khám sau (ngày)
          </Label>
          <Input
            id={`${idPrefix}-rx-followup`}
            type="number"
            min={1}
            max={365}
            value={value.followUpDays}
            onChange={(event) =>
              onChange({ ...value, followUpDays: event.target.value })
            }
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-rx-caregiver`}>
            Tên bố, mẹ hoặc người đưa trẻ đến khám{isYoungChild ? " *" : ""}
          </Label>
          <Input
            id={`${idPrefix}-rx-caregiver`}
            maxLength={200}
            required={isYoungChild}
            value={value.caregiverName}
            onChange={(event) =>
              onChange({ ...value, caregiverName: event.target.value })
            }
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-rx-longterm`}>
            Lý do kê trên 30 ngày (nếu có)
          </Label>
          <Textarea
            id={`${idPrefix}-rx-longterm`}
            maxLength={2000}
            value={value.longTermReason}
            onChange={(event) =>
              onChange({ ...value, longTermReason: event.target.value })
            }
            placeholder="Ghi tình trạng ổn định, căn cứ điều trị và lý do lựa chọn thời gian dùng thuốc"
          />
          <p className="text-xs text-slate-600">
            Tối đa 30 ngày với đơn thường; tối đa 90 ngày khi chẩn đoán thuộc
            Phụ lục VII và có lý do chuyên môn. Mẫu này không kê thuốc gây
            nghiện, hướng thần hoặc tiền chất.
          </p>
        </div>
      </div>
    </section>
  );
}
