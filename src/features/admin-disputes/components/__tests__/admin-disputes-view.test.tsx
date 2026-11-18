import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi, type AdminComplaint } from '@/lib/api/admin.api';
import { AdminDisputesView } from '../admin-disputes-view';

vi.mock('@/lib/api/admin.api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api/admin.api')>(),
  adminApi: { complaints: vi.fn(), facilityComplaints: vi.fn() },
}));

const familyComplaint: AdminComplaint = {
  id: 'family-complaint', complaintCode: 'CP-FAMILY', complaintCategory: 'MISSED_VISIT',
  description: 'Gia đình cần xác minh lịch khám.', status: 'SUBMITTED',
  createdAt: '2026-11-17T12:00:00Z', contractId: 'contract-id',
};
const doctorComplaint: AdminComplaint = {
  ...familyComplaint, id: 'doctor-complaint', complaintCode: 'CP-DOCTOR',
  description: 'Bác sĩ cần xác minh thông tin hợp đồng.',
};

describe('Admin complaint tabs', () => {
  it('loads complaints by sender before pagination and resets page when changing tabs', async () => {
    vi.mocked(adminApi.complaints).mockImplementation(async ({ complainantRole, page }) => ({
      items: [complainantRole === 'FAMILY_REP' ? familyComplaint : doctorComplaint],
      total: 21, page, limit: 20,
    }));
    const user = userEvent.setup();
    render(<AdminDisputesView />);

    expect(await screen.findByText('CP-FAMILY')).toBeInTheDocument();
    expect(adminApi.complaints).toHaveBeenLastCalledWith({ page: 1, status: undefined, complainantRole: 'FAMILY_REP' });
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() => expect(adminApi.complaints).toHaveBeenLastCalledWith({ page: 2, status: undefined, complainantRole: 'FAMILY_REP' }));

    await user.click(screen.getByRole('tab', { name: 'Bác sĩ' }));
    expect(await screen.findByText('CP-DOCTOR')).toBeInTheDocument();
    expect(screen.queryByText('CP-FAMILY')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Trạng thái khiếu nại'), { target: { value: 'INVESTIGATING' } });
    await waitFor(() => expect(adminApi.complaints).toHaveBeenLastCalledWith({ page: 1, status: 'INVESTIGATING', complainantRole: 'DOCTOR' }));
  });

  it('keeps the facility page on its own list without sender tabs', async () => {
    vi.mocked(adminApi.facilityComplaints).mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
    render(<AdminDisputesView facility />);

    expect(await screen.findByText('Chưa có khiếu nại.')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(adminApi.facilityComplaints).toHaveBeenLastCalledWith({ page: 1, status: undefined });
  });
});
