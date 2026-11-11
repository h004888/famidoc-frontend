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
  getFamilyMembers: (): Promise<PatientDto[]> => {
    return httpClient.get<PatientDto[]>('/api/v1/patients');
  },

  getMemberById: (id: string): Promise<PatientDto> => {
    return httpClient.get<PatientDto>(`/api/v1/patients/${id}`);
  },

  createFamilyMember: (dto: CreatePatientDto): Promise<PatientDto> => {
    return httpClient.post<PatientDto>('/api/v1/patients', dto);
  },

  updateFamilyMember: (id: string, dto: Partial<CreatePatientDto>): Promise<PatientDto> => {
    return httpClient.put<PatientDto>(`/api/v1/patients/${id}`, dto);
  },

  addMemberAllergy: (patientId: string, dto: PatientAllergyDto): Promise<PatientAllergyDto> => {
    return httpClient.post<PatientAllergyDto>(`/api/v1/patients/${patientId}/allergies`, dto);
  },

  addMemberDocument: (patientId: string, dto: PatientDocumentDto): Promise<PatientDocumentDto> => {
    return httpClient.post<PatientDocumentDto>(`/api/v1/patients/${patientId}/documents`, dto);
  },
};
