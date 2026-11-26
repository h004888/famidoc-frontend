import { expect, test } from '@playwright/test';
import {
  FRONTEND_URL,
  loginRealSession,
  runHomeVisitSeedScript,
} from './helpers/home-visit-e2e-helper';

test.describe.serial('Home Visit Dual-Lane Family Full-Stack E2E (Playwright + PostgreSQL)', () => {
  let seed: {
    success: boolean;
    ids: { enc_family_confirm: string };
    emails: { family: string; doctor: string };
    password: string;
  };

  test.beforeAll(() => {
    seed = runHomeVisitSeedScript('seed');
    expect(seed.success).toBe(true);
  });

  test.afterAll(() => {
    const cleaned = runHomeVisitSeedScript<{ success: boolean }>('cleanup');
    expect(cleaned.success).toBe(true);
  });

  test('E2E-04: Làn Gia đình xác nhận 1 chạm bác sĩ có mặt trên DB thật', async ({
    page,
  }) => {
    const { origin } = await loginRealSession(page, seed.emails.family, seed.password);
    await page.goto(`${origin}/family/appointments`);

    const confirmPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/encounters/${seed.ids.enc_family_confirm}/confirm-arrival`) &&
        res.request().method() === 'PATCH',
    );
    const confirmBtn = page.getByRole('button', {
      name: /Bác sĩ ĐÃ ĐẾN/i,
    }).first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
    await page.getByRole('button', { name: /Để sau, đóng lại/i }).click();
    const confirmRes = await confirmPromise;
    expect(confirmRes.status()).toBe(200);

    await expect
      .poll(() => {
        const db = runHomeVisitSeedScript<{
          encounters: Array<{
            id: string;
            encounter_status: string;
            family_confirmed_arrival_at: string | null;
          }>;
        }>('inspect');
        const row = db.encounters.find((e) => e.id === seed.ids.enc_family_confirm);
        return row?.encounter_status;
      })
      .toBe('PENDING_RECORD');
  });
});
