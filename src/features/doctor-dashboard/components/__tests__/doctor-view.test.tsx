import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DoctorDashboardView } from '../doctor-dashboard-view';
import { contractsApi, doctorsApi, encountersApi } from '@/lib/api';

const mockPush = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/doctor',
  useSearchParams: () => new URLSearchParams(),
}));

const MOCK_ACTIVE_PROFILE = {
  id: 'doc-real-1',
  doctorName: 'BS.CKII Lê Minh Quân',
  academicTitle: 'BS.CKII',
  specialty: 'Y học gia đình',
  experienceYears: 12,
  activePanelCount: 14,
  maxPanelCapacity: 30,
  onboardingStatus: 'ACTIVE' as const,
  facilityId: 'fac-1',
  facility: { id: 'fac-1', facilityName: 'Bệnh viện Hoàn Mỹ Sài Gòn' },
  credentials: [
    {
      id: 'c1',
      credentialType: 'PRACTICE_LICENSE_CCHN' as const,
      certificateNumber: '009988/HCM-CCHN',
      issueDate: '2020-01-01',
      issuingAuthority: 'Sở Y tế TP.HCM',
      fileUrl: '/api/v1/doctors/doc-real-1/credentials/c1/file',
    },
  ],
};

const MOCK_ENCOUNTERS = [
  {
    id: 'enc-1',
    contractId: 'ctr-1',
    doctorId: 'doc-real-1',
    scheduledDate: '2026-11-23',
    scheduledTime: '09:00',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'CONFIRMED',
    displayNotes: 'Tăng huyết áp định kỳ',
    patient: {
      id: 'pt-1',
      fullName: 'Nguyễn Văn Phúc',
      dateOfBirth: '1948-01-01',
      allergies: ['Penicillin'],
      chronicDiseases: 'Tăng huyết áp',
    },
    contract: {
      id: 'ctr-1',
      contractNumber: 'MC-88219',
      familyUnit: {
        id: 'fam-1',
        homeAddress: '123 Lê Lợi, Quận 1, TP.HCM',
      },
    },
  },
  {
    id: 'enc-2',
    contractId: 'ctr-2',
    doctorId: 'doc-real-1',
    scheduledDate: '2026-11-23',
    scheduledTime: '10:30',
    encounterType: 'TELEHEALTH',
    category: 'AD_HOC_ON_DEMAND',
    encounterStatus: 'CONFIRMED',
    displayNotes: 'Tư vấn dinh dưỡng thai kỳ',
    patient: {
      id: 'pt-2',
      fullName: 'Lê Thu Trang',
      dateOfBirth: '1992-05-10',
    },
    contract: {
      id: 'ctr-2',
      contractNumber: 'MC-44012',
    },
  },
  {
    id: 'enc-3',
    contractId: 'ctr-3',
    doctorId: 'doc-real-1',
    scheduledDate: '2026-11-23',
    scheduledTime: '08:15',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'IN_PROGRESS',
    displayNotes: 'Tái khám rối loạn lipid máu',
    patient: {
      id: 'pt-3',
      fullName: 'Trần Thị Bích',
      dateOfBirth: '1960-03-12',
    },
    contract: {
      id: 'ctr-3',
      contractNumber: 'MC-29011',
    },
  },
  {
    id: 'enc-4',
    contractId: 'ctr-4',
    doctorId: 'doc-real-1',
    scheduledDate: '2026-11-23',
    scheduledTime: '07:45',
    encounterType: 'TELEHEALTH',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'COMPLETED',
    displayNotes: 'Viêm mũi dị ứng',
    assessment: 'Viêm mũi dị ứng nhẹ',
    icd10Code: 'J30.4',
    patient: {
      id: 'pt-4',
      fullName: 'Phạm Minh Khôi',
      dateOfBirth: '2017-08-01',
    },
    contract: {
      id: 'ctr-4',
      contractNumber: 'MC-51029',
    },
  },
];

describe('DoctorDashboardView — Daily Clinical Hub (5s Scanability IA)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
    vi.spyOn(doctorsApi, 'getDoctorMe').mockResolvedValue(MOCK_ACTIVE_PROFILE as any);
    vi.spyOn(contractsApi, 'getMedicalContracts').mockResolvedValue([]);
    vi.spyOn(encountersApi, 'getDoctorTimetable').mockResolvedValue({
      data: MOCK_ENCOUNTERS as any,
      pagination: { page: 1, pageSize: 50, totalItems: MOCK_ENCOUNTERS.length, totalPages: 1 },
    });
  });

  it('auto-selects "Đang khám" tab when in-progress encounters exist and keeps persistent "Cần xử lý ngay" cards even at 0', async () => {
    const user = userEvent.setup();
    const { container } = render(<DoctorDashboardView />);

    await waitFor(() => {
      expect(screen.getByText('BS.CKII Lê Minh Quân')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1, name: /Ca trực hôm nay/i })).toBeInTheDocument();
    expect(screen.queryByText(/CCHN:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/14\/30/)).toBeInTheDocument();

    // Persistent "Cần xử lý ngay" 2-card strip stays visible even when counts are 0
    expect(screen.getByText('0 hợp đồng chờ ký duyệt')).toBeInTheDocument();
    expect(screen.getByText('0 xung đột lịch trực')).toBeInTheDocument();

    // Auto-selects "Đang khám" (enc-3: Trần Thị Bích) instead of stranding on an empty tab
    expect(screen.getAllByText('Trần Thị Bích').length).toBeGreaterThan(0);
    expect(screen.getByText(/Chưa ghi nhận dị ứng/i)).toBeInTheDocument();
    expect(screen.getByText(/Chưa ghi nhận bệnh nền/i)).toBeInTheDocument();

    // Zero fake/mock numbers or jargon
    expect(screen.queryByText(/18\.450\.000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Escrow/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/WebRTC/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/4\.95 \/ 5\.0/)).not.toBeInTheDocument();
    expect(container.querySelector('main')).toBeNull();

    // Switch to "Chờ khám" to verify allergy & chronic condition on enc-1
    await user.click(screen.getByRole('tab', { name: /Chờ khám/i }));
    const openBtn = screen.getByRole('button', { name: /Mở Phiếu khám/i });
    expect(openBtn.className).toContain('py-2');
    expect(openBtn.className).toContain('min-h-11');
    expect(screen.getByText(/Penicillin/)).toBeInTheDocument();
    expect(screen.getByText(/Bệnh nền:/)).toBeInTheDocument();
  });

  it('surfaces pending 4-party contracts in "Cần xử lý ngay" strip from real contractsApi', async () => {
    vi.spyOn(contractsApi, 'getMedicalContracts').mockResolvedValueOnce([
      {
        id: 'ctr-pending-1',
        contractNumber: 'MC-9001',
        contractStatus: 'PENDING_APPROVAL',
        familyHeadName: 'Gia đình Nguyễn Văn A',
      } as any,
      {
        id: 'ctr-pending-2',
        contractNumber: 'MC-9002',
        contractStatus: 'PENDING_APPROVAL',
        familyHeadName: 'Gia đình Trần Thị B',
      } as any,
    ]);

    render(<DoctorDashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/2 hợp đồng 4 bên chờ bạn ký duyệt/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Ký duyệt HĐ \(2\)/i })).toHaveAttribute(
      'href',
      '/doctor/contracts'
    );
  });

  it('switches queue tabs, filters by visit mode, and adapts primary CTA for Video encounters', async () => {
    const user = userEvent.setup();
    render(<DoctorDashboardView />);

    await waitFor(() => {
      expect(screen.getAllByText('Trần Thị Bích').length).toBeGreaterThan(0);
    });

    // Switch to "Chờ khám" and click Video encounter -> primary CTA becomes "Vào phòng khám Video"
    await user.click(screen.getByRole('tab', { name: /Chờ khám/i }));
    await user.click(screen.getByRole('button', { name: /Lê Thu Trang/i }));
    expect(screen.getByRole('link', { name: /Vào phòng khám Video/i })).toHaveAttribute(
      'href',
      '/doctor/telemedicine?encounterId=enc-2'
    );

    // Switch to "Hoàn tất" tab
    await user.click(screen.getByRole('tab', { name: /Hoàn tất/i }));
    expect(screen.getAllByText('Phạm Minh Khôi').length).toBeGreaterThan(0);
    expect(screen.getByText(/J30\.4/)).toBeInTheDocument();
  });

  it('keeps persistent 2-column layout and action cards visible when doctor has 0 scheduled encounters', async () => {
    vi.spyOn(encountersApi, 'getDoctorTimetable').mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
    });

    render(<DoctorDashboardView />);

    await waitFor(() => {
      expect(screen.getByText('Hôm nay bạn chưa có lịch khám nào')).toBeInTheDocument();
    });
    // Both persistent sections remain mounted (nothing vanishes)
    expect(screen.getByText('0 hợp đồng chờ ký duyệt')).toBeInTheDocument();
    expect(screen.getByText('0 xung đột lịch trực')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Chờ khám \(0\)/i })).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ tóm tắt trước khám')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem lịch trực tuần này/i })).toHaveAttribute(
      'href',
      '/doctor/timetable'
    );
  });

  it('shows onboarding notice when doctor profile is not ACTIVE', async () => {
    vi.spyOn(doctorsApi, 'getDoctorMe').mockResolvedValueOnce({
      id: 'doc-pending-1',
      doctorName: 'BS. Trần Thu Hà',
      specialty: 'Y học gia đình',
      experienceYears: 3,
      onboardingStatus: 'PENDING_SUBMISSION',
      facilityId: 'fac-1',
      facility: { id: 'fac-1', facilityName: 'Phòng khám An Bình' },
    } as any);

    render(<DoctorDashboardView />);
    expect(
      await screen.findByText(/Hồ sơ Bác sĩ đang trong quy trình thẩm định 2 cấp/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Ca trực hôm nay/i)).not.toBeInTheDocument();
  });

  it('standardizes typography across all 9 Doctor & Facility Portal views (no font-mono, font-black, or font-extrabold)', async () => {
    const { container } = render(<DoctorDashboardView />);
    await waitFor(() => {
      expect(screen.getByText('BS.CKII Lê Minh Quân')).toBeInTheDocument();
    });
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);

    const doctorAndFacilityFiles = [
      '../doctor-dashboard-view.tsx',
      '../../../doctor-encounters/components/doctor-encounters-view.tsx',
      '../../../doctor-telemedicine/components/doctor-telemedicine-view.tsx',
      '../../../doctor-timetable/components/doctor-timetable-view.tsx',
      '../../../doctor-verification/components/doctor-verification-view.tsx',
      '../../../facility-dashboard/components/facility-dashboard-view.tsx',
      '../../../facility-staff/components/facility-staff-view.tsx',
      '../../../facility-coordination/components/facility-coordination-view.tsx',
      '../../../facility-revenue/components/facility-revenue-view.tsx',
    ];

    for (const relPath of doctorAndFacilityFiles) {
      const fullPath = path.resolve(__dirname, relPath);
      const source = fs.readFileSync(fullPath, 'utf-8');
      expect(source, `Typography violation in ${relPath}`).not.toMatch(
        /\bfont-(mono|black|extrabold)\b/
      );
    }
  });

  it('D1: shows ACTIVE today card with Mở Workspace Ca khám, PENDING_RECORD 24h card, and no check-in buttons', async () => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now.getTime() - 20 * 3600 * 1000);
    const yesterdayIso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    vi.spyOn(encountersApi, 'getDoctorTimetable').mockResolvedValueOnce({
      data: [
        {
          id: 'enc-active-today',
          contractId: 'ctr-1',
          doctorId: 'doc-real-1',
          scheduledDate: todayIso,
          scheduledTime: '14:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'CONFIRMED',
          familyConfirmedArrivalAt: null,
          clinicalEmrs: [],
          patient: { id: 'pt-1', fullName: 'Nguyễn Văn A' },
        },
        {
          id: 'enc-pending-24h',
          contractId: 'ctr-2',
          doctorId: 'doc-real-1',
          scheduledDate: yesterdayIso,
          scheduledTime: '09:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'CONFIRMED',
          familyConfirmedArrivalAt: '2026-11-24T09:15:00+07:00',
          clinicalEmrs: [],
          patient: { id: 'pt-2', fullName: 'Lê Thị B' },
        },
      ] as any,
      pagination: { page: 1, pageSize: 50, totalItems: 2, totalPages: 1 },
    });

    render(<DoctorDashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/ĐANG DIỄN RA \(ACTIVE\)/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Mở Workspace Ca khám/i })).toHaveAttribute(
        'href',
        '/doctor/encounters?encounterId=enc-active-today',
      );
      expect(screen.getByText(/Ca cần bổ sung & chốt hồ sơ/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Tiếp tục hoàn tất hồ sơ/i })).toHaveAttribute(
        'href',
        '/doctor/encounters?encounterId=enc-pending-24h',
      );
    });

    expect(screen.queryByRole('button', { name: /Đang di chuyển/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Check-in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Đã đến nhà/i })).not.toBeInTheDocument();
  });
});
