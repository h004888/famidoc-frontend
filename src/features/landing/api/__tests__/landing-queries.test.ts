import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import {
  landingKeys,
  fetchLandingPortalOverview,
  fetchLandingDoctors,
  fetchLandingPackages,
  fetchHomePageData,
} from '../landing-queries';

const API_BASE =
  process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

describe('UT-QRY: Landing Queries & Keys', () => {
  it('UT-QRY-01: Kiểm tra tính nhất quán của Landing Query Keys', () => {
    expect(landingKeys.all).toEqual(['landing']);
    expect(landingKeys.overview()).toEqual(['landing', 'overview']);
    expect(landingKeys.doctors()).toEqual(['landing', 'doctors']);
    expect(landingKeys.packages()).toEqual(['landing', 'packages']);
  });

  it('UT-QRY-02: fetchLandingPortalOverview lấy metrics thật từ Backend', async () => {
    const metrics = await fetchLandingPortalOverview();
    expect(metrics).toEqual({
      totalPartnerFacilities: 12,
      totalDoctors: 48,
      totalActivePackages: 4,
      totalFamiliesServed: 320,
    });
  });

  it('UT-QRY-03: fetchLandingDoctors lấy danh sách bác sĩ và tổng số từ /api/v1/public/doctors', async () => {
    const result = await fetchLandingDoctors();
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(48);
    expect(result.items[0]?.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(result.items[0]?.doctorName).toBe('PGS.TS Nguyễn Trọng Nghĩa');
  });

  it('UT-QRY-04: fetchLandingPackages lấy danh sách 4 gói dịch vụ từ /api/v1/public/packages', async () => {
    const packages = await fetchLandingPackages();
    expect(packages).toHaveLength(4);
    expect(packages[1]?.packageName).toBe('Gói Đồng Hành');
    expect(packages[1]?.id).toBe('20000000-0000-4000-8000-000000000002');
  });

  it('UT-QRY-05: fetchHomePageData fallback an toàn khi Backend trả lỗi 500', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/public/portal-overview`, () =>
        HttpResponse.json({ message: 'Error' }, { status: 500 })
      ),
      http.get(`${API_BASE}/api/v1/public/doctors`, () =>
        HttpResponse.json({ message: 'Error' }, { status: 500 })
      ),
      http.get(`${API_BASE}/api/v1/public/packages`, () =>
        HttpResponse.json({ message: 'Error' }, { status: 500 })
      )
    );

    const data = await fetchHomePageData();
    expect(data.metrics).toBeNull();
    expect(data.doctors).toEqual([]);
    expect(data.totalDoctors).toBe(0);
    expect(data.packages).toEqual([]);
  });
});
