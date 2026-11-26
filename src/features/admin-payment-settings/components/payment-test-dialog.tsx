"use client";
import { useEffect, useRef, useState } from "react";
import {
  paymentSettingsApi,
  type PaymentSettings,
} from "@/lib/api/payment-settings.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { maskPaymentAccount } from "../payment-settings-form";
import { usePaymentTestPolling } from "../use-payment-test-polling";

const statuses = {
  PENDING: "Chờ chuyển khoản và nhận webhook",
  WAITING_WEBHOOK: "Đang chờ webhook — mã QR đã hết hạn",
  SUCCEEDED: "Đã nhận webhook và khớp giao dịch",
  EXPIRED: "Phiên test đã hết hạn chờ webhook",
};
export function PaymentTestDialog({
  settings,
  onClose,
}: {
  settings: PaymentSettings;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("1000"),
    [confirmed, setConfirmed] = useState(false),
    [creating, setCreating] = useState(false),
    [createError, setCreateError] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const alive = useRef(true),
    busy = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const { session, accept, error, reading, refresh } = usePaymentTestPolling();
  const amountValid =
    /^\d+$/.test(amount) && Number(amount) >= 1000 && Number(amount) <= 100000;
  async function create() {
    if (
      busy.current ||
      !amountValid ||
      (settings.environment === "LIVE" && !confirmed)
    )
      return;
    busy.current = true;
    setCreating(true);
    setCreateError("");
    try {
      const result = await paymentSettingsApi.createSession({
        environment: settings.environment,
        revision: settings.revision,
        requestId,
        amountVnd: Number(amount),
        ...(settings.environment === "LIVE"
          ? { confirmRealMoney: confirmed }
          : {}),
      });
      if (alive.current) accept(result);
    } catch {
      if (alive.current)
        setCreateError(
          "Chưa tạo được phiên test. Thử lại sẽ dùng cùng yêu cầu.",
        );
    } finally {
      busy.current = false;
      if (alive.current) setCreating(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Test nhận giao dịch</DialogTitle>
          <DialogDescription>
            Chuyển khoản theo hướng dẫn để kiểm tra webhook. Khoản test không
            kích hoạt hợp đồng và không tự hoàn tiền.
          </DialogDescription>
        </DialogHeader>
        {!session ? (
          <div className="space-y-4">
            <label
              htmlFor="payment-test-amount"
              className="block text-sm font-medium"
            >
              Số tiền test (VND)
            </label>
            <Input
              id="payment-test-amount"
              inputMode="numeric"
              value={amount}
              disabled={creating}
              onChange={(event) => setAmount(event.target.value)}
              aria-describedby="payment-test-amount-hint"
            />
            <p id="payment-test-amount-hint" className="text-sm text-slate-500">
              Nhập số nguyên từ 1.000 đến 100.000 VND.
            </p>
            {settings.environment === "LIVE" && (
              <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmed}
                  disabled={creating}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                <span>
                  Tôi xác nhận chuyển tiền thật trong môi trường LIVE và tự xử
                  lý khoản tiền test.
                </span>
              </label>
            )}
            {settings.simulation && (
              <p className="rounded-lg bg-slate-50 p-3 text-sm">
                Simulation không tạo QR chuyển tiền thật. Dùng nguồn giao dịch
                thử hợp lệ.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p
              role="status"
              aria-live="polite"
              className="rounded-lg border bg-slate-50 p-3 font-medium"
            >
              {statuses[session.status]}
            </p>
            {session.status === "PENDING" && session.qrUrl && (
              <div className="flex justify-center rounded-lg border bg-white p-3">
                {/* QR contains a pinned account snapshot, not a secret. */}
                {}
                <img
                  src={session.qrUrl}
                  alt="Mã QR test giao dịch"
                  width={240}
                  height={240}
                  className="max-w-full"
                />
              </div>
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt>Ngân hàng</dt>
              <dd className="font-medium">{session.account.gateway}</dd>
              <dt>Tài khoản</dt>
              <dd>{maskPaymentAccount(session.account.accountNumber)}</dd>
              <dt>Số tiền</dt>
              <dd className="font-semibold">
                {session.amountVnd.toLocaleString("vi-VN")} VND
              </dd>
              <dt>Nội dung</dt>
              <dd className="break-all font-medium">{session.code}</dd>
              <dt>Hạn QR</dt>
              <dd>{new Date(session.expiresAt).toLocaleString("vi-VN")}</dd>
              <dt>Chờ webhook tới</dt>
              <dd>{new Date(session.finalizeAt).toLocaleString("vi-VN")}</dd>
            </dl>
            <ul className="space-y-2 rounded-lg border p-4 text-sm">
              <li>✓ Cấu hình đã lưu</li>
              <li>
                {session.apiSeenAt
                  ? "✓ Đã thấy giao dịch trên API"
                  : "○ Chưa thấy giao dịch trên API"}
              </li>
              <li>
                {session.status === "SUCCEEDED"
                  ? "✓ Webhook được xác thực và khớp tài khoản, tiền, mã, thời gian"
                  : "○ Chưa nhận webhook hợp lệ khớp giao dịch"}
              </li>
            </ul>
            {session.observation === "API_SEEN_WEBHOOK_PENDING" &&
              session.status !== "SUCCEEDED" && (
                <p className="text-sm text-amber-800">
                  Đã thấy giao dịch trên API, chưa nhận webhook. Kết quả API
                  chưa chứng minh webhook hoạt động.
                </p>
              )}
            {session.status === "WAITING_WEBHOOK" && (
              <p className="text-sm text-slate-600">
                Không chuyển khoản theo QR đã hết hạn. Thông báo giao dịch có
                thể đến muộn; dùng Kiểm tra lại để đọc kết quả của phiên này.
              </p>
            )}
          </div>
        )}
        {(createError || error) && (
          <p role="alert" aria-live="polite" className="text-sm text-red-700">
            {createError || error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {!session ? (
            <Button
              disabled={
                creating ||
                !amountValid ||
                (settings.environment === "LIVE" && !confirmed)
              }
              onClick={() => void create()}
            >
              {creating ? "Đang tạo…" : "Tạo mã test"}
            </Button>
          ) : (
            !["SUCCEEDED", "EXPIRED"].includes(session.status) && (
              <Button
                disabled={reading}
                onClick={() => void refresh(session.id)}
              >
                {reading ? "Đang đọc…" : "Kiểm tra lại"}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
