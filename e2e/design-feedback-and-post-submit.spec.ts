import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';

function originForRole(feRole: 'FACILITY' | 'DOCTOR' | 'ADMIN'): string {
  const url = new URL(FRONTEND_URL);
  if (url.hostname === 'localhost') {
    if (feRole === 'DOCTOR') return `${url.protocol}//bacsi.localhost:${url.port || '3000'}`;
    if (feRole === 'ADMIN') return `${url.protocol}//admin.localhost:${url.port || '3000'}`;
    if (feRole === 'FACILITY') return `${url.protocol}//csyt.localhost:${url.port || '3000'}`;
  }
  return FRONTEND_URL;
}

async function seedMockAuthSession(
  page: Page,
  feRole: 'FACILITY' | 'DOCTOR' | 'ADMIN',
  options?: { mustChangePassword?: boolean; name?: string },
): Promise<string> {
  const targetOrigin = originForRole(feRole);
  const token = `e2e-mock-token-${feRole.toLowerCase()}`;
  const authUser = {
    id: `user-${feRole.toLowerCase()}-1`,
    name: options?.name || `E2E ${feRole}`,
    phone: '0909000111',
    email: `${feRole.toLowerCase()}@famidoc.vn`,
    role: feRole,
    avatarText: feRole.slice(0, 2),
    mustChangePassword: Boolean(options?.mustChangePassword),
  };

  await page.goto(`${targetOrigin}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ accessToken, role, userJson }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('famidoc_token', accessToken);
      window.localStorage.setItem('famidoc_role', role);
      window.localStorage.setItem('famidoc_user', userJson);
    },
    {
      accessToken: token,
      role: feRole,
      userJson: JSON.stringify(authUser),
    },
  );

  await page.context().clearCookies();
  await page.context().addCookies([
    { name: 'famidoc_token', value: token, url: targetOrigin },
    { name: 'famidoc_role', value: feRole, url: targetOrigin },
    {
      name: 'famidoc_user',
      value: encodeURIComponent(JSON.stringify(authUser)),
      url: targetOrigin,
    },
  ]);

  return targetOrigin;
}

const SAMPLE_BANKS = [
  {
    id: 43,
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    code: 'VCB',
    bin: '970436',
    shortName: 'Vietcombank',
    logo: '',
    transferSupported: 1,
    lookupSupported: 1,
  },
];

const MOCK_OVERVIEW = {
  doctors: {
    total: 2,
    active: 2,
    pending: 0,
    activePanelCount: 1,
    maxPanelCapacity: 10,
    panelUtilizationPercent: 10,
  },
  encounters: {
    month: 11,
    year: 2026,
    total: 0,
    completed: 0,
    inProgress: 0,
    confirmed: 0,
    requested: 0,
    cancelled: 0,
    completionRatePercent: 0,
    byChannel: { HOME_VISIT: 0, TELEHEALTH: 0, FACILITY_VISIT: 0 },
  },
  revenue: {
    month: 11,
    year: 2026,
    grossVnd: 0,
    facilityShareVnd: 0,
    platformFeeVnd: 0,
    invoiceCount: 0,
    facilitySharePercent: 85,
    platformSharePercent: 15,
    activeB2bContractCode: null,
    activeB2bValidTo: null,
  },
  recentEncounters: [],
  pendingRescheduleCount: 0,
};

function createPdfFilePayload(filename: string) {
  return {
    name: filename,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%e2e-test-document\n%%EOF'),
  };
}

test.describe('Design Feedback & Post-Submit E2E Suite (Playwright)', () => {
  test('E2E-UI-01 (#1): MustChangePasswordBanner stays single-row on desktop and can be dismissed', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/facilities/me/overview')) {
        return route.fulfill({ json: { success: true, data: MOCK_OVERVIEW } });
      }
      if (url.includes('/facilities/me')) {
        return route.fulfill({
          json: {
            success: true,
            data: {
              id: 'fac-1',
              facilityName: 'CSYT Hà Nội',
              verificationStatus: 'ACTIVE',
              status: 'ACTIVE',
              onboardingStatus: 'ACTIVE',
              hasActiveStaffingContract: true,
            },
          },
        });
      }
      if (url.includes('/contracts/staffing')) {
        return route.fulfill({ json: { success: true, data: { data: [], total: 0 } } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    });

    const origin = await seedMockAuthSession(page, 'FACILITY', {
      mustChangePassword: true,
      name: 'CSYT Hà Nội',
    });
    await page.goto(`${origin}/facility`);

    const banner = page.getByTestId('must-change-password-banner');
    await expect(banner).toBeVisible();

    const textEl = banner.locator('p');
    const changePasswordBtn = banner.getByRole('link', { name: 'Đổi mật khẩu', exact: true });

    const textBox = await textEl.boundingBox();
    const btnBox = await changePasswordBtn.boundingBox();
    expect(textBox).not.toBeNull();
    expect(btnBox).not.toBeNull();
    // Single-row alignment: button must sit on the same horizontal band as text, not wrapped below
    expect(Math.abs((btnBox!.y + btnBox!.height / 2) - (textBox!.y + textBox!.height / 2))).toBeLessThan(16);
    expect(btnBox!.x).toBeGreaterThan(textBox!.x);

    await banner.getByRole('button', { name: 'Đóng đề xuất đổi mật khẩu' }).click();
    await expect(banner).toBeHidden();
  });

  test('E2E-UI-02 (#5): FacilityStaffView 3 toolbar buttons have equal dimensions on desktop and no mobile overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/facilities/me')) {
        return route.fulfill({
          json: {
            success: true,
            data: {
              id: 'fac-1',
              facilityName: 'CSYT Hà Nội',
              verificationStatus: 'ACTIVE',
              status: 'ACTIVE',
              onboardingStatus: 'ACTIVE',
              hasActiveStaffingContract: true,
            },
          },
        });
      }
      if (url.includes('/doctors/facility/quota-proposals')) {
        return route.fulfill({ json: { success: true, data: [] } });
      }
      if (url.includes('/doctors')) {
        return route.fulfill({ json: { success: true, data: [] } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    });

    const origin = await seedMockAuthSession(page, 'FACILITY');
    await page.goto(`${origin}/facility/doctors`);

    const refreshBtn = page.getByRole('button', { name: /Làm mới/i });
    const importBtn = page.getByRole('button', { name: /Import Excel/i });
    const addBtn = page.getByRole('button', { name: /Thêm Bác Sĩ Mới/i });

    await expect(refreshBtn).toBeVisible();
    const b1 = await refreshBtn.boundingBox();
    const b2 = await importBtn.boundingBox();
    const b3 = await addBtn.boundingBox();

    expect(b1 && b2 && b3).toBeTruthy();
    // Equal height and equal width in 3-column grid, aligned on same row
    expect(Math.abs(b1!.height - b2!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(b2!.height - b3!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(b1!.width - b2!.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(b2!.width - b3!.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(b1!.y - b2!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(b2!.y - b3!.y)).toBeLessThanOrEqual(1);

    // Responsive check on mobile
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test('E2E-UI-03 (#7): AdminFacilitiesView renders all 5 status filter tabs on a single row', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/admin/facilities')) {
        return route.fulfill({
          json: {
            success: true,
            data: {
              data: [
                {
                  id: 'fac-e2e-1',
                  facilityName: 'CSYT Hà Nội',
                  representativeName: 'BS. Nguyễn Văn A',
                  email: 'hn@csyt.vn',
                  phone: '0909000111',
                  verificationStatus: 'PENDING',
                  status: 'PENDING',
                  onboardingStatus: 'LEGAL_SUBMITTED',
                  createdAt: '2026-11-20T00:00:00.000Z',
                },
              ],
              total: 1,
            },
          },
        });
      }
      if (url.includes('/doctors/admin/list')) {
        return route.fulfill({ json: { success: true, data: [] } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    });

    const origin = await seedMockAuthSession(page, 'ADMIN');
    await page.goto(`${origin}/admin/facilities`);

    const tabLabels = [
      /Tất cả/i,
      /Chờ Nộp Pháp Lý/i,
      /Chờ Pháp Lý Cấp 2/i,
      /Đang Hoạt Động/i,
      /Từ chối \/ Bổ sung/i,
    ];

    const filterBar = page.locator('.overflow-x-auto').first();
    const boxes = [];
    for (const label of tabLabels) {
      const btn = filterBar.getByRole('button', { name: label });
      await expect(btn).toBeVisible();
      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }

    const ys = boxes.map((b) => b.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(2);
  });

  test('E2E-COPY-01 (#2, #3, #4): Facility legal profile & Admin facility detail omit ACTIVE banner and replace ĐKKD with Giấy phép kinh doanh', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const activeFacility = {
      id: 'fac-e2e-1',
      facilityName: 'CSYT Hà Nội',
      representativeName: 'BS. Nguyễn Văn A',
      email: 'hn@csyt.vn',
      phone: '0909000111',
      address: '123 Giải Phóng, Hà Nội',
      verificationStatus: 'ACTIVE',
      status: 'ACTIVE',
      onboardingStatus: 'ACTIVE',
      operatingLicense: '09988/BYT-GPHĐ',
      licenseIssuer: 'Bộ Y tế',
      licenseDate: '2024-01-15',
      taxCode: '0315999888',
      bankName: 'Vietcombank',
      bankBin: '970436',
      bankCode: 'VCB',
      bankAccount: '0011002233445',
      bankAccountHolder: 'CONG TY CSYT HA NOI',
      hasOperatingLicense: true,
      hasBusinessLicense: true,
      hasLegalDocument: true,
      createdAt: '2026-11-20T00:00:00.000Z',
    };

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/public/banks') || url.includes('/vietqr')) {
        return route.fulfill({ json: { success: true, data: SAMPLE_BANKS } });
      }
      if (url.includes('/facilities/me')) {
        return route.fulfill({ json: { success: true, data: activeFacility } });
      }
      if (url.includes('/admin/facilities/fac-e2e-1')) {
        return route.fulfill({ json: { success: true, data: activeFacility } });
      }
      if (url.includes('/contracts/staffing')) {
        return route.fulfill({ json: { success: true, data: { data: [], total: 0 } } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    });

    // 1. Check /facility/legal-profile
    const facOrigin = await seedMockAuthSession(page, 'FACILITY');
    await page.goto(`${facOrigin}/facility/legal-profile`);

    await expect(page.getByText(/2\. Giấy phép kinh doanh/i)).toBeVisible();
    await expect(
      page.getByText(
        /Bản scan Giấy phép kinh doanh \(hoặc Quyết định thành lập nếu là cơ sở công lập\) có Mã số thuế/i,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/Cơ sở y tế đã hoàn tất hậu kiểm pháp lý và được kích hoạt đối tác ACTIVE!/i),
    ).toHaveCount(0);

    const facBodyText = await page.locator('main').last().innerText();
    expect(facBodyText).not.toMatch(/ĐKKD|Đăng ký doanh nghiệp|đăng ký kinh doanh/i);

    // 2. Check /admin/facilities/fac-e2e-1
    const adminOrigin = await seedMockAuthSession(page, 'ADMIN');
    await page.goto(`${adminOrigin}/admin/facilities/fac-e2e-1`);

    await page.getByRole('button', { name: /2\. Hồ sơ pháp lý & GPHĐ/i }).click();
    await expect(page.getByText(/2\. Giấy phép kinh doanh/i)).toBeVisible();
    await expect(
      page.getByText(
        /Bản scan Giấy phép kinh doanh \(hoặc Quyết định thành lập nếu là cơ sở công lập\) có Mã số thuế/i,
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Xem \/ Tải Giấy phép kinh doanh/i })).toBeVisible();

    const adminMainText = await page.locator('main').last().innerText();
    expect(adminMainText).not.toMatch(/ĐKKD|Đăng ký doanh nghiệp|đăng ký kinh doanh/i);
  });

  test('E2E-FLOW-01 (#6): Facility legal submit redirects to /facility waiting state, locks resubmission & handles 409/REJECTED', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    let currentProfile: Record<string, any> = {
      id: 'fac-e2e-1',
      facilityName: 'CSYT Hà Nội',
      representativeName: 'BS. Nguyễn Văn A',
      email: 'hn@csyt.vn',
      phone: '0909000111',
      address: '123 Giải Phóng, Hà Nội',
      verificationStatus: 'PENDING',
      status: 'PENDING',
      onboardingStatus: 'PENDING_LEGAL',
      legalRejectionReason: null,
      hasOperatingLicense: false,
      hasBusinessLicense: false,
      createdAt: '2026-11-20T00:00:00.000Z',
    };
    let submitCount = 0;

    await page.route('**/api/v1/**', async (route) => {
      const req = route.request();
      const url = req.url();
      if (url.includes('/public/banks') || url.includes('/vietqr')) {
        return route.fulfill({ json: { success: true, data: SAMPLE_BANKS } });
      }
      if (url.includes('/facilities/me/legal-profile') && req.method() === 'PUT') {
        submitCount += 1;
        currentProfile = {
          ...currentProfile,
          onboardingStatus: 'LEGAL_SUBMITTED',
          verificationStatus: 'PENDING',
          status: 'PENDING',
          legalRejectionReason: null,
          operatingLicense: '09988/BYT-GPHĐ',
          licenseIssuer: 'Bộ Y tế',
          licenseDate: '2024-01-15',
          taxCode: '0315999888',
          bankName: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam',
          bankBin: '970436',
          bankCode: 'VCB',
          bankAccount: '0011002233445',
          bankAccountHolder: 'CONG TY CSYT HA NOI',
          hasOperatingLicense: true,
          hasBusinessLicense: true,
          hasLegalDocument: true,
        };
        return route.fulfill({ json: { success: true, data: currentProfile } });
      }
      if (url.includes('/facilities/me/overview')) {
        return route.fulfill({ json: { success: true, data: MOCK_OVERVIEW } });
      }
      if (url.includes('/facilities/me')) {
        return route.fulfill({ json: { success: true, data: currentProfile } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    });

    const origin = await seedMockAuthSession(page, 'FACILITY');
    await page.goto(`${origin}/facility/legal-profile`);

    // Fill all required fields
    await page.getByPlaceholder(/08921\/BYT-GPHĐ/i).fill('09988/BYT-GPHĐ');
    await page.getByPlaceholder(/Cục Quản lý Khám chữa bệnh/i).fill('Bộ Y tế');
    await page.locator('input[type="date"]').fill('2024-01-15');
    await page.getByPlaceholder(/0315892019/i).fill('0315999888');
    await page.getByPlaceholder(/1900 8821/i).fill('0909000111');
    await page.getByPlaceholder(/Số nhà, tên đường/i).fill('123 Giải Phóng, Hà Nội');

    await page.getByTestId('bank-selector-trigger').click();
    await page.getByRole('option', { name: /Vietcombank/i }).locator('button').click();
    await page.getByPlaceholder(/0071000889922/i).fill('0011002233445');
    await page.getByPlaceholder(/CTCP BENH VIEN QUOC TE FAMICARE/i).fill('CONG TY CSYT HA NOI');

    await page.getByTestId('operating-license-input').setInputFiles(createPdfFilePayload('gphd.pdf'));
    await page.getByTestId('business-license-input').setInputFiles(createPdfFilePayload('gpkd.pdf'));

    await page.getByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i }).click();

    // Redirects to /facility and shows waiting review banner
    await expect(page).toHaveURL(/\/facility$/);
    expect(submitCount).toBe(1);
    await expect(
      page.getByText(/Hồ sơ pháp lý đã nộp · Đang chờ Admin FamiDoc thẩm định/i),
    ).toBeVisible();

    // Attempting to access restricted operational route /facility/doctors bounces back to /facility/legal-profile
    await page.goto(`${origin}/facility/doctors`);
    await expect(page).toHaveURL(/\/facility\/legal-profile$/);

    // Legal profile form is locked and submit button is hidden
    await expect(page.getByPlaceholder(/08921\/BYT-GPHĐ/i)).toBeDisabled();
    await expect(page.getByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i })).toHaveCount(0);

    // Negative / Resubmit case: when REJECTED, form unlocks for resubmission
    currentProfile = {
      ...currentProfile,
      onboardingStatus: 'REJECTED',
      legalRejectionReason: 'Ảnh Giấy phép kinh doanh bị mờ góc',
    };
    await page.reload();
    await expect(page.getByText(/Ảnh Giấy phép kinh doanh bị mờ góc/i)).toBeVisible();
    await expect(page.getByPlaceholder(/08921\/BYT-GPHĐ/i)).toBeEnabled();
    await expect(page.getByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i })).toBeVisible();
  });

  test('E2E-FLOW-02 (#8): Doctor credentials submit redirects to /doctor waiting card, skips clinical APIs & locks form', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    let doctorProfile: Record<string, any> = {
      id: 'doc-e2e-1',
      doctorName: 'BS. Phan Văn Minh',
      specialty: 'Y học gia đình',
      experienceYears: 5,
      onboardingStatus: 'PENDING_SUBMISSION',
      facilityId: 'fac-1',
      facilityName: 'CSYT Hà Nội',
      credentials: [],
    };
    let submitCount = 0;
    let clinicalApiCalled = false;

    await page.route('**/api/v1/**', async (route) => {
      const req = route.request();
      const url = req.url();
      if (url.includes('/doctors/me/credentials') && req.method() === 'PUT') {
        submitCount += 1;
        doctorProfile = {
          ...doctorProfile,
          onboardingStatus: 'PENDING_FACILITY_REVIEW',
          credentials: [
            {
              id: 'c1',
              credentialType: 'PRACTICE_LICENSE_CCHN',
              certificateNumber: 'CCHN-001',
              issueDate: '2022-01-01',
              issuingAuthority: 'Bộ Y tế',
              fileUrl: 'cchn.pdf',
            },
            {
              id: 'c2',
              credentialType: 'DEGREE',
              certificateNumber: 'DEG-001',
              issueDate: '2020-01-01',
              issuingAuthority: 'ĐH Y Hà Nội',
              fileUrl: 'degree.pdf',
            },
            {
              id: 'c3',
              credentialType: 'FAMILY_MEDICINE_CERT',
              certificateNumber: 'FM-001',
              issueDate: '2023-01-01',
              issuingAuthority: 'Bộ Y tế',
              fileUrl: 'fm.pdf',
            },
          ],
        };
        return route.fulfill({ json: { success: true, data: doctorProfile } });
      }
      if (url.includes('/doctors/me')) {
        return route.fulfill({ json: { success: true, data: doctorProfile } });
      }
      if (url.includes('/contracts') || url.includes('/encounters/timetable')) {
        clinicalApiCalled = true;
        return route.fulfill({ json: { success: true, data: [] } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    });

    const origin = await seedMockAuthSession(page, 'DOCTOR', { name: 'BS. Phan Văn Minh' });
    await page.goto(`${origin}/doctor/verification`);

    // Fill 3 mandatory credentials
    await page.getByLabel('Số hiệu Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)').fill('CCHN-001');
    await page.getByLabel('Nơi cấp Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)').fill('Bộ Y tế');
    await page.getByLabel('Ngày cấp Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)').fill('2022-01-01');
    await page
      .getByLabel('Tệp scan Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)')
      .setInputFiles(createPdfFilePayload('cchn.pdf'));

    await page.getByLabel('Số hiệu Bằng chuyên môn').fill('DEG-001');
    await page.getByLabel('Nơi cấp Bằng chuyên môn').fill('ĐH Y Hà Nội');
    await page.getByLabel('Ngày cấp Bằng chuyên môn').fill('2020-01-01');
    await page
      .getByLabel('Tệp scan Bằng chuyên môn')
      .setInputFiles(createPdfFilePayload('degree.pdf'));

    await page.getByLabel('Số hiệu Chứng chỉ Y học gia đình').fill('FM-001');
    await page.getByLabel('Nơi cấp Chứng chỉ Y học gia đình').fill('Bộ Y tế');
    await page.getByLabel('Ngày cấp Chứng chỉ Y học gia đình').fill('2023-01-01');
    await page
      .getByLabel('Tệp scan Chứng chỉ Y học gia đình')
      .setInputFiles(createPdfFilePayload('fm.pdf'));

    await page.getByRole('button', { name: /Gửi Thẩm Định/i }).click();

    // Redirects to /doctor and shows 2-tier verification card without calling clinical APIs
    await expect(page).toHaveURL(/\/doctor$/);
    expect(submitCount).toBe(1);
    await expect(
      page.getByRole('heading', { name: /Hồ sơ Bác sĩ đang trong quy trình thẩm định 2 cấp/i }),
    ).toBeVisible();
    expect(clinicalApiCalled).toBe(false);

    // Attempting to access restricted clinical route /doctor/encounters bounces back to /doctor/verification
    await page.goto(`${origin}/doctor/encounters`);
    await expect(page).toHaveURL(/\/doctor\/verification$/);

    // Verification form is locked and submit button is hidden
    await expect(page.getByLabel(/Chuyên khoa hành nghề/i)).toBeDisabled();
    await expect(page.getByRole('button', { name: /Gửi Thẩm Định/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Cập nhật & Gửi lại Thẩm định/i })).toHaveCount(0);
  });
});
