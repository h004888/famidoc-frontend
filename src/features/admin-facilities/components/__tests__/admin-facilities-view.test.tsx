import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminFacilitiesView } from '../admin-facilities-view';
import { facilitiesApi } from '@/lib/api/facilities.api';

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getAdminFacilities: vi.fn(),
    approveAccount: vi.fn(),
    verifyLegal: vi.fn(),
    rejectFacility: vi.fn(),
  },
}));

describe('AdminFacilitiesView - Quản trị & Thẩm định Cơ sở Y tế (Flow 2.1)', () => {
  const mockFacility = {
    id: 'FAC-TEST-001',
    facilityName: 'Bệnh viện Kiểm Thử FamiDoc',
    representativeName: 'TS. Nguyễn Văn A',
    email: 'test@hospital.vn',
    phone: '0912345678',
    address: '123 Đường Y Tế, Q.1, TP.HCM',
    onboardingStatus: 'PENDING_APPROVAL' as const,
    status: 'PENDING' as const,
    createdAt: '2026-11-14T08:00:00.000Z',
  };

  it('renders header, stat counters and initial facilities list', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      statusCode: 200,
      message: 'OK',
      data: [mockFacility],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    render(<AdminFacilitiesView />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Quản trị & Thẩm định Cơ sở Y tế/i);
    expect(screen.getAllByText(/Chờ Duyệt Cấp 1/i).length).toBeGreaterThan(0);

    const facilityNames = await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');
    expect(facilityNames.length).toBeGreaterThan(0);
  });

  it('opens detail modal when clicking "Chi tiết & Thẩm định"', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      statusCode: 200,
      message: 'OK',
      data: [mockFacility],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    const detailButtons = screen.getAllByRole('button', { name: /Chi tiết & Thẩm định|Thẩm định/i });
    fireEvent.click(detailButtons[0]);

    expect(screen.getByText(/Hồ Sơ Chi Tiết Cơ Sở Y Tế/i)).toBeInTheDocument();
    expect(screen.getByText(/Thông Tin Đăng Ký Cơ Bản/i)).toBeInTheDocument();
  });

  it('executes Duyệt Cấp 1 to issue portal account and default password', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      statusCode: 200,
      message: 'OK',
      data: [mockFacility],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    vi.mocked(facilitiesApi.approveAccount).mockResolvedValue({ statusCode: 200 });

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    const detailButtons = screen.getAllByRole('button', { name: /Chi tiết & Thẩm định|Thẩm định/i });
    fireEvent.click(detailButtons[0]);

    const approveL1Btn = screen.getByRole('button', { name: /Duyệt Cấp 1 \(Cấp Portal\)/i });
    fireEvent.click(approveL1Btn);

    // Confirm popup opens
    expect(screen.getByText(/Xác nhận Duyệt Lần 1: Cấp Tài Khoản Portal/i)).toBeInTheDocument();
    expect(screen.getAllByText('FamiDoc@Facility2026').length).toBeGreaterThan(0);

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận cấp tài khoản/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(facilitiesApi.approveAccount).toHaveBeenCalledWith('FAC-TEST-001');
    });
  });
});
