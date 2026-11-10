import { httpClient } from './http-client';

export interface PublicDoctorDto {
  id: string;
  fullName: string;
  title?: string;
  specialty?: string;
  facilityName?: string;
  rating?: number;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface PublicFacilityDto {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  type?: string;
  rating?: number;
}

export const publicApi = {
  getDoctors: (): Promise<PublicDoctorDto[]> => {
    return httpClient.get<PublicDoctorDto[]>('/api/v1/public/doctors');
  },

  getFacilities: (): Promise<PublicFacilityDto[]> => {
    return httpClient.get<PublicFacilityDto[]>('/api/v1/public/facilities');
  },
};
