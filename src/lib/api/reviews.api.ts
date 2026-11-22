import { unwrapApiEnvelope } from './envelope';
import { httpClient } from './http-client';
import type { ComplaintOutcome, ComplaintStatus } from './admin.api';
import type { ComplaintCategory } from '@/lib/complaint-labels';

export type { ComplaintCategory, ComplaintOutcome, ComplaintStatus };

export interface DoctorReviewPayload {
  doctorId: string;
  rating: number; // 1-5
  comment: string;
}

export interface SubmitComplaintPayload {
  contractId: string;
  encounterId?: string;
  category: ComplaintCategory;
  description: string;
  evidenceKeys?: string[];
}

export interface ComplaintItem {
  id: string;
  complaintCode: string;
  contractId: string;
  encounterId?: string | null;
  complaintCategory: string;
  description: string;
  evidenceAttachments?: string[] | null;
  status: ComplaintStatus;
  facilityResponse?: string | null;
  facilityReviewedAt?: string | null;
  resolutionOutcome?: ComplaintOutcome | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  complainantUser?: { id?: string; fullName: string; role?: string };
  contract?: {
    contractNumber?: string;
    facility?: { facilityName?: string };
    doctor?: { doctorName?: string } | null;
  };
}

export interface ComplaintPage {
  items: ComplaintItem[];
  total: number;
  page: number;
  limit: number;
}

export const reviewsApi = {
  submitDoctorReview: (
    payload: DoctorReviewPayload,
  ): Promise<{ id: string; success: boolean }> => {
    return httpClient.post<{ id: string; success: boolean }>(
      '/api/v1/reviews/doctors',
      payload,
    );
  },

  listComplaints: async (params?: {
    status?: ComplaintStatus;
    page?: number;
    limit?: number;
  }): Promise<ComplaintPage> => {
    const raw = await httpClient.get<unknown>(
      '/api/v1/complaints',
      params,
      { cache: 'no-store' },
    );
    const data = unwrapApiEnvelope<ComplaintPage | ComplaintItem[]>(raw);
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      };
    }
    return data;
  },

  uploadComplaintEvidence: async (
    file: File,
  ): Promise<{ evidenceKey: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const raw = await httpClient.upload<unknown>(
      '/api/v1/complaints/evidence',
      formData,
    );
    return unwrapApiEnvelope<{ evidenceKey: string }>(raw);
  },

  submitComplaint: async (
    payload: SubmitComplaintPayload,
  ): Promise<ComplaintItem> => {
    const raw = await httpClient.post<unknown>('/api/v1/complaints', payload);
    return unwrapApiEnvelope<ComplaintItem>(raw);
  },

  getComplaintById: async (id: string): Promise<ComplaintItem> => {
    const raw = await httpClient.get<unknown>(
      `/api/v1/complaints/${id}`,
      undefined,
      { cache: 'no-store' },
    );
    return unwrapApiEnvelope<ComplaintItem>(raw);
  },
};
