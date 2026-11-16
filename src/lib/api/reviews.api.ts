import { httpClient } from './http-client';

export interface DoctorReviewPayload {
  doctorId: string;
  rating: number; // 1-5
  comment: string;
}

export interface ComplaintPayload {
  contractId?: string;
  title: string;
  description: string;
  incidentDate?: string;
  severityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ComplaintItem {
  id: string;
  contractId?: string;
  title: string;
  description: string;
  severityLevel: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
  resolutionNotes?: string;
  compensationAmountVnd?: number;
  createdAt: string;
  resolvedAt?: string;
}

export const reviewsApi = {
  submitDoctorReview: (payload: DoctorReviewPayload): Promise<{ id: string; success: boolean }> => {
    return httpClient.post<{ id: string; success: boolean }>('/api/v1/reviews/doctors', payload);
  },

  listComplaints: (params?: { severityLevel?: string; status?: string }): Promise<ComplaintItem[]> => {
    return httpClient.get<ComplaintItem[]>('/api/v1/complaints', params as any);
  },

  submitComplaint: (payload: ComplaintPayload): Promise<ComplaintItem> => {
    return httpClient.post<ComplaintItem>('/api/v1/complaints', payload);
  },

  getComplaintById: (id: string): Promise<ComplaintItem> => {
    return httpClient.get<ComplaintItem>(`/api/v1/complaints/${id}`);
  },

  resolveComplaint: (
    id: string,
    payload: { resolutionNotes: string; compensationAmountVnd?: number }
  ): Promise<ComplaintItem> => {
    return httpClient.patch<ComplaintItem>(`/api/v1/complaints/${id}/resolve`, payload);
  },
};
