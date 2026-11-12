import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorDetailView } from '../doctor-detail-view';
import { publicApi, type PublicDoctorDetailDto } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  publicApi: {
    getDoctors: vi.fn(),
    getFacilities: vi.fn(),
    getDoctorDetail: vi.fn(),
    getDoctorReviews: vi.fn(),
    submitConsultationRequest: vi.fn(),
  },
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

describe('DoctorDetailView Component', () => {
  const mockDoctor: PublicDoctorDetailDto = {
    id: 'doc-real-100',
    doctorName: 'BS. Lê Minh Trí',
    academicTitle: 'TS. Bác sĩ',
    specialty: 'Y học Gia đình & Lão khoa',
    hospital: 'Bệnh viện Thống Nhất',
    location: 'TP. Hồ Chí Minh',
    experienceYears: 18,
    ratingAvg: 4.95,
    totalReviews: 120,
    consultationCount: 1500,
    bio: 'Bác sĩ chuyên khoa sâu về quản lý đa bệnh lý ở người cao tuổi và phục hồi sau phẫu thuật tại nhà.',
    education: [
      'Tiến sĩ Y khoa - Đại học Y Dược TP.HCM (2015)',
      'Chứng chỉ Lão khoa Lâm sàng - Bệnh viện Thống Nhất',
    ],
    carePackages: [
      {
        id: 'PKG-CUSTOM-1',
        name: 'Gói Chăm Sóc Người Cao Tuổi Pro',
        badge: '6 Tháng',
        price: '5.200.000đ',
        monthlyPrice: '866.000đ/tháng',
        popular: true,
        highlight: 'Theo dõi chỉ số sinh hiệu và tim mạch tại nhà 24/7',
        features: ['Đo điện tim tại nhà', 'Bác sĩ thăm khám 2 lần/tháng'],
      },
      {
        id: 'PKG-CUSTOM-2',
        name: 'Gói Khám Cơ Bản',
        badge: '1 Tháng',
        price: '1.200.000đ',
        features: ['1 lượt bác sĩ khám tại nhà'],
      },
    ],
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Trần Văn Hùng',
        rating: 5,
        comment: 'Bác sĩ Trí rất tận tâm và giải thích cặn kẽ tình trạng bệnh.',
        badge: 'Hội viên Gói An Tâm',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getDoctorReviews).mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 5, totalRecords: 0, totalPages: 1 },
    });
  });

  it('renders doctor details, academic title, care packages, and bio from initialDoctor prop', () => {
    render(<DoctorDetailView initialDoctor={mockDoctor} />);

    // Name and academic title / degree
    expect(screen.getAllByText(/BS\. Lê Minh Trí/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TS\. Bác sĩ/i).length).toBeGreaterThan(0);

    // Specialty & Hospital
    expect(screen.getByText(/Y học Gia đình & Lão khoa/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bệnh viện Thống Nhất/i).length).toBeGreaterThan(0);

    // Bio
    expect(
      screen.getByText(/Bác sĩ chuyên khoa sâu về quản lý đa bệnh lý ở người cao tuổi/i)
    ).toBeInTheDocument();

    // Care packages
    expect(screen.getByText('Gói Chăm Sóc Người Cao Tuổi Pro')).toBeInTheDocument();
    expect(screen.getByText('5.200.000đ')).toBeInTheDocument();
    expect(screen.getByText('Gói Khám Cơ Bản')).toBeInTheDocument();
  });

  it('submits consultation request with user input and displays real ticket ID on success screen', async () => {
    vi.mocked(publicApi.submitConsultationRequest).mockResolvedValue({
      data: {
        ticketId: 'CRQ-8899-TEST',
        status: 'RECEIVED',
        message: 'Thành công',
      },
    });

    render(<DoctorDetailView initialDoctor={mockDoctor} />);

    // Select package PKG-CUSTOM-2
    const pkgOption = screen.getByText('Gói Khám Cơ Bản');
    fireEvent.click(pkgOption);

    // Fill form
    const nameInput = screen.getByPlaceholderText(/Họ và tên người đại diện gia đình/i);
    const phoneInput = screen.getByPlaceholderText(/Số điện thoại liên hệ nhận tư vấn/i);
    const noteInput = screen.getByPlaceholderText(/Ghi chú/i);

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Thị Hoa' } });
    fireEvent.change(phoneInput, { target: { value: '0912345678' } });
    fireEvent.change(noteInput, { target: { value: 'Cần khám cho mẹ lớn tuổi khó đi lại' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Đăng Ký Gói Chăm Sóc Ngay/i });
    fireEvent.click(submitBtn);

    // Check API called
    await waitFor(() => {
      expect(publicApi.submitConsultationRequest).toHaveBeenCalledWith({
        fullName: 'Nguyễn Thị Hoa',
        phone: '0912345678',
        preferredPackageId: 'PKG-CUSTOM-2',
        familyMemberCount: 3,
        healthNeeds: 'Cần khám cho mẹ lớn tuổi khó đi lại',
      });
    });

    // Check success screen displays actual ticket ID
    await waitFor(() => {
      expect(screen.getByText(/Đăng Ký Gói Thành Công!/i)).toBeInTheDocument();
      expect(screen.getByText(/#CRQ-8899-TEST/i)).toBeInTheDocument();
    });
  });

  it('falls back safely to default mock doctor when initialDoctor is not provided', async () => {
    render(<DoctorDetailView id="doc-01" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Nguyễn Văn Hoài/i })).toBeInTheDocument();
      expect(screen.getAllByText(/PGS\. TS\. Bác sĩ/i).length).toBeGreaterThan(0);
    });
  });

  it('displays friendly error message when submitConsultationRequest fails', async () => {
    vi.mocked(publicApi.submitConsultationRequest).mockRejectedValueOnce(
      new Error('Hệ thống đang bảo trì, vui lòng thử lại sau.')
    );

    render(<DoctorDetailView initialDoctor={mockDoctor} />);

    const nameInput = screen.getByPlaceholderText(/Họ và tên người đại diện gia đình/i);
    const phoneInput = screen.getByPlaceholderText(/Số điện thoại liên hệ nhận tư vấn/i);

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Thị Hoa' } });
    fireEvent.change(phoneInput, { target: { value: '0912345678' } });

    const submitBtn = screen.getByRole('button', { name: /Đăng Ký Gói Chăm Sóc Ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Hệ thống đang bảo trì, vui lòng thử lại sau\./i)
      ).toBeInTheDocument();
    });
  });

  it('fetches reviews via publicApi.getDoctorReviews when doctor has no reviews in initialDoctor', async () => {
    const doctorWithoutReviews = { ...mockDoctor, reviews: [] };
    vi.mocked(publicApi.getDoctorReviews).mockResolvedValueOnce({
      items: [
        {
          id: 'rev-fetched-1',
          authorName: 'Vũ Minh Tuấn',
          rating: 5,
          comment: 'Bác sĩ phản hồi nhanh và nhiệt tình.',
          badge: 'Gói Đồng Hành',
        },
      ],
      pagination: { page: 1, pageSize: 5, totalRecords: 1, totalPages: 1 },
    });

    render(<DoctorDetailView initialDoctor={doctorWithoutReviews} />);

    await waitFor(() => {
      expect(publicApi.getDoctorReviews).toHaveBeenCalledWith('doc-real-100', {
        page: 1,
        limit: 5,
      });
      expect(screen.getByText(/Vũ Minh Tuấn/i)).toBeInTheDocument();
      expect(screen.getByText(/Bác sĩ phản hồi nhanh và nhiệt tình\./i)).toBeInTheDocument();
    });
  });
});
