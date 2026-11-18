import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export type EncounterType = 'HOME_VISIT' | 'TELEMEDICINE';
export type EncounterCategory = 'PERIODIC_ROUTINE' | 'AD_HOC_ON_DEMAND';
export type EncounterStatus =
  | 'PROPOSED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULE_REQUESTED';

export interface EncounterPatient {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  allergies?: string[];
  chronicDiseases?: string[];
}

export interface EncounterContract {
  id: string;
  contractNumber?: string;
  familyUnit?: {
    id: string;
    familyName?: string;
    address?: string;
    representativeUser?: {
      name?: string;
      phone?: string;
    };
  };
  servicePackage?: {
    id: string;
    packageName: string;
  };
}

export interface EncounterItem {
  id: string;
  contractId: string;
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime: string;
  encounterType: EncounterType | string;
  category: EncounterCategory | string;
  encounterStatus: EncounterStatus | string;
  subjectiveNote?: string | null;
  objectiveExam?: string | null;
  assessment?: string | null;
  plan?: string | null;
  prescription?: any;
  icd10Code?: string | null;
  digitalSignature?: string | null;
  createdAt?: string;
  updatedAt?: string;
  patient?: EncounterPatient;
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
  patientId: string;
  scheduledDate: string;
  scheduledTime: string;
  encounterType: EncounterType;
  clinicalNotes?: string;
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

export interface DoctorRescheduleReviewDto {
  action: 'ACCEPT' | 'COUNTER_PROPOSE' | 'REJECT';
  counterDate?: string;
  counterTime?: string;
  doctorNotes?: string;
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

  finalizeEncounter: async (id: string, payload: FinalizeEncounterDto): Promise<EncounterItem> => {
    const raw = await httpClient.patch<EncounterItem>(`/api/v1/encounters/${id}/finalize`, payload);
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  reviewReschedule: async (id: string, payload: DoctorRescheduleReviewDto): Promise<any> => {
    const raw = await httpClient.patch(`/api/v1/encounters/${id}/reschedule-review`, payload);
    return unwrapApiEnvelope(raw);
  },
};
