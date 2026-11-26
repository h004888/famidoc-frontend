import { httpClient } from "./http-client";
import { unwrapApiEnvelope } from "./envelope";
export type PaymentEnvironment = "TEST" | "LIVE";
export interface PaymentSettings {
  environment: PaymentEnvironment;
  activeEnvironment: PaymentEnvironment;
  revision: number;
  persisted: boolean;
  accountNumber: string;
  gateway: string;
  bankAccountId: string;
  authMethod: "hmac" | "apikey";
  ttlMinutes: number;
  hasApiToken: boolean;
  hasWebhookSecret: boolean;
  hasWebhookApiKey: boolean;
  webhookUrl: string;
  simulation: boolean;
}
export interface PaymentSettingsDraft {
  environment: PaymentEnvironment;
  expectedRevision: number;
  accountNumber: string;
  gateway: string;
  bankAccountId: string;
  authMethod: "hmac" | "apikey";
  apiToken?: string;
  webhookSecret?: string;
  webhookApiKey?: string;
}
export interface PaymentSettingsCheck {
  draftFingerprint: string;
  checks: { code: string; status: string; message: string }[];
}
export interface PaymentTestSession {
  id: string;
  environment: PaymentEnvironment;
  revisionId: string;
  amountVnd: number;
  code: string;
  account: { gateway: string; accountNumber: string };
  createdAt: string;
  expiresAt: string;
  finalizeAt: string;
  status: "PENDING" | "WAITING_WEBHOOK" | "SUCCEEDED" | "EXPIRED";
  observation: string | null;
  qrUrl: string | null;
  webhookMatchedAt: string | null;
  apiSeenAt: string | null;
}
export interface CreatePaymentTest {
  environment: PaymentEnvironment;
  revision: number;
  requestId: string;
  amountVnd: number;
  confirmRealMoney?: boolean;
}
export const paymentSettingsApi = {
  async get(environment: PaymentEnvironment): Promise<PaymentSettings> {
    return unwrapApiEnvelope(
      await httpClient.get(
        "/api/v1/payments/admin/settings",
        { environment },
        { cache: "no-store" },
      ),
    );
  },
  async save(draft: PaymentSettingsDraft): Promise<PaymentSettings> {
    return unwrapApiEnvelope(
      await httpClient.patch("/api/v1/payments/admin/settings", draft),
    );
  },
  async check(draft: PaymentSettingsDraft): Promise<PaymentSettingsCheck> {
    return unwrapApiEnvelope(
      await httpClient.post("/api/v1/payments/admin/settings/check", draft),
    );
  },
  async createSession(dto: CreatePaymentTest): Promise<PaymentTestSession> {
    return unwrapApiEnvelope(
      await httpClient.post(
        "/api/v1/payments/admin/settings/test-sessions",
        dto,
      ),
    );
  },
  async getSession(id: string): Promise<PaymentTestSession> {
    return unwrapApiEnvelope(
      await httpClient.get(
        `/api/v1/payments/admin/settings/test-sessions/${encodeURIComponent(id)}`,
        undefined,
        { cache: "no-store" },
      ),
    );
  },
};
