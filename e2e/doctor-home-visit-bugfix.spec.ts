import { expect, test, type Locator, type Page } from '@playwright/test';
import {
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

test.use({
  launchOptions: {
    slowMo: 220,
  },
});

async function humanPause(page: Page, ms = 350) {
  await page.waitForTimeout(ms);
}

async function humanType(locator: Locator, text: string) {
  await locator.click();
  await locator.fill('');
  await locator.pressSequentially(text, { delay: 30 });
}

test.describe.serial('Doctor Home Visit Bugfix Full-Stack E2E (FE + BE + PostgreSQL thật)', () => {
  let seed: SeedResult;

  test.beforeAll(() => {
    try {
      runHomeVisitSeedScript('cleanup');
    } catch {
      // Bỏ qua nếu chưa có dữ liệu cũ
    }
    seed = runHomeVisitSeedScript<SeedResult>('seed');
    expect(seed.success).toBe(true);
  });

  test.afterAll(() => {
    const cleaned = runHomeVisitSeedScript<{ success: boolean }>('cleanup');
    expect(cleaned.success).toBe(true);
  });

  test('E2E-01: Điểm danh có lý do -> Lưu nháp sinh hiệu & Reload prefill -> ICD U07.1 -> Kê đơn đủ trường -> Chốt & Hoàn tất ca trên DB thật', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const { origin } = await loginRealSession(page, seed.emails.doctor, seed.password);

    await page.goto(`${origin}/doctor/encounters?encounterId=${seed.ids.enc_2tier_main}`);
    await expect(
      page.getByText(/Danh sách thành viên hộ gia đình \(2\)/i),
    ).toBeVisible({ timeout: 15_000 });
    await humanPause(page, 400);

    // 1. Nút hoàn tất bị disabled khi còn thành viên Chờ khám
    await expect(page.getByText(/Còn 2 thành viên chưa điểm danh/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i }),
    ).toBeDisabled();

    // 2. Điểm danh Trần Thị Bình vắng mặt kèm lý do (lưu thật xuống DB)
    const desktopRow2 = page.locator('tbody tr', { hasText: 'Trần Thị Bình' });
    await desktopRow2.getByRole('button', { name: /Đánh dấu vắng/i }).click();
    await humanPause(page, 300);

    await humanType(page.getByLabel(/Lý do vắng/i), 'Đi công tác');
    await page.getByRole('button', { name: /Xác nhận vắng/i }).click();
    await expect(desktopRow2.getByText(/Vắng — Đi công tác/i)).toBeVisible({
      timeout: 10_000,
    });
    await humanPause(page, 400);

    // 3. Mở khám Nguyễn Văn An -> nhập Bước 1 + sinh hiệu & cân nặng 62.5
    const desktopRow1 = page.locator('tbody tr', { hasText: 'Nguyễn Văn An' });
    await desktopRow1.getByRole('button', { name: /^Khám$/i }).click();
    await expect(page.getByLabel(/Lý do khám/i)).toBeVisible({ timeout: 10_000 });
    await humanPause(page, 300);

    await humanType(page.getByLabel(/Lý do khám/i), 'Ho khan 3 ngày, sốt nhẹ');
    await humanType(page.getByLabel(/Kết quả thăm khám/i), 'Họng đỏ nhẹ, phổi trong');
    await humanType(page.getByLabel(/Huyết áp tâm thu/i), '125');
    await humanType(page.getByLabel(/Cân nặng/i), '62.5');
    await humanPause(page, 300);

    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(page.getByLabel(/Mã ICD-10/i)).toBeVisible({ timeout: 10_000 });
    await humanPause(page, 400);

    // 4. Reload trang để xác nhận nháp & sinh hiệu được prefill từ DB thật
    await page.reload();
    await expect(
      page.getByText(/Danh sách thành viên hộ gia đình \(2\)/i),
    ).toBeVisible({ timeout: 15_000 });
    await desktopRow1.getByRole('button', { name: /^Khám$/i }).click();
    await expect(page.getByLabel(/Lý do khám/i)).toHaveValue(
      'Ho khan 3 ngày, sốt nhẹ',
      { timeout: 10_000 },
    );
    await expect(page.getByLabel(/Huyết áp tâm thu/i)).toHaveValue('125');
    await expect(page.getByLabel(/Cân nặng/i)).toHaveValue('62.5');
    await humanPause(page, 350);

    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(page.getByLabel(/Mã ICD-10/i)).toBeVisible({ timeout: 10_000 });

    // 5. Bước 2: nhập ICD-10 nhóm U (U07.1)
    await humanType(page.getByLabel(/Mã ICD-10/i), 'U07.1');
    await humanType(page.getByLabel(/Chẩn đoán/i), 'Nghi nhiễm COVID-19 nhẹ');
    await humanType(page.getByLabel(/Kế hoạch điều trị/i), 'Cách ly theo dõi tại nhà');
    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(page.getByRole('button', { name: /Thêm thuốc/i })).toBeVisible({
      timeout: 10_000,
    });
    await humanPause(page, 400);

    // 6. Bước 3: kê đơn thuốc đầy đủ trường + clinicalContext để BE chấp nhận
    await humanType(page.getByPlaceholder(/Tên thuốc/i), 'Paracetamol 500mg');
    await humanType(page.getByPlaceholder(/Hoạt chất/i), 'Paracetamol');
    await humanType(page.getByPlaceholder(/Hàm lượng/i), '500mg');
    await page.getByLabel(/Đường dùng 1/i).selectOption('Uống');
    await humanType(page.getByPlaceholder(/Liều dùng/i), '1 viên');
    await humanType(page.getByPlaceholder(/Tần suất/i), '2 lần/ngày');
    await humanType(page.getByPlaceholder(/Số ngày/i), '5');
    await humanType(page.getByPlaceholder(/Tổng số lượng/i), '10');
    await humanType(page.getByPlaceholder(/Đơn vị/i), 'viên');

    await humanType(page.getByLabel(/Nơi cư trú/i), '123 Nguyễn Trãi, Q.5, TP.HCM');
    await humanType(page.getByLabel(/Số điện thoại/i), '0912345678');
    await humanPause(page, 300);

    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(
      page.getByRole('button', { name: /✓ Chốt hồ sơ thành viên này/i }),
    ).toBeVisible({ timeout: 10_000 });
    await humanPause(page, 350);

    // 7. Bước 4: chốt hồ sơ thành viên lên BE + DB thật
    await page.getByRole('button', { name: /✓ Chốt hồ sơ thành viên này/i }).click();
    await expect(
      page.getByText(/Danh sách thành viên hộ gia đình \(2\)/i),
    ).toBeVisible({ timeout: 15_000 });
    await humanPause(page, 400);

    // 8. Hoàn tất ca khám cho cả gia đình -> chờ BE trả COMPLETED -> VisitCompletionSummary
    const completeBtn = page.getByRole('button', {
      name: /✓ Hoàn tất ca khám cho cả gia đình/i,
    });
    await expect(completeBtn).toBeEnabled({ timeout: 10_000 });
    await completeBtn.click();
    await humanPause(page, 300);

    await page.getByRole('button', { name: /Xác nhận hoàn tất/i }).click();
    await expect(page.getByText(/Đã hoàn tất ca khám tại nhà/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Vắng — Đi công tác/i)).toBeVisible();
    await expect(page.getByText(/Đã chốt hồ sơ/i)).toBeVisible();

    // 9. Xác nhận trạng thái thực tế trong PostgreSQL
    const inspected = runHomeVisitSeedScript<InspectResult>('inspect');
    const mainEnc = inspected.encounters.find((e) => e.id === seed.ids.enc_2tier_main);
    expect(mainEnc?.encounter_status).toBe('COMPLETED');
    expect(mainEnc?.doctor_completed_at).not.toBeNull();

    const pat1Emr = inspected.emrs.find(
      (e) => e.encounter_id === seed.ids.enc_2tier_main && e.patient_id === seed.ids.patient_1,
    );
    expect(pat1Emr?.is_finalized).toBe(true);
    expect(pat1Emr?.icd10_code).toBe('U07.1');
  });

  test('E2E-02: Ca quá hạn xem hồ sơ chỉ đọc (0 textbox) và hoàn tất bắt buộc lý do nộp trễ trên DB thật', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const { origin } = await loginRealSession(page, seed.emails.doctor, seed.password);

    await page.goto(`${origin}/doctor/encounters?encounterId=${seed.ids.enc_overdue}`);
    await expect(page.getByText(/Quá hạn hồ sơ/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Mức 1/)).toHaveCount(0);
    await humanPause(page, 400);

    // Mở hồ sơ đã chốt -> chỉ đọc
    await page.getByRole('button', { name: /Xem hồ sơ/i }).first().click();
    await expect(page.getByText(/Đã chốt hồ sơ \(Chỉ xem\)/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await humanPause(page, 350);

    await page.getByRole('button', { name: /Quay lại danh sách thành viên/i }).click();
    await expect(
      page.getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Hoàn tất ca quá hạn -> bắt buộc nhập lý do nộp trễ
    await page
      .getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i })
      .click();
    await humanPause(page, 300);

    await page.getByRole('button', { name: /Xác nhận hoàn tất/i }).click();
    await expect(page.getByText(/Vui lòng nhập lý do nộp hồ sơ trễ/i)).toBeVisible();
    await humanPause(page, 300);

    await humanType(
      page.getByLabel(/Lý do nộp hồ sơ trễ/i),
      'Mất kết nối mạng tại nhà bệnh nhân',
    );
    await page.getByRole('button', { name: /Xác nhận hoàn tất/i }).click();

    await expect(page.getByText(/Đã hoàn tất ca khám tại nhà/i)).toBeVisible({
      timeout: 15_000,
    });

    const inspected = runHomeVisitSeedScript<InspectResult>('inspect');
    const overdueEnc = inspected.encounters.find((e) => e.id === seed.ids.enc_overdue);
    expect(overdueEnc?.late_completion_reason).toBe('Mất kết nối mạng tại nhà bệnh nhân');
  });
});
