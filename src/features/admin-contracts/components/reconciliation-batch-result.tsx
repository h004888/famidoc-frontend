import type { SePayReconciliationResultDto } from "@/lib/api/finance.api";
import { Button } from "@/components/ui/button";
const labels: Record<string, string> = {
  SUCCEEDED: "Hoàn tất",
  FAILED: "Thất bại",
  PARTIAL: "Hoàn tất một phần",
  RUNNING: "Đang đồng bộ",
};
export function ReconciliationBatchResult({
  result,
  onReload,
}: {
  result: SePayReconciliationResultDto;
  onReload: () => void;
}) {
  if (
    !("resultKind" in result) ||
    result.resultKind !== "BATCH" ||
    !("runs" in result) ||
    !Array.isArray(result.runs)
  )
    return null;
  return (
    <section
      aria-label="Kết quả đối soát từng tài khoản"
      className="space-y-4 rounded-xl border bg-white p-5"
    >
      <h3 className="font-semibold">
        {labels[result.status] ?? "Kết quả đối soát"}
      </h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {result.runs.map((run) => (
          <li key={run.id} className="space-y-2 rounded-lg border p-4 text-sm">
            <p className="break-all font-medium">
              Tài khoản {run.monitoredAccountId ?? run.id}
            </p>
            <p>{labels[run.status] ?? "Chưa xác định"}</p>
            <p>Bổ sung {run.backfilledCount ?? 0} giao dịch</p>
            {run.status === "FAILED" && (
              <p className="text-red-700">
                Không đồng bộ được tài khoản này. Kiểm tra kết nối SePay rồi thử
                lại.
              </p>
            )}
          </li>
        ))}
      </ul>
      <Button variant="outline" onClick={onReload}>
        Tải lại lịch sử tài khoản
      </Button>
    </section>
  );
}
