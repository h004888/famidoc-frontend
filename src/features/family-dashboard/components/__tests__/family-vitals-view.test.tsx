import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FamilyVitalsView } from '../family-vitals-view';

const mockGetFamilyMembers = vi.fn();
const mockGetMemberVitalSigns = vi.fn();
const mockAddMemberVitalSign = vi.fn();
const mockUpdateMemberVitalSign = vi.fn();
const mockDeleteMemberVitalSign = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/family/vitals',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 240 }}>{children}</div>
    ),
  };
});

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    patientsApi: {
      ...actual.patientsApi,
      getFamilyMembers: (...args: unknown[]) => mockGetFamilyMembers(...args),
      getMemberVitalSigns: (...args: unknown[]) => mockGetMemberVitalSigns(...args),
      addMemberVitalSign: (...args: unknown[]) => mockAddMemberVitalSign(...args),
      updateMemberVitalSign: (...args: unknown[]) => mockUpdateMemberVitalSign(...args),
      deleteMemberVitalSign: (...args: unknown[]) => mockDeleteMemberVitalSign(...args),
    },
  };
});

describe('FamilyVitalsView (/family/vitals)', () => {
  const todayIso = new Date().toISOString();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFamilyMembers.mockResolvedValue([
      {
        id: 'm-1',
        familyId: 'fam-1',
        fullName: 'Trần Văn Hùng',
        dateOfBirth: '1960-03-10',
        gender: 'MALE',
        relationshipToHead: 'PARENT',
        status: 'ACTIVE',
      },
      {
        id: 'm-2',
        familyId: 'fam-1',
        fullName: 'Nguyễn Minh Châu',
        dateOfBirth: '1992-07-20',
        gender: 'FEMALE',
        relationshipToHead: 'HEAD_OF_HOUSEHOLD',
        status: 'ACTIVE',
      },
      {
        id: 'm-3',
        familyId: 'fam-1',
        fullName: 'Trần Thị Lan',
        dateOfBirth: '1963-05-12',
        gender: 'FEMALE',
        relationshipToHead: 'PARENT',
        chronicDiseases: 'Tăng huyết áp',
        status: 'ACTIVE',
      },
    ]);

    mockGetMemberVitalSigns.mockImplementation(async (patientId: string) => {
      if (patientId === 'm-1') {
        return [
          {
            id: 'vs-alert-1',
            emrId: null,
            patientId: 'm-1',
            systolicBp: 152,
            diastolicBp: 94,
            heartRate: 88,
            temperature: 36.8,
            spo2: 97,
            respiratoryRate: 18,
            bloodGlucose: 6.1,
            isAbnormalAlert: true,
            recordedAt: todayIso,
          },
        ];
      }
      return [];
    });

    mockAddMemberVitalSign.mockResolvedValue({
      id: 'vs-new-2',
      emrId: null,
      patientId: 'm-1',
      systolicBp: 124,
      diastolicBp: 78,
      heartRate: 74,
      temperature: null,
      spo2: 98,
      respiratoryRate: null,
      bloodGlucose: null,
      isAbnormalAlert: false,
      recordedAt: new Date(Date.now() + 1000).toISOString(),
    });
  });

  it('displays household abnormal alerts, switches members honestly with -- for unmeasured, and has no IoT claims', async () => {
    const { container } = render(<FamilyVitalsView />);

    await waitFor(() => {
      expect(
        screen.getByText(/Cảnh báo hôm nay: 1 thành viên có chỉ số vượt ngưỡng an toàn/i)
      ).toBeInTheDocument();
    });

    expect(container.textContent).not.toMatch(/\bIoT\b/i);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);

    expect(screen.getByText(/Huyết áp 152\/94 mmHg/)).toBeInTheDocument();
    expect(screen.getByText('Chưa đo hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Theo dõi khi cần')).toBeInTheDocument();

    // Auto-selected alerted member m-1 (has EMR/historic respiratoryRate: 18)
    expect(screen.getByTestId('vital-card-bp')).toHaveAttribute('data-abnormal', 'true');
    expect(screen.getByTestId('vital-card-respiratoryRate')).toBeInTheDocument();

    // Switch to healthy member m-2 (no vitals recorded, no chronic diseases)
    fireEvent.click(screen.getByRole('button', { name: /Nguyễn Minh Châu/i }));
    await waitFor(() => {
      expect(screen.getByText('Chưa ghi nhận chỉ số hôm nay')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Mở y bạ Nguyễn Minh Châu/i })).toHaveAttribute(
      'href',
      '/family/members/m-2'
    );

    // Switch to chronic member m-3 (no vitals recorded, has Tăng huyết áp)
    fireEvent.click(screen.getByRole('button', { name: /Trần Thị Lan/i }));
    await waitFor(() => {
      expect(
        screen.getByText('Hôm nay chưa có chỉ số sức khỏe nào được ghi nhận')
      ).toBeInTheDocument();
    });
  });

  it('updates household alert summary immediately when adding a stable reading for the alerted member', async () => {
    render(<FamilyVitalsView />);

    await waitFor(() => {
      expect(
        screen.getByText(/Cảnh báo hôm nay: 1 thành viên có chỉ số vượt ngưỡng an toàn/i)
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole('columnheader', { name: 'Nhịp tim' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Nhập chỉ số hôm nay/i }));
    expect(screen.queryByLabelText(/Nhịp thở/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nhịp tim/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Thời điểm đo/i)).not.toBeInTheDocument();

    // Invalid inverted BP shows inline error and blocks submit
    fireEvent.change(screen.getByLabelText(/Huyết áp \(mmHg\)/i), {
      target: { value: '80/120' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu chỉ số' }));
    expect(
      screen.getByText(/Huyết áp tâm thu phải lớn hơn huyết áp tâm trương/i)
    ).toBeInTheDocument();
    expect(mockAddMemberVitalSign).not.toHaveBeenCalled();

    // Valid combined BP 124/78 submits cleanly with automatic real-time timestamp and hides unmeasured cards
    fireEvent.change(screen.getByLabelText(/Huyết áp \(mmHg\)/i), {
      target: { value: '124/78' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu chỉ số' }));

    await waitFor(() => {
      expect(mockAddMemberVitalSign).toHaveBeenCalledWith(
        'm-1',
        expect.objectContaining({
          systolicBp: 124,
          diastolicBp: 78,
          recordedAt: expect.any(String),
        })
      );
      expect(
        screen.getByText('Các chỉ số đo hôm nay của gia đình đều trong ngưỡng ổn định')
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('vital-card-respiratoryRate')).not.toBeInTheDocument();
  });

  it('renders empty member CTA when household has no members', async () => {
    mockGetFamilyMembers.mockResolvedValueOnce([]);
    render(<FamilyVitalsView />);

    await waitFor(() => {
      expect(screen.getByText('Chưa có hồ sơ thành viên gia đình')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Đi tới Quản lý thành viên' })).toHaveAttribute(
      'href',
      '/family/members'
    );
  });
});
