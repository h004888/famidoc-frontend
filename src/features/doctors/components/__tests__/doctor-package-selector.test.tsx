import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DoctorPackageSelector,
  calculatePackagePrice,
  clampSelectorMemberCount,
} from '../doctor-package-selector';
import type { PublicDoctorCarePackageDto } from '@/lib/api';

const samplePackages: PublicDoctorCarePackageDto[] = [
  {
    id: 'pkg-1m',
    packageCode: 'TRAI_NGHIEM_V2',
    packageName: 'Trải nghiệm',
    durationMonths: 1,
    basePrice: 1000000,
    formattedPrice: '1.000.000đ',
    monthlyPrice: '1.000.000đ/tháng',
    periodicVisitsQuota: 1,
    telehealthQuota: 1,
    includedMembers: 1,
    maxMembers: 2,
    additionalMemberMonthlyPrice: 75000,
  },
  {
    id: 'pkg-3m',
    packageCode: 'DONG_HANH_V2',
    packageName: 'Đồng hành',
    durationMonths: 3,
    basePrice: 2850000,
    formattedPrice: '2.850.000đ',
    monthlyPrice: '950.000đ/tháng',
    periodicVisitsQuota: 3,
    telehealthQuota: 4,
    includedMembers: 3,
    maxMembers: 6,
    additionalMemberMonthlyPrice: 75000,
  },
];

describe('DoctorPackageSelector', () => {
  it('calculates base and extra member fees correctly', () => {
    expect(calculatePackagePrice(samplePackages[1], 3)).toEqual({
      extraMembers: 0,
      additionalCost: 0,
      totalPrice: 2850000,
    });
    expect(calculatePackagePrice(samplePackages[1], 5)).toEqual({
      extraMembers: 2,
      additionalCost: 450000,
      totalPrice: 3300000,
    });
  });

  it('clamps selector member count strictly within includedMembers and maxMembers', () => {
    expect(clampSelectorMemberCount(0, 3, 6)).toBe(3);
    expect(clampSelectorMemberCount(2, 3, 6)).toBe(3);
    expect(clampSelectorMemberCount(4, 3, 6)).toBe(4);
    expect(clampSelectorMemberCount(9, 3, 6)).toBe(6);
  });

  it('resets to includedMembers when switching packages, locks bounds, and builds booking link', () => {
    render(
      <DoctorPackageSelector
        doctorId="doc-1"
        doctorName="ThS. BS Trương Hán Siêu"
        isAvailable={true}
        facilityId="fac-1"
        carePackages={samplePackages}
      />
    );

    expect(screen.getByText('Mặc định 1 · Tối đa 2 người')).toBeInTheDocument();
    expect(screen.getByText('Mặc định 3 · Tối đa 6 người')).toBeInTheDocument();

    expect(screen.getByTestId('selected-members-count')).toHaveTextContent('1 người');
    expect(screen.getByTestId('estimated-package-total')).toHaveTextContent('1.000.000đ');

    const decreaseBtn = screen.getByRole('button', { name: 'Giảm số thành viên' });
    const increaseBtn = screen.getByRole('button', { name: 'Tăng số thành viên' });
    expect(decreaseBtn).toBeDisabled();

    fireEvent.click(increaseBtn);
    expect(screen.getByTestId('selected-members-count')).toHaveTextContent('2 người');
    expect(screen.getByTestId('estimated-package-total')).toHaveTextContent('1.075.000đ');
    expect(increaseBtn).toBeDisabled();

    // Chuyển sang gói Đồng hành -> tự đặt về mặc định 3 người và khóa nút giảm tại 3
    fireEvent.click(screen.getByRole('button', { name: /Đồng hành/i }));
    expect(screen.getByTestId('selected-members-count')).toHaveTextContent('3 người');
    expect(screen.getByTestId('estimated-package-total')).toHaveTextContent('2.850.000đ');
    expect(decreaseBtn).toBeDisabled();

    // Tăng từ 3 lên 6 (trần tối đa) và khóa nút tăng ở 6
    fireEvent.click(increaseBtn);
    expect(screen.getByTestId('selected-members-count')).toHaveTextContent('4 người');
    expect(screen.getByTestId('estimated-package-total')).toHaveTextContent('3.075.000đ');

    fireEvent.click(increaseBtn);
    fireEvent.click(increaseBtn);
    expect(screen.getByTestId('selected-members-count')).toHaveTextContent('6 người');
    expect(increaseBtn).toBeDisabled();

    // Chuyển ngược về gói Trải nghiệm -> reset về 1 người (includedMembers)
    fireEvent.click(screen.getByRole('button', { name: /Trải nghiệm/i }));
    expect(screen.getByTestId('selected-members-count')).toHaveTextContent('1 người');
    expect(decreaseBtn).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Đồng hành/i }));
    fireEvent.click(increaseBtn);
    const ctaLink = screen.getByRole('link', { name: /Đăng ký dịch vụ với bác sĩ/i });
    expect(ctaLink).toHaveAttribute(
      'href',
      '/booking?packageId=pkg-3m&doctorId=doc-1&facilityId=fac-1&members=4'
    );
  });

  it('disables registration when doctor is unavailable or missing facility', () => {
    const { rerender } = render(
      <DoctorPackageSelector
        doctorId="doc-1"
        doctorName="BS Test"
        isAvailable={false}
        facilityId="fac-1"
        carePackages={samplePackages}
      />
    );

    expect(
      screen.getByRole('button', { name: /Đăng ký dịch vụ với bác sĩ/i })
    ).toBeDisabled();
    expect(
      screen.getByText('Bác sĩ hiện đã đủ hộ gia đình phụ trách.')
    ).toBeInTheDocument();

    rerender(
      <DoctorPackageSelector
        doctorId="doc-1"
        doctorName="BS Test"
        isAvailable={true}
        facilityId={null}
        carePackages={samplePackages}
      />
    );
    expect(
      screen.getByRole('button', { name: /Đăng ký dịch vụ với bác sĩ/i })
    ).toBeDisabled();
    expect(
      screen.getByText('Bác sĩ chưa gắn cơ sở y tế phụ trách để đăng ký gói.')
    ).toBeInTheDocument();
  });
});
