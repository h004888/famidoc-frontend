import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ApiError } from "@/lib/http/errors";
import { AdminPaymentSettingsView } from "../components/admin-payment-settings-view";
import { paymentSettingsApi } from "@/lib/api/payment-settings.api";
vi.mock("@/features/auth/context/auth-context", () => ({
  useAuth: () => ({ role: "ADMIN" }),
}));
vi.mock("@/lib/api/payment-settings.api", () => ({
  paymentSettingsApi: {
    get: vi.fn(),
    save: vi.fn(),
    check: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
  },
}));
const saved = {
  environment: "LIVE",
  activeEnvironment: "LIVE",
  revision: 1,
  persisted: true,
  accountNumber: "00123456789",
  gateway: "MBBank",
  bankAccountId: "11111111-1111-4111-8111-111111111111",
  authMethod: "hmac",
  hasApiToken: true,
  hasWebhookSecret: true,
  hasWebhookApiKey: false,
  ttlMinutes: 15,
  webhookUrl: "/api/v1/payments/webhook/vietqr",
  simulation: false,
} as const;
describe("Admin payment settings form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentSettingsApi.get).mockResolvedValue(saved);
  });
  it("keeps draft across tabs and cancels to last loaded data", async () => {
    render(<AdminPaymentSettingsView />);
    const input = await screen.findByLabelText("Số tài khoản");
    expect(input).toHaveValue("00123456789");
    fireEvent.change(input, { target: { value: "00098765432" } });
    fireEvent.click(screen.getByRole("tab", { name: "Kết nối SePay" }));
    expect(screen.getByLabelText("API token")).toHaveValue("");
    fireEvent.click(screen.getByRole("tab", { name: "Tài khoản" }));
    expect(screen.getByLabelText("Số tài khoản")).toHaveValue("00098765432");
    fireEvent.click(screen.getByRole("button", { name: "Hủy thay đổi" }));
    expect(screen.getByLabelText("Số tài khoản")).toHaveValue("00123456789");
  });
  it("compares masked accounts before saving, then updates revision", async () => {
    vi.mocked(paymentSettingsApi.save).mockResolvedValue({
      ...saved,
      accountNumber: "00098765432",
      revision: 2,
    });
    render(<AdminPaymentSettingsView />);
    fireEvent.change(await screen.findByLabelText("Số tài khoản"), {
      target: { value: "00098765432" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("6789");
    expect(screen.getByRole("dialog")).toHaveTextContent("5432");
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận lưu" }));
    await waitFor(() =>
      expect(paymentSettingsApi.save).toHaveBeenCalledWith(
        expect.objectContaining({
          accountNumber: "00098765432",
          expectedRevision: 1,
        }),
      ),
    );
    expect(await screen.findByText(/Đã lưu phiên bản 2/)).toBeInTheDocument();
  });
  it("blocks saving after load failure and provides retry", async () => {
    vi.mocked(paymentSettingsApi.get).mockRejectedValue(
      new Error("unavailable"),
    );
    render(<AdminPaymentSettingsView />);
    expect(
      await screen.findByRole("button", { name: "Thử lại" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Lưu" }),
    ).not.toBeInTheDocument();
  });
  it("keeps a stale revision draft for recovery after 409", async () => {
    vi.mocked(paymentSettingsApi.save).mockRejectedValueOnce(
      new ApiError("conflict", 409),
    );
    render(<AdminPaymentSettingsView />);
    fireEvent.change(await screen.findByLabelText("Số tài khoản"), {
      target: { value: "00098765432" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Xác nhận lưu" }),
    );
    expect(
      await screen.findByRole("button", { name: "Tải bản mới" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Số tài khoản")).toHaveValue("00098765432");
  });
  it("invalidates late draft-check results on edits and blocks double check requests", async () => {
    let resolve!: (
      value: Awaited<ReturnType<typeof paymentSettingsApi.check>>,
    ) => void;
    vi.mocked(paymentSettingsApi.check).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<AdminPaymentSettingsView />);
    await screen.findByLabelText("Số tài khoản");
    fireEvent.click(screen.getByRole("tab", { name: "Test cấu hình" }));
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra cấu hình" }));
    expect(
      screen.getByRole("button", { name: "Đang kiểm tra…" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Đang kiểm tra…" }));
    expect(paymentSettingsApi.check).toHaveBeenCalledTimes(1);
    expect(paymentSettingsApi.check).toHaveBeenCalledWith(
      expect.not.objectContaining({ apiToken: expect.anything() }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Tài khoản" }));
    fireEvent.change(screen.getByLabelText("Số tài khoản"), {
      target: { value: "00098765432" },
    });
    await act(async () => {
      resolve({
        draftFingerprint: "old-draft",
        checks: [
          { code: "SEPAY_API_ACCESS", status: "PASS", message: "OLD_RESULT" },
        ],
      });
    });
    fireEvent.click(screen.getByRole("tab", { name: "Test cấu hình" }));
    expect(screen.queryByText("OLD_RESULT")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mở hướng dẫn test" }),
    ).toBeDisabled();
  });
});
