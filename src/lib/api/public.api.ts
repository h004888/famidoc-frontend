import { httpClient } from './http-client';

export interface PublicDoctorsQuery {
  search?: string;
  facilityId?: string;
  specialty?: string;
  city?: string;
  minExperienceYears?: number;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PublicDoctorFacilityDto {
  id: string;
  facilityName: string;
  address?: string;
  hotline?: string;
}

export interface PublicDoctorDto {
  id: string;
  doctorName: string;
  fullName?: string;
  specialty: string;
  academicTitle?: string | null;
  title?: string;
  experienceYears?: number;
  bio?: string | null;
  ratingAvg?: number;
  rating?: number;
  totalReviews?: number;
  reviewCount?: number;
  isAvailable?: boolean;
  avatarUrl?: string | null;
  avatar?: string;
  facilityName?: string;
  phone?: string;
  facility?: PublicDoctorFacilityDto | null;
}

export interface PublicDoctorsResponse {
  items: PublicDoctorDto[];
  pagination?: PaginationMeta;
}

export interface PublicFacilityDto {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  type?: string;
  rating?: number;
}

interface RawPublicDoctorsApiResponse {
  data?: PublicDoctorDto[];
  meta?: { pagination?: PaginationMeta };
  items?: PublicDoctorDto[];
}

export const publicApi = {
  getDoctors: async (params?: PublicDoctorsQuery): Promise<PublicDoctorsResponse> => {
    const res = await httpClient.get<RawPublicDoctorsApiResponse | PublicDoctorDto[]>(
      '/api/v1/public/doctors',
      params as Record<string, string | number | boolean | undefined>
    );

    if (res && !Array.isArray(res) && res.data && Array.isArray(res.data)) {
      return {
        items: res.data,
        pagination: res.meta?.pagination,
      };
    }

    if (Array.isArray(res)) {
      return { items: res };
    }

    return { items: [] };
  },

  getFacilities: (): Promise<PublicFacilityDto[]> => {
    return httpClient.get<PublicFacilityDto[]>('/api/v1/public/facilities');
  },
};
