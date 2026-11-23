import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export type EncounterType = 'HOME_VISIT' | 'TELEHEALTH' | 'TELEMEDICINE';
export type EncounterCategory = 'PERIODIC_ROUTINE' | 'AD_HOC_ON_DEMAND';
export type EncounterStatus =
  | 'REQUESTED'
  | 'PROPOSED'
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULE_REQUESTED';

export type RescheduleDecision = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RescheduleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface EncounterRescheduleRequestItem {
  id: string;
  encounterId: string;
  requestedByRole: 'FAMILY_REP' | 'DOCTOR' | string;
  requestedByUserId: string;
  proposedDate: string;
  proposedTime: string;
  reason: string;
  familyDecision: RescheduleDecision;
  doctorDecision: RescheduleDecision;
  facilityDecision: RescheduleDecision;
  status: RescheduleRequestStatus;
  createdAt?: string;
  resolvedAt?: string | null;
}

export interface EncounterPatient {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  allergies?: (string | { allergen: string })[];
  chronicDiseases?: string | string[] | null;
}

export interface EncounterContract {
  id: string;
  contractNumber?: string;
  familyRepresentativeName?: string;
  familyRepresentativePhone?: string;
  familyUnit?: {
    id: string;
    familyName?: string;
    address?: string;
    homeAddress?: string;
    emergencyPhone?: string;
    representativeUser?: {
      fullName?: string;
      name?: string;
      phone?: string;
      email?: string;
    };
  };
  members?: Array<{
    id?: string;
    patientId?: string;
    relationship?: string;
    patient?: EncounterPatient;
  }>;
  servicePackage?: {
    id: string;
    packageName: string;
  };
}

export type EncounterVisitScope = 'FAMILY' | 'INDIVIDUAL';

export interface EncounterParticipant {
  id: string;
  patientId: string;
  patient?: EncounterPatient;
}

export interface EncounterItem {
  id: string;
  contractId: string;
  patientId?: string;
  doctorId: string;
  visitScope?: EncounterVisitScope;
  scheduledDate: string;
  scheduledTime: string;
  proposedDate?: string | null;
  proposedTime?: string | null;
  proposedBy?: string | null;
  rescheduleReason?: string | null;
  rescheduleCount?: number;
  conflictAlert?: boolean;
  conflictDetails?: string | null;
  encounterType: EncounterType | string;
  category: EncounterCategory | string;
  encounterStatus: EncounterStatus | string;
  onTheWayAt?: string | null;
  arrivedAt?: string | null;
  familyConfirmedArrivalAt?: string | null;
  subjectiveNote?: string | null;
  cancelReason?: string | null;
  objectiveExam?: string | null;
  assessment?: string | null;
  plan?: string | null;
  prescription?: any;
  icd10Code?: string | null;
  digitalSignature?: string | null;
  createdAt?: string;
  updatedAt?: string;
  patient?: EncounterPatient;
  participants?: EncounterParticipant[];
  rescheduleRequests?: EncounterRescheduleRequestItem[];
  clinicalEmrs?: Array<{
    id: string;
    patientId: string;
    isFinalized: boolean;
  }>;
  telehealthSession?: {
    id: string;
    encounterId: string;
    roomSid: string;
    startedAt?: string | null;
    endedAt?: string | null;
    durationSeconds: number;
    networkQualityScore?: string | null;
    isFallbackChat: boolean;
  } | null;
  contract?: EncounterContract;
  doctor?: {
    id: string;
    doctorName?: string;
    user?: {
      name?: string;
      phone?: string;
    };
    facility?: {
      id: string;
      facilityName?: string;
    };
  };
}

export interface DoctorTimetableResponse {
  data: EncounterItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ListEncountersQueryDto {
  contractId?: string;
  status?: EncounterStatus | string;
  category?: EncounterCategory | string;
  encounterType?: EncounterType | string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePeriodicEncounterDto {
  contractId: string;
  patientId?: string;
  patientIds?: string[];
  visitScope?: EncounterVisitScope;
  scheduledDate: string;
  scheduledTime: string;
  encounterType: EncounterType;
  clinicalNotes?: string;
}

export interface CreateAdHocEncounterDto {
  contractId: string;
  patientId?: string;
  patientIds?: string[];
  visitScope?: EncounterVisitScope;
  encounterType: EncounterType;
  desiredDate: string;
  desiredTime: string;
  reason: string;
}

export interface RequestRescheduleDto {
  proposedDate: string;
  proposedTime: string;
  rescheduleReason: string;
}

export interface DecideRescheduleRequestDto {
  decision: 'APPROVE' | 'REJECT';
  note?: string;
}

export interface FinalizeEncounterDto {
  scheduledDate?: string;
  scheduledTime?: string;
  encounterType?: EncounterType;
  subjectiveNote?: string;
  objectiveExam?: string;
  assessment?: string;
  plan?: string;
  prescription?: any;
  icd10Code?: string;
  digitalSignature?: string;
  notes?: string;
}

export interface AdjustCadenceMilestoneDto {
  scheduledDate?: string;
  scheduledTime?: string;
  encounterType?: EncounterType;
}

export interface DoctorRescheduleReviewDto {
  action?: 'ACCEPT' | 'COUNTER_PROPOSE' | 'REJECT';
  accept?: boolean;
  counterDate?: string;
  counterTime?: string;
  doctorNotes?: string;
  notes?: string;
}

export const encountersApi = {
  getDoctorTimetable: async (query?: ListEncountersQueryDto): Promise<DoctorTimetableResponse> => {
    const raw = await httpClient.get<DoctorTimetableResponse | { data: EncounterItem[]; pagination: any }>(
      '/api/v1/encounters/timetable/doctor',
      query as Record<string, string | number | boolean | undefined>
    );
    const unwrapped = unwrapApiEnvelope(raw) as any;
    if (unwrapped && Array.isArray(unwrapped.data)) {
      return unwrapped as DoctorTimetableResponse;
    }
    if (Array.isArray(unwrapped)) {
      return {
        data: unwrapped,
        pagination: { page: 1, pageSize: unwrapped.length, totalItems: unwrapped.length, totalPages: 1 },
      };
    }
    return {
      data: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    };
  },

  getFamilyTimetable: async (query?: ListEncountersQueryDto): Promise<DoctorTimetableResponse> => {
    const raw = await httpClient.get<DoctorTimetableResponse>(
      '/api/v1/encounters/timetable/family',
      query as Record<string, string | number | boolean | undefined>
    );
    const unwrapped = unwrapApiEnvelope(raw) as any;
    if (unwrapped && Array.isArray(unwrapped.data)) {
      return unwrapped as DoctorTimetableResponse;
    }
    return {
      data: Array.isArray(unwrapped) ? unwrapped : [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    };
  },

  getEncounterDetail: async (id: string): Promise<EncounterItem> => {
    const raw = await httpClient.get<EncounterItem>(`/api/v1/encounters/${id}`);
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  createPeriodicEncounter: async (payload: CreatePeriodicEncounterDto): Promise<EncounterItem> => {
    const raw = await httpClient.post<EncounterItem>('/api/v1/encounters/periodic', payload);
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  createAdHocEncounter: async (payload: CreateAdHocEncounterDto): Promise<EncounterItem> => {
    const raw = await httpClient.post<EncounterItem>('/api/v1/encounters/ad-hoc', payload);
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  confirmEncounter: async (id: string, payload: { confirmed?: boolean } | boolean = true): Promise<any> => {
    const body = typeof payload === 'boolean' ? { confirmed: payload } : { confirmed: payload.confirmed ?? true };
    const raw = await httpClient.patch(`/api/v1/encounters/${id}/confirm`, body);
    return unwrapApiEnvelope(raw);
  },

  markOnTheWay: async (id: string): Promise<EncounterItem> => {
    const raw = await httpClient.patch<EncounterItem>(`/api/v1/encounters/${id}/on-the-way`, {});
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  markArrived: async (id: string): Promise<EncounterItem> => {
    const raw = await httpClient.patch<EncounterItem>(`/api/v1/encounters/${id}/arrive`, {});
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  confirmArrival: async (id: string): Promise<EncounterItem> => {
    const raw = await httpClient.patch<EncounterItem>(`/api/v1/encounters/${id}/confirm-arrival`, {});
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  requestReschedule: async (id: string, payload: RequestRescheduleDto): Promise<any> => {
    const raw = await httpClient.post(`/api/v1/encounters/${id}/reschedule`, payload);
    return unwrapApiEnvelope(raw);
  },

  decideRescheduleRequest: async (
    encounterId: string,
    requestId: string,
    payload: DecideRescheduleRequestDto
  ): Promise<EncounterRescheduleRequestItem> => {
    const raw = await httpClient.patch<EncounterRescheduleRequestItem>(
      `/api/v1/encounters/${encounterId}/reschedule-requests/${requestId}/decision`,
      payload
    );
    return unwrapApiEnvelope(raw) as EncounterRescheduleRequestItem;
  },

  getPendingRescheduleRequests: async (): Promise<EncounterRescheduleRequestItem[]> => {
    const raw = await httpClient.get<EncounterRescheduleRequestItem[]>(
      '/api/v1/encounters/reschedule-requests/pending'
    );
    const unwrapped = unwrapApiEnvelope(raw);
    return Array.isArray(unwrapped) ? unwrapped : [];
  },

  getFacilityScheduleBoard: async (
    fromDate?: string,
    toDate?: string
  ): Promise<{
    facilityId: string;
    encounters: EncounterItem[];
    pendingRescheduleRequests: EncounterRescheduleRequestItem[];
  }> => {
    const raw = await httpClient.get<any>('/api/v1/encounters/facility/schedule-board', {
      fromDate,
      toDate,
    });
    return unwrapApiEnvelope(raw) as {
      facilityId: string;
      encounters: EncounterItem[];
      pendingRescheduleRequests: EncounterRescheduleRequestItem[];
    };
  },

  finalizeEncounter: async (id: string, payload: FinalizeEncounterDto): Promise<EncounterItem> => {
    const raw = await httpClient.patch<EncounterItem>(`/api/v1/encounters/${id}/finalize`, payload);
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  reviewReschedule: async (id: string, payload: DoctorRescheduleReviewDto): Promise<EncounterItem> => {
    const raw = await httpClient.patch<EncounterItem>(`/api/v1/encounters/${id}/reschedule-review`, payload);
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  finalizeCadenceSchedule: async (
    contractId: string
  ): Promise<{ finalizedCount: number; encounters: EncounterItem[] }> => {
    const raw = await httpClient.post<any>(`/api/v1/encounters/cadence/finalize/${contractId}`, {});
    return unwrapApiEnvelope(raw);
  },

  adjustCadenceMilestone: async (
    id: string,
    payload: AdjustCadenceMilestoneDto
  ): Promise<EncounterItem> => {
    const raw = await httpClient.patch<EncounterItem>(`/api/v1/encounters/cadence/${id}`, payload);
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  backfillCadence: async (
    contractId: string
  ): Promise<{ generatedCount: number; encounters: EncounterItem[] }> => {
    const raw = await httpClient.post<any>(`/api/v1/encounters/cadence/backfill/${contractId}`, {});
    return unwrapApiEnvelope(raw);
  },
};