import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';
export type PatientRelationship = 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER';
export type PatientStatus = 'ACTIVE' | 'INACTIVE';
export type AllergenType = 'DRUG' | 'FOOD' | 'ENVIRONMENTAL';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'LIFE_THREATENING_ANAPHYLAXIS';
export type PatientDocumentType = 'LAB_RESULT' | 'IMAGING_XRAY_CT' | 'DISCHARGE_SUMMARY';

export interface PatientAllergyDto {
  id?: string;
  allergenType: AllergenType;
  allergenName: string;
  severity: AllergySeverity;
  clinicalManifestation?: string | null;
  createdAt?: string;
}

export interface PatientDocumentDto {
  id?: string;
  documentName: string;
  documentType: PatientDocumentType;
  fileUrl: string;
  fileSizeKb?: number;
  recordedDate: string;
  uploadedAt?: string;
}

export interface PatientDto {
  id: string;
  familyId: string;
  fullName: string;
  dateOfBirth: string;
  gender: PatientGender;
  relationshipToHead: PatientRelationship | string;
  citizenId?: string | null;
  healthInsuranceNumber?: string | null;
  bloodType?: string | null;
  registeredHospital?: string | null;
  chronicDiseases?: string | null;
  status?: PatientStatus;
  allergies?: PatientAllergyDto[];
  documents?: PatientDocumentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  fullName: string;
  dateOfBirth: string;
  gender: PatientGender;
  relationshipToRepresentative?: PatientRelationship | string;
  relationshipToHead?: PatientRelationship | string;
  identityNumber?: string;
  citizenId?: string;
  phoneNumber?: string;
  bloodType?: string;
  healthInsuranceNumber?: string;
  registeredHospital?: string;
  chronicDiseases?: string;
  familyId?: string;
}

export type UpdatePatientDto = Partial<CreatePatientDto> & {
  status?: PatientStatus;
};

export const patientsApi = {
  getFamilyMembers: async (): Promise<PatientDto[]> => {
    const payload = await httpClient.get<unknown>('/api/v1/patients');
    return unwrapApiEnvelope<PatientDto[]>(payload);
  },

  getMemberById: async (id: string): Promise<PatientDto> => {
    const payload = await httpClient.get<unknown>(`/api/v1/patients/${id}`);
    return unwrapApiEnvelope<PatientDto>(payload);
  },

  createFamilyMember: async (dto: CreatePatientDto): Promise<PatientDto> => {
    const payload = await httpClient.post<unknown>('/api/v1/patients', dto);
    return unwrapApiEnvelope<PatientDto>(payload);
  },

  updateFamilyMember: async (id: string, dto: UpdatePatientDto): Promise<PatientDto> => {
    const payload = await httpClient.put<unknown>(`/api/v1/patients/${id}`, dto);
    return unwrapApiEnvelope<PatientDto>(payload);
  },

  detachFamilyMember: async (id: string): Promise<PatientDto> => {
    const payload = await httpClient.delete<unknown>(`/api/v1/patients/${id}`);
    return unwrapApiEnvelope<PatientDto>(payload);
  },

  addMemberAllergy: async (patientId: string, dto: PatientAllergyDto): Promise<PatientAllergyDto> => {
    const payload = await httpClient.post<unknown>(`/api/v1/patients/${patientId}/allergies`, dto);
    return unwrapApiEnvelope<PatientAllergyDto>(payload);
  },

  addMemberDocument: async (patientId: string, dto: PatientDocumentDto): Promise<PatientDocumentDto> => {
    const payload = await httpClient.post<unknown>(`/api/v1/patients/${patientId}/documents`, dto);
    return unwrapApiEnvelope<PatientDocumentDto>(payload);
  },
};
