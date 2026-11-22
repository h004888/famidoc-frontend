import { unwrapApiEnvelope } from './envelope';
import { extractErrorMessage } from './error-handler';
import { httpClient } from './http-client';
import { ApiError } from '../http/errors';
import type { PrescriptionSnapshot } from '../prescription-rules';

type PrescriptionReference = { id: string; prescriptionCode: string };

export interface PrescriptionLine {
  medicationType?: 'SINGLE_INGREDIENT' | 'COMBINATION' | 'BIOLOGICAL';
  medicationCode?: string | null;
  activeIngredient?: string | null;
  medicationName: string;
  strength: string;
  administrationRoute: string;
  dosage: string;
  frequency: string;
  quantity: number;
  unit: string;
  durationDays: number;
}

export interface PrescriptionContext {
  ageMonths?: number;
  longTermReason?: string;
  weightKg?: number;
  citizenId?: string;
  identityDocument?: string;
  insuranceNumber?: string;
  ethnicity?: string;
  phone?: string;
  address?: string;
  conclusion?: string;
  precautions?: string;
  treatmentMode?: 'INPATIENT' | 'OUTPATIENT';
  followUpDays?: number;
  caregiverName?: string;
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
  validUntil?: string | null;
  recordSnapshot?: PrescriptionSnapshot | null;
  replaces?: PrescriptionReference | null;
  replacedBy?: PrescriptionReference | null;
  replacementReason?: string | null;
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
  clinicalContext?: PrescriptionContext | null;
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
  async downloadRecord(id: string) {
    const record = unwrapApiEnvelope<unknown>(
      await httpClient.get(
        `${path}/${encodeURIComponent(id)}/export`,
        undefined,
        { cache: 'no-store' },
      ),
    );
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(record, null, 2)], {
        type: 'application/json;charset=utf-8',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `don-thuoc-${id}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
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
      patientId?: string;
      clinicalContext?: PrescriptionContext;
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
  async replace(
    id: string,
    body: {
      clinicalContext?: PrescriptionContext;
      details: PrescriptionLine[];
      instructions: string;
      recipientUserId: string;
      recipientAuthorized: true;
      replacementReason: string;
    },
  ) {
    return unwrapApiEnvelope<PrescriptionReference>(
      await httpClient.post(
        `${path}/${encodeURIComponent(id)}/replacements`,
        body,
      ),
    );
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
