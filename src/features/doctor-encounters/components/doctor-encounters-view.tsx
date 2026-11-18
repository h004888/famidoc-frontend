import {
  DoctorBookVisitView,
  MedicalBookView,
} from '@/features/prescriptions/components/medical-book-view';

export function DoctorEncountersView({
  encounterId,
  patientId,
}: { encounterId?: string; patientId?: string } = {}) {
  return encounterId ? (
    <DoctorBookVisitView key={encounterId} id={encounterId} patientId={patientId} />
  ) : (
    <MedicalBookView key={patientId} doctor initialPatientId={patientId} />
  );
}
