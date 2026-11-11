import { httpClient } from './http-client';
import type { FourPartyContract, ContractStatus } from '@/features/four-party-contract';

export interface MedicalContractListItem {
  id: string;
  contractNumber: string;
  contractStatus: ContractStatus;
  packageId: string;
  packageName: string;
  facilityId: string;
  facilityName: string;
  doctorId?: string;
  doctorName?: string;
  familyId: string;
  familyHeadName?: string;
  memberCount: number;
  totalAmountVnd: number;
  signaturesCount: number;
  createdAt: string;
}

export interface CareNeedsSummaryDto {
  contractId: string;
  contractNumber: string;
  packageName: string;
  facilityName: string;
  familyAddress?: string;
  members: {
    patientId: string;
    fullName: string;
    age: number;
    gender: string;
    relationshipToHead: string;
    allergies: { allergen: string; severity: string }[];
    documents: { title: string; documentType: string }[];
  }[];
}

export interface ContractDocumentDto {
  contractId: string;
  contractNumber: string;
  termsHash: string;
  htmlContent: string;
  signatures: {
    signerRole: string;
    signerUserId: string;
    signatureHash: string;
    signedAt: string;
  }[];
}

export interface CreateFourPartyContractPayload {
  packageId: string;
  facilityId: string;
  doctorId?: string;
  patientIds: string[];
  familyId?: string;
  memberCount?: number;
  videoConsultations?: number;
  extraHomeVisits?: number;
}

export interface SignContractPayload {
  termsHash?: string;
  confirmationCode?: string;
}

export interface AssignDoctorPayload {
  doctorId: string;
}

export const contractsApi = {
  getMedicalContracts: (params?: {
    role?: string;
    status?: string;
    facilityId?: string;
  }): Promise<MedicalContractListItem[]> => {
    return httpClient.get<MedicalContractListItem[]>('/api/v1/contracts/medical', params);
  },

  getMedicalContractById: (id: string): Promise<FourPartyContract> => {
    return httpClient.get<FourPartyContract>(`/api/v1/contracts/medical/${id}`);
  },

  getCareSummary: (contractId: string): Promise<CareNeedsSummaryDto> => {
    return httpClient.get<CareNeedsSummaryDto>(`/api/v1/contracts/medical/${contractId}/care-summary`);
  },

  getContractDocument: (contractId: string): Promise<ContractDocumentDto> => {
    return httpClient.get<ContractDocumentDto>(`/api/v1/contracts/medical/${contractId}/document`);
  },

  initiateFourPartyContract: (payload: CreateFourPartyContractPayload): Promise<FourPartyContract> => {
    return httpClient.post<FourPartyContract>('/api/v1/contracts/four-party', payload);
  },

  signContract: (contractId: string, payload: SignContractPayload): Promise<{ signatureHash: string }> => {
    return httpClient.put<{ signatureHash: string }>(`/api/v1/contracts/four-party/${contractId}/sign`, payload);
  },

  assignDoctor: (contractId: string, payload: AssignDoctorPayload): Promise<{ id: string; doctorId: string }> => {
    return httpClient.patch<{ id: string; doctorId: string }>(`/api/v1/contracts/${contractId}/assign-doctor`, payload);
  },

  recheckPaymentActivation: (paymentId: string): Promise<{ activated: boolean }> => {
    return httpClient.post<{ activated: boolean }>(`/api/v1/payments/requests/${paymentId}/recheck-activation`);
  },
};
