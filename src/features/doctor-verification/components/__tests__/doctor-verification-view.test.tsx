import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DoctorVerificationView } from '../doctor-verification-view';
import { doctorsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  doctorsApi: {
    getDoctorMe: vi.fn(),
    submitMyCredentials: vi.fn(),
  },
}));

describe('DoctorVerificationView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and loads doctor profile with pending submission status', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue({
      id: 'doc-uuid-123',
      doctorName: 'BS. Phan Văn Minh',
      specialty: 'Khoa Y học Gia đình',
      experienceYears: 5,
      onboardingStatus: 'PENDING_SUBMISSION',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [
        {
          credentialType: 'PRACTICE_LICENSE_CCHN',
          certificateNumber: '004128/BYT-CCHN',
          issueDate: '2022-06-15',
          issuingAuthority: 'Bộ Y Tế',
          fileUrl: 'https://cdn.famidoc.vn/cchn.pdf',
        },
      ],
    });

    render(<DoctorVerificationView />);

    await waitFor(() => {
      expect(screen.getByText(/Hồ Sơ Y Khoa & Xác Thực Chứng Chỉ Hành Nghề/i)).toBeInTheDocument();
      expect(screen.getAllByText(/004128\/BYT-CCHN/i).length).toBeGreaterThan(0);
    });
  });

  it('opens modal and submits credentials to backend', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue({
      id: 'doc-uuid-123',
      doctorName: 'BS. Phan Văn Minh',
      specialty: 'Khoa Y học Gia đình',
      experienceYears: 5,
      onboardingStatus: 'PENDING_SUBMISSION',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [],
    });

    vi.mocked(doctorsApi.submitMyCredentials).mockResolvedValue({ success: true });

    render(<DoctorVerificationView />);

    await waitFor(() => {
      expect(screen.getByText(/Cập nhật \/ Nộp hồ sơ CCHN/i)).toBeInTheDocument();
    });

    // Open Modal
    fireEvent.click(screen.getByText(/Cập nhật \/ Nộp hồ sơ CCHN/i));

    // Fill form fields
    fireEvent.change(screen.getByPlaceholderText(/Ví dụ: 004128\/BYT-CCHN/i), {
      target: { value: '004128/BYT-CCHN' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ví dụ: Cục Quản lý Khám chữa bệnh/i), {
      target: { value: 'Bộ Y Tế' },
    });
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2022-06-15' } });
    }

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Gửi Thẩm Định 2 Cấp/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(doctorsApi.submitMyCredentials).toHaveBeenCalled();
    });
  });
});
