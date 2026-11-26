import { expect, test, type Page, type Route } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function fulfillJson(route: Route, status: number, body: unknown) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS_HEADERS });
    return;
  }
  await route.fulfill({
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Dùng tháng tương lai cố định để tránh lệch ngày hiện tại / cutoff 20:00
const FUTURE_MONTH = '2099-05';
const DAY_TAKEN_AM = '2099-05-04'; // Thứ 2: Sáng TAKEN, Chiều AVAILABLE
const DAY_OWN_VISIT = '2099-05-05'; // Thứ 3: Sáng OWN_VISIT, Chiều FAMILY_SAME_DAY
const DAY_SUNDAY = '2099-05-03'; // Chủ nhật: DAY_OFF

function buildMonthlyDays() {
  return [
    {
      date: DAY_SUNDAY,
      isDayOff: true,
      dayOffReason: 'Chủ nhật (ngày nghỉ)',
      isOutOfContract: false,
      familyHasVisit: false,
      morning: {
        available: false,
        reasonCode: 'DAY_OFF',
        label: 'Ngày nghỉ',
        reason: 'Chủ nhật (ngày nghỉ)',
      },
      afternoon: {
        available: false,
        reasonCode: 'DAY_OFF',
        label: 'Ngày nghỉ',
        reason: 'Chủ nhật (ngày nghỉ)',
      },
    },
    {
      date: DAY_TAKEN_AM,
      isDayOff: false,
      isOutOfContract: false,
      familyHasVisit: false,
      morning: {
        available: false,
        reasonCode: 'TAKEN',
        label: 'Đã có lịch',
        reason: 'Đã có lịch',
      },
      afternoon: {
        available: true,
        reasonCode: 'AVAILABLE',
        label: 'Còn trống',
        reason: null,
      },
    },
    {
      date: DAY_OWN_VISIT,
      isDayOff: false,
      isOutOfContract: false,
      familyHasVisit: true,
      morning: {
        available: false,
        reasonCode: 'OWN_VISIT',
        label: 'Lịch của bạn',
        reason: 'Lịch của bạn',
      },
      afternoon: {
        available: false,
        reasonCode: 'FAMILY_SAME_DAY',
        label: 'Gia đình đã có lượt trong ngày',
        reason: 'Gia đình đã có lượt trong ngày',
      },
    },
  ];
}

function originFor(role: 'FAMILY' | 'DOCTOR'): string {
  return role === 'DOCTOR' ? 'http://bacsi.localhost:3000' : BASE_URL;
}

async function seedMockSession(page: Page, role: 'FAMILY' | 'DOCTOR') {
  const origin = originFor(role);
  const user = {
    id: role === 'DOCTOR' ? 'user-doc-1' : 'user-fam-1',
    name: role === 'DOCTOR' ? 'BS. Trần Thanh Mai' : 'Nguyễn Văn An',
    phone: '0901234567',
    email: role === 'DOCTOR' ? 'doctor@famidoc.vn' : 'family@famidoc.vn',
    role,
    avatarText: role === 'DOCTOR' ? 'BS' : 'NV',
    mustChangePassword: false,
  };
  const token = `e2e-mock-token-${role.toLowerCase()}`;

  await page.context().clearCookies();
  await page.context().addCookies([
    { name: 'famidoc_token', value: token, url: origin },
    { name: 'famidoc_role', value: role, url: origin },
    {
      name: 'famidoc_user',
      value: encodeURIComponent(JSON.stringify(user)),
      url: origin,
    },
  ]);

  await page.addInitScript(
    ({ t, r, u }) => {
      window.localStorage.setItem('famidoc_token', t);
      window.localStorage.setItem('famidoc_role', r);
      window.localStorage.setItem('famidoc_user', u);
    },
    { t: token, r: role, u: JSON.stringify(user) },
  );

  // Chặn mọi request tới backend mặc định (OPTIONS + notifications/gate-status) để tránh ERR_CONNECTION_REFUSED
  await page.route('http://localhost:4000/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    const url = route.request().url();
    if (url.includes('/api/v1/contracts/family/gate-status')) {
      await fulfillJson(route, 200, {
        success: true,
        data: { activeContract: { id: 'ctr-1' }, hasActiveContract: true },
      });
      return;
    }
    if (url.includes('/api/v1/doctors/me')) {
      await fulfillJson(route, 200, {
        success: true,
        data: { id: 'doc-1', doctorName: 'BS. Trần Thanh Mai', onboardingStatus: 'ACTIVE' },
      });
      return;
    }
    await fulfillJson(route, 200, { success: true, data: [] });
  });
}

test.describe('Doctor Slot Ledger — Playwright E2E', () => {
  test('E2E-01: FamilyReschedulePage hiển thị trạng thái ca, gửi đúng slotWindow và xử lý 409 SLOT_TAKEN', async ({
    page,
  }) => {
    await seedMockSession(page, 'FAMILY');

    let availabilityCalls = 0;
    let shouldFailSlotTaken = true;
    let capturedRescheduleBody: any = null;

    await page.route('**/api/v1/encounters/enc-1', async (route) => {
      await fulfillJson(route, 200, {
        success: true,
        data: {
          id: 'enc-1',
          doctorId: 'doc-1',
          contractId: 'ctr-1',
          encounterType: 'HOME_VISIT',
          encounterStatus: 'CONFIRMED',
          scheduledDate: `${FUTURE_MONTH}-05`,
          scheduledTime: '08:00:00',
          doctor: { id: 'doc-1', doctorName: 'BS. Trần Thanh Mai' },
        },
      });
    });

    await page.route('**/api/v1/encounters/doctors/doc-1/monthly-availability**', async (route) => {
      availabilityCalls += 1;
      await fulfillJson(route, 200, {
        success: true,
        data: {
          month: FUTURE_MONTH,
          doctorId: 'doc-1',
          days: buildMonthlyDays(),
        },
      });
    });

    await page.route('**/api/v1/encounters/enc-1/reschedule', async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillJson(route, 204, {});
      capturedRescheduleBody = route.request().postDataJSON();
      if (shouldFailSlotTaken) {
        shouldFailSlotTaken = false;
        await fulfillJson(route, 409, {
          statusCode: 409,
          code: 'SLOT_TAKEN',
          message: 'Ca này vừa có người đặt, vui lòng chọn ca khác',
        });
        return;
      }
      await fulfillJson(route, 200, { success: true, data: { id: 'req-1', status: 'PENDING' } });
    });

    await page.route('**/api/v1/encounters/timetable/family**', async (route) => {
      await fulfillJson(route, 200, {
        success: true,
        data: { data: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      });
    });

    await page.goto(`${BASE_URL}/family/appointments/enc-1/reschedule`);

    // Kiểm tra legend 3 mục
    await expect(page.getByText('Còn trống').first()).toBeVisible();
    await expect(page.getByText('Đã có lịch').first()).toBeVisible();
    await expect(page.getByText('Không khả dụng').first()).toBeVisible();

    // Kiểm tra nhãn OWN_VISIT
    await expect(page.getByText('Lịch của bạn')).toBeVisible();

    // Ngày 04: Sáng TAKEN (disabled + title="Đã có lịch"), Chiều AVAILABLE (enabled)
    const morningBtns = page.getByRole('button', { name: /Sáng/i });
    const afternoonBtns = page.getByRole('button', { name: /Chiều/i });

    // Thứ tự ngày trong buildMonthlyDays: 03 (index 0), 04 (index 1), 05 (index 2)
    await expect(morningBtns.nth(1)).toBeDisabled();
    await expect(morningBtns.nth(1)).toHaveAttribute('title', 'Đã có lịch');
    await expect(afternoonBtns.nth(1)).toBeEnabled();

    // Chọn ca Chiều ngày 04 -> nhập lý do -> gửi lần 1 nhận 409 SLOT_TAKEN
    await afternoonBtns.nth(1).click();
    await page.getByRole('textbox').fill('Gia đình bận buổi sáng');
    await page.getByRole('button', { name: /Gửi đề xuất tới Bác sĩ/i }).click();

    await expect(page.getByText('Ca này vừa có người đặt, vui lòng chọn ca khác')).toBeVisible();
    await expect.poll(() => availabilityCalls).toBe(2);

    // Chọn lại ca Chiều ngày 04 -> gửi lần 2 thành công
    await afternoonBtns.nth(1).click();
    await page.getByRole('button', { name: /Gửi đề xuất tới Bác sĩ/i }).click();
    expect(capturedRescheduleBody).toMatchObject({
      proposedDate: DAY_TAKEN_AM,
      proposedTime: '13:30',
    });
    await page.waitForURL('**/family/appointments');
  });

  test('E2E-02: DoctorReschedulePage chọn ca trống và xử lý 409 SLOT_TAKEN', async ({ page }) => {
    await seedMockSession(page, 'DOCTOR');

    let availabilityCalls = 0;
    let shouldFailSlotTaken = true;
    let capturedBody: any = null;

    await page.route('**/api/v1/encounters/enc-doc-1', async (route) => {
      await fulfillJson(route, 200, {
        success: true,
        data: {
          id: 'enc-doc-1',
          doctorId: 'doc-1',
          contractId: 'ctr-1',
          encounterType: 'HOME_VISIT',
          encounterStatus: 'CONFIRMED',
          scheduledDate: `${FUTURE_MONTH}-05`,
          scheduledTime: '08:00:00',
          contract: { familyUnit: { representativeUser: { fullName: 'Nguyễn Văn An' } } },
        },
      });
    });

    await page.route('**/api/v1/encounters/doctors/doc-1/monthly-availability**', async (route) => {
      availabilityCalls += 1;
      const days = buildMonthlyDays();
      days[1].morning = { available: true, reasonCode: 'AVAILABLE', label: 'Còn trống', reason: '' };
      await fulfillJson(route, 200, {
        success: true,
        data: { month: FUTURE_MONTH, doctorId: 'doc-1', days },
      });
    });

    await page.route('**/api/v1/encounters/enc-doc-1/reschedule', async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillJson(route, 204, {});
      capturedBody = route.request().postDataJSON();
      if (shouldFailSlotTaken) {
        shouldFailSlotTaken = false;
        await fulfillJson(route, 409, {
          statusCode: 409,
          code: 'SLOT_TAKEN',
          message: 'Ca này vừa có người đặt, vui lòng chọn ca khác',
        });
        return;
      }
      await fulfillJson(route, 200, { success: true, data: { id: 'req-doc-1', status: 'PENDING' } });
    });

    await page.route('**/api/v1/encounters/timetable/doctor**', async (route) => {
      await fulfillJson(route, 200, {
        success: true,
        data: { data: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      });
    });

    await page.goto(`${originFor('DOCTOR')}/doctor/timetable/enc-doc-1/reschedule`);

    const morningBtns = page.getByRole('button', { name: /Sáng/i });
    await expect(morningBtns.nth(1)).toBeEnabled();
    await morningBtns.nth(1).click();
    await page.getByRole('textbox').fill('Bác sĩ có ca cấp cứu');
    await page.getByRole('button', { name: /Gửi đề xuất tới Gia đình/i }).click();

    await expect(page.getByText('Ca này vừa có người đặt, vui lòng chọn ca khác')).toBeVisible();
    await expect.poll(() => availabilityCalls).toBe(2);

    await morningBtns.nth(1).click();
    await page.getByRole('button', { name: /Gửi đề xuất tới Gia đình/i }).click();
    expect(capturedBody).toMatchObject({
      proposedDate: DAY_TAKEN_AM,
      proposedTime: '08:00',
    });
    await page.waitForURL('**/doctor/timetable');
  });

  test('E2E-03: DoctorManualSchedulePage xếp tay theo ca và xử lý 409 SLOT_TAKEN', async ({
    page,
  }) => {
    await seedMockSession(page, 'DOCTOR');

    let availabilityCalls = 0;
    let shouldFailSlotTaken = true;
    let capturedManualBody: any = null;

    await page.route('**/api/v1/encounters/timetable/doctor**', async (route) => {
      await fulfillJson(route, 200, {
        success: true,
        data: {
          data: [
            {
              id: 'enc-manual-1',
              doctorId: 'doc-1',
              contractId: 'ctr-1',
              encounterType: 'HOME_VISIT',
              encounterStatus: 'REQUESTED',
              scheduleStage: 'MANUAL_SLOT_REQUIRED',
              scheduledDate: `${FUTURE_MONTH}-04`,
              cancelReason: 'MANUAL_SLOT_REQUIRED',
              contract: { familyUnit: { representativeUser: { fullName: 'Nguyễn Văn An' } } },
            },
          ],
          pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
        },
      });
    });

    await page.route('**/api/v1/encounters/doctors/doc-1/monthly-availability**', async (route) => {
      availabilityCalls += 1;
      await fulfillJson(route, 200, {
        success: true,
        data: { month: FUTURE_MONTH, doctorId: 'doc-1', days: buildMonthlyDays() },
      });
    });

    await page.route('**/api/v1/encounters/enc-manual-1/doctor-manual-schedule', async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillJson(route, 204, {});
      capturedManualBody = route.request().postDataJSON();
      if (shouldFailSlotTaken) {
        shouldFailSlotTaken = false;
        await fulfillJson(route, 409, {
          statusCode: 409,
          code: 'SLOT_TAKEN',
          message: 'Ca này vừa có người đặt, vui lòng chọn ca khác',
        });
        return;
      }
      await fulfillJson(route, 200, {
        success: true,
        data: { id: 'enc-manual-1', encounterStatus: 'CONFIRMED' },
      });
    });

    await page.goto(`${originFor('DOCTOR')}/doctor/timetable/manual-schedule`);

    const afternoonBtns = page.getByRole('button', { name: /Chiều/i });
    await expect(afternoonBtns.nth(1)).toBeEnabled();
    await afternoonBtns.nth(1).click();
    await page.getByRole('button', { name: /Chốt lịch ngay/i }).click();

    await expect(page.getByText('Ca này vừa có người đặt, vui lòng chọn ca khác')).toBeVisible();
    await expect.poll(() => availabilityCalls).toBe(2);

    await afternoonBtns.nth(1).click();
    await page.getByRole('button', { name: /Chốt lịch ngay/i }).click();
    expect(capturedManualBody).toEqual({
      proposedDate: DAY_TAKEN_AM,
      slotWindow: 'AFTERNOON',
    });
  });

  test('E2E-04: BookVideoConsultationPage đặt 2 ca trọn khung (không còn giờ 30 phút) và xử lý 409 SLOT_TAKEN', async ({
    page,
  }) => {
    await seedMockSession(page, 'FAMILY');

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetDay = `${currentMonth}-15`;
    let videoAvailabilityCalls = 0;
    let shouldFailSlotTaken = true;
    let capturedAdHocBody: any = null;

    await page.route('**/api/v1/contracts/family/gate-status', async (route) => {
      await fulfillJson(route, 200, {
        success: true,
        data: { activeContract: { id: 'ctr-1' }, hasActiveContract: true },
      });
    });

    await page.route('**/api/v1/contracts/medical/ctr-1', async (route) => {
      await fulfillJson(route, 200, {
        success: true,
        data: {
          id: 'ctr-1',
          doctor: { id: 'doc-1', doctorName: 'BS. Trần Thanh Mai' },
          remainingTelehealth: 3,
          servicePackage: { videoQuotaPolicy: 'FIXED' },
        },
      });
    });

    await page.route('**/api/v1/encounters/doctors/doc-1/video-availability**', async (route) => {
      videoAvailabilityCalls += 1;
      await fulfillJson(route, 200, {
        success: true,
        data: {
          month: currentMonth,
          doctorId: 'doc-1',
          nearestAvailableSlot: { date: targetDay, slotWindow: 'MORNING', suggestedTime: '08:00' },
          days: [
            {
              date: targetDay,
              isDayOff: false,
              outOfRange: false,
              morning: { available: true, candidateTimes: ['08:00'], reasonCode: 'AVAILABLE', label: 'Còn trống' },
              afternoon: { available: true, candidateTimes: ['13:30'], reasonCode: 'AVAILABLE', label: 'Còn trống' },
            },
          ],
        },
      });
    });

    await page.route('**/api/v1/encounters/ad-hoc', async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillJson(route, 204, {});
      capturedAdHocBody = route.request().postDataJSON();
      if (shouldFailSlotTaken) {
        shouldFailSlotTaken = false;
        await fulfillJson(route, 409, {
          statusCode: 409,
          code: 'SLOT_TAKEN',
          message: 'Ca này vừa có người đặt, vui lòng chọn ca khác',
        });
        return;
      }
      await fulfillJson(route, 201, {
        success: true,
        data: { id: 'enc-vid-1', encounterStatus: 'REQUESTED' },
      });
    });

    await page.route('**/api/v1/encounters/timetable/family**', async (route) => {
      await fulfillJson(route, 200, {
        success: true,
        data: { data: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      });
    });

    await page.goto(`${BASE_URL}/family/appointments/book-video`);

    // Không còn các nút giờ 30 phút
    await expect(page.getByText('BS. Trần Thanh Mai')).toBeVisible();
    await expect(page.getByText('08:30')).toHaveCount(0);

    // Chọn ngày 15 -> Khung Chiều -> Tiếp tục -> Xác nhận đặt lịch (lần 1: 409 SLOT_TAKEN)
    await page.getByRole('button', { name: /15\s*●/ }).click();
    await page.getByRole('button', { name: /Khung Chiều/i }).click();
    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await page.getByRole('button', { name: /Xác nhận đặt lịch/i }).click();

    await expect(page.getByText('Ca này vừa có người đặt, vui lòng chọn ca khác')).toBeVisible();
    await expect.poll(() => videoAvailabilityCalls).toBe(2);

    // Đã quay lại bước 1 -> chọn lại Khung Chiều -> gửi lần 2 thành công
    await page.getByRole('button', { name: /Khung Chiều/i }).click();
    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await page.getByRole('button', { name: /Xác nhận đặt lịch/i }).click();

    expect(capturedAdHocBody).toMatchObject({
      contractId: 'ctr-1',
      encounterType: 'TELEHEALTH',
      desiredDate: targetDay,
      slotWindow: 'AFTERNOON',
    });
    await page.waitForURL('**/family/appointments');
  });
});
