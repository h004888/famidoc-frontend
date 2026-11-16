import { describe, it, expect } from 'vitest';
import { submitConsultationLeadAction } from '../submit-consultation-lead';

describe('UT-ACT: Submit Consultation Lead Action', () => {
  it('UT-ACT-01: Gửi đăng ký tư vấn thành công tới /api/v1/public/consultation-requests', async () => {
    const payload = {
      fullName: 'Nguyễn Văn Minh',
      phone: '0987654321',
      email: 'minh.nguyen@famidoc.vn',
      healthNeeds: 'Gia đình có 2 con nhỏ và bố mẹ lớn tuổi cần theo dõi định kỳ.',
      preferredPackageId: '20000000-0000-4000-8000-000000000002',
    };

    const result = await submitConsultationLeadAction(payload);
    expect(result.success).toBe(true);
    expect(result.ticketId).toBe('CRQ-TEST-999');
  });

  it('UT-ACT-02: Chặn gọi backend khi Zod schema validation thất bại', async () => {
    const invalidPayload = {
      fullName: 'N',
      phone: '123',
      email: 'invalid',
      healthNeeds: 'ngắn',
    };

    const result = await submitConsultationLeadAction(invalidPayload);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.fullName).toBeDefined();
    expect(result.errors?.phone).toBeDefined();
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.healthNeeds).toBeDefined();
  });

  it('UT-ACT-03: Xử lý lỗi 400 Bad Request từ Backend', async () => {
    const duplicatePayload = {
      fullName: 'Trần Văn Trùng',
      phone: '0900000000',
      email: 'trung@famidoc.vn',
      healthNeeds: 'Gia đình cần tư vấn gói chăm sóc sức khỏe tại nhà.',
    };

    const result = await submitConsultationLeadAction(duplicatePayload);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Số điện thoại đã gửi yêu cầu trước đó');
  });

  it('UT-ACT-04: Xử lý sự cố mạng hoặc sập máy chủ 500', async () => {
    const errorPayload = {
      fullName: 'Lê Văn Lỗi',
      phone: '0911111111',
      email: 'loi@famidoc.vn',
      healthNeeds: 'Gia đình cần tư vấn gói chăm sóc sức khỏe tại nhà.',
    };

    const result = await submitConsultationLeadAction(errorPayload);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Hệ thống đang bảo trì, vui lòng gọi Hotline 1900 8821/i);
  });
});
