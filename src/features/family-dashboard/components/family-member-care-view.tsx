'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { PatientAllergyDto, PatientDocumentDto, PatientDto, VitalSignDto } from '@/lib/api';
import { extractErrorMessage, patientsApi } from '@/lib/api';
import { MemberVitalSignsSection } from './member-vital-signs-section';
import { MemberHeroBanner } from './member-hero-section';
import { HealthMetricsCards } from './member-metrics-cards';
import { MemberQuickActionTasks, MemberEmptyVitalsState } from './member-actions';
import { MemberDocumentUploadSection } from './member-document-upload-section';
import { MemberPathologySection } from './member-pathology-section';
import { MemberProfileSkeleton, MemberProfileError } from './member-common';
import { MemberContext } from './member-context';
import * as MP from '../utils/member-profile.util';

/* ═══════════════════════════════════════════════════
   Legacy type re-export (used by family-dashboard-view)
   ═══════════════════════════════════════════════════ */

export interface MemberHealthData {
  id: string; name: string; relation: string; age: number; avatar: string;
  bhyt: string; bloodType: string; allergies: string; chronicCondition: string;
  status: 'good' | 'warning'; statusText: string; bp: string; bpStatus: string;
  spo2: string; heartRate: string; glucose: string; glucoseStatus: string; lastUpdated: string;
  upcomingVisit?: { doctor: string; specialty: string; hospital: string; time: string; date: string; mode: 'home' | 'telehealth'; note: string; };
}

export const INITIAL_FAMILY_MEMBERS_DATA: Record<string, MemberHealthData> = {};

/* ═══════════════════════════════════════════════════
   Main Component — Health Profile at a Glance
   ═══════════════════════════════════════════════════ */

export function FamilyMemberCareView({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<PatientDto | null>(null);
  const [allergies, setAllergies] = useState<PatientAllergyDto[]>([]);
  const [documents, setDocuments] = useState<PatientDocumentDto[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSignDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* Load data on mount */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      const [mRes, vRes] = await Promise.allSettled([
        patientsApi.getMemberById(memberId),
        patientsApi.getMemberVitalSigns(memberId, 30),
      ]);
      if (cancelled) return;
      if (mRes.status === 'rejected' || !mRes.value) {
        const msg = mRes.status === 'rejected'
          ? extractErrorMessage(mRes.reason, 'Không thể tải hồ sơ thành viên.')
          : 'Không tìm thấy hồ sơ thành viên.';
        setMember(null);
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }
      const loadedM = mRes.value;
      const vitals = vRes.status === 'fulfilled' && Array.isArray(vRes.value) ? vRes.value : [];
      setMember(loadedM);
      try { localStorage.setItem(`member_name_${loadedM.id}`, loadedM.fullName); } catch {}
      setAllergies(loadedM.allergies ?? []);
      setDocuments(loadedM.documents ?? []);
      setVitalSigns(vitals);
      setIsLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [memberId]);

  /* Derived state */
  const age = member ? MP.calculateAge(member.dateOfBirth) : null;
  const initials = member ? MP.getMemberInitials(member.fullName) : '';
  const parsedVitals = useMemo(() => MP.parseLatestVitals(vitalSigns), [vitalSigns]);
  const abnormal = useMemo(() => MP.hasAbnormalVitals(parsedVitals, vitalSigns), [parsedVitals, vitalSigns]);
  const chronicStr = member?.chronicDiseases?.trim() ?? '';
  const severeNames = MP.severeAllergenNames(allergies);

  /* Render states */
  if (isLoading) return <MemberProfileSkeleton />;
  if (errorMessage || !member) return <MemberProfileError message={errorMessage || undefined} />;

  return (
    <MemberContext.Provider value={{ id: member.id, name: member.fullName }}>
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 pb-24 lg:pb-6">
      {/* 1. Hero banner — personal info */}
      <MemberHeroBanner member={member} age={age} initials={initials} />

      {/* 3. Health metrics cards — BP, HR, SpO2, Temp */}
      <HealthMetricsCards parsedVitals={parsedVitals} />

      {/* 4. Quick action task cards */}
      <MemberQuickActionTasks
        memberId={member.id}
        allergies={allergies}
        severeNames={severeNames}
        chronicStr={chronicStr}
      />

      {/* 5. No-vitals empty state */}
      {!parsedVitals && vitalSigns.length === 0 && !abnormal && (
        <MemberEmptyVitalsState memberName={member.fullName} />
      )}

      {/* 6. Full-width vital signs chart */}
      <section id="vitals-section" className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <MemberVitalSignsSection
          memberId={member.id}
          memberName={member.fullName}
          vitalSigns={vitalSigns}
          onVitalAdded={(v) => setVitalSigns(p => [v, ...p])}
          onVitalUpdated={(v) => setVitalSigns(p => p.map(x => x.id === v.id ? v : x))}
          onVitalDeleted={(id) => setVitalSigns(p => p.filter(v => v.id !== id))}
        />
      </section>

      {/* 7. Full-width Info panel — pathology + documents stacked */}
      <section id="pathology-tab" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Pathology + Allergies section */}
          <div>
            <MemberPathologySection
              memberId={member.id}
              memberName={member.fullName}
              chronicDiseases={chronicStr}
              allergies={allergies}
              onChronicUpdated={(next) =>
                setMember((prev) => (prev ? { ...prev, chronicDiseases: next } : prev))
              }
              onAllergyAdded={(created) => setAllergies((prev) => [created, ...prev])}
              onAllergyDeleted={(id) =>
                setAllergies((prev) => prev.filter((a) => a.id !== id))
              }
            />
          </div>

          {/* Documents section */}
          <div id="documents-section">
            <MemberDocumentUploadSection
              memberId={member.id}
              memberName={member.fullName}
              documents={documents}
              onDocumentAdded={(created) => setDocuments((prev) => [created, ...prev])}
              onDocumentDeleted={(id) =>
                setDocuments((prev) => prev.filter((doc) => doc.id !== id))
              }
            />
          </div>
        </div>
      </section>
      </div>
    </MemberContext.Provider>
  );
}
