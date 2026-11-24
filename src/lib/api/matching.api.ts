import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';
import type { DoctorClinicalTier } from './public.api';

export interface MatchDoctorsIntakePayload {
  packageId: string;
  memberCount: number;
  requestedTier?: DoctorClinicalTier;
  requestedAcademicTitle?: string;
  ageGroups?: string[];
  careCategories?: string[];
  districtArea?: string;
  careDescription?: string;
}

export interface MatchingOptionsDto {
  areas: Array<{ city: string; districts: string[] }>;
  ageGroups: Array<{ id: string; label: string }>;
  careCategories: Array<{
    id: string;
    label: string;
    specialtyKeywords: string[];
  }>;
  academicTitles: Array<{ value: string; label: string; desc: string }>;
}

export interface MatchedDoctorSummaryDto {
  id: string;
  doctorName: string;
  specialty: string;
  academicTitle: string | null;
  experienceYears: number;
  clinicalTier: DoctorClinicalTier;
  ratingAvg: number;
  totalReviews: number;
  remainingSlots: number;
  maxPanelCapacity: number;
  avatarUrl: string | null;
}

export interface MatchedFacilitySummaryDto {
  id: string;
  facilityName: string;
  address: string;
  hotline: string;
}

export interface MatchingComparisonRowDto {
  criterion: string;
  familyNeed: string;
  doctorMatch: string;
  isMatched: boolean;
}

export interface MatchedDoctorAlternativeDto {
  rank: number;
  scores: {
    jevFitScore: number;
    vacancyScore: number;
    compositeScore: number;
  };
  rationale: string;
  shortReason?: string;
  doctor: MatchedDoctorSummaryDto;
  facility: MatchedFacilitySummaryDto;
}

export interface MatchedDoctorPreviewDto {
  outcome: 'MATCHED';
  matchingSessionId: string;
  expiresAt: string;
  jevModelVersion: string;
  rankingSource?: 'AI' | 'FALLBACK';
  relaxedAcademicTitle?: boolean;
  requestedAcademicTitle?: string | null;
  scores: {
    jevFitScore: number;
    vacancyScore: number;
    compositeScore: number;
  };
  rationale: string;
  comparisonRows?: MatchingComparisonRowDto[];
  package: {
    id: string;
    packageCode: string;
    packageName: string;
    durationMonths: number;
    basePrice: number;
    includedMembers: number;
    maxMembers: number;
    additionalMemberMonthlyPrice: number;
    periodicVisitsQuota: number;
    telehealthQuota: number;
  };
  memberCount: number;
  doctor: MatchedDoctorSummaryDto;
  facility: MatchedFacilitySummaryDto;
  alternatives?: MatchedDoctorAlternativeDto[];
}

export interface PlatformFullMatchingResultDto {
  outcome: 'PLATFORM_FULL';
  packageId: string;
  memberCount: number;
  hotline: string;
  message: string;
}

export interface QueuedMatchingResultDto {
  outcome: 'QUEUED';
  queueRequestId: string;
  status: 'QUEUED' | 'ASSIGNED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  fallbackReason: string;
  slaExpiresAt: string;
  packageId: string;
  memberCount: number;
  message: string;
}

export interface MatchingSessionDetailDto {
  id: string;
  status: 'MATCHED' | 'QUEUED' | 'CONFIRMED' | 'EXPIRED';
  memberCount: number;
  rationale: string | null;
  jevModelVersion: string | null;
  jevFitScore: number | null;
  vacancyScore: number | null;
  compositeScore: number | null;
  expiresAt: string;
  contractId: string | null;
  package: MatchedDoctorPreviewDto['package'];
  doctor: (MatchedDoctorPreviewDto['doctor'] & { isQuotaFull?: boolean }) | null;
  facility: MatchedDoctorPreviewDto['facility'] | null;
}

export interface MatchingQueueItemDto {
  id: string;
  packageId: string;
  memberCount: number;
  requestedTier: DoctorClinicalTier | null;
  ageGroups: string[];
  careCategories: string[];
  districtArea: string | null;
  sanitizedDescription: string | null;
  fallbackReason: string;
  status: 'QUEUED' | 'ASSIGNED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  slaExpiresAt: string;
  assignedDoctorId: string | null;
  assignedFacilityId: string | null;
  assignedAt: string | null;
  adminNote: string | null;
  contractId: string | null;
  createdAt: string;
  servicePackage?: {
    id: string;
    packageCode: string;
    packageName: string;
    durationMonths: number;
    basePrice?: number | string;
    includedMembers?: number;
    maxMembers?: number;
    additionalMemberMonthlyPrice?: number | string;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
  assignedDoctor?: {
    id: string;
    doctorName: string;
    specialty: string;
    academicTitle?: string | null;
    experienceYears?: number;
    clinicalTier?: DoctorClinicalTier;
  } | null;
  assignedFacility?: {
    id: string;
    facilityName: string;
    address: string;
    hotline?: string;
  } | null;
  package?: MatchedDoctorPreviewDto['package'];
  doctor?: (MatchedDoctorPreviewDto['doctor'] & { isQuotaFull?: boolean }) | null;
  facility?: MatchedDoctorPreviewDto['facility'] | null;
}

export interface AdminMatchingConfigDto {
  enabled: boolean;
  endpointUrl: string;
  modelName: string;
  questionType: 'score' | 'noul';
  hasApiKey: boolean;
  apiKeyMasked: string | null;
  apiKeySource: 'db' | 'env' | 'none';
  isLocalEndpoint: boolean;
  timeoutMs: number;
  maxCandidates: number;
  minFitThreshold: number;
  fitWeight: number;
  vacancyWeight: number;
  updatedAt: string | null;
}

export interface UpdateAdminMatchingConfigPayload {
  enabled?: boolean;
  endpointUrl?: string;
  modelName?: string;
  questionType?: 'score' | 'noul';
  apiKey?: string;
  clearApiKey?: boolean;
  timeoutMs?: number;
  maxCandidates?: number;
  minFitThreshold?: number;
  fitWeight?: number;
  vacancyWeight?: number;
}

export interface TestAdminMatchingConfigPayload {
  endpointUrl?: string;
  modelName?: string;
  questionType?: 'score' | 'noul';
  apiKey?: string;
  clearApiKey?: boolean;
  timeoutMs?: number;
}

export interface SystemOneConnectionTestDto {
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number;
  endpointUrl: string;
  modelName: string;
  resolvedModel: string | null;
  questionType: 'score' | 'noul';
  sampleScores: Array<{
    doctorId: string;
    label: string;
    fitScore: number;
    confidence?: number;
  }>;
  errorMessage?: string;
}

export interface DiscoveredSystemOneModelDto {
  name: string;
  parameterSize?: string;
  quantizationLevel?: string;
  capabilities?: string[];
  sizeBytes?: number;
}

export const matchingApi = {
  getMatchingOptions: async (): Promise<MatchingOptionsDto> => {
    const res = await httpClient.get<unknown>('/api/v1/matching/options');
    return unwrapApiEnvelope<MatchingOptionsDto>(res);
  },

  matchDoctors: async (
    payload: MatchDoctorsIntakePayload
  ): Promise<MatchedDoctorPreviewDto | PlatformFullMatchingResultDto | QueuedMatchingResultDto> => {
    const res = await httpClient.post<unknown>('/api/v1/matching/doctors', payload);
    return unwrapApiEnvelope<
      MatchedDoctorPreviewDto | PlatformFullMatchingResultDto | QueuedMatchingResultDto
    >(res);
  },

  getMatchingSession: async (id: string): Promise<MatchingSessionDetailDto> => {
    const res = await httpClient.get<unknown>(
      `/api/v1/matching/sessions/${encodeURIComponent(id)}`
    );
    return unwrapApiEnvelope<MatchingSessionDetailDto>(res);
  },

  getMyQueueRequests: async (): Promise<{
    items: MatchingQueueItemDto[];
    total: number;
  }> => {
    const res = await httpClient.get<unknown>('/api/v1/matching-queue/my');
    const unwrapped = unwrapApiEnvelope<{
      items?: MatchingQueueItemDto[];
      total?: number;
    }>(res);
    return {
      items: unwrapped?.items ?? [],
      total: unwrapped?.total ?? 0,
    };
  },

  getQueueRequestDetail: async (id: string): Promise<MatchingQueueItemDto> => {
    const res = await httpClient.get<unknown>(
      `/api/v1/matching-queue/${encodeURIComponent(id)}`
    );
    return unwrapApiEnvelope<MatchingQueueItemDto>(res);
  },

  cancelQueueRequest: async (
    id: string,
    reason?: string
  ): Promise<MatchingQueueItemDto> => {
    const res = await httpClient.patch<unknown>(
      `/api/v1/matching-queue/${encodeURIComponent(id)}/cancel`,
      reason ? { reason } : {}
    );
    return unwrapApiEnvelope<MatchingQueueItemDto>(res);
  },

  getAdminQueueRequests: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: MatchingQueueItemDto[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const res = await httpClient.get<unknown>('/api/v1/admin/matching-queue', params);
    const unwrapped = unwrapApiEnvelope<{
      items?: MatchingQueueItemDto[];
      total?: number;
      page?: number;
      limit?: number;
    }>(res);
    return {
      items: unwrapped?.items ?? [],
      total: unwrapped?.total ?? 0,
      page: unwrapped?.page ?? 1,
      limit: unwrapped?.limit ?? 20,
    };
  },

  assignAdminQueueDoctor: async (
    queueId: string,
    payload: { doctorId: string; adminNote?: string }
  ): Promise<MatchingQueueItemDto> => {
    const res = await httpClient.patch<unknown>(
      `/api/v1/admin/matching-queue/${encodeURIComponent(queueId)}/assign`,
      payload
    );
    return unwrapApiEnvelope<MatchingQueueItemDto>(res);
  },

  getAdminMatchingConfig: async (): Promise<AdminMatchingConfigDto> => {
    const res = await httpClient.get<unknown>('/api/v1/admin/matching-config');
    return unwrapApiEnvelope<AdminMatchingConfigDto>(res);
  },

  updateAdminMatchingConfig: async (
    payload: UpdateAdminMatchingConfigPayload
  ): Promise<AdminMatchingConfigDto> => {
    const res = await httpClient.patch<unknown>(
      '/api/v1/admin/matching-config',
      payload
    );
    return unwrapApiEnvelope<AdminMatchingConfigDto>(res);
  },

  testAdminMatchingConfig: async (
    payload: TestAdminMatchingConfigPayload
  ): Promise<SystemOneConnectionTestDto> => {
    const res = await httpClient.post<unknown>(
      '/api/v1/admin/matching-config/test',
      payload
    );
    return unwrapApiEnvelope<SystemOneConnectionTestDto>(res);
  },

  discoverSystemOneModels: async (
    endpointUrl?: string
  ): Promise<{
    reachable: boolean;
    origin: string;
    models: DiscoveredSystemOneModelDto[];
    message?: string;
  }> => {
    const res = await httpClient.get<unknown>(
      '/api/v1/admin/matching-config/models',
      endpointUrl ? { endpointUrl } : undefined
    );
    return unwrapApiEnvelope<{
      reachable: boolean;
      origin: string;
      models: DiscoveredSystemOneModelDto[];
      message?: string;
    }>(res);
  },
};
