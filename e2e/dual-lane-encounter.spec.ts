import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';

function originForRole(feRole: string): string {
  const url = new URL(FRONTEND_URL);
  if (url.hostname === 'localhost') {
    if (feRole === 'DOCTOR') return `${url.protocol}//bacsi.localhost:${url.port || '3000'}`;
    if (feRole === 'ADMIN') return `${url.protocol}//admin.localhost:${url.port || '3000'}`;
    if (feRole === 'FACILITY') return `${url.protocol}//csyt.localhost:${url.port || '3000'}`;
  }
  return FRONTEND_URL;
}
const SEED_SCRIPT = path.resolve(__dirname, 'scripts', 'dual-lane-e2e-seed.py');

interface SeedResult {
  success: boolean;
  ids: {
    family_user: string;
    doctor_user: string;
    admin_user: string;
    family_unit: string;
    patient: string;
    doctor: string;
    contract: string;
    enc_confirm_pending: string;
    enc_confirm_complete: string;
    enc_future_guard: string;
    enc_telehealth_guard: string;
    enc_no_show_dispute: string;
    enc_rx_replace: string;
    rx_old: string;
  };
  emails: {
    family: string;
    doctor: string;
    admin: string;
  };
  password: string;
  dates: {
    enc_confirm_pending: string;
    enc_confirm_complete: string;
    enc_no_show_dispute: string;
  };
}

interface InspectResult {
  success: boolean;
  encounters: Array<{
    id: string;
    encounter_type: string;
    encounter_status: string;
    family_confirmed_arrival_at: string | null;
  }>;
  emrs: Array<{
    id: string;
    encounter_id: string;
    is_finalized: boolean;
  }>;
  prescriptions: Array<{
    id: string;
    prescription_code: string;
    status: string;
    replaces_prescription_id: string | null;
    replacement_reason: string | null;
  }>;
  complaints: Array<{
    id: string;
    encounter_id: string;
    complaint_category: string;
    status: string;
  }>;
}

function runSeedScript<T>(action: 'seed' | 'inspect' | 'cleanup'): T {
  const out = execFileSync('python', [SEED_SCRIPT, action], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out) as T;
}

function mapRoleToFrontendCookie(backendRole: string): string {
  if (backendRole === 'FAMILY_REP') return 'FAMILY';
  if (backendRole === 'HEALTHCARE_FACILITY') return 'FACILITY';
  return backendRole;
}

async function loginSession(
  page: Page,
  email: string,
  password: string,
): Promise<{ accessToken: string; user: any; role: string; origin: string }> {
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
    { name: 'famidoc_user', value: encodeURIComponent(JSON.stringify(authUser)), url: targetOrigin },
    ...(refreshToken
      ? [{ name: 'famidoc_refresh_token', value: refreshToken, url: targetOrigin }]
      : []),
  ]);

  return { accessToken, user, role: feRole, origin: targetOrigin };
}

test.describe.serial('Dual-Lane Encounter Full-Stack E2E (Playwright + PostgreSQL)', () => {
  let seed: SeedResult;

  test.beforeAll(() => {
    seed = runSeedScript<SeedResult>('seed');
    expect(seed.success).toBe(true);
  });

  test.afterAll(() => {
    const cleaned = runSeedScript<{ success: boolean }>('cleanup');
    expect(cleaned.success).toBe(true);
  });

  test('E2E-01: Làn 1 Gia đình xác nhận (F3a) -> PENDING_RECORD -> Làn 2 Bác sĩ chốt EMR (D3) -> COMPLETED', async ({
    page,
  }) => {
    // 1. Gia đình đăng nhập & mở /family/appointments
    await loginSession(page, seed.emails.family, seed.password);
    await page.goto('/family/appointments');

    await expect(page.getByRole('tab', { name: /Hôm nay \/ Cần xác nhận/i })).toBeVisible();
    await expect(page.getByText(/Phía Gia đình:/i).first()).toBeVisible();

    // Kiểm tra fix hiển thị giờ hẹn HH:mm (không còn "1970-") & ẩn nút xác nhận trên thẻ TELEHEALTH
    await expect(page.getByText(/1970-/)).toHaveCount(0);
    const telehealthCard = page
      .getByRole('tabpanel')
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Khám trực tuyến' })
      .first();
    await expect(telehealthCard).toBeVisible();
    await expect(telehealthCard.getByText(/Khám trực tuyến qua phòng Video/i)).toBeVisible();
    await expect(telehealthCard.getByRole('button', { name: /Bác sĩ ĐÃ ĐẾN/i })).toHaveCount(0);
    await expect(telehealthCard.getByRole('button', { name: /Bác sĩ KHÔNG ĐẾN/i })).toHaveCount(0);

    // Tìm đúng card HOME_VISIT chứa ngày hẹn của ENC_CONFIRM_PENDING và bấm "Bác sĩ ĐÃ ĐẾN"
    const pendingCard = page
      .getByRole('tabpanel')
      .locator('div')
      .filter({ hasText: `${seed.dates.enc_confirm_pending}` })
      .filter({ hasText: 'Khám tại nhà' })
      .filter({ has: page.getByRole('button', { name: /Bác sĩ ĐÃ ĐẾN/i }) })
      .last();
    await expect(pendingCard).toBeVisible();

    const confirmPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/encounters/${seed.ids.enc_confirm_pending}/confirm-arrival`) &&
        res.request().method() === 'PATCH',
    );
    await pendingCard.getByRole('button', { name: /Bác sĩ ĐÃ ĐẾN/i }).click();
    await expect(page.getByText(/Xác nhận & Đánh giá ca khám/i)).toBeVisible();
    await page.getByRole('button', { name: /Để sau, đóng lại/i }).click();
    const confirmRes = await confirmPromise;
    expect(confirmRes.status()).toBe(200);

    const state = runSeedScript<InspectResult>('inspect');
    const encPending = state.encounters.find((e) => e.id === seed.ids.enc_confirm_pending);
    expect(encPending?.encounter_status).toBe('PENDING_RECORD');
    expect(encPending?.family_confirmed_arrival_at).not.toBeNull();

    // 2. Bác sĩ đăng nhập & mở D3 DoctorVisitWorkspace cho ENC_CONFIRM_PENDING
    const docSession = await loginSession(page, seed.emails.doctor, seed.password);
    await page.goto(`${docSession.origin}/doctor/encounters?encounterId=${seed.ids.enc_confirm_pending}`);

    await expect(page.getByText(/1\. Chọn thành viên/i)).toBeVisible();
    await expect(page.getByText(/Đã xác nhận có đến/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText('1970-');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/\(\d{2}:\d{2}\)/);

    await page.getByLabel(/Lý do khám/i).fill('Khám định kỳ E2E Dual-Lane');
    await page.getByLabel(/Triệu chứng & Khám thực thể/i).fill('Huyết áp 130/80 mmHg, tim đều, phổi trong');
    await page.getByLabel(/Mã ICD-10/i).fill('I10');
    await page.getByLabel(/Chẩn đoán/i).fill('Tăng huyết áp vô căn');
    await page.getByLabel(/Dặn dò \/ Kế hoạch tái khám/i).fill('Tiếp tục đo huyết áp hằng ngày và tái khám sau 1 tháng');
    const confirmVisitPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/medical-books/visits/${seed.ids.enc_confirm_pending}/confirm`) &&
        res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /^✓ Chốt hồ sơ$/i }).click();
    const confirmVisitRes = await confirmVisitPromise;
    expect(confirmVisitRes.ok(), await confirmVisitRes.text()).toBeTruthy();

    // 3. Khẳng định PostgreSQL chuyển PENDING_RECORD -> COMPLETED và tạo clinical_emr finalized
    const afterDoctor = runSeedScript<InspectResult>('inspect');
    const finalEnc = afterDoctor.encounters.find((e) => e.id === seed.ids.enc_confirm_pending);
    expect(finalEnc?.encounter_status).toBe('COMPLETED');
    const finalEmr = afterDoctor.emrs.find((e) => e.encounter_id === seed.ids.enc_confirm_pending);
    expect(finalEmr?.is_finalized).toBe(true);
  });

  test('E2E-02: Làn 2 đã có EMR finalized -> Gia đình xác nhận -> tự đối soát lên thẳng COMPLETED', async ({
    page,
  }) => {
    const before = runSeedScript<InspectResult>('inspect');
    const current = before.encounters.find((e) => e.id === seed.ids.enc_confirm_complete);

    if (current?.encounter_status !== 'COMPLETED') {
      const { accessToken } = await loginSession(page, seed.emails.family, seed.password);
      const res = await page.request.patch(
        `${BACKEND_URL}/api/v1/encounters/${seed.ids.enc_confirm_complete}/confirm-arrival`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect(res.status()).toBe(200);
    }

    const after = runSeedScript<InspectResult>('inspect');
    const updated = after.encounters.find((e) => e.id === seed.ids.enc_confirm_complete);
    expect(updated?.encounter_status).toBe('COMPLETED');
    expect(updated?.family_confirmed_arrival_at).not.toBeNull();
  });

  test('E2E-03: Chặn confirm-arrival trước giờ hẹn VN (+07:00) & bảo vệ luồng TELEHEALTH', async ({
    page,
  }) => {
    const { accessToken } = await loginSession(page, seed.emails.family, seed.password);

    // 1. Ca HOME_VISIT trong tương lai -> 400 BadRequest
    const futureRes = await page.request.patch(
      `${BACKEND_URL}/api/v1/encounters/${seed.ids.enc_future_guard}/confirm-arrival`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(futureRes.status()).toBe(400);
    const futureText = await futureRes.text();
    expect(futureText).toContain('Chưa đến giờ hẹn khám');

    // 2. Ca TELEHEALTH đã quá giờ hẹn -> 400 BadRequest (không đẩy sang PENDING_RECORD)
    const teleRes = await page.request.patch(
      `${BACKEND_URL}/api/v1/encounters/${seed.ids.enc_telehealth_guard}/confirm-arrival`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(teleRes.status()).toBe(400);
    const teleText = await teleRes.text();
    expect(teleText).toContain('lịch khám tại nhà');

    // Khẳng định DB cả 2 ca giữ nguyên CONFIRMED
    const after = runSeedScript<InspectResult>('inspect');
    expect(
      after.encounters.find((e) => e.id === seed.ids.enc_future_guard)?.encounter_status,
    ).toBe('CONFIRMED');
    expect(
      after.encounters.find((e) => e.id === seed.ids.enc_telehealth_guard)?.encounter_status,
    ).toBe('CONFIRMED');
  });

  test('E2E-04: Gia đình báo DOCTOR_ABSENT (F3b) -> DISPUTED -> hiển thị Admin O1 & khóa tự đóng ca', async ({
    page,
  }) => {
    // 1. Gia đình mở /family/appointments & bấm Bác sĩ KHÔNG ĐẾN trên đúng card ENC_NO_SHOW_DISPUTE
    await loginSession(page, seed.emails.family, seed.password);
    await page.goto('/family/appointments');

    const noShowCard = page
      .getByRole('tabpanel')
      .locator('div')
      .filter({ hasText: `${seed.dates.enc_no_show_dispute}` })
      .filter({ hasText: 'Khám tại nhà' })
      .filter({ has: page.getByRole('button', { name: /Bác sĩ KHÔNG ĐẾN/i }) })
      .last();
    await expect(noShowCard).toBeVisible();
    await noShowCard.getByRole('button', { name: /Bác sĩ KHÔNG ĐẾN/i }).click();

    await expect(page.getByText(/tạm khóa để Vận hành/i)).toBeVisible();
    await page.getByLabel(/Ghi thêm chi tiết/i).fill('E2E kiểm thử bác sĩ vắng mặt');

    const complaintPromise = page.waitForResponse(
      (res) => res.url().includes('/complaints') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Gửi báo cáo sự cố/i }).click();
    const complaintRes = await complaintPromise;
    expect(complaintRes.ok(), await complaintRes.text()).toBeTruthy();

    // 2. Xác nhận PostgreSQL đã khóa encounter_status = DISPUTED & tạo complaint DOCTOR_ABSENT
    const afterDispute = runSeedScript<InspectResult>('inspect');
    const disputedEnc = afterDispute.encounters.find(
      (e) => e.id === seed.ids.enc_no_show_dispute,
    );
    expect(disputedEnc?.encounter_status).toBe('DISPUTED');
    expect(
      afterDispute.complaints.some(
        (c) =>
          c.encounter_id === seed.ids.enc_no_show_dispute &&
          c.complaint_category === 'DOCTOR_ABSENT',
      ),
    ).toBe(true);

    // 3. Admin mở /admin/disputes kiểm tra phản ánh DOCTOR_ABSENT & tab Đối soát ca khám 2 làn (O1)
    const adminSession = await loginSession(page, seed.emails.admin, seed.password);
    await page.goto(`${adminSession.origin}/admin/disputes`);
    await expect(page.getByText(/E2E kiểm thử bác sĩ vắng mặt/i)).toBeVisible();
    await page.getByRole('tab', { name: /Đối soát ca khám 2 làn/i }).click();
    await expect(
      page.getByRole('button', { name: /Cần xử lý: NO_SHOW\/DISPUTED/i }),
    ).toBeVisible();

    // 4. Bác sĩ gọi confirmVisitRecord trên ca DISPUTED -> tuyệt đối KHÔNG tự chuyển sang COMPLETED
    const { accessToken: docToken } = await loginSession(
      page,
      seed.emails.doctor,
      seed.password,
    );
    const docConfirmRes = await page.request.post(
      `${BACKEND_URL}/api/v1/medical-books/visits/${seed.ids.enc_no_show_dispute}/confirm`,
      {
        headers: { Authorization: `Bearer ${docToken}` },
        data: {
          patientId: seed.ids.patient,
          confirmed: true,
          exam: {
            chiefComplaint: 'Ghi chú đối soát',
            clinicalFindings: 'Kiểm tra tranh chấp',
            icd10Code: 'Z00',
            icd10Diagnosis: 'Khám tổng quát',
            treatmentPlan: 'Chờ vận hành đối soát',
          },
        },
      },
    );
    expect(docConfirmRes.ok(), await docConfirmRes.text()).toBeTruthy();

    const afterDocOnDisputed = runSeedScript<InspectResult>('inspect');
    expect(
      afterDocOnDisputed.encounters.find((e) => e.id === seed.ids.enc_no_show_dispute)
        ?.encounter_status,
    ).toBe('DISPUTED');
  });

  test('E2E-05: Bác sĩ thay thế đơn thuốc đã phát hành trên D4 gọi đúng prescriptionsApi.replace', async ({
    page,
  }) => {
    const docSession = await loginSession(page, seed.emails.doctor, seed.password);
    await page.goto(`${docSession.origin}/doctor/encounters?patientId=${seed.ids.patient}`);

    // Chọn đúng lần khám ENC_RX_REPLACE (hôm qua lúc 09:00) trong Lịch sử khám để mở DoctorBookVisitView (chứa PrescriptionForm D4)
    const visitTrigger = page
      .getByRole('button', {
        name: new RegExp(`${seed.dates.enc_confirm_complete} · 09:00`, 'i'),
      })
      .first();
    await expect(visitTrigger).toBeVisible();
    await visitTrigger.click();

    await expect(page.getByText('RX-E2E-DL-01')).toBeVisible();
    await page.getByRole('button', { name: /Kê đơn thay thế/i }).click();

    await page
      .getByLabel(/Lý do thay thế/i)
      .fill('Điều chỉnh hàm lượng Amlodipine từ 5mg lên 10mg theo huyết áp mới');

    await page.getByLabel(/Tôi xác nhận nội dung và người được khám/i).check();

    const replacePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/prescriptions/${seed.ids.rx_old}/replacements`) &&
        res.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: /Lưu đơn thay thế và thông báo gia đình/i })
      .click();

    const replaceRes = await replacePromise;
    expect(replaceRes.ok(), await replaceRes.text()).toBeTruthy();

    // Kiểm tra PostgreSQL: đơn cũ bị CANCELLED/REPLACED, đơn mới ISSUED có replaces_prescription_id = rx_old
    const afterReplace = runSeedScript<InspectResult>('inspect');
    const oldRx = afterReplace.prescriptions.find((p) => p.id === seed.ids.rx_old);
    const newRx = afterReplace.prescriptions.find(
      (p) => p.replaces_prescription_id === seed.ids.rx_old,
    );

    expect(['CANCELLED', 'REPLACED']).toContain(oldRx?.status);
    expect(newRx).toBeDefined();
    expect(newRx?.status).toBe('ISSUED');
    expect(newRx?.replacement_reason).toContain('Điều chỉnh hàm lượng Amlodipine');
  });
});
