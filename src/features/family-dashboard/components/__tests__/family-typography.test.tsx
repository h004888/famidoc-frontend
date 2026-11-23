import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FamilyDashboardView } from '../family-dashboard-view';
import { contractsApi, patientsApi } from '@/lib/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/family',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Medsev Typography Standard on Family Portal & Contract Signing Wizard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValue([
      {
        id: 'pat-default-1',
        familyId: 'fam-1',
        fullName: 'Trần Văn An',
        dateOfBirth: '1965-01-01',
        gender: 'MALE',
        relationshipToHead: 'PARENT',
        status: 'ACTIVE',
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-18T00:00:00.000Z',
      },
    ]);
    vi.spyOn(patientsApi, 'getMemberVitalSigns').mockResolvedValue([
      {
        id: 'vs-default-1',
        emrId: null,
        patientId: 'pat-default-1',
        systolicBp: 135,
        diastolicBp: 85,
        heartRate: 76,
        temperature: 36.7,
        spo2: 98,
        respiratoryRate: 18,
        bloodGlucose: 6.8,
        isAbnormalAlert: false,
        recordedAt: new Date().toISOString(),
      },
    ]);
  });

  it('renders FamilyDashboardView vitals with font-bold tabular-nums and without tracking-wide, font-black, or font-extrabold', async () => {
    const { container } = render(<FamilyDashboardView />);
    await waitFor(() => {
      expect(screen.getByText('135/85')).toBeInTheDocument();
    });
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(screen.getByText('135/85')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('98%')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('76')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('6.8')).toHaveClass('font-bold', 'tabular-nums');
  });

  it('ensures all Family Portal & ContractSigningWizard source files contain no tracking-wide, font-black, or font-extrabold', () => {
    const familyFiles = [
      '../family-dashboard-view.tsx',
      '../member-vital-signs-section.tsx',
      '../../../family-members/components/family-members-view.tsx',
      '../../../appointments/components/family-appointments-view.tsx',
      '../../../billing/components/family-billing-view.tsx',
      '../../../subscription-contract/components/subscription-contract-view.tsx',
      '../../../subscription-contract/components/contract-signing-wizard.tsx',
      '../../../chronic-care/components/chronic-care-view.tsx',
    ];

    for (const relPath of familyFiles) {
      const fullPath = path.resolve(__dirname, relPath);
      const source = fs.readFileSync(fullPath, 'utf-8');
      expect(source, `Typography violation in ${relPath}`).not.toMatch(
        /\bfont-(mono|black|extrabold)\b/,
      );
    }
  });

  it('renders the actionable inbox and links to shared prescriptions', async () => {
    render(<FamilyDashboardView />);
    await waitFor(() => {
      expect(screen.getByText(/Cần làm hôm nay/i)).toBeInTheDocument();
    });
    const rxLinks = screen.getAllByRole('link', { name: /Đơn thuốc/i });
    expect(rxLinks.length).toBeGreaterThan(0);
    expect(rxLinks[0]).toHaveAttribute('href', '/family/prescriptions');
  });

  it('renders FamilyDashboardView without nested <main> landmark', () => {
    const { container } = render(<FamilyDashboardView />);
    expect(container.querySelector('main')).toBeNull();
  });

  it('normalizes FourPartyContract shape from getMedicalContracts without crashing on undefined totalAmountVnd', async () => {
    vi.spyOn(contractsApi, 'getMedicalContracts').mockResolvedValueOnce([
      {
        id: 'ctr-1',
        contractNumber: 'MC-175418-ANTAM',
        status: 'ACTIVE',
        packageId: 'pkg-1',
        packageName: 'An tâm',
        packagePrice: 6475000,
        durationMonths: 6,
        familyId: 'fam-1',
        familyRepresentativeName: 'Trần Gia Bảo',
        familyRepresentativePhone: '0919888777',
        familyRepresentativeEmail: 'family.active@famidoc.vn',
        membersCount: 4,
        doctorName: 'BS. CKI Lê Quang Minh',
        facilityName: 'HMU Clinic',
        createdAt: '2026-11-18T00:00:00.000Z',
        updatedAt: '2026-11-18T00:00:00.000Z',
        signatures: {},
      },
    ]);
    vi.spyOn(contractsApi, 'getFamilyGateStatus').mockResolvedValueOnce({
      hasActiveContract: true,
      activeContract: {
        id: 'ctr-1',
        contractNumber: 'MC-175418-ANTAM',
        memberCount: 4,
        endDate: '2027-05-18T00:00:00.000Z',
        packageName: 'An tâm',
      },
      pendingContract: null,
      patientCount: 1,
    });

    render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/BS\. CKI Lê Quang Minh/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/MC-175418-ANTAM/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Thanh Toán VietQR Để Kích Hoạt/i)).not.toBeInTheDocument();
  });

  it('syncs FamilyDashboardView inbox and member cards with real abnormal vital-signs', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([
      {
        id: 'pat-alert-1',
        familyId: 'fam-1',
        fullName: 'Trần Văn Bình',
        dateOfBirth: '1958-04-12',
        gender: 'MALE',
        relationshipToHead: 'PARENT',
        status: 'ACTIVE',
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-18T00:00:00.000Z',
      },
    ]);
    vi.spyOn(patientsApi, 'getMemberVitalSigns').mockResolvedValueOnce([
      {
        id: 'vs-real-1',
        emrId: null,
        patientId: 'pat-alert-1',
        systolicBp: 148,
        diastolicBp: 92,
        heartRate: 82,
        temperature: 36.8,
        spo2: 97,
        respiratoryRate: 18,
        bloodGlucose: 6.2,
        isAbnormalAlert: true,
        recordedAt: new Date().toISOString(),
      },
    ]);

    const { container } = render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/Cần chú ý: Trần Văn Bình/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Huyết áp 148\/92 mmHg/)).toBeInTheDocument();

    expect(screen.getByText('148/92')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('97%')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('82')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('6.2')).toHaveClass('font-bold', 'tabular-nums');
    expect(container.textContent).not.toMatch(/Nguyễn Văn Phúc/i);
  });

  it('displays honest -- empty metrics and unmeasured status when real member has no vital-signs', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([
      {
        id: 'pat-empty-1',
        familyId: 'fam-1',
        fullName: 'Lê Thị Hoa',
        dateOfBirth: '1990-08-15',
        gender: 'FEMALE',
        relationshipToHead: 'SELF',
        status: 'ACTIVE',
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-18T00:00:00.000Z',
      },
    ]);
    vi.spyOn(patientsApi, 'getMemberVitalSigns').mockResolvedValueOnce([]);

    render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getByText('Chưa đo')).toBeInTheDocument();
    });

    expect(screen.getAllByText('--').length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText(/Nguyễn Văn Phúc/i)).not.toBeInTheDocument();
  });
});
