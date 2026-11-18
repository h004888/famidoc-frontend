import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FamilyMatchingQueuePanel } from '../family-matching-queue-panel';
import { AdminMatchingQueuePanel } from '@/features/admin-doctors/components/admin-matching-queue-panel';
import { matchingApi, publicApi } from '@/lib/api';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    matchingApi: {
      ...actual.matchingApi,
      getMyQueueRequests: vi.fn(),
      cancelQueueRequest: vi.fn(),
      getAdminQueueRequests: vi.fn(),
      assignAdminQueueDoctor: vi.fn(),
    },
    publicApi: {
      ...actual.publicApi,
      getDoctors: vi.fn(),
    },
  };
});

describe('Matching Queue UI (Task 6.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FamilyMatchingQueuePanel allows cancelling a QUEUED request and links ASSIGNED requests to /booking?queueId=...', async () => {
    vi.mocked(matchingApi.getMyQueueRequests).mockResolvedValue({
      total: 2,
      items: [
        {
          id: 'queue-pending-1',
          packageId: 'pkg-1',
          memberCount: 4,
          requestedTier: 'SENIOR',
          ageGroups: ['Người cao tuổi'],
          careCategories: ['Tim mạch'],
          districtArea: 'Quận 1',
          sanitizedDescription: 'Theo dõi huyết áp',
          fallbackReason: 'BELOW_FIT_THRESHOLD',
          status: 'QUEUED',
          slaExpiresAt: new Date(Date.now() + 86400_000).toISOString(),
          assignedDoctorId: null,
          assignedFacilityId: null,
          assignedAt: null,
          adminNote: null,
          contractId: null,
          createdAt: new Date().toISOString(),
          servicePackage: {
            id: 'pkg-1',
            packageCode: 'DONG_HANH',
            packageName: 'Gói Đồng Hành',
            durationMonths: 3,
          },
        },
        {
          id: 'queue-assigned-2',
          packageId: 'pkg-1',
          memberCount: 4,
          requestedTier: null,
          ageGroups: [],
          careCategories: [],
          districtArea: 'Quận 3',
          sanitizedDescription: null,
          fallbackReason: 'NO_ELIGIBLE_CANDIDATES',
          status: 'ASSIGNED',
          slaExpiresAt: new Date(Date.now() + 86400_000).toISOString(),
          assignedDoctorId: 'doc-1',
          assignedFacilityId: 'fac-1',
          assignedAt: new Date().toISOString(),
          adminNote: 'Đã phân công',
          contractId: null,
          createdAt: new Date().toISOString(),
          servicePackage: {
            id: 'pkg-1',
            packageCode: 'DONG_HANH',
            packageName: 'Gói Đồng Hành',
            durationMonths: 3,
          },
          assignedDoctor: {
            id: 'doc-1',
            doctorName: 'BS. Nguyễn Văn An',
            specialty: 'Y học gia đình',
          },
          assignedFacility: {
            id: 'fac-1',
            facilityName: 'Phòng khám FamiDoc',
            address: 'Quận 3',
          },
        },
      ],
    });
    vi.mocked(matchingApi.cancelQueueRequest).mockResolvedValue({
      id: 'queue-pending-1',
      status: 'CANCELLED',
    } as never);

    render(<FamilyMatchingQueuePanel />);

    await waitFor(() => {
      expect(screen.getByTestId('family-queue-item-queue-pending-1')).toBeInTheDocument();
      expect(screen.getByTestId('family-queue-item-queue-assigned-2')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('link', { name: /Xem bác sĩ & Xác nhận hợp đồng/i })
    ).toHaveAttribute('href', '/booking?queueId=queue-assigned-2');

    fireEvent.click(screen.getByRole('button', { name: 'Hủy yêu cầu chờ' }));

    await waitFor(() => {
      expect(matchingApi.cancelQueueRequest).toHaveBeenCalledWith(
        'queue-pending-1',
        expect.any(String)
      );
    });
  });

  it('AdminMatchingQueuePanel assigns an open-slot doctor to a QUEUED request', async () => {
    vi.mocked(matchingApi.getAdminQueueRequests).mockResolvedValue({
      total: 1,
      page: 1,
      limit: 20,
      items: [
        {
          id: 'queue-admin-1',
          packageId: 'pkg-1',
          memberCount: 4,
          requestedTier: 'STANDARD',
          ageGroups: ['Người cao tuổi'],
          careCategories: ['Tim mạch'],
          districtArea: 'Quận 1',
          sanitizedDescription: 'Cần bác sĩ gần nhà',
          fallbackReason: 'BELOW_FIT_THRESHOLD',
          status: 'QUEUED',
          slaExpiresAt: new Date(Date.now() + 86400_000).toISOString(),
          assignedDoctorId: null,
          assignedFacilityId: null,
          assignedAt: null,
          adminNote: null,
          contractId: null,
          createdAt: new Date().toISOString(),
          servicePackage: {
            id: 'pkg-1',
            packageCode: 'DONG_HANH',
            packageName: 'Gói Đồng Hành',
            durationMonths: 3,
          },
          user: {
            id: 'u-1',
            fullName: 'Gia đình Nguyễn A',
            email: 'a@famidoc.vn',
            phone: '0901234567',
          },
        },
      ],
    });
    vi.mocked(publicApi.getDoctors).mockResolvedValue({
      items: [
        {
          id: 'doc-open-1',
          doctorName: 'BS. Lê Minh',
          specialty: 'Y học gia đình',
          remainingSlots: 15,
          maxPanelCapacity: 30,
          isQuotaFull: false,
          facility: { id: 'fac-1', facilityName: 'Phòng khám Q1' },
        },
      ],
    });
    vi.mocked(matchingApi.assignAdminQueueDoctor).mockResolvedValue({
      id: 'queue-admin-1',
      status: 'ASSIGNED',
    } as never);

    render(<AdminMatchingQueuePanel />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-queue-row-queue-admin-1')).toBeInTheDocument();
    });

    const select = screen.getByLabelText(
      /Chọn bác sĩ cho yêu cầu queue-admin-1/i
    );
    fireEvent.change(select, { target: { value: 'doc-open-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gán bác sĩ' }));

    await waitFor(() => {
      expect(matchingApi.assignAdminQueueDoctor).toHaveBeenCalledWith(
        'queue-admin-1',
        { doctorId: 'doc-open-1' }
      );
    });
  });
});
