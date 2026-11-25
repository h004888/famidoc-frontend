import { MedicalBookView } from '@/features/prescriptions/components/medical-book-view';
import { DoctorVisitWorkspace } from './doctor-visit-workspace';

export function DoctorEncountersView({
  encounterId,
  patientId,
}: { encounterId?: string; patientId?: string } = {}) {
  return encounterId ? (
    <DoctorVisitWorkspace key={encounterId} encounterId={encounterId} initialPatientId={patientId} />
  ) : (
    <MedicalBookView key={patientId} doctor initialPatientId={patientId} />
  );
}
