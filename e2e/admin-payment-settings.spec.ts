import { execFileSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';
const DB_SCRIPT = path.resolve(__dirname, 'scripts', 'payment-settings-e2e-db.cjs');

interface SeedInfo {
  adminEmail: string;
  adminId: string;
  familyEmail: string;
  familyId: string;
  password: string;
}

interface InspectInfo {
  revisions: number;
  monitoredAccounts: number;
  testSessions: Array<{ id: string; code: string; status: string; amountVnd: number }>;
  testDeliveries: Array<{ id: string; source: string; sessionId: string | null; providerTransactionId: string }>;
  invoices: number;
  paymentTransactions: number;
  batches: Array<{ id: string; status: string; environment: string }>;
  runs: Array<{ id: string; batchId: string | null; monitoredAccountId: string | null; status: string }>;
}

function runDb<T>(action: 'seed' | 'inspect'): T {
  const out = execFileSync('node', [DB_SCRIPT, action], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out) as T;
}

function originForRole(role: string): string {
  const url = new URL(FRONTEND_URL);
  if (url.hostname === 'localhost' && role === 'ADMIN') {
    return `${url.protocol}//admin.localhost:${url.port || '3000'}`;
  }
  return FRONTEND_URL;
}

async function loginAs(page: Page, email: string, password: string): Promise<{ accessToken: string; origin: string }> {
  const res = await page.request.post(`${BACKEND_URL}/api/v1/auth/login`, {
    data: { email, password },
  });
  expect(res.ok(), `Login failed for ${email}: ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  const payload = body?.data ?? body;
  const accessToken: string = payload.accessToken;
  const refreshToken: string = payload.refreshToken || '';
  const user = payload.user;
  const feRole = user.role === 'FAMILY_REP' ? 'FAMILY' : user.role;

  const targetOrigin = originForRole(feRole);
  await page.goto(`${targetOrigin}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ token, refresh, role, userJson }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('famidoc_token', token);
      window.localStorage.setItem('famidoc_role', role);
      window.localStorage.setItem('famidoc_user', userJson);
      if (refresh) window.localStorage.setItem('famidoc_refresh_token', refresh);
    },
    {
      token: accessToken,
      refresh: refreshToken,
      role: feRole,
      userJson: JSON.stringify({
        id: user.id,
        name: user.fullName || user.email,
        phone: user.phone || '',
        email: user.email,
        role: feRole,
        avatarText: 'AD',
        mustChangePassword: false,
      }),
    },
  );
  await page.context().clearCookies();
  await page.context().addCookies([
    { name: 'famidoc_token', value: accessToken, url: targetOrigin },
    { name: 'famidoc_role', value: feRole, url: targetOrigin },
  ]);
  return { accessToken, origin: targetOrigin };
}

test.describe.serial('Admin Payment Settings & Reconciliation Fullstack E2E', () => {
  let seed: SeedInfo;
  const webhookSecretA = 'secret-a-'.padEnd(36, 'a');
  const webhookSecretB = 'secret-b-'.padEnd(36, 'b');
  const bankUuidA = randomUUID();
  const bankUuidB = randomUUID();

  test.beforeAll(() => {
    seed = runDb<SeedInfo>('seed');
  });

  test('blocks non-admin access on both UI and backend API', async ({ page }) => {
    const { accessToken, origin } = await loginAs(page, seed.familyEmail, seed.password);
    const apiRes = await page.request.get(`${BACKEND_URL}/api/v1/payments/admin/settings?environment=TEST`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(apiRes.status()).toBe(403);

    await page.goto(`${origin}/admin/payment-settings`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/403|\/family|\/login/);
  });

  test('saves revision 1 (account A), preserves draft across tabs, cancels, checks draft, tests live webhook & isolates business', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const { accessToken, origin } = await loginAs(page, seed.adminEmail, seed.password);

    await page.goto(`${origin}/admin/payment-settings`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Cấu hình thanh toán' })).toBeVisible();

    // Switch to TEST (active environment on backend)
    await page.getByLabel('Môi trường cấu hình').selectOption('TEST');
    await expect(page.getByLabel('Ngân hàng')).toBeVisible();

    // Tab 1: Tài khoản (with leading zero)
    await page.getByLabel('Ngân hàng').fill('MBBank');
    await page.getByLabel('Số tài khoản').fill('00123456789');

    // Tab 2: Kết nối SePay — verify draft preserved when switching back
    await page.getByRole('tab', { name: 'Kết nối SePay' }).click();
    await page.getByLabel('ID tài khoản SePay').fill(bankUuidA);
    await page.getByLabel('API token').fill('token-e2e-a');
    await page.getByLabel('Khóa HMAC').fill(webhookSecretA);
    await expect(page.getByLabel('Đường dẫn webhook')).toHaveValue('/api/v1/payments/webhook/vietqr');

    await page.getByRole('tab', { name: 'Tài khoản' }).click();
    await expect(page.getByLabel('Số tài khoản')).toHaveValue('00123456789');

    // Cancel resets draft
    await page.getByRole('button', { name: 'Hủy thay đổi' }).click();
    await expect(page.getByLabel('Số tài khoản')).toHaveValue('');

    // Re-enter Account A and Save via modal
    await page.getByLabel('Ngân hàng').fill('MBBank');
    await page.getByLabel('Số tài khoản').fill('00123456789');
    await page.getByRole('tab', { name: 'Kết nối SePay' }).click();
    await page.getByLabel('ID tài khoản SePay').fill(bankUuidA);
    await page.getByLabel('API token').fill('token-e2e-a');
    await page.getByLabel('Khóa HMAC').fill(webhookSecretA);

    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Xác nhận lưu' }).click();
    await expect(page.getByText('Đã lưu phiên bản 1.')).toBeVisible();

    // Reload and verify masked secrets + persisted leading zero
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByLabel('Môi trường cấu hình').selectOption('TEST');
    await expect(page.getByLabel('Số tài khoản')).toHaveValue('00123456789');
    await page.getByRole('tab', { name: 'Kết nối SePay' }).click();
    await expect(page.getByLabel('API token')).toBeDisabled();
    await expect(page.getByLabel('API token')).toHaveValue('');

    // Verify 409 STALE_REVISION via API
    const staleRes = await page.request.patch(`${BACKEND_URL}/api/v1/payments/admin/settings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        environment: 'TEST',
        expectedRevision: 0,
        accountNumber: '00123456789',
        gateway: 'MBBank',
        bankAccountId: bankUuidA,
        authMethod: 'hmac',
      },
    });
    expect(staleRes.status()).toBe(409);

    // Change draft to Account B without saving -> Check draft (must NOT persist revision 2)
    await page.getByRole('tab', { name: 'Tài khoản' }).click();
    await page.getByLabel('Số tài khoản').fill('00987654321');
    await page.getByRole('tab', { name: 'Kết nối SePay' }).click();
    await page.getByLabel('ID tài khoản SePay').fill(bankUuidB);
    await page.getByRole('button', { name: 'Thay Khóa HMAC' }).click();
    await page.getByLabel('Khóa HMAC').fill(webhookSecretB);

    await page.getByRole('tab', { name: 'Test cấu hình' }).click();
    // Dirty draft blocks opening test transaction modal
    await expect(page.getByRole('button', { name: 'Mở hướng dẫn test' })).toBeDisabled();
    await page.getByRole('button', { name: 'Kiểm tra cấu hình' }).click();
    await expect(page.getByText('Dữ liệu — Đạt')).toBeVisible({ timeout: 40_000 });
    await expect(page.getByText('Nhận webhook — Chưa xác minh')).toBeVisible();

    // Confirm DB still has only 1 revision
    expect(runDb<InspectInfo>('inspect').revisions).toBe(1);

    // Save Account B (revision 2)
    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByRole('dialog').getByText('••••6789')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('••••4321')).toBeVisible();
    await page.getByRole('button', { name: 'Xác nhận lưu' }).click();
    await expect(page.getByText('Đã lưu phiên bản 2.')).toBeVisible();

    // Open Test Transaction dialog and create PTC session
    await page.getByRole('button', { name: 'Mở hướng dẫn test' }).click();
    await page.getByLabel('Số tiền test (VND)').fill('10000');
    await page.getByRole('button', { name: 'Tạo mã test' }).click();

    await expect(page.getByText('Chờ chuyển khoản và nhận webhook')).toBeVisible();
    const afterCreate = runDb<InspectInfo>('inspect');
    expect(afterCreate.testSessions).toHaveLength(1);
    const sessionCode = afterCreate.testSessions[0].code;
    expect(sessionCode).toMatch(/^PTC[A-F0-9]{24}$/);
    expect(sessionCode).not.toContain('FD');
    await expect(page.getByText(sessionCode)).toBeVisible();

    // Send real signed HMAC webhook directly to backend
    const rawBody = JSON.stringify({
      id: 990001,
      gateway: 'MBBank',
      accountNumber: '00987654321',
      transferType: 'in',
      transferAmount: 10000,
      content: `Thanh toan ${sessionCode}`,
      transactionDate: new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 19).replace('T', ' '),
    });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const sig =
      'sha256=' +
      createHmac('sha256', webhookSecretB).update(timestamp).update('.').update(rawBody).digest('hex');

    const webhookRes = await page.request.post(`${BACKEND_URL}/api/v1/payments/webhook/vietqr`, {
      headers: {
        'content-type': 'application/json',
        'x-sepay-timestamp': timestamp,
        'x-sepay-signature': sig,
      },
      data: rawBody,
    });
    expect(webhookRes.ok(), `Webhook failed: ${await webhookRes.text()}`).toBeTruthy();

    // Wait for 3-second polling on UI to transition to SUCCEEDED
    await expect(page.getByText('Đã nhận webhook và khớp giao dịch')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Đóng' }).click();

    // Verify complete isolation from business tables in PostgreSQL
    const afterWebhook = runDb<InspectInfo>('inspect');
    expect(afterWebhook.invoices).toBe(0);
    expect(afterWebhook.paymentTransactions).toBe(0);
    expect(afterWebhook.testSessions[0].status).toBe('SUCCEEDED');
    expect(afterWebhook.testDeliveries).toHaveLength(1);
  });

  test('runs batch reconciliation on /admin/reconciliation across monitored accounts A & B', async ({ page }) => {
    const { accessToken, origin } = await loginAs(page, seed.adminEmail, seed.password);
    await page.goto(`${origin}/admin/reconciliation`, { waitUntil: 'networkidle' });

    // Call reconciliation endpoint directly from UI or verify batch contract
    const res = await page.request.post(`${BACKEND_URL}/api/v1/finance/reconciliation/sepay`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { environment: 'TEST' },
    });
    // Even if SePay sandbox is unreachable offline, batch is persisted with FAILED/PARTIAL for both A & B
    expect(res.ok()).toBeTruthy();
    const envelope = await res.json();
    const batch = envelope?.data ?? envelope;
    expect(batch.resultKind).toBe('BATCH');
    expect(batch.runs).toHaveLength(2);

    const inspected = runDb<InspectInfo>('inspect');
    expect(inspected.batches).toHaveLength(1);
    expect(inspected.runs.filter((r) => r.batchId === batch.id)).toHaveLength(2);
  });
});
