"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/context/auth-context";
import {
  paymentSettingsApi,
  type PaymentSettings,
  type PaymentSettingsDraft,
  type PaymentSettingsCheck,
  type PaymentEnvironment,
} from "@/lib/api/payment-settings.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  maskPaymentAccount,
  settingsDraft,
  settingsPayload,
  validateSettings,
} from "../payment-settings-form";
import { PaymentTestDialog } from "./payment-test-dialog";
import { RevenueShareCard } from "./revenue-share-card";

const tabs = ["Tài khoản", "Kết nối SePay", "Test cấu hình"];
const checkLabels: Record<string, string> = {
  REQUIRED_FIELDS: "Dữ liệu",
  SEPAY_API_ACCESS: "Truy cập API",
  ACCOUNT_MATCH: "ID SePay khớp tài khoản",
  WEBHOOK_RECEIPT: "Nhận webhook",
};
const statusLabels: Record<string, string> = {
  PASS: "Đạt",
  FAIL: "Không đạt",
  UNVERIFIED: "Chưa xác minh",
  SKIPPED: "Chưa kiểm tra",
};
function SettingsField({
  field,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  field: string;
  label: string;
  hint: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={`payment-${field}`} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={`payment-${field}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={field === "accountNumber" ? "numeric" : undefined}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-describedby={`payment-${field}-hint`}
      />
      <p
        id={`payment-${field}-hint`}
        className={error ? "text-sm text-red-700" : "text-sm text-slate-500"}
      >
        {error ?? hint}
      </p>
    </div>
  );
}
function SettingsSecret({
  field,
  label,
  hasSecret,
  replacing,
  value,
  error,
  onChange,
  onToggle,
}: {
  field: string;
  label: string;
  hasSecret: boolean;
  replacing: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`payment-${field}`} className="text-sm font-medium">
          {label}
        </label>
        {hasSecret && (
          <Button type="button" variant="outline" size="sm" onClick={onToggle}>
            {replacing ? "Giữ khóa cũ" : `Thay ${label}`}
          </Button>
        )}
      </div>
      <Input
        id={`payment-${field}`}
        type="password"
        value={value}
        disabled={hasSecret && !replacing}
        autoComplete="new-password"
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={`payment-${field}-hint`}
      />
      <p
        id={`payment-${field}-hint`}
        className={error ? "text-sm text-red-700" : "text-sm text-slate-500"}
      >
        {error ??
          (hasSecret
            ? "Đã cấu hình. Để trống để giữ khóa đã lưu."
            : "Chưa cấu hình. Nhập khóa mới.")}
      </p>
    </div>
  );
}
export function AdminPaymentSettingsView() {
  const { role } = useAuth();
  const [environment, setEnvironment] = useState<PaymentEnvironment>("LIVE");
  const [saved, setSaved] = useState<PaymentSettings | null>(null);
  const [draft, setDraft] = useState<PaymentSettingsDraft | null>(null);
  const [tab, setTab] = useState(0),
    [retry, setRetry] = useState(0);
  const [loadError, setLoadError] = useState(false),
    [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof PaymentSettingsDraft, string>>
  >({});
  const [replacing, setReplacing] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState(false),
    [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false),
    [check, setCheck] = useState<PaymentSettingsCheck | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const generation = useRef(0),
    mounted = useRef(true),
    busyCheck = useRef(false),
    busySave = useRef(false);
  const dirty = Boolean(
    saved &&
    draft &&
    JSON.stringify(draft) !== JSON.stringify(settingsDraft(saved)),
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (role !== "ADMIN") return;
    let active = true;
    generation.current++;
    setSaved(null);
    setDraft(null);
    setLoadError(false);
    setNotice("");
    setCheck(null);
    setErrors({});
    setReplacing({});
    void paymentSettingsApi
      .get(environment)
      .then((data) => {
        if (active) {
          setSaved(data);
          setDraft(settingsDraft(data));
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [environment, retry, role]);
  function edit<K extends keyof PaymentSettingsDraft>(
    key: K,
    value: PaymentSettingsDraft[K],
  ) {
    generation.current++;
    setCheck(null);
    setNotice("");
    setErrors({});
    setDraft((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );
  }
  function cancel() {
    if (!saved) return;
    generation.current++;
    setDraft(settingsDraft(saved));
    setCheck(null);
    setErrors({});
    setReplacing({});
    setNotice("");
  }
  function validate() {
    if (!draft || !saved) return false;
    const next = validateSettings(draft, saved);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      setTab(["gateway", "accountNumber"].includes(first) ? 0 : 1);
      setTimeout(() => document.getElementById(`payment-${first}`)?.focus(), 0);
      return false;
    }
    return true;
  }
  async function save() {
    if (!draft || busySave.current || !validate()) return;
    busySave.current = true;
    setSaving(true);
    setNotice("");
    try {
      const result = await paymentSettingsApi.save(settingsPayload(draft));
      if (!mounted.current) return;
      generation.current++;
      setSaved(result);
      setDraft(settingsDraft(result));
      setReplacing({});
      setCheck(null);
      setConfirm(false);
      setNotice(`Đã lưu phiên bản ${result.revision}.`);
    } catch (error) {
      if (mounted.current) {
        setConfirm(false);
        setNotice(
          typeof error === "object" &&
            error &&
            "status" in error &&
            error.status === 409
            ? "Cấu hình đã thay đổi. Bản nháp được giữ lại; tải bản mới trước khi nhập lại."
            : "Không lưu được cấu hình. Bản nháp được giữ lại, vui lòng thử lại.",
        );
      }
    } finally {
      busySave.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  async function runCheck() {
    if (!draft || busyCheck.current || !validate()) return;
    busyCheck.current = true;
    setChecking(true);
    setCheck(null);
    setNotice("");
    const version = generation.current;
    try {
      const result = await paymentSettingsApi.check(settingsPayload(draft));
      if (mounted.current && version === generation.current) setCheck(result);
    } catch {
      if (mounted.current && version === generation.current)
        setNotice("Không kiểm tra được cấu hình. Vui lòng thử lại.");
    } finally {
      busyCheck.current = false;
      if (mounted.current) setChecking(false);
    }
  }
  if (role !== "ADMIN")
    return (
      <p role="alert" className="p-6">
        Chỉ quản trị viên được truy cập cấu hình thanh toán.
      </p>
    );
  if (loadError)
    return (
      <Card className="m-4 space-y-4 p-6">
        <p role="alert">Không tải được cấu hình thanh toán.</p>
        <Button onClick={() => setRetry((value) => value + 1)}>Thử lại</Button>
      </Card>
    );
  if (!saved || !draft)
    return (
      <div
        role="status"
        className="m-6 animate-pulse rounded-xl bg-slate-200 p-12"
      >
        Đang tải cấu hình…
      </div>
    );
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Cấu hình thanh toán"
        description="Quản lý tài khoản nhận tiền, kết nối SePay và kiểm tra nhận giao dịch."
      />
      <RevenueShareCard />
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <label className="flex items-center gap-3 text-sm font-medium">
            Môi trường cấu hình
            <select
              aria-label="Môi trường cấu hình"
              className="rounded-md border bg-white p-2"
              value={environment}
              disabled={dirty || saving || checking}
              onChange={(event) =>
                setEnvironment(event.target.value as PaymentEnvironment)
              }
            >
              <option value="LIVE">LIVE</option>
              <option value="TEST">TEST</option>
            </select>
          </label>
          <p className="text-sm text-slate-600">
            Đang vận hành: <strong>{saved.activeEnvironment}</strong> · Phiên
            bản {saved.revision}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Cấu hình thanh toán"
          className="grid grid-cols-3 border-b bg-slate-50 p-2"
        >
          {tabs.map((label, index) => (
            <button
              key={label}
              id={`payment-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={tab === index}
              aria-controls={`payment-panel-${index}`}
              tabIndex={tab === index ? 0 : -1}
              disabled={saving}
              onClick={() => setTab(index)}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : (tab + (event.key === "ArrowLeft" ? 2 : 1)) % 3;
                setTab(next);
                document.getElementById(`payment-tab-${next}`)?.focus();
              }}
              className={`min-h-12 rounded-md px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary ${tab === index ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:bg-white/60"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg border bg-slate-50 p-3 text-sm"
            >
              {notice}
              {notice.includes("tải bản mới") && (
                <Button
                  variant="link"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Tải bản mới
                </Button>
              )}
            </div>
          )}
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="text-sm text-red-700">
              Kiểm tra các trường được đánh dấu trước khi tiếp tục.
            </p>
          )}
          <fieldset disabled={saving} className="min-w-0">
            <div
              role="tabpanel"
              id={`payment-panel-${tab}`}
              aria-labelledby={`payment-tab-${tab}`}
              className="space-y-6"
            >
              {tab === 0 && (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <SettingsField
                      field="gateway"
                      label="Ngân hàng"
                      hint="Tên gateway do SePay gửi, ví dụ MBBank."
                      value={draft.gateway}
                      error={errors.gateway}
                      onChange={(value) => edit("gateway", value)}
                    />
                    <SettingsField
                      field="accountNumber"
                      label="Số tài khoản"
                      hint="Giữ nguyên các chữ số 0 ở đầu."
                      value={draft.accountNumber}
                      error={errors.accountNumber}
                      onChange={(value) => edit("accountNumber", value)}
                    />
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 text-sm">
                    <p className="font-medium">Thời hạn mã QR: 15 phút</p>
                    <p className="mt-2 text-slate-600">
                      Cấu hình mới áp dụng cho yêu cầu tạo mới. Hóa đơn và mã QR
                      đã phát hành giữ nguyên tài khoản nhận tiền.
                    </p>
                  </div>
                </>
              )}
              {tab === 1 && (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <SettingsField
                      field="bankAccountId"
                      label="ID tài khoản SePay"
                      hint="UUID của tài khoản trong SePay."
                      value={draft.bankAccountId}
                      error={errors.bankAccountId}
                      onChange={(value) => edit("bankAccountId", value)}
                    />
                    <SettingsSecret
                      field="apiToken"
                      label="API token"
                      hasSecret={saved.hasApiToken}
                      replacing={Boolean(replacing.apiToken)}
                      value={draft.apiToken ?? ""}
                      error={errors.apiToken}
                      onChange={(value) => edit("apiToken", value)}
                      onToggle={() => {
                        setReplacing((previous) => ({
                          ...previous,
                          apiToken: !previous.apiToken,
                        }));
                        edit("apiToken", "");
                      }}
                    />
                  </div>
                  <label className="block space-y-2 text-sm font-medium">
                    Xác thực webhook
                    <select
                      aria-label="Xác thực webhook"
                      className="block w-full rounded-md border bg-white p-2"
                      value={draft.authMethod}
                      onChange={(event) =>
                        edit(
                          "authMethod",
                          event.target.value as "hmac" | "apikey",
                        )
                      }
                    >
                      <option value="hmac">HMAC-SHA256</option>
                      <option value="apikey">API key</option>
                    </select>
                  </label>
                  {draft.authMethod === "hmac" ? (
                    <SettingsSecret
                      field="webhookSecret"
                      label="Khóa HMAC"
                      hasSecret={saved.hasWebhookSecret}
                      replacing={Boolean(replacing.webhookSecret)}
                      value={draft.webhookSecret ?? ""}
                      error={errors.webhookSecret}
                      onChange={(value) => edit("webhookSecret", value)}
                      onToggle={() => {
                        setReplacing((previous) => ({
                          ...previous,
                          webhookSecret: !previous.webhookSecret,
                        }));
                        edit("webhookSecret", "");
                      }}
                    />
                  ) : (
                    <SettingsSecret
                      field="webhookApiKey"
                      label="Webhook API key"
                      hasSecret={saved.hasWebhookApiKey}
                      replacing={Boolean(replacing.webhookApiKey)}
                      value={draft.webhookApiKey ?? ""}
                      error={errors.webhookApiKey}
                      onChange={(value) => edit("webhookApiKey", value)}
                      onToggle={() => {
                        setReplacing((previous) => ({
                          ...previous,
                          webhookApiKey: !previous.webhookApiKey,
                        }));
                        edit("webhookApiKey", "");
                      }}
                    />
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor="payment-webhook-url"
                      className="text-sm font-medium"
                    >
                      Đường dẫn webhook
                    </label>
                    <Input
                      id="payment-webhook-url"
                      readOnly
                      value={saved.webhookUrl}
                    />
                    <p className="text-sm text-slate-500">
                      Dùng tên miền API đang triển khai cùng đường dẫn này trong
                      SePay.
                    </p>
                  </div>
                </>
              )}
              {tab === 2 && (
                <>
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold">Kiểm tra bản nháp</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {draft.gateway || "Ngân hàng"} /{" "}
                          {maskPaymentAccount(draft.accountNumber)} · Không lưu
                          cấu hình
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        disabled={checking}
                        onClick={() => void runCheck()}
                      >
                        {checking ? "Đang kiểm tra…" : "Kiểm tra cấu hình"}
                      </Button>
                    </div>
                    <ul
                      aria-live="polite"
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      {(
                        check?.checks ??
                        Object.keys(checkLabels).map((code) => ({
                          code,
                          status: "UNVERIFIED",
                          message: "Chưa kiểm tra.",
                        }))
                      ).map((item) => (
                        <li
                          key={item.code}
                          className="rounded-lg border p-4 text-sm"
                        >
                          <span className="font-medium">
                            {checkLabels[item.code]} —{" "}
                            {statusLabels[item.status] ?? "Chưa xác minh"}
                          </span>
                          <p className="mt-1 text-slate-500">{item.message}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="space-y-3 border-t pt-5">
                    <h2 className="font-semibold">Test nhận giao dịch</h2>
                    <p className="text-sm text-slate-600">
                      Tạo mã riêng để kiểm tra nhận webhook. Khoản test không
                      ghi nhận doanh thu và không tự hoàn tiền.
                    </p>
                    <Button
                      disabled={
                        dirty ||
                        !saved.persisted ||
                        saved.revision < 1 ||
                        environment !== saved.activeEnvironment ||
                        checking
                      }
                      onClick={() => setTestOpen(true)}
                    >
                      Mở hướng dẫn test
                    </Button>
                    {dirty && (
                      <p className="text-sm text-amber-800">
                        Lưu cấu hình trước khi tạo phiên test.
                      </p>
                    )}
                    {environment !== saved.activeEnvironment && (
                      <p className="text-sm text-amber-800">
                        Chỉ tạo phiên test trong môi trường đang vận hành.
                      </p>
                    )}
                  </section>
                </>
              )}
            </div>
          </fieldset>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-slate-50 p-4">
          <Button
            variant="outline"
            disabled={!dirty || saving}
            onClick={cancel}
          >
            Hủy thay đổi
          </Button>
          <Button
            disabled={!dirty || saving || checking}
            onClick={() => {
              if (validate()) setConfirm(true);
            }}
          >
            Lưu
          </Button>
        </div>
      </Card>
      <Dialog
        open={confirm}
        onOpenChange={(value) => {
          if (!saving) setConfirm(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận lưu cấu hình thanh toán</DialogTitle>
            <DialogDescription>
              Thông tin mới áp dụng cho yêu cầu tạo mới. Tiếp tục theo dõi tài
              khoản cũ để nhận tiền về muộn.
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Tài khoản hiện tại</dt>
              <dd className="mt-1 font-medium">
                {saved.gateway} / {maskPaymentAccount(saved.accountNumber)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Tài khoản mới</dt>
              <dd className="mt-1 font-medium">
                {draft.gateway} / {maskPaymentAccount(draft.accountNumber)}
              </dd>
            </div>
          </dl>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setConfirm(false)}
            >
              Quay lại
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Đang lưu…" : "Xác nhận lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {testOpen && (
        <PaymentTestDialog
          settings={saved}
          onClose={() => setTestOpen(false)}
        />
      )}
    </main>
  );
}
