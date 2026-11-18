import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';
export type PatientRelationship = 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER';
export type PatientStatus = 'ACTIVE' | 'INACTIVE';
export type AllergenType = 'DRUG' | 'FOOD' | 'ENVIRONMENTAL';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'LIFE_THREATENING_ANAPHYLAXIS';
export type PatientDocumentType =
  | 'LAB_RESULT'
  | 'IMAGING_XRAY_CT'
  | 'DISCHARGE_SUMMARY'
  | 'PRESCRIPTION'
  | 'OTHER';

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
  patientId?: string;
  documentName: string;
  documentType: PatientDocumentType;
  fileUrl: string;
  mimeType?: string | null;
  notes?: string | null;
  previewUrl?: string | null;
  downloadPath?: string;
  fileSizeKb?: number;
  recordedDate: string;
  uploadedAt?: string;
}

export interface UploadMemberDocumentInput {
  documentName: string;
  documentType: PatientDocumentType;
  recordedDate: string;
  notes?: string;
  file: File;
}

export interface PatientDto {
  id: string;
  familyId: string;
  fullName: string;
  dateOfBirth: string;
  gender: PatientGender;
  relationshipToHead: PatientRelationship | string;
  bloodType?: string | null;
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
  bloodType?: string;
  chronicDiseases?: string;
  familyId?: string;
}

export type UpdatePatientDto = Partial<CreatePatientDto> & {
  status?: PatientStatus;
};

export interface VitalSignDto {
  id: string;
  emrId?: string | null;
  patientId: string;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  heartRate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  respiratoryRate?: number | null;
  bloodGlucose?: number | null;
  isAbnormalAlert: boolean;
  recordedAt: string;
}

export interface CreateVitalSignDto {
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  bloodGlucose?: number;
  recordedAt?: string;
}

export type UpdateVitalSignDto = Partial<CreateVitalSignDto>;

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

  deleteMemberAllergy: async (patientId: string, allergyId: string): Promise<PatientAllergyDto> => {
    const payload = await httpClient.delete<unknown>(
      `/api/v1/patients/${patientId}/allergies/${allergyId}`
    );
    return unwrapApiEnvelope<PatientAllergyDto>(payload);
  },

  addMemberDocument: async (patientId: string, dto: PatientDocumentDto): Promise<PatientDocumentDto> => {
    const payload = await httpClient.post<unknown>(`/api/v1/patients/${patientId}/documents`, dto);
    return unwrapApiEnvelope<PatientDocumentDto>(payload);
  },

  uploadMemberDocument: async (
    patientId: string,
    input: UploadMemberDocumentInput
  ): Promise<PatientDocumentDto> => {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('documentName', input.documentName.trim());
    formData.append('documentType', input.documentType);
    formData.append('recordedDate', input.recordedDate);
    if (input.notes?.trim()) {
      formData.append('notes', input.notes.trim());
    }
    const payload = await httpClient.upload<unknown>(
      `/api/v1/patients/${patientId}/documents`,
      formData
    );
    return unwrapApiEnvelope<PatientDocumentDto>(payload);
  },

  deleteMemberDocument: async (
    patientId: string,
    documentId: string
  ): Promise<PatientDocumentDto> => {
    const payload = await httpClient.delete<unknown>(
      `/api/v1/patients/${patientId}/documents/${documentId}`
    );
    return unwrapApiEnvelope<PatientDocumentDto>(payload);
  },

  fetchMemberDocumentBlob: async (patientId: string, documentId: string): Promise<Blob> => {
    return httpClient.getBlob(`/api/v1/patients/${patientId}/documents/${documentId}/file`);
  },

  getMemberVitalSigns: async (patientId: string, days = 30): Promise<VitalSignDto[]> => {
    const payload = await httpClient.get<unknown>(
      `/api/v1/patients/${patientId}/vital-signs?days=${encodeURIComponent(String(days))}`
    );
    return unwrapApiEnvelope<VitalSignDto[]>(payload);
  },

  addMemberVitalSign: async (patientId: string, dto: CreateVitalSignDto): Promise<VitalSignDto> => {
    const payload = await httpClient.post<unknown>(`/api/v1/patients/${patientId}/vital-signs`, dto);
    return unwrapApiEnvelope<VitalSignDto>(payload);
  },

  updateMemberVitalSign: async (
    patientId: string,
    vitalId: string,
    dto: UpdateVitalSignDto
  ): Promise<VitalSignDto> => {
    const payload = await httpClient.put<unknown>(
      `/api/v1/patients/${patientId}/vital-signs/${vitalId}`,
      dto
    );
    return unwrapApiEnvelope<VitalSignDto>(payload);
  },

  deleteMemberVitalSign: async (patientId: string, vitalId: string): Promise<VitalSignDto> => {
    const payload = await httpClient.delete<unknown>(
      `/api/v1/patients/${patientId}/vital-signs/${vitalId}`
    );
    return unwrapApiEnvelope<VitalSignDto>(payload);
  },
};
