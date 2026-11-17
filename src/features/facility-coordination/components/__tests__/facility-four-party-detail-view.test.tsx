import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { contractsApi, type MedicalContractDetailDto } from '@/lib/api';
import { ApiError } from '@/lib/http/errors';
import { FacilityFourPartyDetailView } from '../facility-four-party-detail-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/facility/coordination/ct-4p-001',
}));

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: ({
    token,
    onDocumentCompleted,
  }: {
    token: string;
    onDocumentCompleted?: (detail: unknown) => void;
  }) => (
    <div data-testid="mock-documenso-embed" data-token={token}>
      <button
        type="button"
        onClick={() => onDocumentCompleted?.({ completed: true })}
      >
        Hoàn tất ký trên Documenso
      </button>
    </div>
  ),
}));

const baseDetail: MedicalContractDetailDto = {
  id: 'ct-4p-001',
  contractNumber: 'HĐ4B-2026-0842',
  contractStatus: 'PENDING_APPROVAL',
  totalAmount: 14400000,
  startDate: '2026-11-17T00:00:00.000Z',
  endDate: '2027-11-17T00:00:00.000Z',
  createdAt: '2026-11-17T09:08:00.000Z',
  memberCount: 2,
  documensoEnvelopeId: 'env-001',
  signedPdfUrl: null,
  familyUnit: {
    id: 'fam-1',
    homeAddress: '142/8 Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    emergencyPhone: '0908412678',
    representativeUser: {
      fullName: 'Nguyễn Thị Minh Anh',
      phoneNumber: '0908412678',
    },
  },
  facility: {
    id: 'fac-1',
    facilityName: 'Bệnh viện Nhi Đồng 1',
  },
  doctor: {
    id: 'doc-1',
    doctorName: 'BS. CKII Trần Minh Tuấn',
    specialty: 'Nội tổng quát & Lão khoa',
    cchnNumber: '004821/SYT-HCM',
    experienceYears: 14,
  },
  servicePackage: {
    id: 'pkg-1',
    packageName: 'Gói Gia Đình Toàn Diện',
    durationMonths: 12,
  },
  signatures: [
    {
      signerRole: 'FAMILY_REP',
      signerUserId: 'u-fam',
      signedAt: '2026-11-17T09:14:00.000Z',
    },
  ],
  members: [
    {
      id: 'm-1',
      patientId: 'pat-1',
      patient: {
        id: 'pat-1',
        fullName: 'Nguyễn Văn Phúc (Fallback)',
        dateOfBirth: '1956-05-01T00:00:00.000Z',
        gender: 'MALE',
        relationshipToHead: 'PARENT',
      },
    },
  ],
};

describe('FacilityFourPartyDetailView (/facility/coordination/[id])', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders household, care-summary members, read-only doctor, 4-party timeline, and mounts DocumensoSigningEmbed for Bên B', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce(baseDetail);
    vi.spyOn(contractsApi, 'getCareSummary').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      packageName: 'Gói Gia Đình Toàn Diện',
      facilityName: 'Bệnh viện Nhi Đồng 1',
      members: [
        {
          patientId: 'pat-1',
          fullName: 'Nguyễn Văn Phúc',
          age: 70,
          gender: 'MALE',
          relationshipToHead: 'PARENT',
          allergies: [{ allergenName: 'Penicillin', severity: 'HIGH' }],
          documents: [],
        },
      ],
    });
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValue({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-facility-b',
      signingUrl: 'https://sign.famidoc.online/sign/tok-facility-b',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });
    vi.spyOn(contractsApi, 'syncDocumenso').mockResolvedValueOnce({
      synced: true,
      contractId: 'ct-4p-001',
      contractStatus: 'PENDING_APPROVAL',
      signedRoles: ['FAMILY_REP', 'HEALTHCARE_FACILITY'],
      signedPdfUrl: null,
    });

    const { container } = render(<FacilityFourPartyDetailView contractId="ct-4p-001" />);

    expect(await screen.findByText(/HĐ4B-2026-0842/)).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn Phúc')).toBeInTheDocument();
    expect(screen.getByText('Penicillin (HIGH)')).toBeInTheDocument();

    // Read-only pre-selected doctor without assign/reassign UI
    expect(screen.getByText('Bác sĩ Gia đình đã chọn')).toBeInTheDocument();
    expect(screen.getByText('Chỉ xem')).toBeInTheDocument();
    expect(screen.getAllByText('BS. CKII Trần Minh Tuấn').length).toBeGreaterThan(0);
    expect(screen.getByText(/004821\/SYT-HCM/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Phân công|Chỉ định/i })).toBeNull();

    // 4-party timeline A -> B · C · D
    const timeline = screen.getByTestId('four-party-signature-timeline');
    expect(within(timeline).getByTestId('timeline-party-A')).toHaveTextContent('Đã ký');
    expect(within(timeline).getByTestId('timeline-party-B')).toHaveTextContent('Chờ ký');
    expect(within(timeline).getByTestId('timeline-party-C')).toHaveTextContent('Chờ ký');
    expect(within(timeline).getByTestId('timeline-party-D')).toHaveTextContent('Chờ ký');

    // Right column mounts DocumensoSigningEmbed
    const embed = await screen.findByTestId('mock-documenso-embed');
    expect(embed).toHaveAttribute('data-token', 'tok-facility-b');

    // Typography check
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('falls back to detail.members when getCareSummary fails without blocking contract view', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce(baseDetail);
    vi.spyOn(contractsApi, 'getCareSummary').mockRejectedValueOnce(new Error('500'));
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-b',
      signingUrl: 'https://sign.famidoc.online/sign/tok-b',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" />);

    expect(await screen.findByText('Nguyễn Văn Phúc (Fallback)')).toBeInTheDocument();
    expect(screen.getByText('Chưa tải được thông tin dị ứng')).toBeInTheDocument();
    expect(await screen.findByTestId('mock-documenso-embed')).toBeInTheDocument();
  });

  it('renders ended status badges for EXPIRED/TERMINATED contracts and clean empty-doctor state without literal 0', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce({
      ...baseDetail,
      contractStatus: 'EXPIRED',
      doctor: null,
      signatures: [],
    });
    vi.spyOn(contractsApi, 'getCareSummary').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      packageName: 'Gói Gia Đình Toàn Diện',
      members: [
        {
          patientId: 'pat-1',
          fullName: 'Lê Thị Mai',
          age: Number.NaN,
          dateOfBirth: '1960-01-01',
          gender: 'FEMALE',
          relationshipToHead: 'PARENT',
          allergies: [],
          documents: [],
        },
      ],
    });
    vi.spyOn(contractsApi, 'getSigningSession').mockRejectedValueOnce(
      new ApiError('Ended', 404)
    );

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" />);

    expect(
      await screen.findByTestId('facility-detail-no-doctor')
    ).toBeInTheDocument();
    expect(screen.getByText('Lê Thị Mai')).toBeInTheDocument();
    expect(screen.getAllByText('Đã hết hạn').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Chờ Bên A ký trước/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/năm kinh nghiệm/i)).not.toBeInTheDocument();
  });

  it('hides experienceYears badge when experienceYears is 0', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce({
      ...baseDetail,
      doctor: {
        ...baseDetail.doctor!,
        experienceYears: 0,
      },
    });
    vi.spyOn(contractsApi, 'getCareSummary').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      packageName: 'Gói Gia Đình Toàn Diện',
      members: [],
    });
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-b',
      signingUrl: 'https://sign.famidoc.online/sign/tok-b',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" />);

    expect(
      (await screen.findAllByText('BS. CKII Trần Minh Tuấn')).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/năm kinh nghiệm/i)).not.toBeInTheDocument();
  });

  it('displays 409 Party-A-first gate notice when Bên A has not signed yet', async () => {
    const unsignedDetail: MedicalContractDetailDto = {
      ...baseDetail,
      signatures: [],
    };
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce(unsignedDetail);
    vi.spyOn(contractsApi, 'getCareSummary').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      packageName: 'Gói Gia Đình Toàn Diện',
      members: [],
    });
    vi.spyOn(contractsApi, 'getSigningSession').mockRejectedValueOnce(
      new ApiError('Chờ Bên A ký trước', 409)
    );

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" />);

    expect(
      await screen.findByText('Chờ Đại diện Hộ gia đình (Bên A) ký trước')
    ).toBeInTheDocument();
    const timeline = screen.getByTestId('four-party-signature-timeline');
    expect(within(timeline).getByTestId('timeline-party-B')).toHaveTextContent(
      'Chờ Bên A ký trước'
    );
  });

  it('displays 404 missing-session guidance cleanly', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce(baseDetail);
    vi.spyOn(contractsApi, 'getCareSummary').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      packageName: 'Gói Gia Đình Toàn Diện',
      members: [],
    });
    vi.spyOn(contractsApi, 'getSigningSession').mockRejectedValueOnce(
      new ApiError('', 404)
    );

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" />);

    expect(
      await screen.findByText('Chưa tìm thấy phiên ký Documenso')
    ).toBeInTheDocument();
  });

  it('marks 4/4 timeline complete, provides "Tải PDF đã ký", and surfaces PDF download errors inline', async () => {
    const signedAllDetail: MedicalContractDetailDto = {
      ...baseDetail,
      contractStatus: 'PENDING_PAYMENT',
      signedPdfUrl: '/api/v1/contracts/medical/ct-4p-001/signed-pdf',
      signatures: [
        { signerRole: 'FAMILY_REP', signerUserId: 'u-1', signedAt: '2026-11-17T09:14:00.000Z' },
        { signerRole: 'HEALTHCARE_FACILITY', signerUserId: 'u-2', signedAt: '2026-11-17T10:00:00.000Z' },
        { signerRole: 'ASSIGNED_DOCTOR', signerUserId: 'u-3', signedAt: '2026-11-17T11:00:00.000Z' },
        { signerRole: 'ADMIN', signerUserId: 'u-4', signedAt: '2026-11-17T12:00:00.000Z' },
      ],
    };

    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce(signedAllDetail);
    vi.spyOn(contractsApi, 'getCareSummary').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      packageName: 'Gói Gia Đình Toàn Diện',
      members: [],
    });
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      contractStatus: 'PENDING_PAYMENT',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: true,
      canSign: false,
      signingToken: null,
      signingUrl: null,
      signedRoles: ['FAMILY_REP', 'HEALTHCARE_FACILITY', 'ASSIGNED_DOCTOR', 'ADMIN'],
      signedPdfUrl: '/api/v1/contracts/medical/ct-4p-001/signed-pdf',
    });
    vi.spyOn(contractsApi, 'downloadSignedPdf').mockRejectedValueOnce(
      new ApiError('Server error', 500)
    );

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" />);

    const timeline = await screen.findByTestId('four-party-signature-timeline');
    expect(within(timeline).getByText('4/4 chữ ký hoàn tất')).toBeInTheDocument();

    const downloadBtn = screen.getByRole('button', { name: /Tải PDF đã ký/i });
    fireEvent.click(downloadBtn);

    const pdfErrorAlert = await screen.findByText(/Không thể tải tệp PDF đã ký/i);
    expect(pdfErrorAlert).toBeInTheDocument();
  });

  it('shows retry button and back link when detail loading fails', async () => {
    const detailSpy = vi
      .spyOn(contractsApi, 'getMedicalContractDetail')
      .mockRejectedValueOnce(new Error('Không thể kết nối máy chủ'))
      .mockResolvedValueOnce(baseDetail);
    vi.spyOn(contractsApi, 'getCareSummary').mockResolvedValue({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      packageName: 'Gói Gia Đình Toàn Diện',
      members: [],
    });
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValue({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-b',
      signingUrl: 'https://sign.famidoc.online/sign/tok-b',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể kết nối máy chủ'
    );
    expect(
      screen.getByRole('link', { name: /Quay lại danh sách Hợp đồng Y tế 4 bên/i })
    ).toHaveAttribute('href', '/facility/coordination');

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    await waitFor(() => {
      expect(detailSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/HĐ4B-2026-0842/)).toBeInTheDocument();
    });
  });
});
