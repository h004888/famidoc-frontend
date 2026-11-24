import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DoctorDirectoryView } from '../doctor-directory-view';
import { DoctorDetailView } from '../doctor-detail-view';
import { publicApi, type PublicDoctorDetailDto } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  publicApi: {
    getDoctors: vi.fn(),
    getFacilities: vi.fn(),
    getDoctorDetail: vi.fn(),
    getDoctorReviews: vi.fn(),
  },
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

const openDoctorDetail: PublicDoctorDetailDto = {
  id: 'doc-open-1',
  doctorName: 'BS. Nguyễn Còn Slot',
  academicTitle: 'ThS.BS',
  specialty: 'Y học Gia đình',
  specialtyKey: 'general',
  avatarUrl: null,
  bio: 'Bác sĩ có nhiều slot trống',
  isVerified: true,
  isAvailable: true,
  clinicalTier: 'STANDARD',
  remainingSlots: 8,
  isQuotaFull: false,
  panel: { activeCount: 22, maxCapacity: 30 },
  stats: {
    experienceYears: 7,
    ratingAvg: 4.9,
    totalReviews: 25,
    completedEncounters: 320,
  },
  facility: {
    id: 'fac-1',
    facilityName: 'Phòng khám FamiDoc',
    address: 'Quận 1, TP.HCM',
    verificationStatus: 'ACTIVE',
  },
  credentials: [],
  treatedCases: [],
  careModel: { serviceModes: [], commitments: [] },
  carePackages: [
    {
      id: 'pkg-1',
      packageCode: 'DONG_HANH',
      packageName: 'Gói Đồng Hành',
      durationMonths: 3,
      basePrice: 2850000,
      periodicVisitsQuota: 3,
      telehealthQuota: 20,
      includedMembers: 4,
      maxMembers: 6,
      additionalMemberMonthlyPrice: 75000,
    },
  ],
  reviews: { ratingAvg: 4.9, totalReviews: 25, items: [] },
};

const fullDoctorDetail: PublicDoctorDetailDto = {
  ...openDoctorDetail,
  id: 'doc-full-1',
  doctorName: 'PGS.TS Bác Sĩ Kín Lịch',
  clinicalTier: 'SENIOR',
  isAvailable: false,
  remainingSlots: 0,
  isQuotaFull: true,
  panel: { activeCount: 30, maxCapacity: 30 },
  juniorAlternatives: [
    {
      id: 'doc-junior-1',
      doctorName: 'BS. Trần Trẻ Tuổi',
      academicTitle: 'BS',
      specialty: 'Y học Gia đình',
      clinicalTier: 'JUNIOR',
      remainingSlots: 24,
      maxPanelCapacity: 30,
      isQuotaFull: false,
      isAvailable: true,
      facility: {
        id: 'fac-1',
        facilityName: 'Phòng khám FamiDoc',
        address: 'Quận 1, TP.HCM',
      },
    },
  ],
  lowerPricePackages: [
    {
      id: 'pkg-low-1',
      packageCode: 'TRAI_NGHIEM',
      packageName: 'Gói Trải Nghiệm',
      durationMonths: 1,
      basePrice: 1000000,
      periodicVisitsQuota: 1,
      telehealthQuota: 2,
      includedMembers: 2,
      maxMembers: 4,
      additionalMemberMonthlyPrice: 75000,
    },
  ],
};

describe('Track A Quota Slots & Junior Alternatives UI (Task 5.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getFacilities).mockResolvedValue([]);
  });

  it('DoctorDirectoryView displays open-slot and full-quota badges accurately', async () => {
    vi.mocked(publicApi.getDoctors).mockResolvedValue({
      items: [
        {
          id: 'doc-open-1',
          doctorName: 'BS. Còn Slot',
          specialty: 'Y học Gia đình',
          clinicalTier: 'STANDARD',
          remainingSlots: 7,
          maxPanelCapacity: 30,
          isQuotaFull: false,
          isAvailable: true,
          facility: { id: 'fac-1', facilityName: 'PK A', address: 'Hà Nội' },
        },
        {
          id: 'doc-full-1',
          doctorName: 'BS. Kín Slot',
          specialty: 'Y học Gia đình',
          clinicalTier: 'SENIOR',
          remainingSlots: 0,
          maxPanelCapacity: 30,
          isQuotaFull: true,
          isAvailable: false,
          facility: { id: 'fac-1', facilityName: 'PK A', address: 'Hà Nội' },
        },
      ],
      pagination: { page: 1, pageSize: 10, totalRecords: 2, totalPages: 1 },
    });

    render(<DoctorDirectoryView packageId="pkg-1" initialMembers={4} />);

    await waitFor(() => {
      expect(screen.getByText('BS. Còn Slot')).toBeInTheDocument();
      expect(screen.getByText('BS. Kín Slot')).toBeInTheDocument();
      expect(screen.queryByTestId('doctor-quota-badge-doc-open-1')).toBeNull();
      expect(screen.queryByTestId('doctor-quota-badge-doc-full-1')).toBeNull();
    });
  });

  it('DoctorDetailView allows booking when doctor has open slots and preserves package & members', () => {
    render(
      <DoctorDetailView
        initialDoctor={openDoctorDetail}
        initialPackageCode="pkg-1"
        initialMembers={5}
      />
    );

    expect(screen.getByTestId('doctor-detail-slot-badge')).toHaveTextContent(
      'Còn nhận gia đình'
    );
    const ctaLink = screen.getByRole('link', { name: /Đăng ký dịch vụ với bác sĩ/i });
    expect(ctaLink).toHaveAttribute(
      'href',
      '/booking?packageId=pkg-1&doctorId=doc-open-1&facilityId=fac-1&members=5'
    );
    expect(screen.queryByTestId('junior-alternatives-section')).toBeNull();
  });

  it('DoctorDetailView locks registration and displays junior alternatives + lowerPricePackages when quota is full', () => {
    render(<DoctorDetailView initialDoctor={fullDoctorDetail} />);

    expect(screen.getByTestId('doctor-detail-slot-badge')).toHaveTextContent(
      'Đã kín lịch (0 slot trống)'
    );
    expect(screen.getByTestId('doctor-booking-locked-btn')).toBeDisabled();

    const altSection = screen.getByTestId('junior-alternatives-section');
    expect(altSection).toBeInTheDocument();
    expect(altSection).toHaveTextContent('BS. Trần Trẻ Tuổi');
    expect(altSection).toHaveTextContent('Còn 24 slot');
    expect(altSection).toHaveTextContent('Gói Trải Nghiệm');
  });
});
