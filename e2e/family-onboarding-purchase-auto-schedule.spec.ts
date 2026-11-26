import { expect, test, type Page } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';

const AUDIT_ACCOUNT = {
  email: process.env.E2E_AUDIT_EMAIL || 'mit@n0ai.cloud',
  password: process.env.E2E_AUDIT_PASSWORD || 'Famidoc@123',
};

interface RawEncounter {
  id: string;
  contractId: string;
  doctorId: string;
  encounterType: string;
  category: string;
  visitScope: string;
  scheduledDate: string;
  scheduledTime: string;
  encounterStatus: string;
  slotWindow: string | null;
  rescheduleCount: number;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  doctorCompletedAt: string | null;
  familyConfirmedArrivalAt: string | null;
  telehealthSession?: {
    endedAt?: string | null;
  } | null;
  clinicalEmrs?: Array<{ id: string; isFinalized: boolean }>;
  contract?: {
    id: string;
    contractNumber: string;
    startDate: string;
    endDate: string;
    remainingHomeVisits: number;
    remainingTelehealth: number;
    contractStatus: string;
    servicePackage?: {
      packageName: string;
      periodicVisitsQuota: number;
      telehealthQuota: number;
      durationMonths: number;
    };
  };
}

function parseScheduleMeta(cancelReason: string | null): Record<string, unknown> | null {
  if (!cancelReason) return null;
  const match = cancelReason.match(/^\[SCHEDULE_META:(\{.*?\})\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getSlotFromTime(scheduledTime: string): 'MORNING' | 'AFTERNOON' {
  const hhmm = scheduledTime.includes('T')
    ? scheduledTime.slice(11, 16)
    : scheduledTime.slice(0, 5);
  const hour = Number.parseInt(hhmm.split(':')[0] || '8', 10);
  return hour < 12 ? 'MORNING' : 'AFTERNOON';
}

function toVnStartMs(scheduledDate: string, scheduledTime: string): number {
  const datePart = scheduledDate.slice(0, 10);
  const timePart = scheduledTime.includes('T')
    ? scheduledTime.slice(11, 16)
    : scheduledTime.slice(0, 5);
  return Date.parse(`${datePart}T${timePart}:00+07:00`);
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
  const emailInput = page.getByLabel(/Email đăng nhập/i);
  const passwordInput = page.getByLabel(/^Mật khẩu/i);

  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);
  await passwordInput.fill(password);

  const loginResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/v1/auth/login') && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /Đăng nhập hệ thống/i }).click();
  const loginRes = await loginResponsePromise;
  expect(loginRes.status(), `Login failed for ${email}`).toBeLessThan(300);

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
}

test.describe('Luồng Đăng ký → Đăng nhập → Chọn Bác sĩ & Mua gói → Lịch khám mặc định → Kiểm toán lỗi lịch', () => {
  test('E2E-01: Đăng ký tài khoản đại diện gia đình & xác thực OTP email (UI)', async ({
    page,
  }) => {
    const uniqueSuffix = Date.now().toString().slice(-7);
    const email = `e2e.family.${uniqueSuffix}@famidoc.test`;
    const phone = `09${uniqueSuffix}1`;
    const password = 'Famidoc@123';

    await page.goto(`${FRONTEND_URL}/family/register`, { waitUntil: 'networkidle' });
    const fullNameInput = page.getByLabel(/Họ và tên người đại diện/i);
    await expect(fullNameInput).toBeVisible();

    await fullNameInput.fill(`Gia Đình E2E ${uniqueSuffix}`);
    await page.getByLabel(/Email đăng nhập/i).fill(email);
    await page.getByLabel(/Số điện thoại liên hệ/i).fill(phone);
    await page.getByLabel(/Mật khẩu mới/i).fill(password);
    await page.getByLabel(/Xác nhận mật khẩu/i).fill(password);

    const registerResPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/auth/register-representative') &&
        res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Đăng ký tài khoản FamiDoc/i }).click();
    const registerRes = await registerResPromise;
    expect(registerRes.status()).toBe(201);

    const registerBody = (await registerRes.json()) as {
      data?: { devOtp?: string; email?: string };
    };
    await page.waitForURL(/\/verify-otp/, { timeout: 15_000 });

    const devOtp = registerBody?.data?.devOtp;
    if (devOtp && /^\d{6}$/.test(devOtp)) {
      for (let i = 0; i < 6; i++) {
        await page.locator(`#otp-slot-${i}`).fill(devOtp[i]);
      }
      const verifyPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/v1/auth/verify-email-otp') &&
          res.request().method() === 'POST',
      );
      await page.getByRole('button', { name: /Xác nhận mã OTP/i }).click();
      const verifyRes = await verifyPromise;
      expect(verifyRes.status()).toBeLessThan(300);

      // Đăng nhập lại bằng tài khoản vừa đăng ký
      await loginViaUi(page, email, password);
    } else {
      test.info().annotations.push({
        type: 'info',
        description:
          'Môi trường không trả về devOtp trong response đăng ký — đã xác minh thành công bước khởi tạo đăng ký và điều hướng /verify-otp.',
      });
    }
  });

  test('E2E-02: Chọn bác sĩ & gói chăm sóc → vào màn hình khởi tạo hợp đồng /booking', async ({
    page,
  }) => {
    // Lấy bác sĩ & gói công khai từ backend để chọn đúng ID thật
    const [docsRes, pkgsRes] = await Promise.all([
      page.request.get(`${BACKEND_URL}/api/v1/public/doctors`),
      page.request.get(`${BACKEND_URL}/api/v1/public/packages`),
    ]);
    expect(docsRes.ok()).toBeTruthy();
    expect(pkgsRes.ok()).toBeTruthy();

    const doctors = ((await docsRes.json()) as { data?: Array<{ id: string; doctorName: string }> })
      .data;
    const packages = (
      (await pkgsRes.json()) as { data?: Array<{ id: string; packageName: string }> }
    ).data;
    expect(doctors && doctors.length > 0).toBeTruthy();
    expect(packages && packages.length > 0).toBeTruthy();

    const doctor = doctors![0];
    const pkg = packages![0];

    await loginViaUi(page, AUDIT_ACCOUNT.email, AUDIT_ACCOUNT.password);

    await page.goto(`${FRONTEND_URL}/doctors`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(doctor.doctorName);

    await page.goto(
      `${FRONTEND_URL}/booking?doctorId=${encodeURIComponent(doctor.id)}&packageId=${encodeURIComponent(pkg.id)}`,
      { waitUntil: 'networkidle' },
    );
    await expect(page.locator('[data-testid="booking-missing-context"]')).toHaveCount(0);
    await expect(page.locator('body')).toContainText(pkg.packageName);
  });

  test('E2E-03: Tài khoản mit@n0ai.cloud đăng nhập, xem lịch mặc định & kiểm tra luồng Đặt Video / Đổi lịch (không lỗi HTTP/console)', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('response', (res) => {
      if (res.status() >= 400) {
        failedResponses.push(`${res.status()} ${res.request().method()} ${res.url()}`);
      }
    });

    await loginViaUi(page, AUDIT_ACCOUNT.email, AUDIT_ACCOUNT.password);

    // 1. Vào trang Lịch Hẹn Khám Gia Đình và bắt response timetable
    const timetablePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/encounters/timetable/family') &&
        res.request().method() === 'GET',
    );
    await page.goto(`${FRONTEND_URL}/family/appointments`, { waitUntil: 'networkidle' });
    const timetableRes = await timetablePromise;
    expect(timetableRes.status()).toBe(200);

    const timetableJson = (await timetableRes.json()) as {
      data?: { data?: RawEncounter[] };
    };
    const encounters = timetableJson?.data?.data ?? [];
    const autoHomeVisits = encounters.filter(
      (e) => e.encounterType === 'HOME_VISIT' && e.category === 'PERIODIC_ROUTINE',
    );
    expect(autoHomeVisits.length).toBeGreaterThan(0);

    await expect(page.getByRole('heading', { name: /Lịch Hẹn Khám Gia Đình/i })).toBeVisible();
    await expect(page.locator('body')).toContainText('Đồng hành 124');

    // 2. Kiểm tra quy tắc không xếp vào Chủ Nhật & không trùng 2 lượt HOME_VISIT cùng ngày
    const activeHomeDays = new Set<string>();
    for (const enc of autoHomeVisits) {
      const dateStr = enc.scheduledDate.slice(0, 10);
      const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
      expect(dow, `Lịch ${enc.id} bị xếp vào Chủ Nhật (${dateStr})`).not.toBe(0);
      if (!['CANCELLED', 'NO_SHOW', 'DISPUTED'].includes(enc.encounterStatus)) {
        expect(
          activeHomeDays.has(dateStr),
          `Bị trùng 2 lịch HOME_VISIT trong cùng ngày ${dateStr}`,
        ).toBe(false);
        activeHomeDays.add(dateStr);
      }
    }

    // 3. Kiểm tra trang Đặt Tư vấn Video load lịch trống hợp lệ
    await page.goto(`${FRONTEND_URL}/family/appointments/book-video`, {
      waitUntil: 'networkidle',
    });
    await expect(page.getByRole('heading', { name: /Đặt lịch Tư vấn Video/i })).toBeVisible();
    await expect(page.locator('body')).toContainText('Buổi trống gần nhất');

    // 4. Kiểm tra trang Đổi lịch của 1 buổi CONFIRMED load lịch tháng hợp lệ
    const firstConfirmed = autoHomeVisits.find((e) => e.encounterStatus === 'CONFIRMED');
    expect(firstConfirmed).toBeTruthy();
    await page.goto(`${FRONTEND_URL}/family/appointments/${firstConfirmed!.id}/reschedule`, {
      waitUntil: 'networkidle',
    });
    await expect(
      page.getByRole('heading', { name: /Đề xuất đổi lịch Khám tại nhà với Bác sĩ/i }),
    ).toBeVisible();

    expect(consoleErrors, `Console errors: ${consoleErrors.join('; ')}`).toEqual([]);
    expect(failedResponses, `Failed HTTP requests: ${failedResponses.join('; ')}`).toEqual([]);
  });

  test('E2E-04: Kiểm toán sâu phát hiện lỗi lịch trên tài khoản mit@n0ai.cloud (Regression Bug Detector)', async ({
    page,
  }, testInfo) => {
    // Đánh dấu test.fail() vì đây là test kiểm toán các lỗi ĐANG TỒN TẠI trên mit@n0ai.cloud.
    // Khi toàn bộ 5 lỗi gốc được sửa, test này sẽ chuyển sang "unexpectedly passed" để nhắc bỏ test.fail().
    test.fail(
      true,
      'Tài khoản mit@n0ai.cloud hiện có 5 lỗi lịch đã được phát hiện (lịch mặc định xếp vào quá khứ, slotWindow=null, SCHEDULE_META lệch sau đổi lịch, DISPUTED hiện nút Đề xuất đổi lịch, WRAP_UP nằm ở tab Sắp tới).',
    );

    await loginViaUi(page, AUDIT_ACCOUNT.email, AUDIT_ACCOUNT.password);

    const timetablePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/encounters/timetable/family') &&
        res.request().method() === 'GET',
    );
    await page.goto(`${FRONTEND_URL}/family/appointments`, { waitUntil: 'networkidle' });
    const timetableRes = await timetablePromise;
    const timetableJson = (await timetableRes.json()) as {
      data?: { data?: RawEncounter[] };
    };
    const encounters = timetableJson?.data?.data ?? [];

    const findings: Array<{ code: string; encounterId: string; detail: string }> = [];

    // Defect 1: Lịch mặc định AUTO_CONFIRMED bị xếp vào QUÁ KHỨ so với thời điểm thanh toán (createdAt)
    for (const enc of encounters) {
      if (enc.encounterType === 'HOME_VISIT' && enc.category === 'PERIODIC_ROUTINE') {
        const meta = parseScheduleMeta(enc.cancelReason);
        if (meta?.stage === 'AUTO_CONFIRMED') {
          const scheduledStartMs = toVnStartMs(enc.scheduledDate, enc.scheduledTime);
          const createdMs = Date.parse(enc.createdAt);
          if (scheduledStartMs < createdMs) {
            const diffHours = ((createdMs - scheduledStartMs) / 3_600_000).toFixed(2);
            findings.push({
              code: 'AUTO_SCHEDULE_IN_THE_PAST',
              encounterId: enc.id,
              detail: `Lịch mặc định milestone ${String(meta.milestoneIndex)}/${String(meta.totalMilestones)} xếp lúc ${enc.scheduledDate.slice(0, 10)} ${enc.scheduledTime.slice(11, 16)}+07:00 nhưng được tạo lúc ${enc.createdAt} (chậm hơn ${diffHours} giờ trong quá khứ).`,
            });
          }
        }
      }
    }

    // Defect 2: Cột slotWindow bị NULL trên toàn bộ lịch HOME_VISIT tự động
    const nullSlotVisits = encounters.filter(
      (e) =>
        e.encounterType === 'HOME_VISIT' &&
        e.category === 'PERIODIC_ROUTINE' &&
        !e.slotWindow,
    );
    if (nullSlotVisits.length > 0) {
      findings.push({
        code: 'MISSING_SLOT_WINDOW_COLUMN',
        encounterId: nullSlotVisits[0].id,
        detail: `${nullSlotVisits.length} buổi HOME_VISIT định kỳ có slotWindow = null trong DB dù SCHEDULE_META có slotWindow.`,
      });
    }

    // Defect 3: Lệch SCHEDULE_META.slotWindow so với scheduledTime sau khi đổi lịch
    for (const enc of encounters) {
      const meta = parseScheduleMeta(enc.cancelReason);
      if (meta?.slotWindow) {
        const actualSlot = getSlotFromTime(enc.scheduledTime);
        if (meta.slotWindow !== actualSlot) {
          findings.push({
            code: 'STALE_SCHEDULE_META_AFTER_RESCHEDULE',
            encounterId: enc.id,
            detail: `scheduledTime=${enc.scheduledTime.slice(11, 16)} (${actualSlot}) nhưng SCHEDULE_META.slotWindow="${String(meta.slotWindow)}" (rescheduleCount=${enc.rescheduleCount}).`,
          });
        }
      }
    }

    // Defect 4: Lịch DISPUTED bị map thành confirmed trên Calendar và vẫn hiện nút "Đề xuất đổi lịch"
    const disputed = encounters.find((e) => e.encounterStatus === 'DISPUTED');
    if (disputed) {
      // Bấm vào pill của buổi DISPUTED (25/11 08:00) trên Calendar
      const disputedPill = page
        .locator('button')
        .filter({ hasText: /08:00.*Tại nhà/i })
        .first();
      if (await disputedPill.isVisible()) {
        await disputedPill.click();
        const rescheduleLink = page.getByRole('link', { name: /Đề xuất đổi lịch/i });
        if (await rescheduleLink.isVisible()) {
          findings.push({
            code: 'DISPUTED_SHOWN_AS_CONFIRMED_WITH_RESCHEDULE',
            encounterId: disputed.id,
            detail:
              'Lịch DISPUTED bị mapEncounterToAppointment fallback thành "confirmed" và hiển thị nút "Đề xuất đổi lịch" trên Calendar modal.',
          });
        }
        await page.keyboard.press('Escape');
      }
    }

    // Defect 5: Lịch TELEHEALTH trạng thái WRAP_UP (cuộc gọi đã kết thúc) bị đếm vào tab "Sắp tới"
    const wrapUpEnded = encounters.find(
      (e) => e.encounterStatus === 'WRAP_UP' && Boolean(e.telehealthSession?.endedAt),
    );
    if (wrapUpEnded) {
      const upcomingTabText = await page
        .getByRole('tab', { name: /Sắp tới/i })
        .innerText();
      const confirmedHomeCount = encounters.filter(
        (e) => e.encounterType === 'HOME_VISIT' && e.encounterStatus === 'CONFIRMED',
      ).length;
      const matchCount = upcomingTabText.match(/\((\d+)\)/);
      const renderedUpcoming = matchCount ? Number(matchCount[1]) : -1;
      if (renderedUpcoming > confirmedHomeCount) {
        findings.push({
          code: 'WRAP_UP_CLASSIFIED_AS_UPCOMING',
          encounterId: wrapUpEnded.id,
          detail: `Tab "Sắp tới" hiển thị (${renderedUpcoming}) thay vì (${confirmedHomeCount}) do deriveDualLaneState không xử lý trạng thái WRAP_UP.`,
        });
      }
    }

    await testInfo.attach('mit-schedule-audit.json', {
      body: JSON.stringify({ account: AUDIT_ACCOUNT.email, totalEncounters: encounters.length, findings }, null, 2),
      contentType: 'application/json',
    });

    console.log('\n=== MIT@N0AI.CLOUD SCHEDULE AUDIT FINDINGS ===');
    for (const f of findings) {
      console.log(`[${f.code}] (${f.encounterId.slice(0, 8)}): ${f.detail}`);
    }

    expect(
      findings,
      `Phát hiện ${findings.length} lỗi lịch trên tài khoản ${AUDIT_ACCOUNT.email}`,
    ).toEqual([]);
  });
});
