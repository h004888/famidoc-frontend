import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LandingHeader } from '../landing-header';
import { LandingHero } from '../landing-hero';
import { LandingStats } from '../landing-stats';
import { LandingPackages } from '../landing-packages';
import { LandingProcess } from '../landing-process';
import { LandingDoctors } from '../landing-doctors';
import { LandingCtaBanner } from '../landing-cta-banner';
import { LandingFooter } from '../landing-footer';
import {
  mockPortalMetrics,
  mockPublicDoctors,
  mockPublicPackages,
} from '@/test/mocks/handlers/landing.handler';

describe('UT-CMP: Landing UI Components (High-End Concierge Medical Compliance)', () => {
  it('UT-CMP-01: Header hiển thị đầy đủ Logo, Concierge Navigation, nút Khẩn Cấp và Auth button pair', () => {
    render(<LandingHeader />);
    expect(screen.getByText(/FamiDoc/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gói chăm sóc' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bác sĩ gia đình' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cơ sở y tế đối tác' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Liên hệ & Tư vấn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Đăng ký/i })).toBeInTheDocument();
  });

  it('UT-CMP-02: Header điều hướng đúng liên kết cho khách vãng lai theo các chương', () => {
    render(<LandingHeader />);
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Gói chăm sóc' })).toHaveAttribute('href', '/packages');
    expect(screen.getByRole('link', { name: 'Bác sĩ gia đình' })).toHaveAttribute('href', '/doctors');
    expect(screen.getByRole('link', { name: 'Cơ sở y tế đối tác' })).toHaveAttribute('href', '/facilities');
    expect(screen.getByRole('link', { name: 'Liên hệ & Tư vấn' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Đăng ký/i })).toHaveAttribute('href', '/register');
  });

  it('UT-CMP-03: Hero Section hiển thị tiêu đề và nút đăng ký', () => {
    render(<LandingHero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Y học Gia đình Tận tâm/i);
    expect(screen.getByRole('link', { name: /Đăng ký Bác sĩ Riêng/i })).toBeInTheDocument();
  });

  it('UT-CMP-04: Hero hiển thị đúng hình ảnh bác sĩ đối thoại tư gia', () => {
    render(<LandingHero />);
    expect(
      screen.getByAltText(/Bác sĩ gia đình đối thoại chuyên môn tại tư gia/i)
    ).toBeInTheDocument();
  });

  it('UT-CMP-05: Stats Banner hiển thị số liệu thật từ Backend và fallback an toàn khi null', () => {
    const { rerender } = render(<LandingStats metrics={mockPortalMetrics} />);
    expect(screen.getByText('320+')).toBeInTheDocument();
    expect(screen.getByText('48+')).toBeInTheDocument();
    expect(screen.getByText('<25 phút')).toBeInTheDocument();
    expect(screen.getByText('99.4%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(<LandingStats metrics={null} />);
    expect(screen.getByText('50.000+')).toBeInTheDocument();
    expect(screen.getByText('1.200+')).toBeInTheDocument();
  });

  it('UT-CMP-06: Packages Section render đủ 4 gói từ Backend và truyền UUID vào packageId', () => {
    render(<LandingPackages packages={mockPublicPackages} />);
    expect(screen.getByText('Gói Trải Nghiệm')).toBeInTheDocument();
    expect(screen.getByText('Gói Đồng Hành')).toBeInTheDocument();
    expect(screen.getByText('Gói An Tâm')).toBeInTheDocument();
    expect(screen.getByText('Gói Toàn Diện')).toBeInTheDocument();

    expect(screen.getByText('Phổ biến nhất')).toBeInTheDocument();
    expect(screen.getByText('1.000.000đ')).toBeInTheDocument();
    expect(screen.getByText('2.850.000đ')).toBeInTheDocument();
    expect(screen.getByText('6.475.000đ')).toBeInTheDocument();
    expect(screen.getByText('12.600.000đ')).toBeInTheDocument();

    const registerButtons = screen.getAllByRole('link', { name: /Chọn gói này|Đăng ký ngay/i });
    expect(registerButtons).toHaveLength(4);
    expect(registerButtons[0]).toHaveAttribute(
      'href',
      '/register?packageId=10000000-0000-4000-8000-000000000001'
    );
    expect(registerButtons[1]).toHaveAttribute(
      'href',
      '/register?packageId=20000000-0000-4000-8000-000000000002'
    );
  });

  it('UT-CMP-07: Process Section render đủ trụ cột chăm sóc', () => {
    render(<LandingProcess />);
    expect(screen.getByText('Chương II · The Three Pillars')).toBeInTheDocument();
    expect(screen.getByText('Ba Trụ Cột Chăm Sóc Độc Bản')).toBeInTheDocument();
    expect(screen.getByText(/Hiện Diện Y Tế Tận Gia Kín Đáo/i)).toBeInTheDocument();
    expect(screen.getByText(/Hội Đồng Chuyên Gia Đầu Ngành/i)).toBeInTheDocument();
    expect(screen.getByText(/Biên Niên Sử Y Bạ Gia Tộc/i)).toBeInTheDocument();
  });

  it('UT-CMP-08: Doctors Grid hiển thị bác sĩ từ Backend và link tổng số bác sĩ', () => {
    render(<LandingDoctors doctors={mockPublicDoctors} totalDoctors={48} />);
    expect(screen.getByText('ĐỘI NGŨ CHUYÊN GIA HÀNG ĐẦU')).toBeInTheDocument();
    expect(screen.getByText(/PGS.TS Nguyễn Trọng Nghĩa/i)).toBeInTheDocument();
    expect(screen.getByText(/BSCKII Trần Mai Phương/i)).toBeInTheDocument();
    expect(screen.getByText(/ThS.BS Lê Hoàng Nam/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Xem toàn bộ 48 bác sĩ/i })
    ).toHaveAttribute('href', '/doctors');
  });

  it('UT-CMP-08a: Doctors Grid hiển thị trạng thái rỗng thân thiện khi không có bác sĩ', () => {
    render(<LandingDoctors doctors={[]} totalDoctors={0} />);
    expect(screen.getByText(/Danh sách bác sĩ tiêu biểu đang được cập nhật/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Khám phá danh bạ bác sĩ/i })).toHaveAttribute(
      'href',
      '/doctors'
    );
  });

  it('UT-CMP-09: Link "Xem hồ sơ chi tiết" trên thẻ bác sĩ trỏ tới UUID thật', () => {
    render(<LandingDoctors doctors={mockPublicDoctors} totalDoctors={48} />);
    const links = screen.getAllByRole('link', { name: /xem hồ sơ chi tiết/i });
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute(
      'href',
      '/doctors/11111111-1111-4111-8111-111111111111'
    );
  });

  it('UT-CMP-10: CTA Banner render form đầy đủ trường và gửi thành công trả về ticketId', async () => {
    const user = userEvent.setup();
    render(<LandingCtaBanner packages={mockPublicPackages} />);

    expect(
      screen.getByText('Trao Gửi Sức Khỏe Gia Đình Cho Bác Sĩ Tận Tâm Hôm Nay')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hotline: 1900 8821/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Họ và tên người đại diện/i), 'Nguyễn Văn Minh');
    await user.type(screen.getByLabelText(/Số điện thoại liên hệ/i), '0987654321');
    await user.type(screen.getByLabelText(/Email nhận phản hồi/i), 'minh@famidoc.vn');
    await user.type(
      screen.getByLabelText(/Nhu cầu chăm sóc sức khỏe gia đình/i),
      'Gia đình có bố mẹ lớn tuổi cần theo dõi định kỳ.'
    );

    await user.click(screen.getByRole('button', { name: /Đăng ký tư vấn miễn phí/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/CRQ-TEST-999/);
    });
  });

  it('UT-CMP-11: Footer render dạng thanh ngang tinh gọn với tiêu chuẩn BYT và HIPAA', () => {
    render(<LandingFooter />);
    expect(screen.getAllByText(/FamiDoc Pro/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Bộ Y Tế/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: /Chính sách bảo mật y tế/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tiêu chuẩn HIPAA\/HL7/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quy chuẩn kỹ thuật Bộ Y Tế/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Điều khoản dịch vụ/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Đường dây nóng: 1900 8821/i })).toBeInTheDocument();
  });

  it('standardizes typography across LandingStats, LandingPackages, LandingProcess, LandingDoctors', () => {
    const { container } = render(
      <>
        <LandingStats metrics={mockPortalMetrics} />
        <LandingPackages packages={mockPublicPackages} />
        <LandingProcess />
        <LandingDoctors doctors={mockPublicDoctors} totalDoctors={48} />
      </>
    );
    expect(container.innerHTML).not.toMatch(/\bfont-mono\b/);
    expect(screen.getByText('48+')).toHaveClass('tabular-nums');
    expect(screen.getByText('1.000.000đ')).toHaveClass('tabular-nums');
  });

  it('UT-CMP-12: Mobile bottom nav hiển thị 5 mục trên 1 hàng (grid-cols-5) theo thứ tự ưu tiên Bác sĩ trước Gói khám', () => {
    const { rerender } = render(<LandingHeader />);
    const bottomNav = screen.getByRole('navigation', {
      name: 'Thanh điều hướng di động chân trang',
    });
    const grid = bottomNav.firstElementChild;
    expect(grid).toHaveClass('grid-cols-5');
    expect(grid).not.toHaveClass('grid-cols-4');

    const links = Array.from(bottomNav.querySelectorAll('a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/doctors',
      '/packages',
      '/facilities',
      '/contact',
    ]);
    expect(links.map((link) => link.querySelector('span[aria-hidden="true"]')?.textContent)).toEqual([
      'Trang chủ',
      'Bác sĩ',
      'Gói khám',
      'Cơ sở',
      'Tư vấn',
    ]);

    rerender(<LandingHeader hideMobileBottomNav />);
    expect(
      screen.queryByRole('navigation', { name: 'Thanh điều hướng di động chân trang' })
    ).not.toBeInTheDocument();
  });
});
