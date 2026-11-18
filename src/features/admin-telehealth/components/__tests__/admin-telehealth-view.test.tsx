import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminTelehealthView } from '../admin-telehealth-view';
import { telehealthApi, MOCK_TELEHEALTH_ENCOUNTERS } from '@/lib/api/telehealth.api';

vi.mock('@/lib/api/telehealth.api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/telehealth.api')>('@/lib/api/telehealth.api');
  return {
    ...actual,
    telehealthApi: {
      getEncounters: vi.fn(),
      getEncounterDetail: vi.fn(),
    },
  };
});

describe('AdminTelehealthView - Giám sát Lịch khám Trực tuyến', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(telehealthApi.getEncounters).mockResolvedValue({
      data: MOCK_TELEHEALTH_ENCOUNTERS,
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: MOCK_TELEHEALTH_ENCOUNTERS.length,
        totalPages: 1,
      },
    });
  });

  it('renders page header, stat cards, and initial table data', async () => {
    render(<AdminTelehealthView />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Giám sát Lịch khám Trực tuyến/i);
    expect(screen.getByText(/Tổng số ca khám trực tuyến hệ thống/i)).toBeInTheDocument();
    expect(screen.getByText(/Ca khám đang kết nối trực tuyến/i)).toBeInTheDocument();

    // Data row should appear
    const patientName = await screen.findAllByText(/Trần Văn Hùng/i);
    expect(patientName.length).toBeGreaterThan(0);
  });

  it('filters encounters when clicking on status filter buttons', async () => {
    render(<AdminTelehealthView />);

    await screen.findAllByText(/Trần Văn Hùng/i);

    // Click filter "Đang diễn ra (LIVE)"
    const liveFilterBtn = screen.getByRole('button', { name: /Đang diễn ra \(LIVE\)/i });
    fireEvent.click(liveFilterBtn);

    // Live encounter should be visible
    expect(screen.getAllByText(/BS.CKII Nguyễn Hoàng Long/i).length).toBeGreaterThan(0);
  });

  it('filters encounters using search input and clears search', async () => {
    render(<AdminTelehealthView />);

    await screen.findAllByText(/Trần Văn Hùng/i);

    const searchInput = screen.getByLabelText(/Tìm kiếm lịch khám trực tuyến/i);
    fireEvent.change(searchInput, { target: { value: 'Lê Hồng Nhung' } });

    // Matching doctor should appear
    expect(screen.getAllByText(/ThS.BS Lê Hồng Nhung/i).length).toBeGreaterThan(0);

    // Clear search
    const clearBtn = screen.getByLabelText(/Xóa tìm kiếm/i);
    fireEvent.click(clearBtn);

    expect(searchInput).toHaveValue('');
  });

  it('opens detail modal when clicking "Xem chi tiết" button and closes it', async () => {
    render(<AdminTelehealthView />);

    await screen.findAllByText(/Trần Văn Hùng/i);

    const detailButtons = screen.getAllByRole('button', { name: /Xem chi tiết/i });
    fireEvent.click(detailButtons[0]);

    // Modal dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Hồ Sơ Ca Khám Trực Tuyến/i)).toBeInTheDocument();
    expect(screen.getByText(/Triệu chứng ban đầu & Ghi chú lâm sàng/i)).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Đóng cửa sổ/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows error alert and retries fetching when API fails', async () => {
    vi.mocked(telehealthApi.getEncounters).mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'));

    render(<AdminTelehealthView />);

    expect(await screen.findByText(/Lỗi kết nối máy chủ/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    vi.mocked(telehealthApi.getEncounters).mockResolvedValueOnce({
      data: MOCK_TELEHEALTH_ENCOUNTERS,
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: MOCK_TELEHEALTH_ENCOUNTERS.length,
        totalPages: 1,
      },
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Lỗi kết nối máy chủ/i)).not.toBeInTheDocument();
    });
  });
});
