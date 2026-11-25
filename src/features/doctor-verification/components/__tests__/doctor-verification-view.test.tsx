import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DoctorVerificationView } from '../doctor-verification-view';
import { doctorsApi } from '@/lib/api';
import { DOCTOR_GATE_REFRESH_EVENT } from '@/components/layout/doctor-verification-gate';

const mockRouterReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  extractErrorMessage: (_err: unknown, fallback = 'Error') => fallback,
  doctorsApi: {
    getDoctorMe: vi.fn(),
    submitMyCredentials: vi.fn(),
    fetchCredentialFileBlobUrl: vi.fn(),
  },
}));

describe('DoctorVerificationView Component (Full-Page Inline Form)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders full-page doctor profile, rejection reason, maxPanelCapacity 30, and existing credentials without popup modal', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue({
      id: 'doc-uuid-123',
      doctorName: 'BS. Phan Văn Minh',
      academicTitle: 'ThS.BS',
      specialty: 'Khoa Y học Gia đình',
      experienceYears: 5,
      bio: 'Bác sĩ y học gia đình',
      activePanelCount: 2,
      maxPanelCapacity: 30,
      onboardingStatus: 'PENDING_SUBMISSION',
      rejectionReason: 'Bản scan chứng chỉ Y học gia đình bị mờ ngày cấp.',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [
        {
          id: 'cred-1',
          credentialType: 'PRACTICE_LICENSE_CCHN',
          certificateNumber: '004128/BYT-CCHN',
          issueDate: '2022-06-15',
          issuingAuthority: 'Bộ Y Tế',
          fileUrl: 'doctor-credentials/doc-uuid-123/cchn.pdf',
        },
        {
          id: 'cred-2',
          credentialType: 'DEGREE',
          certificateNumber: 'BYK-2019-88',
          issueDate: '2019-07-01',
          issuingAuthority: 'ĐH Y Hà Nội',
          fileUrl: 'doctor-credentials/doc-uuid-123/degree.pdf',
        },
      ],
    });

    render(<DoctorVerificationView />);

    await waitFor(() => {
      expect(screen.getByText(/Hồ Sơ Y Khoa & Xác Thực Chứng Chỉ Hành Nghề/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('004128/BYT-CCHN')).toBeInTheDocument();
      expect(screen.getByDisplayValue('BYK-2019-88')).toBeInTheDocument();
      expect(screen.getByText(/Bản scan chứng chỉ Y học gia đình bị mờ ngày cấp\./i)).toBeInTheDocument();
      expect(screen.getByText(/2 \/ 30 hộ gia đình/i)).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('edits inline profile fields and submits real files + metadata for all 3 required credentials', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue({
      id: 'doc-uuid-123',
      doctorName: 'BS. Phan Văn Minh',
      specialty: 'Khoa Y học Gia đình',
      experienceYears: 0,
      onboardingStatus: 'PENDING_SUBMISSION',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [],
    });

    vi.mocked(doctorsApi.submitMyCredentials).mockResolvedValue({
      id: 'doc-uuid-123',
      doctorName: 'BS. Phan Văn Minh',
      academicTitle: 'BS.CKI',
      specialty: 'Y học gia đình',
      experienceYears: 7,
      bio: 'Kinh nghiệm chăm sóc sức khỏe ban đầu',
      onboardingStatus: 'PENDING_FACILITY_REVIEW',
      facilityId: 'fac-1',
      maxPanelCapacity: 30,
      credentials: [],
    });

    render(<DoctorVerificationView />);

    const academicSelect = await screen.findByLabelText(/Học hàm \/ Học vị/i);
    fireEvent.change(academicSelect, {
      target: { value: 'BS.CKI' },
    });
    fireEvent.change(screen.getByLabelText(/Chuyên khoa hành nghề/i), {
      target: { value: 'Y học gia đình' },
    });
    fireEvent.change(screen.getByLabelText(/Số năm kinh nghiệm/i), {
      target: { value: '7' },
    });
    fireEvent.change(screen.getByLabelText(/Tiểu sử/i), {
      target: { value: 'Kinh nghiệm chăm sóc sức khỏe ban đầu' },
    });

    // 1. CCHN/GPHN
    const cchnFile = new File(['%PDF-1.4 cchn'], 'cchn.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Số hiệu Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)'), {
      target: { value: '004128/BYT-CCHN' },
    });
    fireEvent.change(screen.getByLabelText('Nơi cấp Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)'), {
      target: { value: 'Bộ Y Tế' },
    });
    fireEvent.change(screen.getByLabelText('Ngày cấp Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)'), {
      target: { value: '2022-06-15' },
    });
    fireEvent.change(screen.getByLabelText('Tệp scan Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)'), {
      target: { files: [cchnFile] },
    });

    // 2. DEGREE
    const degreeFile = new File(['png-degree'], 'degree.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Số hiệu Bằng chuyên môn'), {
      target: { value: 'BYK-2018-09' },
    });
    fireEvent.change(screen.getByLabelText('Nơi cấp Bằng chuyên môn'), {
      target: { value: 'ĐH Y Dược TP.HCM' },
    });
    fireEvent.change(screen.getByLabelText('Ngày cấp Bằng chuyên môn'), {
      target: { value: '2018-07-10' },
    });
    fireEvent.change(screen.getByLabelText('Tệp scan Bằng chuyên môn'), {
      target: { files: [degreeFile] },
    });

    // 3. FAMILY_MEDICINE_CERT
    const fmFile = new File(['jpg-fm'], 'fm.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Số hiệu Chứng chỉ Y học gia đình'), {
      target: { value: 'YHGD-2023-55' },
    });
    fireEvent.change(screen.getByLabelText('Nơi cấp Chứng chỉ Y học gia đình'), {
      target: { value: 'Bộ Y Tế' },
    });
    fireEvent.change(screen.getByLabelText('Ngày cấp Chứng chỉ Y học gia đình'), {
      target: { value: '2023-03-01' },
    });
    fireEvent.change(screen.getByLabelText('Tệp scan Chứng chỉ Y học gia đình'), {
      target: { files: [fmFile] },
    });

    fireEvent.click(screen.getByRole('button', { name: /Gửi Thẩm Định/i }));

    await waitFor(() => {
      expect(doctorsApi.submitMyCredentials).toHaveBeenCalledWith(
        expect.objectContaining({
          academicTitle: 'BS.CKI',
          specialty: 'Y học gia đình',
          experienceYears: 7,
          bio: 'Kinh nghiệm chăm sóc sức khỏe ban đầu',
          cchnFile,
          degreeFile,
          familyMedicineFile: fmFile,
          credentials: [
            {
              credentialType: 'PRACTICE_LICENSE_CCHN',
              certificateNumber: '004128/BYT-CCHN',
              issueDate: '2022-06-15',
              issuingAuthority: 'Bộ Y Tế',
            },
            {
              credentialType: 'DEGREE',
              certificateNumber: 'BYK-2018-09',
              issueDate: '2018-07-10',
              issuingAuthority: 'ĐH Y Dược TP.HCM',
            },
            {
              credentialType: 'FAMILY_MEDICINE_CERT',
              certificateNumber: 'YHGD-2023-55',
              issueDate: '2023-03-01',
              issuingAuthority: 'Bộ Y Tế',
            },
          ],
        }),
      );
    });
  });

  it('locks form inputs and hides submit footer when onboardingStatus is ACTIVE', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue({
      id: 'doc-uuid-123',
      doctorName: 'BS. Phan Văn Minh',
      specialty: 'Y học gia đình',
      experienceYears: 5,
      onboardingStatus: 'ACTIVE',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [
        {
          id: 'cred-1',
          credentialType: 'PRACTICE_LICENSE_CCHN',
          certificateNumber: '004128/BYT-CCHN',
          issueDate: '2022-06-15',
          issuingAuthority: 'Bộ Y Tế',
          fileUrl: 'doctor-credentials/doc-uuid-123/cchn.pdf',
          facilityVerified: true,
          platformApproved: true,
        },
      ],
    });

    render(<DoctorVerificationView />);

    const specialtyInput = await screen.findByLabelText(/Chuyên khoa hành nghề/i);
    expect(specialtyInput).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Gửi Thẩm Định/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cập nhật & Gửi lại Thẩm định/i })).not.toBeInTheDocument();
  });

  it('locks form inputs and hides submit footer when onboardingStatus is FACILITY_VERIFIED', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue({
      id: 'doc-uuid-123',
      doctorName: 'BS. Phan Văn Minh',
      specialty: 'Y học gia đình',
      experienceYears: 5,
      onboardingStatus: 'FACILITY_VERIFIED',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [],
    });

    render(<DoctorVerificationView />);

    const specialtyInput = await screen.findByLabelText(/Chuyên khoa hành nghề/i);
    expect(specialtyInput).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Gửi Thẩm Định/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cập nhật & Gửi lại Thẩm định/i })).not.toBeInTheDocument();
  });

  it('locks form inputs and hides submit footer when onboardingStatus is SUSPENDED', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue({
      id: 'doc-uuid-123',
      doctorName: 'BS. Phan Văn Minh',
      specialty: 'Y học gia đình',
      experienceYears: 5,
      onboardingStatus: 'SUSPENDED',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [],
    });

    render(<DoctorVerificationView />);

    const specialtyInput = await screen.findByLabelText(/Chuyên khoa hành nghề/i);
    expect(specialtyInput).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Gửi Thẩm Định/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cập nhật & Gửi lại Thẩm định/i })).not.toBeInTheDocument();
  });

  it('redirects to /doctor after successful submit and locks form when PENDING_FACILITY_REVIEW', async () => {
    mockRouterReplace.mockClear();
    const refreshListener = vi.fn();
    window.addEventListener(DOCTOR_GATE_REFRESH_EVENT, refreshListener);

    try {
      vi.mocked(doctorsApi.getDoctorMe).mockResolvedValueOnce({
        id: 'doc-uuid-123',
        doctorName: 'BS. Phan Văn Minh',
        specialty: 'Y học gia đình',
        experienceYears: 5,
        onboardingStatus: 'PENDING_SUBMISSION',
        facilityId: 'fac-1',
        facilityName: 'Bệnh viện An Sinh',
        credentials: [
          {
            id: 'c1',
            credentialType: 'PRACTICE_LICENSE_CCHN',
            certificateNumber: 'CCHN-1',
            issueDate: '2022-01-01',
            issuingAuthority: 'Bộ Y tế',
            fileUrl: 'c1.pdf',
          },
          {
            id: 'c2',
            credentialType: 'DEGREE',
            certificateNumber: 'DEG-1',
            issueDate: '2020-01-01',
            issuingAuthority: 'ĐH Y',
            fileUrl: 'c2.pdf',
          },
          {
            id: 'c3',
            credentialType: 'FAMILY_MEDICINE_CERT',
            certificateNumber: 'FM-1',
            issueDate: '2023-01-01',
            issuingAuthority: 'Bộ Y tế',
            fileUrl: 'c3.pdf',
          },
        ],
      });
      vi.mocked(doctorsApi.submitMyCredentials).mockResolvedValueOnce({
        id: 'doc-uuid-123',
        doctorName: 'BS. Phan Văn Minh',
        specialty: 'Y học gia đình',
        experienceYears: 5,
        onboardingStatus: 'PENDING_FACILITY_REVIEW',
        facilityId: 'fac-1',
        credentials: [],
      });

      const firstRender = render(<DoctorVerificationView />);
      const submitBtn = await screen.findByRole('button', { name: /Gửi Thẩm Định/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(doctorsApi.submitMyCredentials).toHaveBeenCalled();
        expect(refreshListener).toHaveBeenCalled();
        expect(mockRouterReplace).toHaveBeenCalledWith('/doctor');
      });
      firstRender.unmount();

      vi.mocked(doctorsApi.getDoctorMe).mockResolvedValueOnce({
        id: 'doc-uuid-123',
        doctorName: 'BS. Phan Văn Minh',
        specialty: 'Y học gia đình',
        experienceYears: 5,
        onboardingStatus: 'PENDING_FACILITY_REVIEW',
        facilityId: 'fac-1',
        facilityName: 'Bệnh viện An Sinh',
        credentials: [],
      });

      render(<DoctorVerificationView />);
      const specialtyInput = await screen.findByLabelText(/Chuyên khoa hành nghề/i);
      expect(specialtyInput).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Gửi Thẩm Định/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Cập nhật & Gửi lại Thẩm định/i }),
      ).not.toBeInTheDocument();
    } finally {
      window.removeEventListener(DOCTOR_GATE_REFRESH_EVENT, refreshListener);
    }
  });
});
