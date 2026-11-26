import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitCompletionSummary } from '../visit-completion-summary';
import type { EncounterItem, EncounterPatient } from '@/lib/api/encounters.api';

describe('VisitCompletionSummary (Task 20)', () => {
  it('lấy dữ liệu từ encounter.participants và clinicalEmrs khi memberSummaries rỗng (sau reload), không gán nhầm ABSENT thành Đã chốt hồ sơ', () => {
    const encounter = {
      id: 'enc-1',
      contractId: 'con-1',
      doctorId: 'doc-1',
      encounterType: 'HOME_VISIT',
      category: 'PERIODIC_ROUTINE',
      scheduledDate: '2026-11-26',
      scheduledTime: '08:30:00',
      encounterStatus: 'COMPLETED',
      familyConfirmedArrivalAt: '2026-11-26T08:35:00Z',
      participants: [
        {
          id: 'part-1',
          patientId: 'pat-1',
          attendanceStatus: 'EXAMINED',
          absenceReason: null,
        },
        {
          id: 'part-2',
          patientId: 'pat-2',
          attendanceStatus: 'ABSENT',
          absenceReason: 'Đi công tác',
        },
      ],
      clinicalEmrs: [
        {
          id: 'emr-1',
          patientId: 'pat-1',
          isFinalized: true,
          prescriptions: [{ id: 'rx-1' }],
        },
      ],
    } as EncounterItem;

    const members: EncounterPatient[] = [
      { id: 'pat-1', fullName: 'Nguyễn Văn An' },
      { id: 'pat-2', fullName: 'Trần Thị Bình' },
    ];

    render(
      <VisitCompletionSummary
        encounter={encounter}
        members={members}
        memberSummaries={[]}
      />,
    );

    expect(screen.getByText(/Đã chốt hồ sơ/i)).toBeInTheDocument();
    expect(screen.getByText(/Vắng — Đi công tác/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Đã chốt hồ sơ/i)).toHaveLength(1);
    expect(screen.getByText(/1 đơn thuốc/i)).toBeInTheDocument();
  });
});
