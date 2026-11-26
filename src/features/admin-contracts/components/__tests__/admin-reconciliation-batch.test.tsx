import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ReconciliationBatchResult } from "../reconciliation-batch-result";
import type { SePayReconciliationRunDto } from "@/lib/api/finance.api";
describe("Account reconciliation batch result", () => {
  it("shows partial A failure/B success, preserves zero and sanitizes errors", () => {
    const reload = vi.fn();
    const base = {
      id: "persisted-batch",
      status: "PARTIAL",
      resultKind: "BATCH",
      runs: [
        {
          id: "run-a",
          monitoredAccountId: "account-a",
          status: "FAILED",
          backfilledCount: 0,
          errors: [{ message: "Bearer private-secret" }],
        },
        {
          id: "run-b",
          monitoredAccountId: "account-b",
          status: "SUCCEEDED",
          backfilledCount: 2,
        },
      ],
    } as unknown as SePayReconciliationRunDto & {
      resultKind: string;
      runs: SePayReconciliationRunDto[];
    };
    render(<ReconciliationBatchResult result={base} onReload={reload} />);
    expect(screen.getByText("Hoàn tất một phần")).toBeInTheDocument();
    expect(screen.getByText(/account-a/)).toBeInTheDocument();
    expect(screen.getByText("Bổ sung 0 giao dịch")).toBeInTheDocument();
    expect(screen.getByText("Bổ sung 2 giao dịch")).toBeInTheDocument();
    expect(screen.queryByText(/private-secret/)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Tải lại lịch sử tài khoản" }),
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("accepts legacy single-run result", () => {
    const { container } = render(
      <ReconciliationBatchResult
        result={{ status: "SUCCEEDED" } as SePayReconciliationRunDto}
        onReload={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
