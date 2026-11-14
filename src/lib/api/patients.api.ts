import { httpClient } from './http-client';

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';
export type PatientRelationship = 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export interface PatientDto {
  id: string;
  familyId: string;
  fullName: string;
  dateOfBirth: string;
  gender: PatientGender;
  relationshipToHead: PatientRelationship;
  identityCardNumber?: string;
  healthInsuranceNumber?: string;
  allergies?: PatientAllergyDto[];
  documents?: PatientDocumentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  fullName: string;
  dateOfBirth: string;
  gender: PatientGender;
  relationshipToHead: PatientRelationship;
  identityCardNumber?: string;
  healthInsuranceNumber?: string;
}

export interface PatientAllergyDto {
  id?: string;
  allergen: string;
  allergyType: 'DRUG' | 'FOOD' | 'ENVIRONMENT';
  severity: AllergySeverity;
  reactionDetails?: string;
}

export interface PatientDocumentDto {
  id?: string;
  documentType: 'LAB_RESULT' | 'PRESCRIPTION' | 'DISCHARGE_SUMMARY' | 'IMAGING' | 'OTHER';
  fileUrl: string;
  title: string;
  notes?: string;
}

export const patientsApi = {
  getFamilyMembers: async (): Promise<PatientDto[]> => {
    const res = await httpClient.get<any>('/api/v1/patients');
    if (res && typeof res === 'object') {
      if ('data' in res && Array.isArray(res.data)) return res.data;
    }
    if (Array.isArray(res)) return res;
    return [];
  },

  getMemberById: async (id: string): Promise<PatientDto> => {
    const res = await httpClient.get<any>(`/api/v1/patients/${id}`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as PatientDto;
  },

  createFamilyMember: async (dto: CreatePatientDto): Promise<PatientDto> => {
    const res = await httpClient.post<any>('/api/v1/patients', dto);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as PatientDto;
  },

  updateFamilyMember: async (id: string, dto: Partial<CreatePatientDto>): Promise<PatientDto> => {
    const res = await httpClient.put<any>(`/api/v1/patients/${id}`, dto);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as PatientDto;
  },

  addMemberAllergy: async (patientId: string, dto: PatientAllergyDto): Promise<PatientAllergyDto> => {
    const res = await httpClient.post<any>(`/api/v1/patients/${patientId}/allergies`, dto);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as PatientAllergyDto;
  },

  addMemberDocument: async (patientId: string, dto: PatientDocumentDto): Promise<PatientDocumentDto> => {
    const res = await httpClient.post<any>(`/api/v1/patients/${patientId}/documents`, dto);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as PatientDocumentDto;
  },
};
