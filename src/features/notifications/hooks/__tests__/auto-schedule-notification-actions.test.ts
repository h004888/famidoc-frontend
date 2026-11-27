import { describe, expect, it } from 'vitest';
import { getDoctorNotificationAction } from '../use-doctor-notifications';
import { getFacilityNotificationAction } from '../use-facility-notifications';
import { getNotificationAction } from '../use-family-notifications';

const base = {
  id: 'n-1',
  title: 'Thông báo',
  content: '',
  referenceId: 'contract-1',
  isRead: false,
  createdAt: '2026-11-27T05:00:00Z',
};

describe('Thông báo xếp lịch tự động sau thanh toán (referenceId = mã hợp đồng)', () => {
  it('bác sĩ: ENCOUNTER_MANUAL_SCHEDULE_REQUIRED mở trang xếp lịch thủ công, không mở ca khám theo mã hợp đồng', () => {
    const action = getDoctorNotificationAction({ ...base, type: 'ENCOUNTER_MANUAL_SCHEDULE_REQUIRED' });
    expect(action.href).toBe('/doctor/timetable/manual-schedule');
    expect(action.type).toBe('Cần xếp lịch tay');
  });

  it('bác sĩ: ENCOUNTER_AUTO_CONFIRMED mở lịch trực, không mở ca khám theo mã hợp đồng', () => {
    const action = getDoctorNotificationAction({ ...base, type: 'ENCOUNTER_AUTO_CONFIRMED' });
    expect(action.href).toBe('/doctor/timetable');
  });

  it('bác sĩ: thông báo ca khám khác vẫn mở đúng ca khám', () => {
    const action = getDoctorNotificationAction({ ...base, type: 'ENCOUNTER_RECORD_OVERDUE', referenceId: 'enc-1' });
    expect(action.href).toBe('/doctor/encounters?encounterId=enc-1');
  });

  it.each([
    ['ENCOUNTER_AUTO_SCHEDULE_FAILED', 'Lỗi xếp lịch'],
    ['ENCOUNTER_AUTO_SCHEDULE_MISSING_DATA', 'Thiếu thông tin xếp lịch'],
  ])('CSYT: %s mở chi tiết hợp đồng để xếp lịch lại', (type, label) => {
    const action = getFacilityNotificationAction({ ...base, type });
    expect(action.href).toBe('/facility/coordination/contract-1');
    expect(action.label).toBe('Xếp lịch lại');
    expect(action.type).toBe(label);
  });

  it.each([
    ['ENCOUNTER_MANUAL_SCHEDULE_REQUIRED', 'Chờ bác sĩ xếp lịch'],
    ['ENCOUNTER_AUTO_SCHEDULE_FAILED', 'Xếp lịch chưa thành công'],
    ['ENCOUNTER_AUTO_SCHEDULE_MISSING_DATA', 'Cần bổ sung thông tin'],
  ])('gia đình: %s có nhãn riêng và mở lịch hẹn', (type, label) => {
    const action = getNotificationAction({ ...base, type });
    expect(action?.href).toBe('/family/appointments');
    expect(action?.type).toBe(label);
  });
});
