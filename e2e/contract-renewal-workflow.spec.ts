import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:4100';
const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3100';
const SEPAY_API_KEY =
  process.env.SEPAY_WEBHOOK_API_KEY || 'e2e-sepay-key-at-least-32-characters-long';
const SEED_SCRIPT = path.resolve(__dirname, 'scripts', 'contract-renewal-e2e-seed.py');

interface SeedData {
  success: boolean;
  ids: Record<string, string>;
  password: string;
  dates: {
    vn_today: string;
    a_end: string;
    a_next_start: string;
    b_end: string;
  };
  emails: Record<string, string>;
}

interface InspectData {
  success: boolean;
  contracts: Array<{
    id: string;
    contract_number: string;
    family_id: string;
    contract_status: string;
    upgraded_from_id: string | null;
    start_date: string;
    end_date: string;
    remaining_home_visits: number;
    remaining_telehealth: number;
    member_count: number;
    documenso_envelope_id: string | null;
    hold_expires_at: string | null;
    renewal_confirmation: Record<string, unknown> | null;
  }>;
  signatures: Array<{
    contract_id: string;
    signer_role: string;
    signer_user_id: string;
    terms_hash: string;
  }>;
  members: Array<{ contract_id: string; patient_id: string }>;
  invoices: Array<{
    id: string;
    contract_id: string;
    invoice_code: string;
    payment_status: string;
  }>;
  notifications: Array<{
    user_id: string;
    type: string;
    title: string;
    reference_id: string;
  }>;
  doctor: { id: string; active_panel_count: number };
}

function runSeedScript<T>(action: 'seed' | 'inspect' | 'cleanup'): T {
  const out = execFileSync('python', [SEED_SCRIPT, action], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out) as T;
}

function originForRole(feRole: string): string {
  const url = new URL(FRONTEND_URL);
  if (url.hostname === 'localhost') {
    if (feRole === 'DOCTOR') return `${url.protocol}//bacsi.localhost:${url.port || '3100'}`;
    if (feRole === 'ADMIN') return `${url.protocol}//admin.localhost:${url.port || '3100'}`;
    if (feRole === 'FACILITY') return `${url.protocol}//csyt.localhost:${url.port || '3100'}`;
  }
  return FRONTEND_URL;
}

function mapRoleToFrontendCookie(backendRole: string): string {
  if (backendRole === 'FAMILY_REP') return 'FAMILY';
  if (backendRole === 'HEALTHCARE_FACILITY') return 'FACILITY';
  return backendRole;
}

async function attachBackendForwarder(page: Page) {
  await page.route('http://localhost:4000/**', async (route) => {
    const targetUrl = route.request().url().replace('http://localhost:4000', BACKEND_URL);
    await route.continue({ url: targetUrl });
  });
}

async function loginSession(page: Page, email: string, password: string) {
  const res = await page.request.post(`${BACKEND_URL}/api/v1/auth/login`, {
    data: { email, password },
  });
  expect(res.ok(), `Login failed for ${email}: ${await res.text()}`).toBeTruthy();
  const envelope = await res.json();
  const payload = envelope?.data ?? envelope;
  const accessToken: string = payload.accessToken;
  const refreshToken: string = payload.refreshToken || '';
  const user = payload.user;
  const feRole = mapRoleToFrontendCookie(payload.role || user?.role || '');

  const authUser = {
    id: user.id,
    name: user.fullName || user.email,
    phone: user.phone || '',
    email: user.email,
    role: feRole,
    avatarText: (user.fullName || 'E2').slice(0, 2).toUpperCase(),
    mustChangePassword: false,
  };

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
      userJson: JSON.stringify(authUser),
    },
  );

  await page.context().clearCookies();
  await page.context().addCookies([
    { name: 'famidoc_token', value: accessToken, url: targetOrigin },
    { name: 'famidoc_role', value: feRole, url: targetOrigin },
  ]);

  return { accessToken, user, role: feRole, origin: targetOrigin };
}

test.describe.serial('Contract Renewal Workflow E2E (Docker Postgres + NestJS + Next.js)', () => {
  let seedData: SeedData;

  test.beforeAll(() => {
    seedData = runSeedScript<SeedData>('seed');
  });

  test.afterAll(() => {
    runSeedScript('cleanup');
  });

  test('Case A (ACTIVE): Nhắc hạn 7 ngày -> Mở ContractRenewalDialog -> Xác nhận R8 -> VietQR -> SePay Webhook -> PENDING_ACTIVATION & đồng bộ 4 cổng', async ({
    page,
  }) => {
    await attachBackendForwarder(page);
    await loginSession(page, seedData.emails.family_a, seedData.password);

    // 1. Kiểm tra banner nhắc hạn 7 ngày trên FamilyDashboardView
    await page.goto(`${FRONTEND_URL}/family`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Hợp đồng sắp hết hạn/i)).toBeVisible({ timeout: 15_000 });

    // 2. Vào trang chi tiết hợp đồng ACTIVE -> Mở ContractRenewalDialog
    await page.goto(`${FRONTEND_URL}/family/subscription/${seedData.ids.contract_a}`, {
      waitUntil: 'domcontentloaded',
    });
    const renewBtn = page.getByRole('button', { name: /Gia hạn hợp đồng/i });
    await expect(renewBtn).toBeVisible({ timeout: 15_000 });
    await renewBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Gói Gia Đình E2E 3 Tháng')).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(/Gia hạn nối tiếp/i)).toBeVisible();
    await expect(dialog.getByText(/3\.500\.000 đ/)).toBeVisible();

    // Nút Xác nhận gia hạn bị disabled khi chưa tick checkbox
    const confirmBtn = dialog.getByRole('button', { name: /Xác nhận gia hạn/i });
    await expect(confirmBtn).toBeDisabled();
    await dialog.getByRole('checkbox').click();
    await expect(confirmBtn).toBeEnabled();

    // 3. Bấm Xác nhận gia hạn -> Tạo kỳ mới PENDING_PAYMENT + VietQR
    await confirmBtn.click();
    await expect(dialog.getByText(/Thanh toán VietQR để kích hoạt kỳ gia hạn/i)).toBeVisible({
      timeout: 15_000,
    });
    const codeText = await dialog.locator('strong.font-mono').textContent();
    const paymentCode = (codeText || '').trim();
    expect(paymentCode).toMatch(/^FD[A-Z0-9]+$/);

    // 4. Giả lập SePay Webhook thanh toán đúng số tiền & mã
    const vnNow = new Date(Date.now() + 7 * 3_600_000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    const webhookRes = await page.request.post(`${BACKEND_URL}/api/v1/payments/webhook/vietqr`, {
      headers: {
        Authorization: `Apikey ${SEPAY_API_KEY}`,
      },
      data: {
        id: 990001,
        gateway: 'TEST_BANK',
        transactionDate: vnNow,
        accountNumber: '0000000000',
        code: paymentCode,
        content: `${paymentCode} E2E CASE A`,
        transferType: 'in',
        transferAmount: 3_500_000,
        referenceCode: 'FT-E2E-CASE-A',
      },
    });
    expect(webhookRes.ok(), `Webhook failed: ${await webhookRes.text()}`).toBeTruthy();

    // 5. Bấm Kiểm tra thanh toán trên UI -> Hiện trạng thái Đã thanh toán – chờ hiệu lực
    await dialog.getByRole('button', { name: /Kiểm tra thanh toán/i }).click();
    await expect(dialog.getByText(/Đã thanh toán – chờ hiệu lực/i)).toBeVisible({
      timeout: 15_000,
    });

    // 6. Inspect Docker Postgres trực tiếp: kiểm tra toàn bộ dữ liệu lưu trữ
    const db = runSeedScript<InspectData>('inspect');
    const oldA = db.contracts.find((c) => c.id === seedData.ids.contract_a);
    const newA = db.contracts.find(
      (c) => c.upgraded_from_id === seedData.ids.contract_a,
    );
    expect(oldA?.contract_status).toBe('ACTIVE');
    expect(newA).toBeTruthy();
    expect(newA?.contract_status).toBe('PENDING_ACTIVATION');
    expect(newA?.start_date.slice(0, 10)).toBe(seedData.dates.a_next_start);
    expect(newA?.documenso_envelope_id).toBeNull();
    expect(newA?.hold_expires_at).toBeNull();
    expect(newA?.remaining_home_visits).toBe(3); // Không cộng dồn 2 lượt cũ (R5)
    expect(newA?.remaining_telehealth).toBe(20); // Không cộng dồn 9 lượt cũ (R5)
    expect(newA?.member_count).toBe(2);
    expect(newA?.renewal_confirmation).toBeTruthy();

    const sigsA = db.signatures.filter((s) => s.contract_id === newA!.id);
    expect(sigsA).toHaveLength(1);
    expect(sigsA[0].signer_role).toBe('FAMILY_REP');

    const membersA = db.members.filter((m) => m.contract_id === newA!.id);
    expect(membersA).toHaveLength(2);

    const invA = db.invoices.find((i) => i.contract_id === newA!.id);
    expect(invA?.payment_status).toBe('PAID');

    const notifA = db.notifications.filter(
      (n) => n.reference_id === newA!.id && n.type === 'CONTRACT_RENEWED',
    );
    expect(notifA.length).toBeGreaterThanOrEqual(1);

    // 7. Xem trang chi tiết kỳ mới trên UI Gia đình -> Bản ghi xác nhận trực tuyến
    await page.goto(`${FRONTEND_URL}/family/subscription/${newA!.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText('Đã thanh toán – chờ hiệu lực')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Bản ghi xác nhận gia hạn trực tuyến/i)).toBeVisible();

    // 8. Kiểm tra đồng bộ hiển thị trên cổng Admin & Bác sĩ
    const adminSession = await loginSession(page, seedData.emails.admin, seedData.password);
    await page.goto(`${adminSession.origin}/admin/contracts`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText(newA!.contract_number).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Đã thanh toán – chờ hiệu lực').first()).toBeVisible();

    const doctorSession = await loginSession(page, seedData.emails.doctor, seedData.password);
    await page.goto(`${doctorSession.origin}/doctor/contracts`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText(newA!.contract_number).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Case B (EXPIRED trong ân hạn) & Case TERMINATED (R4): Mở cổng gia hạn Case B, kích hoạt ACTIVE ngay và chặn TERMINATED', async ({
    page,
  }) => {
    await attachBackendForwarder(page);

    // 1. Family B (chỉ có hợp đồng EXPIRED trong ân hạn) mở được /family/subscription/[id]
    await loginSession(page, seedData.emails.family_b, seedData.password);
    await page.goto(`${FRONTEND_URL}/family/subscription/${seedData.ids.contract_b}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('button', { name: /Gia hạn hợp đồng/i })).toBeVisible({
      timeout: 15_000,
    });

    // Trang dịch vụ y tế (/family/appointments) vẫn bị khóa về /doctors
    await page.goto(`${FRONTEND_URL}/family/appointments`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url) => url.pathname === '/doctors', { timeout: 15_000 });

    // Quay lại gia hạn Case B
    await page.goto(`${FRONTEND_URL}/family/subscription/${seedData.ids.contract_b}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByRole('button', { name: /Gia hạn hợp đồng/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Gia hạn trong thời gian ân hạn/i)).toBeVisible({
      timeout: 10_000,
    });
    await dialog.getByRole('checkbox').click();
    await dialog.getByRole('button', { name: /Xác nhận gia hạn/i }).click();
    await expect(dialog.getByText(/Thanh toán VietQR để kích hoạt kỳ gia hạn/i)).toBeVisible({
      timeout: 15_000,
    });
    const codeB = ((await dialog.locator('strong.font-mono').textContent()) || '').trim();
    const vnNow = new Date(Date.now() + 7 * 3_600_000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    const webhookRes = await page.request.post(`${BACKEND_URL}/api/v1/payments/webhook/vietqr`, {
      headers: { Authorization: `Apikey ${SEPAY_API_KEY}` },
      data: {
        id: 990002,
        gateway: 'TEST_BANK',
        transactionDate: vnNow,
        accountNumber: '0000000000',
        code: codeB,
        content: `${codeB} E2E CASE B`,
        transferType: 'in',
        transferAmount: 3_500_000,
        referenceCode: 'FT-E2E-CASE-B',
      },
    });
    expect(webhookRes.ok()).toBeTruthy();

    await dialog.getByRole('button', { name: /Kiểm tra thanh toán/i }).click();
    await expect(dialog.getByText(/Hợp đồng gia hạn đã có hiệu lực/i)).toBeVisible({
      timeout: 15_000,
    });

    const db = runSeedScript<InspectData>('inspect');
    const newB = db.contracts.find(
      (c) => c.upgraded_from_id === seedData.ids.contract_b,
    );
    expect(newB?.contract_status).toBe('ACTIVE');
    expect(newB?.start_date.slice(0, 10)).toBe(seedData.dates.vn_today);
    expect(db.doctor.active_panel_count).toBeGreaterThanOrEqual(2);

    // 2. Family C (TERMINATED) -> Không hiển thị nút Gia hạn, hiển thị Mua gói mới
    await loginSession(page, seedData.emails.family_c, seedData.password);
    await page.goto(`${FRONTEND_URL}/family/subscription/${seedData.ids.contract_c}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText(`#${'MC-E2E-CASE-C'}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Gia hạn hợp đồng/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Mua gói mới/i })).toBeVisible();
  });
});
