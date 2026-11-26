import { expect, test } from '@playwright/test';
import {
  FRONTEND_URL,
  loginRealSession,
  runHomeVisitSeedScript,
} from './helpers/home-visit-e2e-helper';

interface SeedResult {
  success: boolean;
  ids: {
    family_user: string;
    doctor_user: string;
    family_unit: string;
    patient_1: string;
    patient_2: string;
    doctor: string;
    contract: string;
    enc_2tier_main: string;
    enc_overdue: string;
    enc_family_confirm: string;
  };
  emails: {
    family: string;
    doctor: string;
  };
  password: string;
}

interface InspectResult {
  success: boolean;
  encounters: Array<{
    id: string;
    encounter_status: string;
    family_confirmed_arrival_at: string | null;
    doctor_completed_at: string | null;
    record_overdue_at: string | null;
    late_completion_reason: string | null;
  }>;
  participants: Array<{
    encounter_id: string;
    patient_id: string;
    attendance_status: string;
  }>;
  emrs: Array<{
    id: string;
    encounter_id: string;
    patient_id: string;
    is_finalized: boolean;
    icd10_code: string;
  }>;
}

test.describe.serial('Home Visit 2-Tier Full-Stack E2E (Playwright + PostgreSQL)', () => {
  let seed: SeedResult;

  test.beforeAll(() => {
    seed = runHomeVisitSeedScript<SeedResult>('seed');
    expect(seed.success).toBe(true);
  });

  test.afterAll(() => {
    const cleaned = runHomeVisitSeedScript<{ success: boolean }>('cleanup');
    expect(cleaned.success).toBe(true);
  });

  test('E2E-01: Chuông thông báo thật từ DB + deep-link mở HouseholdVisitOverview', async ({
    page,
  }) => {
    const { origin } = await loginRealSession(page, seed.emails.doctor, seed.password);

    await page.goto(`${origin}/doctor/timetable`);

    await expect(
      page.getByRole('button', { name: /Mở menu tài khoản/i }),
    ).toContainText('BS.');

    await expect(
      page.getByRole('button', { name: /Check-in đã đến nhà/i }),
    ).toHaveCount(0);

    const bellBtn = page.getByRole('button', { name: /Thông báo hệ thống/i });
    await bellBtn.click();

    await expect(
      page.getByText('Gia đình đã xác nhận bác sĩ có mặt (E2E)'),
    ).toBeVisible();

    const openEncounterLink = page.getByRole('link', { name: /Mở ca khám/i }).first();
    await expect(openEncounterLink).toHaveAttribute(
      'href',
      `/doctor/encounters?encounterId=${seed.ids.enc_2tier_main}`,
    );
    await openEncounterLink.click();

    await expect(page).toHaveURL(
      new RegExp(`/doctor/encounters\\?encounterId=${seed.ids.enc_2tier_main}`),
    );
    await expect(
      page.getByText(/Danh sách thành viên hộ gia đình \(2\)/i),
    ).toBeVisible();
  });

  test('E2E-02: Đánh dấu vắng mặt + Wizard 4 bước auto-save DB + Hoàn tất cấp hộ gia đình (ghi DB thật)', async ({
    page,
  }) => {
    const { origin } = await loginRealSession(page, seed.emails.doctor, seed.password);
    await page.goto(`${origin}/doctor/encounters?encounterId=${seed.ids.enc_2tier_main}`);

    // Đánh dấu Trần Thị Bình vắng mặt -> ghi xuống encounter_participants.attendance_status = ABSENT
    const desktopRow2 = page.locator('tbody tr', { hasText: 'Trần Thị Bình' });
    await desktopRow2.getByRole('button', { name: /Vắng mặt/i }).click();
    await expect(
      desktopRow2.getByRole('button', { name: /Có mặt/i }),
    ).toBeVisible({ timeout: 10000 });

    // Chưa chốt Nguyễn Văn An -> cảnh báo, không mở modal
    await page
      .getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i })
      .click();
    await expect(
      page.getByText(/Vẫn còn thành viên chưa chốt hồ sơ/i),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Khám & Ghi hồ sơ Nguyễn Văn An
    const desktopRow1 = page.locator('tbody tr', { hasText: 'Nguyễn Văn An' });
    await desktopRow1.getByRole('button', { name: /Khám & Ghi hồ sơ/i }).click();
    await expect(page.getByText('Bước 1/4', { exact: true })).toBeVisible();

    // Bước 1 -> auto-save PUT /draft
    const chiefInput = page.getByLabel(/Lý do khám/i);
    const findingsInput = page.getByLabel(/Kết quả thăm khám/i);
    await chiefInput.fill('Đau đầu và tăng huyết áp nhẹ');
    await findingsInput.fill('Huyết áp 145/90 mmHg');
    await expect(chiefInput).toHaveValue('Đau đầu và tăng huyết áp nhẹ');
    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(page.getByText('Bước 2/4', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Bước 2 -> auto-save PUT /draft
    await page.getByLabel(/Mã ICD-10/i).fill('I10');
    await page.getByLabel(/Chẩn đoán/i).fill('Tăng huyết áp vô căn');
    await page.getByLabel(/Kế hoạch điều trị/i).fill('Theo dõi huyết áp tại nhà');
    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(page.getByText('Bước 3/4', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Bước 3: Không kê đơn -> Bước 4
    await page
      .getByRole('button', { name: /Không kê đơn — Chuyển sang Xem lại/i })
      .click();
    await expect(page.getByText('Bước 4/4', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Bước 4: Chốt hồ sơ thành viên -> quay về Hub
    await page
      .getByRole('button', { name: /✓ Chốt hồ sơ thành viên này/i })
      .click();

    await expect(
      page.getByText(/Danh sách thành viên hộ gia đình \(2\)/i),
    ).toBeVisible({ timeout: 10000 });
    await expect(desktopRow1.getByText(/✓ Đã chốt hồ sơ/i)).toBeVisible({
      timeout: 10000,
    });

    // Hoàn tất ca khám cho cả gia đình
    await page
      .getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /Xác nhận hoàn tất/i }).click();

    await expect(page.getByText('Đã hoàn tất ca khám tại nhà')).toBeVisible({
      timeout: 10000,
    });

    // Kiểm tra trực tiếp PostgreSQL
    const dbState = runHomeVisitSeedScript<InspectResult>('inspect');
    const enc = dbState.encounters.find((e) => e.id === seed.ids.enc_2tier_main);
    expect(enc?.encounter_status).toBe('COMPLETED');
    expect(enc?.doctor_completed_at).not.toBeNull();

    const part1 = dbState.participants.find(
      (p) => p.encounter_id === seed.ids.enc_2tier_main && p.patient_id === seed.ids.patient_1,
    );
    const part2 = dbState.participants.find(
      (p) => p.encounter_id === seed.ids.enc_2tier_main && p.patient_id === seed.ids.patient_2,
    );
    expect(part1?.attendance_status).toBe('EXAMINED');
    expect(part2?.attendance_status).toBe('ABSENT');

    const emr1 = dbState.emrs.find(
      (e) => e.encounter_id === seed.ids.enc_2tier_main && e.patient_id === seed.ids.patient_1,
    );
    expect(emr1?.is_finalized).toBe(true);
    expect(emr1?.icd10_code).toBe('I10');
  });

  test('E2E-03: Ca quá hạn (Mức 1) hiển thị badge QUÁ HẠN và bắt buộc nhập lý do nộp trễ (ghi DB thật)', async ({
    page,
  }) => {
    const { origin } = await loginRealSession(page, seed.emails.doctor, seed.password);

    await page.goto(`${origin}/doctor/timetable`);
    await expect(page.getByText('QUÁ HẠN').first()).toBeVisible();

    await page.goto(`${origin}/doctor/encounters?encounterId=${seed.ids.enc_overdue}`);
    await expect(page.getByText(/QUÁ HẠN HỒ SƠ \(Mức 1\)/i)).toBeVisible();

    await page
      .getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /Xác nhận hoàn tất/i }).click();
    await expect(
      page.getByText(/Vui lòng nhập lý do nộp hồ sơ trễ\./i),
    ).toBeVisible();

    const lateReason = 'Mất kết nối mạng khi thăm khám vùng xa (E2E)';
    await page.getByLabel(/Lý do nộp hồ sơ trễ/i).fill(lateReason);
    await page.getByRole('button', { name: /Xác nhận hoàn tất/i }).click();

    await expect(page.getByText('Đã hoàn tất ca khám tại nhà')).toBeVisible();

    const dbState = runHomeVisitSeedScript<InspectResult>('inspect');
    const overdueEnc = dbState.encounters.find((e) => e.id === seed.ids.enc_overdue);
    expect(overdueEnc?.encounter_status).toBe('COMPLETED');
    expect(overdueEnc?.late_completion_reason).toBe(lateReason);
    expect(overdueEnc?.doctor_completed_at).not.toBeNull();
  });
});
