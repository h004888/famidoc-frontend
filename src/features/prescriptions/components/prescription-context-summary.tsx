import type { PrescriptionContext } from "@/lib/api/prescriptions.api";

export function PrescriptionContextSummary({
  context,
}: {
  context?: PrescriptionContext | null;
}) {
  if (!context) return null;
  const fields = [
    [
      "Tuổi tại ngày kê",
      context.ageMonths !== undefined && context.ageMonths < 72
        ? `${context.ageMonths} tháng`
        : undefined,
    ],
    ["Lý do kê dài ngày", context.longTermReason],
    ["Cân nặng", context.weightKg ? `${context.weightKg} kg` : undefined],
    ["Mã số BHYT", context.insuranceNumber],
    ["CMT/CCCD hoặc hộ chiếu", context.identityDocument],
    ["Mã định danh công dân", context.citizenId],
    ["Dân tộc", context.ethnicity],
    ["Số điện thoại", context.phone],
    ["Nơi cư trú", context.address],
    ["Kết luận", context.conclusion],
    ["Lưu ý", context.precautions],
    [
      "Hình thức điều trị",
      context.treatmentMode === "INPATIENT"
        ? "Nội trú"
        : context.treatmentMode === "OUTPATIENT"
          ? "Ngoại trú"
          : undefined,
    ],
    [
      "Hẹn tái khám",
      context.followUpDays
        ? `Sau ${context.followUpDays} ngày hoặc khi có biểu hiện bất thường`
        : undefined,
    ],
    ["Bố, mẹ hoặc người đưa trẻ đến khám", context.caregiverName],
  ];
  return (
    <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
      {fields.map(([label, value]) =>
        value ? (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words font-medium text-slate-900">
              {value}
            </dd>
          </div>
        ) : null,
      )}
    </dl>
  );
}
