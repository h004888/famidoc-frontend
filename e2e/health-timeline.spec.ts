import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';
const SEED_SCRIPT = path.resolve(
  __dirname,
  'scripts',
  'health-timeline-e2e-seed.py',
);

interface SeedResult {
  success: boolean;
  ids: {
    family_user: string;
    doctor1_user: string;
    doctor2_user: string;
    doctor3_user: string;
    family_unit: string;
    patient: string;
    patient_paged: string;
    enc_doc1_final: string;
    enc_doc1_unfinal: string;
    enc_doc2_final: string;
  };
  emails: {
    family: string;
    doctor1: string;
    doctor2: string;
    doctor3: string;
  };
  password: string;
}

interface InspectAuditResult {
  success: boolean;
  audits: Array<{
    actor_user_id: string;
    action: string;
    resource_id: string;
  }>;
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
    if (feRole === 'DOCTOR') return `${url.protocol}//bacsi.localhost:${url.port || '3000'}`;
    if (feRole === 'ADMIN') return `${url.protocol}//admin.localhost:${url.port || '3000'}`;
    if (feRole === 'FACILITY') return `${url.protocol}//csyt.localhost:${url.port || '3000'}`;
  }
  return FRONTEND_URL;
}

function mapRoleToFrontendCookie(backendRole: string): string {
  if (backendRole === 'FAMILY_REP') return 'FAMILY';
  if (backendRole === 'HEALTHCARE_FACILITY') return 'FACILITY';
  return backendRole;
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
    {
      name: 'famidoc_user',
      value: encodeURIComponent(JSON.stringify(authUser)),
      url: targetOrigin,
    },
    ...(refreshToken
      ? [{ name: 'famidoc_refresh_token', value: refreshToken, url: targetOrigin }]
      : []),
  ]);

  return { accessToken, origin: targetOrigin };
}

test.describe.serial('Health Timeline MVP Full-Stack E2E (Playwright + PostgreSQL)', () => {
  let seed: SeedResult;

  test.beforeAll(() => {
    seed = runSeedScript<SeedResult>('seed');
    expect(seed.success).toBe(true);
  });

  test.afterAll(() => {
    const cleaned = runSeedScript<{ success: boolean }>('cleanup');
    expect(cleaned.success).toBe(true);
  });

  test('E2E-01: Gia đình xem Dòng thời gian, ẩn lượt chưa chốt, mở chi tiết & quay lại không gọi lại API', async ({
    page,
  }) => {
    const { origin } = await loginSession(page, seed.emails.family, seed.password);

    let timelineCalls = 0;
    page.on('request', (req) => {
      if (req.url().includes(`/patients/${seed.ids.patient}/timeline`)) {
        timelineCalls += 1;
      }
    });

    await page.goto(`${origin}/family/medical-book`, { waitUntil: 'domcontentloaded' });

    const visitsTab = page.getByRole('button', { name: 'Lần khám' });
    const timelineTab = page.getByRole('button', { name: 'Dòng thời gian' });
    await expect(visitsTab).toHaveAttribute('aria-pressed', 'true');
    await expect(timelineTab).toHaveAttribute('aria-pressed', 'false');

    const timelineResPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/patients/${seed.ids.patient}/timeline`) &&
        res.request().method() === 'GET',
    );
    await timelineTab.click();
    const timelineRes = await timelineResPromise;
    expect(timelineRes.status()).toBe(200);

    const list = page.getByRole('list', { name: 'Dòng thời gian sổ khám' });
    await expect(list).toBeVisible();

    const items = list.getByRole('listitem');
    // Family sees: RX-E2E-TL-01, RX-E2E-TL-CANCEL (recipientUserId=actor.id per A3),
    // enc_doc1_final (HOME_VISIT finalized), doc_family = 4 items.
    // Unfinalized enc_doc1_unfinal must NOT appear (Decision 2).
    await expect(items).toHaveCount(4);
    await expect(items.nth(0)).toContainText('Đơn thuốc');
    await expect(items.nth(0)).toContainText('Mã đơn RX-E2E-TL-01');

    const homeVisitItem = items.filter({ hasText: 'Khám tại nhà' });
    await expect(homeVisitItem).toHaveCount(1);
    await expect(homeVisitItem).toContainText('Viêm họng cấp');

    const docItem = items.filter({ hasText: 'X-quang phổi E2E' });
    await expect(docItem).toHaveCount(1);
    await expect(docItem).toContainText('Gia đình tự thêm');

    await expect(list).not.toContainText('Chưa chốt bệnh án E2E');

    // Open visit detail in timeline tab
    await homeVisitItem.getByRole('button', { name: 'Xem chi tiết' }).click();
    const backBtn = page.getByRole('button', { name: 'Quay lại dòng thời gian' });
    await expect(backBtn).toBeVisible();
    await expect(page.getByText('Amidan sưng nhẹ').first()).toBeVisible();
    await expect(list).toBeHidden();

    // Return to timeline without extra API fetch
    const callsBeforeBack = timelineCalls;
    await backBtn.click();
    await expect(list).toBeVisible();
    expect(timelineCalls).toBe(callsBeforeBack);

    // Verify READ_PATIENT_TIMELINE audit logged in PostgreSQL
    const auditCheck = runSeedScript<InspectAuditResult>('inspect');
    expect(
      auditCheck.audits.some(
        (a) =>
          a.actor_user_id === seed.ids.family_user &&
          a.resource_id === seed.ids.patient &&
          a.action === 'READ_PATIENT_TIMELINE',
      ),
    ).toBe(true);
  });

  test('E2E-02: Phân trang cursor khi có > 20 sự kiện (nút Xem thêm)', async ({
    page,
  }) => {
    const { origin } = await loginSession(page, seed.emails.family, seed.password);
    await page.goto(`${origin}/family/medical-book`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /Trần Thị Phân Trang/ }).click();
    await page.getByRole('button', { name: 'Dòng thời gian' }).click();

    const list = page.getByRole('list', { name: 'Dòng thời gian sổ khám' });
    await expect(list.getByRole('listitem')).toHaveCount(20);

    const loadMoreBtn = page.getByRole('button', { name: 'Xem thêm' });
    await expect(loadMoreBtn).toBeVisible();
    await loadMoreBtn.click();

    await expect(list.getByRole('listitem')).toHaveCount(22);
    await expect(loadMoreBtn).toBeHidden();
  });

  test('E2E-03: Bác sĩ hợp đồng ACTIVE xem được lượt chưa chốt của mình & lượt đã chốt của bác sĩ khác (ẩn nút Xem chi tiết theo D4)', async ({
    page,
  }) => {
    const { origin } = await loginSession(page, seed.emails.doctor1, seed.password);
    await page.goto(`${origin}/doctor/encounters`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /E2E Gia đình Timeline/ }).click();
    await page.getByRole('button', { name: /Nguyễn Văn Timeline/ }).click();
    await page.getByRole('button', { name: 'Dòng thời gian' }).click();

    const list = page.getByRole('list', { name: 'Dòng thời gian sổ khám' });
    await expect(list).toBeVisible();

    // Doctor 1 sees: rx_issued, enc_doc1_unfinal, enc_doc1_final, enc_doc2_final, doc_family = 5 items
    const items = list.getByRole('listitem');
    await expect(items).toHaveCount(5);

    // Own unfinalized TELEHEALTH visit has "Xem chi tiết"
    const ownUnfinal = items.filter({ hasText: 'Khám trực tuyến' });
    await expect(ownUnfinal).toHaveCount(1);
    await expect(ownUnfinal.getByRole('button', { name: 'Xem chi tiết' })).toBeVisible();

    // Other doctor's finalized visit shows diagnosis & doctor name, NO "Xem chi tiết" (D4)
    const otherFinal = items.filter({ hasText: 'Tăng huyết áp E2E' });
    await expect(otherFinal).toHaveCount(1);
    await expect(otherFinal).toContainText('Bác sĩ: BS. E2E Timeline 2');
    await expect(otherFinal.getByRole('button', { name: 'Xem chi tiết' })).toHaveCount(0);

    // CANCELLED prescription is hidden
    await expect(list).not.toContainText('RX-E2E-TL-CANCEL');
  });

  test('E2E-04: Bác sĩ hết hợp đồng nhận 404 và thấy thông báo từ server (D5)', async ({
    page,
  }) => {
    const { origin } = await loginSession(page, seed.emails.doctor3, seed.password);
    await page.goto(`${origin}/doctor/encounters`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /E2E Gia đình Timeline/ }).click();
    await page.getByRole('button', { name: /Nguyễn Văn Timeline/ }).click();

    const timelineResPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/patients/${seed.ids.patient}/timeline`) &&
        res.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Dòng thời gian' }).click();
    const res = await timelineResPromise;
    expect(res.status()).toBe(404);

    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Không tìm thấy sổ khám của thành viên này.' });
    await expect(alert).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  });
});
