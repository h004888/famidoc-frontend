import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FamilyDashboardView } from '../family-dashboard-view';

const mockGetFamilyTimetable = vi.fn();
const mockGetMedicalContracts = vi.fn();
const mockGetFamilyGateStatus = vi.fn();
const mockGetFamilyMembers = vi.fn();
const mockGetMemberVitalSigns = vi.fn();
const mockListPrescriptionsForFamily = vi.fn();

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/contract-workflow-storage', () => ({
  useContractWorkflow: () => ({ step: 'ACTIVE' }),
}));

vi.mock('@/lib/auth-storage', () => ({
  getStoredAuthSession: () => ({ user: { id: 'u1', name: 'Nguyễn Văn A' }, role: 'FAMILY', token: 'tok' }),
}));

vi.mock('@/lib/api', () => ({
  encountersApi: {
    getFamilyTimetable: (...args: any[]) => mockGetFamilyTimetable(...args),
  },
  contractsApi: {
    getMedicalContracts: (...args: any[]) => mockGetMedicalContracts(...args),
    getFamilyGateStatus: (...args: any[]) => mockGetFamilyGateStatus(...args),
  },
  patientsApi: {
    getFamilyMembers: (...args: any[]) => mockGetFamilyMembers(...args),
    getMemberVitalSigns: (...args: any[]) => mockGetMemberVitalSigns(...args),
  },
  publicApi: {
    getDoctorDetail: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/api/prescriptions.api', () => ({
  prescriptionsApi: {
    listForFamily: (...args: any[]) => mockListPrescriptionsForFamily(...args),
  },
}));

describe('FamilyDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFamilyTimetable.mockResolvedValue({ data: [] });
    mockGetMedicalContracts.mockResolvedValue([]);
    mockGetFamilyGateStatus.mockResolvedValue({ activeContract: null });
    mockGetMemberVitalSigns.mockResolvedValue([]);
    mockListPrescriptionsForFamily.mockResolvedValue({ items: [], hasNextPage: false });
  });

  it('shows empty state without mock patient data when family has no members', async () => {
    mockGetFamilyMembers.mockResolvedValue([]);
    render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getByText('Chưa có hồ sơ thành viên gia đình')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Nguyễn Văn Phúc/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0988 123 456/)).not.toBeInTheDocument();
  });

  it('shows error state with retry button when loading members fails', async () => {
    mockGetFamilyMembers.mockRejectedValue(new Error('Network error'));
    render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getByText('Không thể tải bảng sức khỏe gia đình')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Thử tải lại' })).toBeInTheDocument();
  });

  it('renders real members with explicit units and without duplicate doctor aside', async () => {
    mockGetFamilyMembers.mockResolvedValue([
      {
        id: 'p1',
        fullName: 'Trần Văn B',
        relationshipToHead: 'SELF',
        gender: 'MALE',
        dateOfBirth: '1970-01-01',
      },
    ]);
    mockGetMemberVitalSigns.mockResolvedValue([
      {
        id: 'v1',
        patientId: 'p1',
        recordedAt: new Date().toISOString(),
        systolicBp: 120,
        diastolicBp: 80,
        heartRate: 72,
        spo2: 98,
        bloodGlucose: 5.4,
        isAbnormalAlert: false,
      },
    ]);

    render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getByText('Trần Văn B')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Tổng quan về sức khỏe gia đình' })).toBeInTheDocument();
    expect(screen.getByText('mmHg')).toBeInTheDocument();
    expect(screen.getByText('bpm')).toBeInTheDocument();
    expect(screen.getByText('mmol/L')).toBeInTheDocument();
    expect(screen.queryByText('Trực tuyến')).not.toBeInTheDocument();
    expect(screen.queryByText(/SOS 1900 6868/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quy Trình Chuẩn Bộ Y Tế 2026/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hợp Đồng Y Tế Hiện Tại/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3 \/ 4/)).not.toBeInTheDocument();
    expect(screen.queryByText(/10 \/ 12/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0988 123 456/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nguyễn Minh Tuấn/)).not.toBeInTheDocument();
    expect(screen.getByText('Hôm nay cả nhà đã cập nhật chỉ số ổn định')).toBeInTheDocument();
    expect(screen.queryByText(/👵|👨‍🦳|👧|👦|👩|👨/)).not.toBeInTheDocument();
    expect(document.querySelector('[data-avatar-kind="man"]')).toBeInTheDocument();
  });

  it('sorts members by urgency (warning -> unmeasured -> good) and shows actionable inbox', async () => {
    mockGetFamilyMembers.mockResolvedValue([
      {
        id: 'p-good',
        fullName: 'Thành viên Ổn định',
        relationshipToHead: 'SELF',
        gender: 'FEMALE',
        dateOfBirth: '1990-01-01',
      },
      {
        id: 'p-unmeasured',
        fullName: 'Thành viên Chưa đo',
        relationshipToHead: 'CHILD',
        gender: 'MALE',
        dateOfBirth: '2015-01-01',
      },
      {
        id: 'p-warn',
        fullName: 'Thành viên Cần chú ý',
        relationshipToHead: 'PARENT',
        gender: 'MALE',
        dateOfBirth: '1958-01-01',
      },
    ]);

    mockGetMemberVitalSigns.mockImplementation((patientId: string) => {
      if (patientId === 'p-good') {
        return Promise.resolve([
          {
            id: 'v-good',
            patientId,
            recordedAt: new Date().toISOString(),
            systolicBp: 118,
            diastolicBp: 76,
            isAbnormalAlert: false,
          },
        ]);
      }
      if (patientId === 'p-warn') {
        return Promise.resolve([
          {
            id: 'v-warn',
            patientId,
            recordedAt: new Date().toISOString(),
            systolicBp: 150,
            diastolicBp: 95,
            isAbnormalAlert: true,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getByText('Thành viên Cần chú ý')).toBeInTheDocument();
    });

    const memberLinks = screen
      .getAllByRole('link')
      .filter((el) =>
        ['Thành viên Cần chú ý', 'Thành viên Chưa đo', 'Thành viên Ổn định'].includes(
          el.textContent || ''
        )
      )
      .map((el) => el.textContent);

    expect(memberLinks).toEqual([
      'Thành viên Cần chú ý',
      'Thành viên Chưa đo',
      'Thành viên Ổn định',
    ]);
    expect(screen.getByText(/Cần chú ý: Thành viên Cần chú ý/)).toBeInTheDocument();
    expect(screen.getByText(/Chưa đo chỉ số hôm nay/)).toBeInTheDocument();

    const addVitalsLink = screen.getByRole('link', { name: /\+ Nhập chỉ số/i });
    const manageMembersLink = screen.getByRole('link', { name: /Quản lý thành viên/i });
    expect(addVitalsLink).not.toHaveClass('hover:underline');
    expect(manageMembersLink).not.toHaveClass('hover:underline');
  });

  it('displays header quick summary pills and latest issued prescription from real API', async () => {
    mockGetFamilyMembers.mockResolvedValue([
      {
        id: 'p1',
        fullName: 'Phạm Ngọc Thọ',
        relationshipToHead: 'SELF',
        gender: 'MALE',
        dateOfBirth: '1986-01-01',
        chronicDiseases: 'Tăng huyết áp nhẹ',
      },
    ]);
    mockListPrescriptionsForFamily.mockResolvedValue({
      items: [
        {
          id: 'rx-1',
          prescriptionCode: 'DT-2026-001',
          prescribedDate: '2026-11-20',
          createdAt: '2026-11-20T08:00:00.000Z',
          status: 'ISSUED',
          patient: { id: 'p1', fullName: 'Phạm Ngọc Thọ' },
          doctorName: 'BS. Võ Nguyên Giáp',
          facilityName: 'BV ĐHYD',
          diagnosis: 'Tăng huyết áp độ 1',
          hasSignature: true,
        },
      ],
      hasNextPage: false,
    });

    render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getAllByText('Phạm Ngọc Thọ').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Đã đo:')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
    expect(screen.getByText('Lịch hẹn:')).toBeInTheDocument();
    expect(screen.getByText('Đơn thuốc:')).toBeInTheDocument();
    expect(screen.getByText('Tăng huyết áp nhẹ')).toBeInTheDocument();
    expect(screen.getByText(/Đơn thuốc gần nhất · Phạm Ngọc Thọ/)).toBeInTheDocument();
    expect(screen.getByText('Tăng huyết áp độ 1')).toBeInTheDocument();
  });

  it('renders assigned doctor avatar image from gate status and falls back to doctor icon when null', async () => {
    mockGetFamilyMembers.mockResolvedValue([
      {
        id: 'p1',
        fullName: 'Phạm Ngọc Thọ',
        relationshipToHead: 'SELF',
        gender: 'MALE',
        dateOfBirth: '1986-01-01',
      },
    ]);
    mockGetFamilyGateStatus.mockResolvedValue({
      activeContract: {
        id: 'ctr-1',
        contractNumber: 'MC-001',
        memberCount: 1,
        endDate: '2027-01-01',
        packageName: 'An tâm',
        doctor: {
          id: 'doc-1',
          fullName: 'Trần Minh Tuấn',
          title: 'BSCKI.',
          hospitalName: 'BV ĐHYD',
          avatarUrl: 'https://cdn.famidoc.online/doctors/tuan.jpg',
          phone: null,
          experienceYears: 10,
        },
      },
    });

    const { unmount } = render(<FamilyDashboardView />);

    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Trần Minh Tuấn' });
      expect(img).toHaveAttribute('src', 'https://cdn.famidoc.online/doctors/tuan.jpg');
    });
    unmount();

    mockGetFamilyGateStatus.mockResolvedValue({
      activeContract: {
        id: 'ctr-2',
        contractNumber: 'MC-002',
        memberCount: 1,
        endDate: '2027-01-01',
        packageName: 'An tâm',
        doctor: {
          id: 'doc-2',
          fullName: 'Lê Thị Lan',
          title: 'BS.',
          hospitalName: 'BV Bạch Mai',
          avatarUrl: null,
          phone: null,
          experienceYears: 8,
        },
      },
    });

    render(<FamilyDashboardView />);
    await waitFor(() => {
      expect(screen.getByText(/Lê Thị Lan/)).toBeInTheDocument();
    });
    const fallbackImg = screen.getByRole('img', { name: 'Lê Thị Lan' });
    expect(fallbackImg).toHaveAttribute('src', '/images/medsev/home-one/doctor/1.jpg');
  });
});
