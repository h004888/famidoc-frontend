import { unwrapApiEnvelope } from './envelope';
import { httpClient } from './http-client';
import type { PatientDocumentType } from './patients.api';
import type {
  FamilyPrescriptionDetail,
  PrescriptionExam,
  PrescriptionContext,
  PrescriptionLine,
  PrescriptionPage,
} from './prescriptions.api';

export interface BookMember {
  id: string;
  fullName: string;
  dateOfBirth: string;
  relationshipToHead: string;
}

export interface BookFamily {
  id: string;
  representativeName: string;
  members: BookMember[];
}

export interface BookVisit {
  id: string;
  encounterType: string;
  scheduledDate: string;
  scheduledTime: string;
  doctorName: string;
  isFinalized: boolean;
  diagnosis: string | null;
}

export interface VisitVitals {
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  weightKg?: number;
}

export interface BookVisitDetail extends Omit<BookVisit, 'diagnosis'> {
  visitScope?: 'FAMILY' | 'INDIVIDUAL';
  participants?: Array<{ id: string; fullName: string }>;
  patient: BookMember & { familyId: string; gender?: string };
  facility?: { facilityName: string; address: string | null; phone?: string };
  exam: PrescriptionExam | null;
  vitals?: (VisitVitals & { recordedAt: string; source: 'DRAFT' | 'PREVIOUS' }) | null;
  finalizedAt: string | null;
  recipient: { id: string; name: string } | null;
  prescription: Pick<
    FamilyPrescriptionDetail,
    | 'id'
    | 'prescriptionCode'
    | 'status'
    | 'instructions'
    | 'details'
    | 'clinicalContext'
    | 'prescribedDate'
    | 'validUntil'
    | 'recordSnapshot'
    | 'replaces'
    | 'replacedBy'
    | 'replacementReason'
  > | null;
  prescriptionHistory?: NonNullable<BookVisitDetail['prescription']>[];
}

export interface BookDocument {
  id: string;
  documentName: string;
  documentType: string;
  fileUrl: string | null;
  downloadAvailable: boolean;
  recordedDate: string;
}

export interface ConfirmBookVisit {
  patientId: string;
  confirmed: true;
  exam?: PrescriptionExam;
  vitals?: VisitVitals;
  prescription?: {
    clinicalContext?: PrescriptionContext;
    details: PrescriptionLine[];
    instructions: string;
    recipientUserId: string;
    recipientAuthorized: true;
  };
}

export type FamilyPrescriptionEntry = NonNullable<
  ConfirmBookVisit['prescription']
> & {
  encounterId: string;
  patientId: string;
};

const path = '/api/v1/medical-books';
const patientPath = (familyId: string, patientId: string) =>
  `${path}/families/${encodeURIComponent(familyId)}/patients/${encodeURIComponent(patientId)}`;

export const medicalBooksApi = {
  async familyPrescriptionVisits(
    familyId: string,
    date: string,
    signal: AbortSignal,
  ) {
    return unwrapApiEnvelope<{ items: BookVisitDetail[] }>(
      await httpClient.get(
        `${path}/families/${encodeURIComponent(familyId)}/prescription-visits`,
        { date },
        { signal, cache: 'no-store' },
      ),
    );
  },
  async prescribeFamily(
    familyId: string,
    prescriptions: FamilyPrescriptionEntry[],
  ) {
    return unwrapApiEnvelope<{
      familyId: string;
      items: {
        id: string;
        prescriptionCode: string;
        patientId: string;
        encounterId: string;
      }[];
    }>(
      await httpClient.post(
        `${path}/families/${encodeURIComponent(familyId)}/prescriptions`,
        { prescriptions },
      ),
    );
  },
  async families(page: number, signal: AbortSignal) {
    return unwrapApiEnvelope<PrescriptionPage<BookFamily>>(
      await httpClient.get(
        `${path}/families`,
        { page },
        { signal, cache: 'no-store' },
      ),
    );
  },
  async visits(
    familyId: string,
    patientId: string,
    page: number,
    signal: AbortSignal,
  ) {
    return unwrapApiEnvelope<PrescriptionPage<BookVisit>>(
      await httpClient.get(
        `${patientPath(familyId, patientId)}/visits`,
        { page },
        { signal, cache: 'no-store' },
      ),
    );
  },
  async documents(familyId: string, patientId: string, signal: AbortSignal) {
    return unwrapApiEnvelope<BookDocument[]>(
      await httpClient.get(
        `${patientPath(familyId, patientId)}/documents`,
        undefined,
        { signal, cache: 'no-store' },
      ),
    );
  },
  async uploadDocument(
    familyId: string,
    patientId: string,
    input: {
      documentName: string;
      documentType: PatientDocumentType;
      recordedDate: string;
      file: File;
    },
  ) {
    const form = new FormData();
    form.set('documentName', input.documentName);
    form.set('documentType', input.documentType);
    form.set('recordedDate', input.recordedDate);
    form.set('file', input.file);
    return unwrapApiEnvelope<BookDocument>(
      await httpClient.upload(
        `${patientPath(familyId, patientId)}/documents`,
        form,
      ),
    );
  },
  downloadDocument(familyId: string, patientId: string, id: string) {
    return httpClient.getBlob(
      `${patientPath(familyId, patientId)}/documents/${encodeURIComponent(id)}/file`,
      { cache: 'no-store' },
    );
  },
  async visit(id: string, signal: AbortSignal, patientId?: string) {
    return unwrapApiEnvelope<BookVisitDetail>(
      await httpClient.get(
        `${path}/visits/${encodeURIComponent(id)}`,
        patientId ? { patientId } : undefined,
        { signal, cache: 'no-store' },
      ),
    );
  },
  async saveDraft(
    id: string,
    body: { patientId: string; exam?: Partial<PrescriptionExam>; vitals?: VisitVitals },
  ) {
    return unwrapApiEnvelope<{
      encounterId: string;
      emrId: string;
      isFinalized: boolean;
      savedAt: string;
    }>(
      await httpClient.put(
        `${path}/visits/${encodeURIComponent(id)}/draft`,
        body,
      ),
    );
  },
  async confirm(id: string, body: ConfirmBookVisit) {
    return unwrapApiEnvelope<{ encounterId: string; finalizedAt: string }>(
      await httpClient.post(
        `${path}/visits/${encodeURIComponent(id)}/confirm`,
        body,
      ),
    );
  },
};
