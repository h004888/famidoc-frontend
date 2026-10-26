import { describe, it, expect } from 'vitest';
import {
  formatVndCurrency,
  formatDoctorRating,
  formatEmergencyHotline,
} from '../landing-utils';

describe('UT-UTL: Landing Utils', () => {
  it('UT-UTL-01: Định dạng giá tiền VND kèm chu kỳ tháng', () => {
    expect(formatVndCurrency(1290000)).toBe('1.290.000đ / tháng');
    expect(formatVndCurrency(499000)).toBe('499.000đ / tháng');
  });

  it('UT-UTL-02: Định dạng điểm đánh giá bác sĩ và số lượt khám', () => {
    expect(formatDoctorRating(4.9, '420+ lượt khám')).toBe('4.9 (420+ lượt khám)');
  });

  it('UT-UTL-03: Format chuỗi hotline khẩn cấp có khoảng cách trực quan', () => {
    expect(formatEmergencyHotline('19008821')).toBe('1900 8821');
  });

  it('UT-UTL-04: Fallback format giá tiền khi truyền số âm hoặc không hợp lệ', () => {
    expect(formatVndCurrency(-500)).toBe('Liên hệ');
    expect(formatVndCurrency(NaN)).toBe('Liên hệ');
  });
});
