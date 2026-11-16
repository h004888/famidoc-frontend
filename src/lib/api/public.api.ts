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

export interface PublicDoctorStatsDto {
  experienceYears: number;
  ratingAvg: number | null;
  totalReviews: number;
  completedEncounters: number;
}

export interface PublicDoctorPanelDto {
  activeCount: number;
  maxCapacity: number;
}

export interface PublicDoctorFacilitySummaryDto {
  id: string;
  facilityName: string;
  address: string;
  verificationStatus: string;
}

export interface PublicDoctorCredentialDto {
  id: string;
  type: string;
  typeLabel: string;
  issuingAuthority: string;
  issueYear: number;
  verified: boolean;
}

export interface PublicDoctorTreatedCaseDto {
  id: string;
  summary: string;
}

export interface CareModelItemDto {
  id: string;
  category: 'SERVICE_MODE' | 'COMMITMENT';
  title: string;
  description: string;
  icon?: string | null;
  sortOrder: number;
}

export interface DoctorCareModelDto {
  serviceModes: CareModelItemDto[];
  commitments: CareModelItemDto[];
}

export interface PublicDoctorCarePackageDto {
  id: string;
  packageCode: string;
  packageName: string;
  durationMonths: number;
  basePrice: number;
  formattedPrice?: string;
  monthlyPrice?: string;
  periodicVisitsQuota: number;
  telehealthQuota: number;
  highlight?: string;
  features?: string[];
  includedMembers: number;
  maxMembers: number;
  additionalMemberMonthlyPrice: number;
}

export interface PublicDoctorReviewDto {
  id: string;
  patientDisplayName: string;
  ratingStars: number;
  comment?: string | null;
  packageName?: string | null;
  district?: string | null;
  reviewedAt: string | Date;
  [key: string]: unknown;
}

export interface PublicDoctorReviewsSummaryDto {
  ratingAvg: number | null;
  totalReviews: number;
  items: PublicDoctorReviewDto[];
}

export interface PublicDoctorDetailDto {
  id: string;
  doctorName: string;
  academicTitle?: string | null;
  specialty: string;
  specialtyKey: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  panel: PublicDoctorPanelDto;
  stats: PublicDoctorStatsDto;
  facility: PublicDoctorFacilitySummaryDto | null;
  credentials: PublicDoctorCredentialDto[];
  treatedCases: PublicDoctorTreatedCaseDto[];
  careModel: DoctorCareModelDto;
  carePackages: PublicDoctorCarePackageDto[];
  reviews: PublicDoctorReviewsSummaryDto;
}

export interface PublicDoctorsResponse {
  items: PublicDoctorDto[];
  pagination?: PaginationMeta;
}

export interface PublicDoctorReviewsQuery {
  page?: number;
  limit?: number;
  rating?: number;
}

export interface PublicDoctorReviewsResponse {
  items: PublicDoctorReviewDto[];
  pagination?: PaginationMeta;
}

export interface SubmitConsultationPayload {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  preferredPackageId?: string;
  healthNeeds: string;
  familyMemberCount?: number;
}

export interface ConsultationResponseDto {
  ticketId?: string;
  status?: string;
  message?: string;
  submittedAt?: string | Date;
  data?: {
    ticketId: string;
    status: string;
    message: string;
    submittedAt?: string | Date;
  };
}

export interface PublicFacilityFeaturedDoctorDto {
  id: string;
  doctorName?: string;
  fullName?: string;
  academicTitle?: string | null;
  title?: string;
  specialty: string;
  avatarUrl?: string | null;
  avatar?: string;
  rating?: number;
  experienceYears?: number;
  cchnNumber?: string;
}

export interface PublicFacilityDto {
  id: string;
  name?: string;
  facilityName?: string;
  facility_name?: string;
  type?: string;
  tier?: string;
  status?: string;
  address?: string;
  city?: string;
  phone?: string;
  hotline?: string;
  email?: string;
  websiteUrl?: string;
  website?: string;
  workingHours?: string;
  working_hours?: string;
  bedCount?: string;
  bed_count?: string;
  imageUrl?: string;
  image_url?: string;
  logoUrl?: string;
  logo_url?: string;
  specialties?: string[];
  privileges?: string[];
  featuredDoctors?: PublicFacilityFeaturedDoctorDto[];
  rating?: number;
  licenseNumber?: string;
  license_number?: string;
  operatingLicense?: string;
  taxCode?: string;
  tax_code?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface RawPublicEnvelopeResponse<T> {
  success?: boolean;
  code?: number;
  message?: string;
  data?: T;
  meta?: { pagination?: PaginationMeta };
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

  getFacilities: async (): Promise<PublicFacilityDto[]> => {
    const res = await httpClient.get<
      RawPublicEnvelopeResponse<PublicFacilityDto[]> | PublicFacilityDto[] | { items?: PublicFacilityDto[]; data?: { items?: PublicFacilityDto[] } }
    >('/api/v1/public/facilities');

    if (Array.isArray(res)) {
      return res;
    }

    if (res && typeof res === 'object') {
      if ('data' in res && Array.isArray((res as { data?: unknown }).data)) {
        return (res as { data: PublicFacilityDto[] }).data;
      }
      if (
        'data' in res &&
        (res as { data?: unknown }).data &&
        typeof (res as { data?: unknown }).data === 'object' &&
        'items' in ((res as { data: { items?: unknown } }).data) &&
        Array.isArray((res as { data: { items: PublicFacilityDto[] } }).data.items)
      ) {
        return (res as { data: { items: PublicFacilityDto[] } }).data.items;
      }
      if ('items' in res && Array.isArray((res as { items?: unknown }).items)) {
        return (res as { items: PublicFacilityDto[] }).items;
      }
    }

    return [];
  },

  getFacilityDetail: async (id: string): Promise<PublicFacilityDto | null> => {
    try {
      const res = await httpClient.get<RawPublicEnvelopeResponse<PublicFacilityDto> | PublicFacilityDto>(
        `/api/v1/public/facilities/${id}`
      );

      if (res && typeof res === 'object' && 'data' in res && (res as { data?: PublicFacilityDto }).data) {
        return (res as { data: PublicFacilityDto }).data;
      }

      return (res as PublicFacilityDto) || null;
    } catch {
      return null;
    }
  },

  getDoctorDetail: async (id: string): Promise<PublicDoctorDetailDto> => {
    const res = await httpClient.get<RawPublicEnvelopeResponse<PublicDoctorDetailDto> | PublicDoctorDetailDto>(
      `/api/v1/public/doctors/${id}`
    );

    if (res && typeof res === 'object' && 'data' in res && res.data) {
      return res.data;
    }

    return res as PublicDoctorDetailDto;
  },

  getDoctorReviews: async (
    id: string,
    params?: PublicDoctorReviewsQuery
  ): Promise<PublicDoctorReviewsResponse> => {
    const res = await httpClient.get<
      RawPublicEnvelopeResponse<PublicDoctorReviewDto[]> | PublicDoctorReviewsResponse | PublicDoctorReviewDto[]
    >(
      `/api/v1/public/doctors/${id}/reviews`,
      params as Record<string, string | number | boolean | undefined>
    );

    if (Array.isArray(res)) {
      return { items: res };
    }

    if (res && typeof res === 'object') {
      if ('data' in res && Array.isArray(res.data)) {
        return {
          items: res.data,
          pagination: res.meta?.pagination,
        };
      }

      if ('items' in res && Array.isArray(res.items)) {
        return {
          items: res.items,
          pagination: res.pagination,
        };
      }
    }

    return { items: [] };
  },
};
