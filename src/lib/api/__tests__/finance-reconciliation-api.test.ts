import { afterEach, describe, expect, it, vi } from "vitest";
import { financeApi } from "../finance.api";
import { httpClient } from "../http-client";
describe("Finance reconciliation response compatibility", () => {
  afterEach(() => vi.restoreAllMocks());
  it.each([
    { id: "legacy-run", status: "SUCCEEDED", backfilledCount: 0 },
    {
      id: "persisted-batch",
      resultKind: "BATCH",
      status: "PARTIAL",
      backfilledCount: 0,
      runs: [{ id: "account-run" }],
    },
  ])("preserves single/batch response and zero counts", async (data) => {
    const post = vi
      .spyOn(httpClient, "post")
      .mockResolvedValue({ success: true, data });
    expect(
      await financeApi.runSePayReconciliation({ environment: "TEST" }),
    ).toEqual(data);
    expect(post).toHaveBeenCalledWith("/api/v1/finance/reconciliation/sepay", {
      environment: "TEST",
    });
  });
});
