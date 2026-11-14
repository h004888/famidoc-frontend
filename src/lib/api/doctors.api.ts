import { httpClient } from './http-client';

export interface DoctorProfileDto {
  id: string;
  doctorName: string;
  specialty: string;
  academicTitle?: string;
  experienceYears: number;
  activePanelCount: number;
  maxPanelCapacity: number;
  ratingAvg: number;
  totalReviews: number;
  onboardingStatus: 'PENDING_SUBMISSION' | 'FACILITY_APPROVED' | 'ACTIVE' | 'REJECTED';
  facilityId: string;
  facilityName?: string;
}

export interface SubmitCredentialsPayload {
  cchnNumber: string;
  scopeOfPractice?: string;
  issuedBy?: string;
  issuedDate?: string;
  certificateFiles?: string[];
}

export interface FacilityApprovePayload {
  isApproved: boolean;
  notes?: string;
}

export interface CreateFacilityDoctorPayload {
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  experienceYears?: number;
  academicTitle?: string;
}

export const doctorsApi = {
  getDoctorMe: (): Promise<DoctorProfileDto> => {
    return httpClient.get<DoctorProfileDto>('/api/v1/doctors/me');
  },

  submitMyCredentials: (payload: SubmitCredentialsPayload): Promise<any> => {
    return httpClient.put('/api/v1/doctors/me/credentials', payload);
  },

  facilityApproveCredentials: (doctorId: string, payload: FacilityApprovePayload): Promise<any> => {
    return httpClient.patch(`/api/v1/doctors/${doctorId}/credentials/facility-approve`, payload);
  },

  platformApproveCredentials: (doctorId: string, payload: FacilityApprovePayload): Promise<any> => {
    return httpClient.patch(`/api/v1/doctors/${doctorId}/credentials/platform-approve`, payload);
  },

  createFacilityDoctor: (facilityId: string, payload: CreateFacilityDoctorPayload): Promise<any> => {
    return httpClient.post(`/api/v1/facilities/${facilityId}/doctors`, payload);
  },

  getFacilityDoctors: (facilityId: string): Promise<any[]> => {
    return httpClient.get<any[]>(`/api/v1/facilities/${facilityId}/doctors`);
  },
};
