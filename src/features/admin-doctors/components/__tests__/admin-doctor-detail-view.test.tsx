import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDoctorDetailView } from '../admin-doctor-detail-view';
import { doctorsApi } from '@/lib/api/doctors.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/api/doctors.api', () => ({
  doctorsApi: {
    getDoctorById: vi.fn(),
    platformApproveCredentials: vi.fn(),
  },
}));

describe('AdminDoctorDetailView Dual-Tier Timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Tier 1 pending when onboardingStatus is PENDING_FACILITY_REVIEW', async () => {
    vi.mocked(doctorsApi.getDoctorById).mockResolvedValue({
      id: 'doc-1',
      doctorName: 'BS. Nguyễn Văn An',
      specialty: 'Y học gia đình',
      experienceYears: 5,
      onboardingStatus: 'PENDING_FACILITY_REVIEW',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [],
    });

    render(<AdminDoctorDetailView doctorId="doc-1" />);

    expect(await screen.findByText('BS. Nguyễn Văn An')).toBeInTheDocument();
    expect(
      screen.getByText(/Bác sĩ đã nộp đủ 3 chứng chỉ, đang chờ Cơ sở Y tế thẩm định Cấp 1\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mở sau khi Cơ sở Y tế hoàn tất duyệt Cấp 1\./i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Phê duyệt Cấp 2/i }),
    ).not.toBeInTheDocument();
  });

  it('marks Tier 1 completed and Tier 2 waiting when onboardingStatus is FACILITY_VERIFIED', async () => {
    vi.mocked(doctorsApi.getDoctorById).mockResolvedValue({
      id: 'doc-2',
      doctorName: 'BS. Trần Thị Bình',
      specialty: 'Nội Tổng quát',
      experienceYears: 8,
      onboardingStatus: 'FACILITY_VERIFIED',
      facilityId: 'fac-1',
      facilityName: 'Bệnh viện An Sinh',
      credentials: [],
    });

    render(<AdminDoctorDetailView doctorId="doc-2" />);

    expect(await screen.findByText('BS. Trần Thị Bình')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Đại diện CSYT đã đối chiếu văn bằng gốc, xác nhận bác sĩ trực thuộc và đề xuất kích hoạt lên FamiDoc\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Đang chờ Admin phê duyệt để cấp quyền mở lịch tư vấn và tiếp nhận bệnh nhân\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Duyệt Cấp 2|Phê duyệt/i }),
    ).toBeInTheDocument();
  });
});
