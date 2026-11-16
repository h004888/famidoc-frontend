import { serverClient } from '@/lib/http/server-client';
import type {
  HomePageData,
  LandingDoctorItem,
  LandingPackageItem,
  LandingPortalMetrics,
} from '../types';

export const landingKeys = {
  all: ['landing'] as const,
  overview: () => [...landingKeys.all, 'overview'] as const,
  doctors: () => [...landingKeys.all, 'doctors'] as const,
  packages: () => [...landingKeys.all, 'packages'] as const,
};

interface Envelope<T> {
  data?: T;
  meta?: {
    total?: number;
    pagination?: {
      totalRecords?: number;
    };
  };
}

function unwrapData<T>(payload: T | Envelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data;
  }
  return payload as T;
}

export async function fetchLandingPortalOverview(): Promise<LandingPortalMetrics | null> {
  try {
    const res = await serverClient.get<
      { metrics?: LandingPortalMetrics } | Envelope<{ metrics?: LandingPortalMetrics }>
    >('/api/v1/public/portal-overview', { cache: 'no-store' });
    const data = unwrapData(res.data);
    return data?.metrics ?? null;
  } catch {
    return null;
  }
}

export async function fetchLandingDoctors(): Promise<{
  items: LandingDoctorItem[];
  total: number;
}> {
  try {
    const res = await serverClient.get<
      | { items?: LandingDoctorItem[]; meta?: { total?: number; pagination?: { totalRecords?: number } } }
      | Envelope<LandingDoctorItem[]>
    >('/api/v1/public/doctors?limit=3&page=1', { cache: 'no-store' });

    const raw = res.data;
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray(raw.data)) {
      const total = raw.meta?.pagination?.totalRecords ?? raw.meta?.total ?? raw.data.length;
      return { items: raw.data, total };
    }

    if (raw && typeof raw === 'object' && 'items' in raw && Array.isArray(raw.items)) {
      const total = raw.meta?.pagination?.totalRecords ?? raw.meta?.total ?? raw.items.length;
      return { items: raw.items, total };
    }

    if (Array.isArray(raw)) {
      return { items: raw, total: raw.length };
    }

    return { items: [], total: 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function fetchLandingPackages(): Promise<LandingPackageItem[]> {
  try {
    const res = await serverClient.get<
      { items?: LandingPackageItem[] } | Envelope<{ items?: LandingPackageItem[] } | LandingPackageItem[]>
    >('/api/v1/public/packages?limit=4&page=1', { cache: 'no-store' });

    const unwrapped = unwrapData(res.data);
    if (Array.isArray(unwrapped)) {
      return unwrapped;
    }
    if (unwrapped && typeof unwrapped === 'object' && 'items' in unwrapped && Array.isArray(unwrapped.items)) {
      return unwrapped.items;
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchHomePageData(): Promise<HomePageData> {
  const [overviewRes, doctorsRes, packagesRes] = await Promise.allSettled([
    fetchLandingPortalOverview(),
    fetchLandingDoctors(),
    fetchLandingPackages(),
  ]);

  const metrics = overviewRes.status === 'fulfilled' ? overviewRes.value : null;
  const doctorsData =
    doctorsRes.status === 'fulfilled' ? doctorsRes.value : { items: [], total: 0 };
  const packages = packagesRes.status === 'fulfilled' ? packagesRes.value : [];

  return {
    metrics,
    doctors: doctorsData.items,
    totalDoctors: metrics?.totalDoctors ?? doctorsData.total,
    packages,
  };
}
