import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminReconciliationView } from '../admin-reconciliation-view';
import { contractsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  contractsApi: {
    recheckPaymentActivation: vi.fn().mockResolvedValue({ activated: true }),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/admin/reconciliation',
  useSearchParams: () => new URLSearchParams(),
}));

const mockTransactions = [
  {
    id: 'tx-sepay-901',
    transactionId: 'SP-20261109-7712',
    contractId: 'ct-4p-001',
    contractNumber: 'HD-4P-2026-0001',
    amount: 9600000,
    syntax: 'FAMIDOC HD-4P-2026-0001',
    bankBrand: 'MBBank',
    accountNumber: '0912345678',
    status: 'PENDING' as const,
    receivedAt: '2026-11-09T10:15:00.000Z',
    errorMessage: 'Webhook timeout do nghẽn mạng phía ngân hàng',
  },
  {
    id: 'tx-sepay-902',
    transactionId: 'SP-20261109-7713',
    contractId: 'ct-4p-002',
    contractNumber: 'HD-4P-2026-0002',
    amount: 6000000,
    syntax: 'FAMIDOC HD-4P-2026-0002',
    bankBrand: 'Vietcombank',
    accountNumber: '0987654321',
    status: 'MATCHED' as const,
    receivedAt: '2026-11-09T09:30:00.000Z',
  },
  {
    id: 'tx-sepay-903',
    transactionId: 'SP-20261109-7714',
    contractId: 'ct-4p-003',
    contractNumber: 'HD-4P-2026-0003',
    amount: 5000000,
    syntax: 'FAMIDOC 003 CHUYEN TIEN',
    bankBrand: 'Techcombank',
    accountNumber: '0903112233',
    status: 'FAILED' as const,
    receivedAt: '2026-11-09T08:00:00.000Z',
    errorMessage: 'Thiếu 2.500.000 ₫ so với giá trị gói',
  },
];

describe('Màn 5: AdminReconciliationView (Đối soát SePay & Kích hoạt bù)', () => {
  it('renders SePay webhook transaction log table with syntax, amount, bank, and status', () => {
    render(<AdminReconciliationView initialTransactions={mockTransactions} />);

    // Header & Subheading
    expect(screen.getByText(/Đối Soát Giao Dịch SePay & Kích Hoạt Bù/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Tra cứu log webhook thanh toán VietQR và xử lý kích hoạt bù hợp đồng/i),
    ).toBeInTheDocument();

    // Table headers & content
    expect(screen.getByText(/SP-20261109-7712/i)).toBeInTheDocument();
    expect(screen.getByText(/FAMIDOC HD-4P-2026-0001/i)).toBeInTheDocument();
    expect(screen.getByText(/9\.600\.000/i)).toBeInTheDocument();
    expect(screen.getAllByText(/MBBank/i).length).toBeGreaterThan(0);

    // Status badges
    expect(screen.getAllByText(/Chờ đối soát/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Đã khớp lệnh/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sai lệch/i).length).toBeGreaterThan(0);
  });

  it('filters transactions by status and search query', () => {
    render(<AdminReconciliationView initialTransactions={mockTransactions} />);

    // Filter by status: PENDING
    const filterSelect = screen.getByLabelText(/Lọc theo trạng thái/i);
    fireEvent.change(filterSelect, { target: { value: 'PENDING' } });

    expect(screen.getByText(/SP-20261109-7712/i)).toBeInTheDocument();
    expect(screen.queryByText(/SP-20261109-7713/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SP-20261109-7714/i)).not.toBeInTheDocument();

    // Reset filter
    fireEvent.change(filterSelect, { target: { value: 'ALL' } });
    expect(screen.getByText(/SP-20261109-7713/i)).toBeInTheDocument();

    // Search query
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm mã giao dịch, số hợp đồng/i);
    fireEvent.change(searchInput, { target: { value: 'HD-4P-2026-0002' } });

    expect(screen.queryByText(/SP-20261109-7712/i)).not.toBeInTheDocument();
    expect(screen.getByText(/SP-20261109-7713/i)).toBeInTheDocument();
  });

  it('triggers manual fallback activation for pending transaction and logs admin audit trail', async () => {
    render(<AdminReconciliationView initialTransactions={mockTransactions} />);

    // Check PENDING button exists
    const fallbackBtn = screen.getByRole('button', {
      name: /Kích hoạt bù|Xử lý bù/i,
    });
    fireEvent.click(fallbackBtn);

    // Modal dialog opens
    expect(screen.getByText(/Xác nhận Kích hoạt Bù Hợp đồng/i)).toBeInTheDocument();
    expect(screen.getAllByText(/HD-4P-2026-0001/i).length).toBeGreaterThan(0);

    // Input audit reason
    const reasonInput = screen.getByLabelText(/Lý do kích hoạt bù/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Đã kiểm tra sao kê MBBank thành công, kích hoạt bù do nghẽn webhook' },
    });

    // Confirm button in modal
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Kích hoạt Bù/i });
    fireEvent.click(confirmBtn);

    // Success notification
    await waitFor(() => {
      expect(screen.getByText(/Kích hoạt bù hợp đồng HD-4P-2026-0001 thành công/i)).toBeInTheDocument();
    });

    // Audit trail section should record the action
    expect(screen.getByText(/Nhật ký Thao tác Audit Trail/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Đã kiểm tra sao kê MBBank thành công, kích hoạt bù do nghẽn webhook/i),
    ).toBeInTheDocument();
  });

  it('calls contractsApi.recheckPaymentActivation when admin triggers fallback activation', async () => {
    render(<AdminReconciliationView initialTransactions={mockTransactions} />);

    const fallbackBtn = screen.getByRole('button', {
      name: /Kích hoạt bù|Xử lý bù/i,
    });
    fireEvent.click(fallbackBtn);

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Kích hoạt Bù/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(contractsApi.recheckPaymentActivation).toHaveBeenCalledWith('SP-20261109-7712');
    });
  });

  it('complies with typography design system (no font-mono, font-black, or font-extrabold)', () => {
    const { container } = render(
      <AdminReconciliationView initialTransactions={mockTransactions} />,
    );
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });
});
