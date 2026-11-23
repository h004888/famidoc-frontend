import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemberVitalSignsSection } from '../member-vital-signs-section';
import { patientsApi } from '@/lib/api';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 240 }}>{children}</div>
    ),
  };
});

describe('MemberVitalSignsSection Modal Simplified IA', () => {
  const onVitalAdded = vi.fn();
  const onVitalUpdated = vi.fn();
  const onVitalDeleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses single blood pressure input, omits heart rate / recordedAt / respiratory rate, and submits context + notes', async () => {
    const addSpy = vi.spyOn(patientsApi, 'addMemberVitalSign').mockResolvedValue({
      id: 'vs-101',
      emrId: null,
      patientId: 'mem-1',
      systolicBp: 150,
      diastolicBp: null,
      heartRate: null,
      temperature: null,
      spo2: 98,
      respiratoryRate: null,
      bloodGlucose: 6.2,
      glucoseContext: 'FASTING',
      measurementState: 'AFTER_MEDICATION',
      notes: 'Đo buổi sáng sau khi nghỉ 10 phút',
      isAbnormalAlert: true,
      recordedAt: new Date().toISOString(),
    });

    render(
      <MemberVitalSignsSection
        memberId="mem-1"
        memberName="Phạm Ngọc Thọ"
        vitalSigns={[]}
        onVitalAdded={onVitalAdded}
        onVitalUpdated={onVitalUpdated}
        onVitalDeleted={onVitalDeleted}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Nhập chỉ số hôm nay/i }));

    // Chart tabs exclude Nhịp tim
    expect(screen.queryByRole('button', { name: 'Nhịp tim' })).not.toBeInTheDocument();

    // Grouped sections present
    expect(screen.getByText('Tim mạch & Hô hấp')).toBeInTheDocument();
    expect(screen.getByText('Thân nhiệt & Đường huyết')).toBeInTheDocument();
    expect(screen.getByText('Bối cảnh đo & Ghi chú')).toBeInTheDocument();

    // Removed fields are absent
    expect(screen.queryByLabelText(/Huyết áp tâm trương/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nhịp tim/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Thời điểm đo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chỉ số bổ sung/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nhịp thở/i)).not.toBeInTheDocument();

    // Single Blood Pressure input -> live warning appears when >= 140
    fireEvent.change(screen.getByLabelText(/Huyết áp \(mmHg\)/i), {
      target: { value: '150' },
    });
    expect(screen.getByText(/Phát hiện chỉ số vượt ngưỡng an toàn/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/SpO2/i), {
      target: { value: '98' },
    });

    // Blood glucose + context chip
    fireEvent.change(screen.getByLabelText(/Đường huyết/i), {
      target: { value: '6.2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lúc đói' }));

    // Measurement state chip + notes
    fireEvent.click(screen.getByRole('button', { name: 'Sau uống thuốc' }));
    fireEvent.change(screen.getByLabelText(/Ghi chú triệu chứng/i), {
      target: { value: 'Đo buổi sáng sau khi nghỉ 10 phút' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu chỉ số/i }));

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    expect(addSpy).toHaveBeenCalledWith('mem-1', {
      systolicBp: 150,
      spo2: 98,
      bloodGlucose: 6.2,
      glucoseContext: 'FASTING',
      measurementState: 'AFTER_MEDICATION',
      notes: 'Đo buổi sáng sau khi nghỉ 10 phút',
    });
    expect(onVitalAdded).toHaveBeenCalledTimes(1);
  });
});
