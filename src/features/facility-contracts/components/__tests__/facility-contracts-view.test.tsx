import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { FacilityContractsView } from '../facility-contracts-view';
import { contractsApi } from '@/lib/api/contracts.api';
import { facilitiesApi } from '@/lib/api/facilities.api';

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getMyFacilityProfile: vi.fn().mockResolvedValue({
      facilityName: 'Bệnh viện Đa khoa An Sinh',
    }),
  },
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getStaffingContracts: vi.fn(),
    signStaffingContract: vi.fn(),
    rejectStaffingContract: vi.fn(),
  },
}));

describe('Giai đoạn 3: Hợp đồng cung ứng nhân lực y tế B2B (Flow 2.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('Bước 3.1: CSYT quan sát danh sách hợp đồng B2B thấy STAFF-2026-ANSINH-002 ở trạng thái DRAFT và tỷ lệ 85/15', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [
        {
          id: 'CTR-B2B-2026-002',
          contractNumber: 'STAFF-2026-ANSINH-002',
          facilityName: 'Bệnh viện Đa khoa An Sinh',
          platformSharePercent: 15,
          facilitySharePercent: 85,
          validFrom: '2026-11-12T00:00:00.000Z',
          validTo: '2027-11-12T23:59:59.000Z',
          status: 'DRAFT',
          adminSigned: true,
          facilitySigned: false,
          contractTerms: 'Toàn văn điều khoản phân chia doanh thu 85% CSYT / 15% Platform.',
        },
      ],
      total: 1,
    });

    render(<FacilityContractsView />);

    // Kiểm tra hợp đồng STAFF-2026-ANSINH-002 xuất hiện
    const contractCodes = await screen.findAllByText('STAFF-2026-ANSINH-002');
    expect(contractCodes.length).toBeGreaterThan(0);

    const desktop = within(screen.getByTestId('desktop-view'));
    // Kiểm tra tỷ lệ 85% CSYT / 15% Platform
    expect(desktop.getByText(/85% CSYT/i)).toBeInTheDocument();
    expect(desktop.getByText(/\/ 15% Platform/i)).toBeInTheDocument();

    // Kiểm tra trạng thái DRAFT
    expect(desktop.getByText(/Dự Thảo \(Chờ CSYT ký\)/i)).toBeInTheDocument();

    // Kiểm tra chữ ký 2 bên
    expect(desktop.getByText(/Admin: Đã ký số/i)).toBeInTheDocument();
    expect(desktop.getByText(/CSYT: Chờ ký xác nhận/i)).toBeInTheDocument();
  });

  it('Cho phép CSYT bấm "Chi Tiết & Ký Số", mở SmartCA và Ký số thành công chuyển sang ACTIVE', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [
        {
          id: 'CTR-B2B-2026-002',
          contractNumber: 'STAFF-2026-ANSINH-002',
          facilityName: 'Bệnh viện Đa khoa An Sinh',
          platformSharePercent: 15,
          facilitySharePercent: 85,
          validFrom: '2026-11-12T00:00:00.000Z',
          validTo: '2027-11-12T23:59:59.000Z',
          status: 'DRAFT',
          adminSigned: true,
          facilitySigned: false,
          contractTerms: 'Toàn văn điều khoản phân chia doanh thu 85% CSYT / 15% Platform.',
        },
      ],
      total: 1,
    });
    vi.mocked(contractsApi.signStaffingContract).mockResolvedValue({ statusCode: 200 });

    render(<FacilityContractsView />);

    await screen.findAllByText('STAFF-2026-ANSINH-002');

    // Bấm Chi Tiết & Ký Số
    const detailBtn = within(screen.getByTestId('desktop-view')).getByRole('button', { name: /Chi Tiết & Ký Số/i });
    fireEvent.click(detailBtn);

    // Modal chi tiết hiện lên
    expect(screen.getByText(/Chi Tiết Hợp Đồng Cung Ứng Nhân Lực B2B/i)).toBeInTheDocument();
    expect(screen.getByText(/Toàn văn điều khoản phân chia doanh thu/i)).toBeInTheDocument();

    // Bấm Ký Số Điện Tử B2B
    const signBtn = screen.getByRole('button', { name: /Ký Số Điện Tử B2B/i });
    fireEvent.click(signBtn);

    // Hộp thoại SmartCA xác nhận hiện lên
    expect(screen.getByText(/Xác Nhận Ký Số Hợp Đồng B2B/i)).toBeInTheDocument();
    expect(screen.getByText(/CERT-VNPT-CA-2026-B2B/i)).toBeInTheDocument();

    // Bấm Xác Nhận Ký Số Ngay
    const confirmBtn = screen.getByRole('button', { name: /Xác Nhận Ký Số Ngay/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(contractsApi.signStaffingContract).toHaveBeenCalledWith(
        'CTR-B2B-2026-002',
        expect.objectContaining({ confirmed: true })
      );
    });

    // Kết quả: Chuyển sang ACTIVE
    const desktop = within(screen.getByTestId('desktop-view'));
    await waitFor(() => {
      expect(desktop.getByText(/Đang Hoạt Động \(ACTIVE\)/i)).toBeInTheDocument();
    });

    // Cả 2 bên đều có dấu kiểm ✓ Đã ký số
    expect(desktop.getByText(/CSYT: Đã ký số/i)).toBeInTheDocument();
  });

  it('Cho phép CSYT từ chối / đàm phán lại chuyển hợp đồng sang TERMINATED', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [
        {
          id: 'CTR-B2B-2026-002',
          contractNumber: 'STAFF-2026-ANSINH-002',
          facilityName: 'Bệnh viện Đa khoa An Sinh',
          platformSharePercent: 15,
          facilitySharePercent: 85,
          validFrom: '2026-11-12T00:00:00.000Z',
          validTo: '2027-11-12T23:59:59.000Z',
          status: 'DRAFT',
          adminSigned: true,
          facilitySigned: false,
          contractTerms: 'Toàn văn điều khoản phân chia doanh thu 85% CSYT / 15% Platform.',
        },
      ],
      total: 1,
    });
    vi.mocked(contractsApi.rejectStaffingContract).mockResolvedValue({ statusCode: 200 });

    render(<FacilityContractsView />);

    await screen.findAllByText('STAFF-2026-ANSINH-002');

    // Bấm Chi Tiết & Ký Số
    const detailBtn = within(screen.getByTestId('desktop-view')).getByRole('button', { name: /Chi Tiết & Ký Số/i });
    fireEvent.click(detailBtn);

    // Bấm Từ chối / Đàm phán lại
    const rejectBtn = screen.getByRole('button', { name: /Từ chối \/ Đàm phán lại/i });
    fireEvent.click(rejectBtn);

    // Nhập lý do từ chối
    const reasonInput = screen.getByPlaceholderText(/Đề xuất điều chỉnh lại tỷ lệ phân chia/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Đề xuất tăng tỷ lệ CSYT lên 90% do quy mô bác sĩ lớn.' },
    });

    // Bấm Gửi Yêu Cầu Đàm Phán
    const submitRejectBtn = screen.getByRole('button', { name: /Gửi Yêu Cầu Đàm Phán/i });
    fireEvent.click(submitRejectBtn);

    await waitFor(() => {
      expect(contractsApi.rejectStaffingContract).toHaveBeenCalledWith(
        'CTR-B2B-2026-002',
        'Đề xuất tăng tỷ lệ CSYT lên 90% do quy mô bác sĩ lớn.'
      );
    });

    // Hợp đồng chuyển sang TERMINATED
    await waitFor(() => {
      expect(screen.getByText(/Đã từ chối \/ Đàm phán lại/i)).toBeInTheDocument();
    });
  });
});
