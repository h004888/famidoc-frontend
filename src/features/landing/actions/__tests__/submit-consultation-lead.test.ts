import { describe, it, expect } from 'vitest';
import { submitConsultationLeadAction } from '../submit-consultation-lead';

describe('UT-ACT: Submit Consultation Lead Action', () => {
  it('UT-ACT-01: Gửi đăng ký tư vấn thành công (Happy Path)', async () => {
    const payload = {
      fullName: 'Nguyễn Văn Minh',
      phoneNumber: '0987654321',
      packageInterest: 'FAMILY' as const,
      notes: 'Gia đình có 2 con nhỏ',
    };

    const result = await submitConsultationLeadAction(payload);
    expect(result.success).toBe(true);
    expect(result.leadId).toBe('lead-999');
  });

  it('UT-ACT-02: Chặn gọi backend khi Zod schema validation thất bại', async () => {
    const invalidPayload = {
      fullName: 'N', // too short
      phoneNumber: '123', // invalid phone
      packageInterest: 'FAMILY' as const,
    };

    const result = await submitConsultationLeadAction(invalidPayload);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.fullName).toBeDefined();
    expect(result.errors?.phoneNumber).toBeDefined();
  });

  it('UT-ACT-03: Xử lý lỗi 400 Bad Request từ Backend (trùng lặp SĐT)', async () => {
    const duplicatePayload = {
      fullName: 'Trần Văn Trùng',
      phoneNumber: '0900000000', // triggers 400 in mock handler
      packageInterest: 'BASIC' as const,
    };

    const result = await submitConsultationLeadAction(duplicatePayload);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Số điện thoại đã gửi yêu cầu trước đó');
  });

  it('UT-ACT-04: Xử lý sự cố mạng hoặc sập máy chủ 500', async () => {
    const errorPayload = {
      fullName: 'Lê Văn Lỗi',
      phoneNumber: '0911111111', // triggers 500 in mock handler
      packageInterest: 'VIP' as const,
    };

    const result = await submitConsultationLeadAction(errorPayload);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Hệ thống đang bảo trì, vui lòng gọi Hotline 1900 8821/i);
  });
});
