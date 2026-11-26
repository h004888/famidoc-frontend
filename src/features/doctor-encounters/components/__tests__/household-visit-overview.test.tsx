import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HouseholdVisitOverview } from '../household-visit-overview';
import { VisitCompletionSummary } from '../visit-completion-summary';
import type { EncounterItem, EncounterPatient } from '@/lib/api/encounters.api';

function makeEncounter(overrides: Partial<EncounterItem> = {}): EncounterItem {
  return {
    id: 'enc-hub-1',
    contractId: 'con-1',
    doctorId: 'doc-1',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    scheduledDate: '2026-11-25',
    scheduledTime: '08:30:00',
    slotWindow: 'MORNING',
    encounterStatus: 'CONFIRMED',
    familyConfirmedArrivalAt: '2026-11-25T01:35:00.000Z',
    doctorCompletedAt: null,
    recordOverdueAt: null,
    participants: [
      { id: 'part-1', patientId: 'pat-1', attendanceStatus: 'EXAMINED' },
    ],
    clinicalEmrs: [],
    contract: {
      id: 'con-1',
      familyRepresentativeName: 'Nguyễn Văn An',
      familyRepresentativePhone: '0901234567',
      familyUnit: {
        id: 'fam-1',
        familyName: 'Gia đình Nguyễn Văn An',
        homeAddress: '123 Nguyễn Trãi, Q.1',
      },
    },
    ...overrides,
  } as EncounterItem;
}

const singleMember: EncounterPatient[] = [
  {
    id: 'pat-1',
    fullName: 'Nguyễn Văn An',
    allergies: ['Penicillin'],
    chronicDiseases: ['Tăng huyết áp'],
  },
];

describe('HouseholdVisitOverview & VisitCompletionSummary', () => {
  it('render bảng chi tiết thành viên kể cả khi hộ chỉ có 1 thành viên với dị ứng, bệnh nền, trạng thái hồ sơ và nút Khám & Ghi hồ sơ', () => {
    const onStartExam = vi.fn();
    const encounter = makeEncounter({
      clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: false }],
    });

    render(
      <HouseholdVisitOverview
        encounter={encounter}
        members={singleMember}
        isOverdue={false}
        onStartExam={onStartExam}
        onChangeAttendance={vi.fn()}
        onCompleteVisit={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Penicillin/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Tăng huyết áp/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Đang ghi \(Nháp\)/i).length).toBeGreaterThanOrEqual(1);

    const examBtn = screen.getAllByRole('button', { name: /^Khám$/i })[0];
    fireEvent.click(examBtn);
    expect(onStartExam).toHaveBeenCalledWith('pat-1');
  });

  it('cảnh báo danh sách người chưa chốt và KHÔNG mở modal khi bấm Hoàn tất lúc còn thành viên EXAMINED chưa chốt', () => {
    const encounter = makeEncounter({
      participants: [
        { id: 'part-1', patientId: 'pat-1', attendanceStatus: 'EXAMINED' },
        { id: 'part-2', patientId: 'pat-2', attendanceStatus: 'EXAMINED' },
      ],
      clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
    });
    const members: EncounterPatient[] = [
      ...singleMember,
      { id: 'pat-2', fullName: 'Trần Thị Bình', allergies: [], chronicDiseases: [] },
    ];

    render(
      <HouseholdVisitOverview
        encounter={encounter}
        members={members}
        isOverdue={false}
        onStartExam={vi.fn()}
        onChangeAttendance={vi.fn()}
        onCompleteVisit={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/✓ Đã chốt hồ sơ/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Chưa ghi nhận/i).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i }));

    expect(screen.getByText(/Vẫn còn thành viên chưa chốt hồ sơ/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mở modal xác nhận khi mọi thành viên EXAMINED đã chốt; nếu quá hạn bắt buộc nhập lý do nộp trễ mới gọi onCompleteVisit', () => {
    const onCompleteVisit = vi.fn();
    const encounter = makeEncounter({
      participants: [{ id: 'part-1', patientId: 'pat-1', attendanceStatus: 'EXAMINED' }],
      clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
      recordOverdueAt: '2026-11-26T00:05:00+07:00',
    });

    render(
      <HouseholdVisitOverview
        encounter={encounter}
        members={singleMember}
        isOverdue={true}
        onStartExam={vi.fn()}
        onChangeAttendance={vi.fn()}
        onCompleteVisit={onCompleteVisit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận hoàn tất/i });
    fireEvent.click(confirmBtn);
    expect(onCompleteVisit).not.toHaveBeenCalled();
    expect(screen.getByText(/Vui lòng nhập lý do nộp hồ sơ trễ/i)).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/Lý do nộp hồ sơ trễ/i);
    fireEvent.change(reasonInput, { target: { value: 'Mất kết nối mạng tại vùng xa' } });
    fireEvent.click(confirmBtn);

    expect(onCompleteVisit).toHaveBeenCalledWith('Mất kết nối mạng tại vùng xa');
  });

  it('VisitCompletionSummary hiển thị bảng tổng hợp chẩn đoán/đơn thuốc từng thành viên và link Quay về Lịch trực & Ca khám', () => {
    const encounter = makeEncounter({
      encounterStatus: 'COMPLETED',
      doctorCompletedAt: '2026-11-25T11:10:00+07:00',
    });

    render(
      <VisitCompletionSummary
        encounter={encounter}
        members={singleMember}
        memberSummaries={[
          {
            patientId: 'pat-1',
            patientName: 'Nguyễn Văn An',
            attendanceStatus: 'EXAMINED',
            icd10Code: 'I10',
            icd10Diagnosis: 'Tăng huyết áp vô căn',
            prescriptionSummary: 'Amlodipine 5mg (1 đơn)',
          },
        ]}
      />,
    );

    expect(screen.getByText(/I10/i)).toBeInTheDocument();
    expect(screen.getByText(/Tăng huyết áp vô căn/i)).toBeInTheDocument();
    expect(screen.getByText(/Amlodipine 5mg/i)).toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: /Quay về Lịch trực & Ca khám/i });
    expect(backLink).toHaveAttribute('href', '/doctor/timetable');
  });

  it('Task 18: mở dialog nhập lý do vắng, disable khi pending, hiện lỗi tại hàng, hoàn tác vắng, và badge mobile', async () => {
    let resolveChange!: () => void;
    const onChangeAttendance = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveChange = resolve;
          }),
      )
      .mockRejectedValueOnce(new Error('Lỗi mạng'))
      .mockResolvedValueOnce(undefined);

    const encounter = makeEncounter({
      participants: [{ id: 'part-1', patientId: 'pat-1', attendanceStatus: 'PLANNED' }],
    });

    const { rerender } = render(
      <HouseholdVisitOverview
        encounter={encounter}
        members={singleMember}
        isOverdue={false}
        onStartExam={vi.fn()}
        onChangeAttendance={onChangeAttendance}
        onCompleteVisit={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Chờ khám').length).toBeGreaterThanOrEqual(1);

    // (a)(b) bấm Đánh dấu vắng -> nhập lý do -> xác nhận -> pending disabled
    fireEvent.click(screen.getAllByRole('button', { name: /Đánh dấu vắng/i })[0]);
    fireEvent.change(screen.getByLabelText(/Lý do vắng/i), {
      target: { value: 'Đi công tác' },
    });
    const confirmAbsent = screen.getByRole('button', { name: /Xác nhận vắng/i });
    fireEvent.click(confirmAbsent);
    fireEvent.click(confirmAbsent);
    expect(onChangeAttendance).toHaveBeenCalledTimes(1);
    expect(onChangeAttendance).toHaveBeenCalledWith('pat-1', 'ABSENT', 'Đi công tác');
    resolveChange();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // (c) lỗi tại hàng
    fireEvent.click(screen.getAllByRole('button', { name: /Đánh dấu vắng/i })[0]);
    fireEvent.change(screen.getByLabelText(/Lý do vắng/i), {
      target: { value: 'Đi công tác' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận vắng/i }));
    expect((await screen.findAllByText(/Lỗi mạng/i)).length).toBeGreaterThanOrEqual(1);

    // (d) ABSENT -> Hoàn tác vắng
    rerender(
      <HouseholdVisitOverview
        encounter={makeEncounter({
          participants: [
            {
              id: 'part-1',
              patientId: 'pat-1',
              attendanceStatus: 'ABSENT',
              absenceReason: 'Đi công tác',
            },
          ],
        })}
        members={singleMember}
        isOverdue={false}
        onStartExam={vi.fn()}
        onChangeAttendance={onChangeAttendance}
        onCompleteVisit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Hoàn tác vắng/i })[0]);
    expect(onChangeAttendance).toHaveBeenLastCalledWith('pat-1', 'PLANNED');
  });

  it('Task 19 & 21: disable nút hoàn tất khi còn PLANNED, dialog chờ server, badge Quá hạn hồ sơ không có Mức 1', async () => {
    const members: EncounterPatient[] = [
      ...singleMember,
      { id: 'pat-2', fullName: 'Trần Thị Bình', allergies: [], chronicDiseases: [] },
    ];
    const pendingEncounter = makeEncounter({
      participants: [
        { id: 'part-1', patientId: 'pat-1', attendanceStatus: 'EXAMINED' },
        { id: 'part-2', patientId: 'pat-2', attendanceStatus: 'PLANNED' },
      ],
      clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
    });

    const { rerender } = render(
      <HouseholdVisitOverview
        encounter={pendingEncounter}
        members={members}
        isOverdue={true}
        onStartExam={vi.fn()}
        onChangeAttendance={vi.fn()}
        onCompleteVisit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Quá hạn hồ sơ/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mức 1/)).not.toBeInTheDocument();
    expect(screen.getByText(/Còn 1 thành viên chưa điểm danh/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i }),
    ).toBeDisabled();

    // Khi đủ điều kiện -> dialog chờ server, lỗi giữ dialog mở
    let resolveComplete!: () => void;
    const onCompleteVisit = vi
      .fn()
      .mockRejectedValueOnce(new Error('Còn 1 thành viên chưa điểm danh (khám hoặc vắng).'))
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveComplete = resolve;
          }),
      );

    rerender(
      <HouseholdVisitOverview
        encounter={makeEncounter({
          participants: [{ id: 'part-1', patientId: 'pat-1', attendanceStatus: 'EXAMINED' }],
          clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
        })}
        members={singleMember}
        isOverdue={false}
        onStartExam={vi.fn()}
        onChangeAttendance={vi.fn()}
        onCompleteVisit={onCompleteVisit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Xác nhận hoàn tất/i }));
    expect(
      await screen.findByText(/Còn 1 thành viên chưa điểm danh \(khám hoặc vắng\)\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hoàn tất/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    resolveComplete();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
