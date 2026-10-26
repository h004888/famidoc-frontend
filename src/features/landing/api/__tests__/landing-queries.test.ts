import { describe, it, expect } from 'vitest';
import { landingKeys, fetchCorePackages, fetchFeaturedDoctors } from '../landing-queries';

describe('UT-QRY: Landing Queries & Keys', () => {
  it('UT-QRY-01: Kiểm tra tính nhất quán của Landing Query Keys', () => {
    expect(landingKeys.all).toEqual(['landing']);
    expect(landingKeys.doctors()).toEqual(['landing', 'doctors']);
    expect(landingKeys.packages()).toEqual(['landing', 'packages']);
  });

  it('UT-QRY-02: fetchFeaturedDoctors lấy dữ liệu thành công qua MSW', async () => {
    const doctors = await fetchFeaturedDoctors();
    expect(Array.isArray(doctors)).toBe(true);
    expect(doctors.length).toBe(2);
    expect(doctors[0]?.name).toBe('PGS.TS Nguyễn Trọng Nghĩa');
    expect(doctors[1]?.name).toBe('BSCKII Trần Mai Phương');
  });

  it('UT-QRY-03: fetchCorePackages lấy danh sách 4 gói dịch vụ thành công', async () => {
    const packages = await fetchCorePackages();
    expect(packages.length).toBe(4);
    expect(packages[1]?.name).toBe('Gia Đình Toàn Diện');
    expect(packages[1]?.isPopular).toBe(true);
  });
});
