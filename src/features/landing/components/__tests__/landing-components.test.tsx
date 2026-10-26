import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('UT-CMP: Landing UI Components (High-End Concierge Medical Compliance)', () => {
  it('UT-CMP-01: Header hiển thị đầy đủ Logo, Concierge Navigation, nút Khẩn Cấp và Auth button pair', () => {
    render(<LandingHeader />);
    expect(screen.getByText(/FamiDoc/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dịch vụ/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Gói khám/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quy trình/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bác sĩ/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tư vấn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cấp cứu: 1900 8821/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Đăng ký/i })).toBeInTheDocument();
  });

  it('UT-CMP-02: Header điều hướng đúng liên kết cho khách vãng lai theo các chương', () => {
    render(<LandingHeader />);
    expect(screen.getByRole('link', { name: /Dịch vụ/i })).toHaveAttribute('href', '#tong-quan');
    expect(screen.getByRole('link', { name: /Gói khám/i })).toHaveAttribute('href', '#goi-kham');
    expect(screen.getByRole('link', { name: /Quy trình/i })).toHaveAttribute('href', '#tru-cot');
    expect(screen.getByRole('link', { name: /Bác sĩ/i })).toHaveAttribute('href', '#bac-si');
    expect(screen.getByRole('link', { name: /Tư vấn/i })).toHaveAttribute('href', '#tu-van');
    expect(screen.getByRole('link', { name: /Đăng nhập/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Đăng ký/i })).toHaveAttribute('href', '/register');
  });

  it('UT-CMP-03: Hero Section (Prologue) hiển thị tiêu đề tuyên ngôn và liên kết khám phá quy chuẩn', () => {
    render(<LandingHero />);
    expect(screen.getByText(/Prologue · Khúc Mở Đầu/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Y học Gia đình Tận tâm/i);
    expect(
      screen.getByRole('link', { name: /Khám phá quy chuẩn chăm sóc riêng tư/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Bộ Y Tế cấp phép · CCHN chính quy/i)).toBeInTheDocument();
  });

  it('UT-CMP-04: Hero hiển thị đúng hình ảnh bác sĩ đối thoại tư gia và biên khảo hiện trường', () => {
    render(<LandingHero />);
    expect(screen.getByAltText(/Bác sĩ gia đình đối thoại chuyên môn tại tư gia/i)).toBeInTheDocument();
    expect(screen.getByText(/Biên khảo hiện trường/i)).toBeInTheDocument();
    expect(screen.getByText(/Mỗi gia đình là một tiểu vũ trụ sức khỏe/i)).toBeInTheDocument();
  });

  it('UT-CMP-05: Stats Banner (Chương I) hiển thị đủ 4 chuẩn mực y học gia tộc', () => {
    render(<LandingStats />);
    expect(screen.getByText('1.200+')).toBeInTheDocument();
    expect(screen.getByText('Bác sĩ CCHN uy tín')).toBeInTheDocument();
    expect(screen.getByText('<25 phút')).toBeInTheDocument();
    expect(screen.getByText('Phản ứng khẩn cấp')).toBeInTheDocument();
    expect(screen.getByText('99.4%')).toBeInTheDocument();
    expect(screen.getByText('Gia đình hài lòng')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Ký quỹ Escrow minh bạch')).toBeInTheDocument();
  });

  it('UT-CMP-06: Packages Section render đủ 4 gói dịch vụ và đồng bộ link đăng ký theo packageId', () => {
    render(<LandingPackages />);
    expect(screen.getByText('Chăm Sóc Cơ Bản')).toBeInTheDocument();
    expect(screen.getByText('Gia Đình Toàn Diện')).toBeInTheDocument();
    expect(screen.getByText('Chăm Sóc Người Cao Tuổi')).toBeInTheDocument();
    expect(screen.getByText('Gia Đình Hoàng Gia')).toBeInTheDocument();

    expect(screen.getByText('Phổ biến nhất')).toBeInTheDocument();
    const registerButtons = screen.getAllByRole('link', { name: /Chọn gói này|Đăng ký ngay/i });
    expect(registerButtons).toHaveLength(4);
    expect(registerButtons[0]).toHaveAttribute('href', '/register?packageId=BASIC');
    expect(registerButtons[1]).toHaveAttribute('href', '/register?packageId=FAMILY');
    expect(registerButtons[2]).toHaveAttribute('href', '/register?packageId=ELDERLY');
    expect(registerButtons[3]).toHaveAttribute('href', '/register?packageId=ROYAL');
  });

  it('UT-CMP-07: Process Section (Chương II) render đủ 3 trụ cột chăm sóc độc bản chuẩn La Mã', () => {
    render(<LandingProcess />);
    expect(screen.getByText('Chương II · The Three Pillars')).toBeInTheDocument();
    expect(screen.getByText('Ba Trụ Cột Chăm Sóc Độc Bản')).toBeInTheDocument();
    expect(screen.getByText(/Hiện Diện Y Tế Tận Gia Kín Đáo/i)).toBeInTheDocument();
    expect(screen.getByText(/Hội Đồng Chuyên Gia Đầu Ngành/i)).toBeInTheDocument();
    expect(screen.getByText(/Biên Niên Sử Y Bạ Gia Tộc/i)).toBeInTheDocument();
  });

  it('UT-CMP-08: Doctors Bento Grid hiển thị đầy đủ bác sĩ và testimonial', () => {
    render(<LandingDoctors />);
    expect(screen.getByText('ĐỘI NGŨ CHUYÊN GIA HÀNG ĐẦU')).toBeInTheDocument();
    expect(screen.getByText(/PGS.TS Nguyễn Trọng Nghĩa/i)).toBeInTheDocument();
    expect(screen.getByText(/BSCKII Trần Mai Phương/i)).toBeInTheDocument();
    expect(screen.getByText(/Anh Lê Hoàng Nam/i)).toBeInTheDocument();
    expect(screen.getByText(/Xem toàn bộ 1.200\+ bác sĩ/i)).toBeInTheDocument();
  });

  it('UT-CMP-09: Bấm nút "Đặt lịch khám" trên thẻ bác sĩ', async () => {
    const user = userEvent.setup();
    render(<LandingDoctors />);
    const buttons = screen.getAllByRole('button', { name: /Đặt lịch khám/i });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    await user.click(buttons[0]!);
  });

  it('UT-CMP-10: CTA Banner render tiêu đề kêu gọi và nút Hotline', () => {
    render(<LandingCtaBanner />);
    expect(screen.getByText('Trao Gửi Sức Khỏe Gia Đình Cho Bác Sĩ Tận Tâm Hôm Nay')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng ký tư vấn miễn phí/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hotline: 1900 8821/i })).toBeInTheDocument();
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
});
