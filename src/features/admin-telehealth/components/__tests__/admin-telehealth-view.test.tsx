import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AdminTelehealthView } from '../admin-telehealth-view';
import { httpClient } from '@/lib/api/http-client';
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

describe('AdminTelehealthView - Giám sát lịch khám', () => {
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

  it('shows online and home visits in the same five-column schedule table', async () => {
    const online = {
      ...MOCK_TELEHEALTH_ENCOUNTERS[0],
      scheduledDate: '2026-11-23T00:00:00.000Z',
      scheduledTime: '1970-01-01T15:30:00.000Z',
    };
    const home = {
      ...online,
      id: 'home-visit-1',
      scheduledTime: '09:10:00',
      encounterType: 'HOME_VISIT' as const,
      encounterStatus: 'ARRIVED' as const,
    };
    const pagination = { page: 1, pageSize: 100, totalItems: 2, totalPages: 2 };
    vi.mocked(telehealthApi.getEncounters)
      .mockResolvedValueOnce({ data: [online], pagination })
      .mockResolvedValueOnce({ data: [home], pagination: { ...pagination, page: 2 } });

    render(<AdminTelehealthView />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Giám sát lịch khám');
    const table = within(await screen.findByRole('table', { name: 'Danh sách ca khám' }));
    expect(table.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Ngày và giờ',
      'Bác sĩ phụ trách & CSYT',
      'Đại diện gia đình',
      'Trạng thái ca khám',
      'Hình thức',
    ]);

    const [onlineRow, homeRow] = table.getAllByRole('row').slice(1);
    const onlineCells = within(onlineRow).getAllByRole('cell');
    expect(onlineCells[0]).toHaveTextContent(/^23\/11\/202615:30$/);
    expect(onlineCells[1]).toHaveTextContent('BS.CKII Nguyễn Hoàng Long');
    expect(onlineCells[1]).toHaveTextContent('Bệnh viện Đa khoa Quốc tế Bạch Mai');
    expect(onlineCells[2]).toHaveTextContent(/^Trần Thị Mai$/);
    expect(onlineCells[3]).toHaveTextContent('Đang khám');
    expect(onlineCells[4]).toHaveTextContent(/^Online$/);
    expect(onlineRow).not.toHaveTextContent('Trần Văn Hùng');
    expect(onlineRow).not.toHaveTextContent('45 phút');
    expect(onlineRow).not.toHaveTextContent(online.id);

    const homeCells = within(homeRow).getAllByRole('cell');
    expect(homeCells[0]).toHaveTextContent(/^23\/11\/202609:10$/);
    expect(homeCells[3]).toHaveTextContent('Bác sĩ đã đến');
    expect(homeCells[4]).toHaveTextContent(/^Tại nhà$/);
    expect(telehealthApi.getEncounters).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 100 });

    fireEvent.click(within(homeCells[0]).getByRole('button', { name: /Xem chi tiết ca khám/ }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText(/23\/11\/2026 lúc 09:10 · Tại nhà/)).toBeInTheDocument();
    expect(dialog.queryByRole('link', { name: /WebRTC/ })).not.toBeInTheDocument();
  });

  it('requests timetable data without an online-only filter and preserves an empty response', async () => {
    const { telehealthApi: realApi } =
      await vi.importActual<typeof import('@/lib/api/telehealth.api')>('@/lib/api/telehealth.api');
    const data = { data: [], pagination: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } };
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ success: true, data });
    try {
      await expect(realApi.getEncounters({ page: 1, pageSize: 100 })).resolves.toEqual(data);
      expect(get).toHaveBeenCalledWith(
        '/api/v1/encounters/timetable/family',
        expect.objectContaining({ page: 1, pageSize: 100 }),
        { cache: 'no-store' },
      );
      expect(get.mock.calls[0][1]).not.toHaveProperty('encounterType');
    } finally {
      get.mockRestore();
    }
  });

  it('filters encounters when clicking on status filter buttons', async () => {
    render(<AdminTelehealthView />);

    await screen.findByRole('table', { name: 'Danh sách ca khám' });

    const liveFilterBtn = screen.getByRole('button', { name: /^Đang diễn ra/ });
    fireEvent.click(liveFilterBtn);

    // Live encounter should be visible
    expect(screen.getAllByText(/BS.CKII Nguyễn Hoàng Long/i).length).toBeGreaterThan(0);
  });

  it('filters encounters using search input and clears search', async () => {
    render(<AdminTelehealthView />);

    await screen.findByRole('table', { name: 'Danh sách ca khám' });

    const searchInput = screen.getByLabelText('Tìm kiếm lịch khám');
    fireEvent.change(searchInput, { target: { value: 'Lê Hồng Nhung' } });

    // Matching doctor should appear
    expect(screen.getAllByText(/ThS.BS Lê Hồng Nhung/i).length).toBeGreaterThan(0);

    // Clear search
    const clearBtn = screen.getByLabelText(/Xóa tìm kiếm/i);
    fireEvent.click(clearBtn);

    expect(searchInput).toHaveValue('');
  });

  it('opens the detail and video room link from the date and time cell', async () => {
    render(<AdminTelehealthView />);

    await screen.findByRole('table', { name: 'Danh sách ca khám' });

    const detailButtons = screen.getAllByRole('button', { name: /Xem chi tiết ca khám/i });
    fireEvent.click(detailButtons[0]);

    // Modal dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ ca khám')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tham gia phòng WebRTC' })).toHaveAttribute(
      'href',
      MOCK_TELEHEALTH_ENCOUNTERS[0].telehealthRoomUrl,
    );
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
