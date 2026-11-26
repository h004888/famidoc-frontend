import type {
  PaymentSettings,
  PaymentSettingsDraft,
} from "@/lib/api/payment-settings.api";
export function settingsDraft(saved: PaymentSettings): PaymentSettingsDraft {
  return {
    environment: saved.environment,
    expectedRevision: saved.revision,
    accountNumber: saved.accountNumber,
    gateway: saved.gateway,
    bankAccountId: saved.bankAccountId,
    authMethod: saved.authMethod,
    apiToken: "",
    webhookSecret: "",
    webhookApiKey: "",
  };
}
export function settingsPayload(
  draft: PaymentSettingsDraft,
): PaymentSettingsDraft {
  const { apiToken, webhookSecret, webhookApiKey, ...fields } = draft;
  return {
    ...fields,
    gateway: fields.gateway.trim(),
    bankAccountId: fields.bankAccountId.trim(),
    ...(apiToken?.trim() ? { apiToken: apiToken.trim() } : {}),
    ...(webhookSecret?.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
    ...(webhookApiKey?.trim() ? { webhookApiKey: webhookApiKey.trim() } : {}),
  };
}
export function validateSettings(
  draft: PaymentSettingsDraft,
  saved: PaymentSettings,
) {
  const errors: Partial<Record<keyof PaymentSettingsDraft, string>> = {};
  if (!/^\d{5,19}$/.test(draft.accountNumber))
    errors.accountNumber = "Nhập từ 5 đến 19 chữ số.";
  if (!draft.gateway.trim() || draft.gateway.trim().length > 100)
    errors.gateway = "Nhập ngân hàng, tối đa 100 ký tự.";
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(draft.bankAccountId))
    errors.bankAccountId = "Nhập ID UUID do SePay cung cấp.";
  if (
    draft.environment === "LIVE" &&
    (/^0+$/.test(draft.accountNumber) || /test/i.test(draft.gateway))
  )
    errors.accountNumber = "LIVE cần tài khoản thật.";
  if (!draft.apiToken?.trim() && !saved.hasApiToken)
    errors.apiToken = "Cần API token.";
  if ((draft.apiToken?.trim().length ?? 0) > 4096)
    errors.apiToken = "Token tối đa 4096 ký tự.";
  const secretField =
    draft.authMethod === "hmac" ? "webhookSecret" : "webhookApiKey";
  const hasSecret =
    draft.authMethod === "hmac"
      ? saved.hasWebhookSecret
      : saved.hasWebhookApiKey;
  const secret = draft[secretField]?.trim();
  if (
    (!secret && !hasSecret) ||
    (secret && (secret.length < 32 || secret.length > 4096))
  )
    errors[secretField] = "Khóa cần từ 32 đến 4096 ký tự.";
  return errors;
}
export const maskPaymentAccount = (account: string) =>
  account ? `••••${account.slice(-4)}` : "Chưa cấu hình";
