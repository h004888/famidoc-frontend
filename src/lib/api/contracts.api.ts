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
  doctorTitle?: string;
  doctorSpecialty?: string;
  doctorPhone?: string;
  familyId: string;
  familyHeadName?: string;
  familyAddress?: string;
  memberCount: number;
  totalAmountVnd: number;
  signaturesCount: number;
  startDate?: string;
  endDate?: string;
  remainingHomeVisits?: number;
  totalHomeVisits?: number;
  remainingTelehealth?: number;
  totalTelehealth?: number;
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
  getMedicalContracts: async (params?: {
    role?: string;
    status?: string;
    facilityId?: string;
  }): Promise<MedicalContractListItem[]> => {
    const res = await httpClient.get<any>('/api/v1/contracts/medical', params);
    if (res && typeof res === 'object') {
      if ('data' in res) {
        if (Array.isArray(res.data)) return res.data;
        if (res.data && typeof res.data === 'object' && 'items' in res.data && Array.isArray(res.data.items)) {
          return res.data.items;
        }
      }
      if ('items' in res && Array.isArray(res.items)) return res.items;
    }
    if (Array.isArray(res)) return res;
    return [];
  },

  getMedicalContractById: async (id: string): Promise<FourPartyContract> => {
    const res = await httpClient.get<any>(`/api/v1/contracts/medical/${id}`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as FourPartyContract;
  },

  getCareSummary: async (contractId: string): Promise<CareNeedsSummaryDto> => {
    const res = await httpClient.get<any>(`/api/v1/contracts/medical/${contractId}/care-summary`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as CareNeedsSummaryDto;
  },

  getContractDocument: async (contractId: string): Promise<ContractDocumentDto> => {
    const res = await httpClient.get<any>(`/api/v1/contracts/medical/${contractId}/document`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as ContractDocumentDto;
  },

  initiateFourPartyContract: async (payload: CreateFourPartyContractPayload): Promise<FourPartyContract> => {
    const res = await httpClient.post<any>('/api/v1/contracts/four-party', payload);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as FourPartyContract;
  },

  signContract: async (contractId: string, payload: SignContractPayload): Promise<{ signatureHash: string }> => {
    const res = await httpClient.put<any>(`/api/v1/contracts/four-party/${contractId}/sign`, payload);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as { signatureHash: string };
  },

  assignDoctor: async (contractId: string, payload: AssignDoctorPayload): Promise<{ id: string; doctorId: string }> => {
    const res = await httpClient.patch<any>(`/api/v1/contracts/${contractId}/assign-doctor`, payload);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as { id: string; doctorId: string };
  },

  recheckPaymentActivation: async (paymentId: string): Promise<{ activated: boolean }> => {
    const res = await httpClient.post<any>(`/api/v1/payments/requests/${paymentId}/recheck-activation`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as { activated: boolean };
  },

  createAddendum: (
    contractId: string,
    payload: {
      requestKey: string;
      type: 'QUOTA_EXPANSION' | 'MEMBER_EXTENSION';
      extraHomeVisits?: number;
      additionalMembers?: number;
    }
  ): Promise<any> => {
    return httpClient.post(`/api/v1/contracts/${contractId}/addendums`, payload);
  },

  upgradePackage: (
    contractId: string,
    payload: {
      packageId: string;
      videoConsultations?: number;
      kind?: 'UPGRADE' | 'RENEWAL';
    }
  ): Promise<any> => {
    return httpClient.post(`/api/v1/contracts/${contractId}/upgrade`, payload);
  },

  terminateContract: (
    contractId: string,
    payload: { reason: string; note?: string; bankInfo?: string }
  ): Promise<any> => {
    return httpClient.post(`/api/v1/contracts/${contractId}/termination`, payload);
  },
};
