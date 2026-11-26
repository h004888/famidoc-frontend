import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentTestDialog } from "../components/payment-test-dialog";
import {
  paymentSettingsApi,
  type PaymentSettings,
  type PaymentTestSession,
} from "@/lib/api/payment-settings.api";
vi.mock("@/lib/api/payment-settings.api", () => ({
  paymentSettingsApi: { createSession: vi.fn(), getSession: vi.fn() },
}));
const settings = {
  environment: "LIVE",
  activeEnvironment: "LIVE",
  revision: 2,
} as PaymentSettings;
const session = {
  id: "session-a",
  code: "PTC" + "A".repeat(24),
  status: "PENDING",
  amountVnd: 1000,
  account: { accountNumber: "00123456789", gateway: "MBBank" },
  expiresAt: "2026-11-25T10:00:08Z",
  finalizeAt: "2026-11-26T10:00:08Z",
  qrUrl: "https://vietqr.app/img",
  observation: null,
} as PaymentTestSession;
describe("Payment test dialog lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T10:00:00Z"));
    vi.mocked(paymentSettingsApi.createSession).mockResolvedValue(session);
    vi.mocked(paymentSettingsApi.getSession).mockResolvedValue(session);
  });
  afterEach(() => vi.useRealTimers());
  it("requires LIVE confirmation and stops polling at QR expiry without creating another session", async () => {
    const close = vi.fn();
    render(<PaymentTestDialog settings={settings} onClose={close} />);
    expect(screen.getByRole("button", { name: "Tạo mã test" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Tôi xác nhận chuyển tiền thật/));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tạo mã test" }));
    });
    expect(screen.getByAltText("Mã QR test giao dịch")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(
      screen.queryByAltText("Mã QR test giao dịch"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Đang chờ webhook/)).toBeInTheDocument();
    const calls = vi.mocked(paymentSettingsApi.getSession).mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(paymentSettingsApi.getSession).toHaveBeenCalledTimes(calls);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Kiểm tra lại" }));
    });
    expect(paymentSettingsApi.createSession).toHaveBeenCalledTimes(1);
  });
  it("retains requestId when retrying a failed create request", async () => {
    vi.mocked(paymentSettingsApi.createSession).mockRejectedValueOnce(
      new Error("network"),
    );
    render(
      <PaymentTestDialog
        settings={{ ...settings, environment: "TEST" }}
        onClose={() => {}}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tạo mã test" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tạo mã test" }));
    });
    expect(
      vi.mocked(paymentSettingsApi.createSession).mock.calls[0][0].requestId,
    ).toBe(
      vi.mocked(paymentSettingsApi.createSession).mock.calls[1][0].requestId,
    );
  });
  it("stops timers after success and on unmount", async () => {
    vi.mocked(paymentSettingsApi.getSession).mockResolvedValueOnce({
      ...session,
      status: "SUCCEEDED",
    });
    const { unmount } = render(
      <PaymentTestDialog
        settings={{ ...settings, environment: "TEST" }}
        onClose={() => {}}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tạo mã test" }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(
      screen.getByText("Đã nhận webhook và khớp giao dịch"),
    ).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(paymentSettingsApi.getSession).toHaveBeenCalledTimes(1);
    unmount();
    const beforeUnmountCalls = vi.mocked(paymentSettingsApi.getSession).mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(paymentSettingsApi.getSession).toHaveBeenCalledTimes(beforeUnmountCalls);
  });
  it("shows API-only evidence without declaring webhook success and keeps session after status failure", async () => {
    vi.mocked(paymentSettingsApi.createSession).mockResolvedValueOnce({
      ...session,
      apiSeenAt: "2026-11-25T10:00:01Z",
      observation: "API_SEEN_WEBHOOK_PENDING",
    });
    vi.mocked(paymentSettingsApi.getSession).mockRejectedValueOnce(
      new Error("network"),
    );
    const { unmount } = render(
      <PaymentTestDialog
        settings={{ ...settings, environment: "TEST" }}
        onClose={() => {}}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tạo mã test" }));
    });
    expect(
      screen.getByText(/Đã thấy giao dịch trên API, chưa nhận webhook/),
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Kiểm tra lại" }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Giữ nguyên phiên");
    expect(paymentSettingsApi.createSession).toHaveBeenCalledTimes(1);
    expect(paymentSettingsApi.getSession).toHaveBeenCalledWith(session.id);
    unmount();
    const beforeUnmountCalls = vi.mocked(paymentSettingsApi.getSession).mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(paymentSettingsApi.getSession).toHaveBeenCalledTimes(beforeUnmountCalls);
  });
});
