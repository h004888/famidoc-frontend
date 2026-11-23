import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { financeApi, type FacilitySettlementDto } from '@/lib/api/finance.api';
import { FacilityRevenueView } from '../facility-revenue-view';

vi.mock('@/lib/api/finance.api', () => ({
  financeApi: { getAnalytics: vi.fn(), reviewSettlement: vi.fn() },
}));

const statement: FacilitySettlementDto = {
  id: 'statement-1',
  settlementCode: 'ST-01',
  facilityId: 'facility-1',
  environment: 'LIVE',
  month: 10,
  year: 2026,
  disbursementStatus: 'PENDING',
  reviewStatus: 'PENDING',
  reviewVersion: 3,
  totalRealizedRevenue: 1000000,
  platformFeeAmount: 150000,
  facilityPayoutAmount: 850000,
  bankDestination: { bankName: 'MB', accountNumber: '1234567', accountHolder: 'CSYT' },
  createdAt: '2026-11-05T01:00:00Z',
};

describe('FacilityRevenueView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('hides active doctors table and navigates outside-in across KPI strip, package summary and monthly settlement tabs', async () => {
    vi.mocked(financeApi.getAnalytics).mockResolvedValue({
      currency: 'VND',
      environment: 'LIVE',
      year: 2026,
      month: 10,
      invoiceCount: 2,
      recognitionBasis: 'SERVICE_DAYS',
      grossVnd: 1000000,
      vatVnd: 0,
      netVnd: 1000000,
      facilityShareVnd: 850000,
      platformFeeVnd: 150000,
      settlements: [],
      facilityBusiness: {
        activeHouseholds: 3,
        doctors: [
          { id: 'doctor-1', doctorName: 'Nguyễn Minh', specialty: 'Y học gia đình', households: 3 },
          { id: 'doctor-2', doctorName: 'Lê An', specialty: 'Nội khoa', households: 0 },
        ],
        familyPackages: [],
        purchases: {
          purchasingHouseholds: 1,
          packagesSold: 2,
          grossVnd: 2000000,
          platformFeeVnd: 300000,
          facilityShareVnd: 1700000,
          byPackage: [
            {
              packageCode: 'BASIC',
              packageName: 'Gói cơ bản',
              packagesSold: 2,
              grossVnd: 2000000,
              platformFeeVnd: 300000,
              facilityShareVnd: 1700000,
            },
          ],
        },
      },
    });
    render(<FacilityRevenueView />);

    expect(
      await screen.findByRole('region', { name: 'Tổng quan doanh thu kỳ báo cáo' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Chọn tháng theo lịch' }),
    ).toHaveTextContent('Tháng 10/2026');
    // Phần "Bác sĩ đang hoạt động" và nhãn cũ "Kỳ báo cáo" đã được gỡ bỏ
    expect(screen.queryByText('Bác sĩ đang hoạt động')).not.toBeInTheDocument();
    expect(screen.queryByText('Kỳ báo cáo')).not.toBeInTheDocument();

    // 4 thẻ tổng quan chỉ hiển thị thông tin, không phải button bấm được
    const overviewSection = screen.getByRole('region', {
      name: 'Tổng quan doanh thu kỳ báo cáo',
    });
    expect(within(overviewSection).queryAllByRole('button')).toHaveLength(0);
    expect(overviewSection).toHaveTextContent(/850[.,]000/);
    expect(overviewSection).toHaveTextContent(/150[.,]000/);

    // Chuyển sang tab Tổng hợp theo gói
    fireEvent.click(screen.getByRole('tab', { name: /Tổng hợp theo gói/ }));
    const sales = within(screen.getByRole('table', { name: 'Gói đã thanh toán trong tháng' }));
    expect(sales.getByRole('columnheader', { name: 'Phí nền tảng (15%)' })).toBeInTheDocument();
    expect(sales.getByRole('row', { name: /Gói cơ bản/ })).toBeInTheDocument();
    const totals = within(sales.getByRole('row', { name: /Tổng cộng/ }));
    expect(totals.getByText('2')).toBeInTheDocument();
    expect(totals.getByText(/2\.000\.000/)).toBeInTheDocument();
    expect(totals.getByText(/300\.000/)).toBeInTheDocument();
    expect(totals.getByText(/1\.700\.000/)).toBeInTheDocument();

    // Chuyển sang tab Quyết toán kỳ
    fireEvent.click(screen.getByRole('tab', { name: /Quyết toán kỳ/ }));
    expect(
      screen.getByRole('table', { name: 'Bảng quyết toán của kỳ' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Doanh thu phân bổ trong tháng')).toBeInTheDocument();

    // Chọn tháng qua bộ lịch tháng mới
    fireEvent.click(screen.getByRole('button', { name: 'Chọn tháng theo lịch' }));
    const monthCalendar = within(screen.getByRole('dialog', { name: 'Lịch chọn tháng' }));
    fireEvent.click(monthCalendar.getByRole('button', { name: 'Tháng 9' }));
    await waitFor(() =>
      expect(financeApi.getAnalytics).toHaveBeenLastCalledWith({
        environment: 'LIVE',
        year: 2026,
        month: 9,
      }),
    );
  });

  it('surfaces API errors and hides sample reports', async () => {
    vi.mocked(financeApi.getAnalytics).mockRejectedValueOnce(
      new Error('Không có quyền xem kỳ này'),
    );
    render(<FacilityRevenueView />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xem kỳ này');
    expect(screen.queryByText('Bảng quyết toán của kỳ')).not.toBeInTheDocument();
  });

  it.each([
    ['Xác nhận bảng', 'Xác nhận số liệu', 'CONFIRM', 'CONFIRMED', 'CSYT đã xác nhận'],
    ['Báo sai lệch', 'Gửi sai lệch', 'REPORT_DISCREPANCY', 'DISPUTED', 'Đã báo sai lệch'],
  ] as const)(
    'sends %s for the current settlement version',
    async (open, submit, action, status, label) => {
      const reason = 'Hóa đơn tháng 10 chưa khớp.';
      vi.mocked(financeApi.getAnalytics).mockResolvedValueOnce({
        currency: 'VND',
        environment: 'LIVE',
        year: 2026,
        month: 10,
        invoiceCount: 2,
        recognitionBasis: 'SERVICE_DAYS',
        grossVnd: 1000000,
        vatVnd: 0,
        netVnd: 1000000,
        facilityShareVnd: 850000,
        platformFeeVnd: 150000,
        settlements: [statement],
      });
      vi.mocked(financeApi.reviewSettlement).mockResolvedValueOnce({
        ...statement,
        reviewStatus: status,
        reviewDisputeReason: action === 'REPORT_DISCREPANCY' ? reason : null,
      });
      render(<FacilityRevenueView />);

      const table = within(
        await screen.findByRole('table', { name: 'Bảng quyết toán của kỳ' }),
      );
      fireEvent.click(table.getByRole('button', { name: open }));
      const dialog = within(await screen.findByRole('dialog'));
      const payment = dialog.getByRole('region', { name: 'Số tiền và kỳ chi trả CSYT' });
      expect(payment).toHaveTextContent('Tháng 10/2026');
      expect(payment).toHaveTextContent('850.000');
      expect(payment).toHaveTextContent(
        'Bảng chi trả này chưa xác nhận bên nhận đã hoàn thành nghĩa vụ thuế.',
      );
      if (action === 'REPORT_DISCREPANCY') {
        fireEvent.change(dialog.getByLabelText('Nội dung sai lệch'), {
          target: { value: reason },
        });
      }
      fireEvent.click(dialog.getByRole('button', { name: submit }));
      await waitFor(() =>
        expect(financeApi.reviewSettlement).toHaveBeenCalledWith('statement-1', {
          action,
          environment: 'LIVE',
          reviewVersion: 3,
          ...(action === 'REPORT_DISCREPANCY' ? { reason } : {}),
        }),
      );
      expect(await table.findByText(label)).toBeInTheDocument();
    },
  );

  it('falls back cleanly to LIVE when TEST environment is forbidden', async () => {
    vi.mocked(financeApi.getAnalytics)
      .mockResolvedValueOnce({
        currency: 'VND',
        environment: 'LIVE',
        year: 2026,
        month: 10,
        invoiceCount: 1,
        recognitionBasis: 'SERVICE_DAYS',
        grossVnd: 1000000,
        vatVnd: 0,
        netVnd: 1000000,
        facilityShareVnd: 800000,
        platformFeeVnd: 200000,
        settlements: [],
      })
      .mockRejectedValueOnce(
        new Error('Dữ liệu tài chính TEST bị khóa trong môi trường production.'),
      )
      .mockResolvedValueOnce({
        currency: 'VND',
        environment: 'LIVE',
        year: 2026,
        month: 10,
        invoiceCount: 1,
        recognitionBasis: 'SERVICE_DAYS',
        grossVnd: 1000000,
        vatVnd: 0,
        netVnd: 1000000,
        facilityShareVnd: 800000,
        platformFeeVnd: 200000,
        settlements: [],
      });

    render(<FacilityRevenueView />);

    expect(
      await screen.findByRole('region', { name: 'Tổng quan doanh thu kỳ báo cáo' }),
    ).toBeInTheDocument();

    const envSelect = screen.getByLabelText('Môi trường') as HTMLSelectElement;
    fireEvent.change(envSelect, { target: { value: 'TEST' } });

    await waitFor(() => {
      expect(envSelect.value).toBe('LIVE');
      expect(envSelect).toBeDisabled();
      expect(envSelect.querySelector('option[value="TEST"]')).toBeNull();
    });
  });

  it('drills down from package summary into family packages and into package price, platform fee % and facility payout modal', async () => {
    vi.mocked(financeApi.getAnalytics).mockResolvedValueOnce({
      currency: 'VND',
      environment: 'LIVE',
      year: 2026,
      month: 10,
      invoiceCount: 1,
      recognitionBasis: 'SERVICE_DAYS',
      grossVnd: 1000000,
      vatVnd: 0,
      netVnd: 1000000,
      facilityShareVnd: 850000,
      platformFeeVnd: 150000,
      settlements: [],
      facilityBusiness: {
        activeHouseholds: 1,
        doctors: [
          {
            id: 'doc-1',
            doctorName: 'BS. Trần Minh',
            specialty: 'Y học gia đình',
            households: 1,
          },
        ],
        familyPackages: [
          {
            invoiceId: 'inv-1',
            invoiceCode: 'INV-2026-001',
            contractId: 'ctr-1',
            contractNumber: 'HD-2026-001',
            contractStatus: 'ACTIVE',
            familyId: 'fam-1',
            familyName: 'Nguyễn Văn Hùng',
            memberCount: 4,
            packageCode: 'GOLD',
            packageName: 'Gói Gia Đình Vàng',
            durationMonths: 3,
            paidAt: '2026-10-05T03:00:00Z',
            startDate: '2026-10-01T00:00:00Z',
            endDate: '2027-01-01T00:00:00Z',
            purchasedInPeriod: true,
            primaryDoctor: {
              id: 'doc-1',
              doctorName: 'BS. Trần Minh',
              specialty: 'Y học gia đình',
            },
            participatingDoctors: [
              {
                id: 'doc-1',
                doctorName: 'BS. Trần Minh',
                specialty: 'Y học gia đình',
                isPrimary: true,
                encounterCount: 2,
              },
              {
                id: 'doc-2',
                doctorName: 'BS. Lê Thu',
                specialty: 'Nhi khoa',
                isPrimary: false,
                encounterCount: 1,
              },
            ],
            packagePriceVnd: 3000000,
            platformFeePercent: 15,
            platformFeeVnd: 450000,
            facilitySharePercent: 85,
            facilityShareVnd: 2550000,
            periodRecognition: {
              grossVnd: 1000000,
              platformFeeVnd: 150000,
              facilityShareVnd: 850000,
              serviceFrom: '2026-10-01T00:00:00Z',
              serviceUntil: '2026-10-31T00:00:00Z',
            },
          },
        ],
        purchases: {
          purchasingHouseholds: 1,
          packagesSold: 1,
          grossVnd: 3000000,
          platformFeeVnd: 450000,
          facilityShareVnd: 2550000,
          byPackage: [
            {
              packageCode: 'GOLD',
              packageName: 'Gói Gia Đình Vàng',
              packagesSold: 1,
              grossVnd: 3000000,
              platformFeeVnd: 450000,
              facilityShareVnd: 2550000,
            },
          ],
        },
      },
    });

    render(<FacilityRevenueView />);

    // Mặc định mở thẳng bảng quản lý gói gia đình & bác sĩ khám
    const familyTable = within(
      await screen.findByRole('table', {
        name: 'Quản lý gói gia đình đã mua & Bác sĩ tham gia khám',
      }),
    );
    const row = familyTable.getByRole('row', { name: /Nguyễn Văn Hùng/ });
    const packageNameEl = within(row).getByText('Gói Gia Đình Vàng');
    const durationBadge = within(row).getByText('3 tháng');
    expect(durationBadge.parentElement).toBe(packageNameEl.parentElement);
    expect(within(row).queryByText('Mua trong kỳ')).not.toBeInTheDocument();
    expect(within(row).queryByText('Phục vụ trong kỳ')).not.toBeInTheDocument();
    expect(within(row).queryByText('Phụ trách')).not.toBeInTheDocument();
    expect(row).toHaveTextContent('BS. Trần Minh');
    expect(row).toHaveTextContent('BS. Lê Thu');

    // Đi từ Tab 2 (Tổng hợp theo gói) -> bấm vào tên gói để lọc sâu vào Tab 1
    fireEvent.click(screen.getByRole('tab', { name: /Tổng hợp theo gói/ }));
    const summaryTable = within(
      screen.getByRole('table', { name: 'Gói đã thanh toán trong tháng' }),
    );
    fireEvent.click(summaryTable.getByRole('row', { name: /Gói Gia Đình Vàng/ }));
    expect(screen.getByText('Gói: Gói Gia Đình Vàng')).toBeInTheDocument();

    // Bấm sâu vào từng gia đình -> mở hộp thoại chi tiết giá gói / 15% / 85%
    const filteredTable = within(
      screen.getByRole('table', {
        name: 'Quản lý gói gia đình đã mua & Bác sĩ tham gia khám',
      }),
    );
    fireEvent.click(
      within(filteredTable.getByRole('row', { name: /Nguyễn Văn Hùng/ })).getByRole(
        'button',
        { name: /Xem chi tiết/ },
      ),
    );
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Chi tiết giá gói & doanh thu CSYT')).toBeInTheDocument();
    expect(dialog.getByText('Ngày đăng ký')).toBeInTheDocument();
    expect(dialog.getByText('Ngày hết hạn')).toBeInTheDocument();
    expect(dialog.queryByText('Ngày thanh toán')).not.toBeInTheDocument();
    expect(dialog.queryByText('Thời hạn gói')).not.toBeInTheDocument();
    expect(dialog.getByText('Giá gói gia đình thanh toán')).toBeInTheDocument();
    expect(dialog.getByText(/3\.000\.000/)).toBeInTheDocument();
    expect(dialog.getByText('Phí nền tảng FamiDoc')).toBeInTheDocument();
    expect(dialog.getByText('15%')).toBeInTheDocument();
    expect(dialog.getByText(/450\.000/)).toBeInTheDocument();
    expect(dialog.getByText('Tiền nhận được cho CSYT')).toBeInTheDocument();
    expect(dialog.getByText('85%')).toBeInTheDocument();
    expect(dialog.getByText(/2\.550\.000/)).toBeInTheDocument();
    expect(
      dialog.getByText(/Phân bổ ghi nhận trong kỳ Tháng 10\/2026/),
    ).toBeInTheDocument();
  });
});
