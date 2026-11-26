import { describe, it, expect, vi, afterEach } from "vitest";
import { paymentSettingsApi } from "../payment-settings.api";
import { httpClient } from "../http-client";
describe("paymentSettingsApi", () => {
  afterEach(() => vi.restoreAllMocks());
  it("unwraps GET with no-store and never invents masked secrets", async () => {
    const data = { revision: 3, hasApiToken: true };
    const spy = vi
      .spyOn(httpClient, "get")
      .mockResolvedValue({ success: true, data });
    expect(await paymentSettingsApi.get("TEST")).toEqual(data);
    expect(spy).toHaveBeenCalledWith(
      "/api/v1/payments/admin/settings",
      { environment: "TEST" },
      { cache: "no-store" },
    );
  });
  it("reads session status without creating another session", async () => {
    const get = vi
      .spyOn(httpClient, "get")
      .mockResolvedValue({
        data: { status: "WAITING_WEBHOOK" },
        success: true,
      });
    const post = vi.spyOn(httpClient, "post");
    expect((await paymentSettingsApi.getSession("id/one")).status).toBe(
      "WAITING_WEBHOOK",
    );
    expect(get).toHaveBeenCalledWith(
      "/api/v1/payments/admin/settings/test-sessions/id%2Fone",
      undefined,
      { cache: "no-store" },
    );
    expect(post).not.toHaveBeenCalled();
  });
});
