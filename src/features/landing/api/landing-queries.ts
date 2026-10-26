import { serverClient } from '@/lib/http/server-client';
import { DoctorCardData, CorePackageData } from '../types';
import { mockCorePackages, mockFeaturedDoctors } from '@/test/mocks/handlers/landing.handler';

export const landingKeys = {
  all: ['landing'] as const,
  doctors: () => [...landingKeys.all, 'doctors'] as const,
  packages: () => [...landingKeys.all, 'packages'] as const,
};

export async function fetchFeaturedDoctors(): Promise<DoctorCardData[]> {
  try {
    const res = await serverClient.get<DoctorCardData[]>('/api/v1/doctors/featured');
    return res.data;
  } catch {
    return mockFeaturedDoctors;
  }
}

export async function fetchCorePackages(): Promise<CorePackageData[]> {
  try {
    const res = await serverClient.get<CorePackageData[]>('/api/v1/packages/core');
    return res.data;
  } catch {
    return mockCorePackages;
  }
}
