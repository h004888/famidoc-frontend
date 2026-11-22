import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export type EncounterType = 'HOME_VISIT' | 'TELEHEALTH' | 'FACILITY_VISIT' | 'TELEMEDICINE';
export type EncounterCategory = 'PERIODIC_ROUTINE' | 'AD_HOC_ON_DEMAND';
export type EncounterStatus =
  | 'REQUESTED'
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
  allergies?: (string | { allergen: string })[];
  chronicDiseases?: string | string[] | null;
}

export interface EncounterContract {
  id: string;
  contractNumber?: string;
  familyUnit?: {
    id: string;
    familyName?: string;
    address?: string;
    homeAddress?: string;
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
  rescheduleCount?: number;
  proposedDate?: string | null;
  proposedTime?: string | null;
  proposedBy?: 'DOCTOR' | 'FAMILY_REP' | string | null;
  rescheduleReason?: string | null;
  conflictAlert?: boolean;
  conflictDetails?: string | null;
  cancelReason?: string | null;
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
  encounterType: EncounterType;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
}

export interface CreateAdHocEncounterDto {
  contractId: string;
  patientId: string;
  encounterType: EncounterType;
  desiredDate: string;
  desiredTime: string;
  reason: string;
}

export interface FinalizeEncounterDto {
  encounterType?: EncounterType;
  scheduledDate?: string;
  scheduledTime?: string;
  doctorNotes?: string;
}

export interface ConfirmEncounterDto {
  confirmed: boolean;
}

export interface RequestRescheduleDto {
  proposedDate: string;
  proposedTime: string;
  rescheduleReason: string;
}

export interface DoctorRescheduleReviewDto {
  accept: boolean;
  counterDate?: string;
  counterTime?: string;
  notes?: string;
}

export interface CreateDoctorShiftDto {
  doctorId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  notes?: string;
}

export interface DoctorShiftItem {
  id: string;
  doctorId: string;
  facilityId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  notes?: string | null;
  doctor?: {
    id: string;
    doctorName?: string;
    specialty?: string;
    user?: { name?: string; phone?: string };
  };
}

export interface FacilityScheduleBoardResponse {
  facilityId: string;
  dutyShifts: DoctorShiftItem[];
  externalEncounters: EncounterItem[];
}

export interface SchedulingActionResponse {
  status?: 'CONFLICT_ALERT' | 'AUTO_REJECTED_TOO_LATE' | 'NO_SUITABLE_SLOT' | string;
  message?: string;
  encounter?: EncounterItem;
  id?: string;
  encounterStatus?: EncounterStatus | string;
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

  finalizeEncounter: async (id: string, payload: FinalizeEncounterDto): Promise<EncounterItem> => {
    const raw = await httpClient.patch<EncounterItem>(`/api/v1/encounters/${id}/finalize`, payload);
    return unwrapApiEnvelope(raw) as EncounterItem;
  },

  confirmEncounter: async (
    id: string,
    payload: ConfirmEncounterDto
  ): Promise<EncounterItem & SchedulingActionResponse> => {
    const raw = await httpClient.patch<EncounterItem & SchedulingActionResponse>(
      `/api/v1/encounters/${id}/confirm`,
      payload
    );
    return unwrapApiEnvelope(raw) as EncounterItem & SchedulingActionResponse;
  },

  requestReschedule: async (
    id: string,
    payload: RequestRescheduleDto
  ): Promise<EncounterItem & SchedulingActionResponse> => {
    const raw = await httpClient.post<EncounterItem & SchedulingActionResponse>(
      `/api/v1/encounters/${id}/reschedule`,
      payload
    );
    return unwrapApiEnvelope(raw) as EncounterItem & SchedulingActionResponse;
  },

  reviewReschedule: async (
    id: string,
    payload: DoctorRescheduleReviewDto
  ): Promise<EncounterItem & SchedulingActionResponse> => {
    const raw = await httpClient.patch<EncounterItem & SchedulingActionResponse>(
      `/api/v1/encounters/${id}/reschedule-review`,
      payload
    );
    return unwrapApiEnvelope(raw) as EncounterItem & SchedulingActionResponse;
  },

  createDoctorShift: async (payload: CreateDoctorShiftDto): Promise<DoctorShiftItem> => {
    const raw = await httpClient.post<DoctorShiftItem>('/api/v1/encounters/shifts', payload);
    return unwrapApiEnvelope(raw) as DoctorShiftItem;
  },

  getFacilityScheduleBoard: async (query?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<FacilityScheduleBoardResponse> => {
    const raw = await httpClient.get<FacilityScheduleBoardResponse>(
      '/api/v1/encounters/facility/schedule-board',
      query
    );
    const unwrapped = unwrapApiEnvelope(raw) as FacilityScheduleBoardResponse | null;
    return {
      facilityId: unwrapped?.facilityId ?? '',
      dutyShifts: Array.isArray(unwrapped?.dutyShifts) ? unwrapped.dutyShifts : [],
      externalEncounters: Array.isArray(unwrapped?.externalEncounters) ? unwrapped.externalEncounters : [],
    };
  },
};
