import { unwrapApiEnvelope } from './envelope';
import { extractErrorMessage } from './error-handler';
import { httpClient } from './http-client';
import { ApiError } from '../http/errors';

type PrescriptionReference = { id: string; prescriptionCode: string };

export interface PrescriptionLine {
  medicationName: string;
  strength: string;
  administrationRoute: string;
  dosage: string;
  frequency: string;
  quantity: number;
  unit: string;
  durationDays: number;
}

export interface PrescriptionExam {
  chiefComplaint: string;
  clinicalFindings: string;
  icd10Code: string;
  icd10Diagnosis: string;
  treatmentPlan: string;
}

export interface PrescriptionVisit {
  id: string;
  encounterType: string;
  scheduledDate: string;
  scheduledTime: string;
  patient: { id: string; fullName: string };
  recipient: { id: string; name: string } | null;
  diagnosis: { code: string; name: string } | null;
  prescription: (PrescriptionReference & { shared: boolean }) | null;
}

export interface FamilyPrescription extends PrescriptionReference {
  prescribedDate: string;
  createdAt: string;
  status: 'ISSUED' | 'EXPIRED' | 'CANCELLED';
  patient: { id: string; fullName: string };
  doctorName: string;
  facilityName: string;
  diagnosis: string;
  hasSignature: boolean;
}

export interface FamilyPrescriptionDetail extends FamilyPrescription {
  instructions: string | null;
  details: (Omit<PrescriptionLine, 'strength' | 'administrationRoute'> & {
    id: string;
    strength: string | null;
    administrationRoute: string | null;
  })[];
}

export interface PrescriptionPage<T> {
  items: T[];
  hasNextPage: boolean;
}

const path = '/api/v1/prescriptions';

export function prescriptionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status < 500 && error.details) {
    return extractErrorMessage(error.details, fallback);
  }
  return fallback;
}

export const prescriptionsApi = {
  async listVisits(page: number, signal?: AbortSignal) {
    const response = await httpClient.get(
      path + '/encounters',
      { page },
      { signal, cache: 'no-store' },
    );
    return unwrapApiEnvelope<PrescriptionPage<PrescriptionVisit>>(response);
  },
  async share(
    visitId: string,
    body: {
      exam?: PrescriptionExam;
      details: PrescriptionLine[];
      instructions: string;
      recipientUserId: string;
      recipientAuthorized: true;
    },
  ) {
    const response = await httpClient.post(
      path + '/encounters/' + encodeURIComponent(visitId),
      body,
    );
    return unwrapApiEnvelope<NonNullable<PrescriptionVisit['prescription']>>(
      response,
    );
  },
  async listForFamily(page: number, patientId?: string, signal?: AbortSignal) {
    const response = await httpClient.get(
      path,
      { page, patientId },
      { signal, cache: 'no-store' },
    );
    return unwrapApiEnvelope<PrescriptionPage<FamilyPrescription>>(response);
  },
  async familyDetail(id: string, signal?: AbortSignal) {
    const response = await httpClient.get(
      path + '/' + encodeURIComponent(id),
      undefined,
      { signal, cache: 'no-store' },
    );
    return unwrapApiEnvelope<FamilyPrescriptionDetail>(response);
  },
};
