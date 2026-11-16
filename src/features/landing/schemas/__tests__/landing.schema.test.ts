import { describe, it, expect } from 'vitest';
import { consultationLeadSchema, landingSearchSchema } from '../landing.schema';

describe('UT-SCH: Landing Schemas Validation', () => {
  it('UT-SCH-01: Validate thành công payload tư vấn hợp lệ khớp Backend DTO', () => {
    const validData = {
      fullName: 'Trần Văn An',
      phone: '0912345678',
      email: 'an.tran@famidoc.vn',
      healthNeeds: 'Gia đình có mẹ 70 tuổi cần theo dõi huyết áp tại nhà.',
      preferredPackageId: '20000000-0000-4000-8000-000000000002',
    };
    const res = consultationLeadSchema.safeParse(validData);
    expect(res.success).toBe(true);
  });

  it('UT-SCH-02: BVA Biên dưới độ dài fullName (B-1 = 1 ký tự)', () => {
    const invalidData = {
      fullName: 'A',
      phone: '0912345678',
      email: 'an@famidoc.vn',
      healthNeeds: 'Cần bác sĩ tư vấn sức khỏe gia đình.',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/Họ tên tối thiểu 2 ký tự/i);
    }
  });

  it('UT-SCH-03: BVA Biên trên độ dài fullName (B+1 = 101 ký tự)', () => {
    const invalidData = {
      fullName: 'a'.repeat(101),
      phone: '0912345678',
      email: 'an@famidoc.vn',
      healthNeeds: 'Cần bác sĩ tư vấn sức khỏe gia đình.',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/Họ tên tối đa 100 ký tự/i);
    }
  });

  it('UT-SCH-04: Validate số điện thoại Việt Nam sai định dạng', () => {
    const invalidData = {
      fullName: 'Lê Minh',
      phone: '0123456789',
      email: 'minh@famidoc.vn',
      healthNeeds: 'Cần bác sĩ tư vấn sức khỏe gia đình.',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/Số điện thoại không hợp lệ/i);
    }
  });

  it('UT-SCH-05: Validate email sai định dạng và healthNeeds quá ngắn', () => {
    const invalidData = {
      fullName: 'Lê Minh',
      phone: '0912345678',
      email: 'khong-hop-le',
      healthNeeds: 'Ngắn',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      const messages = res.error.issues.map((i) => i.message);
      expect(messages.some((m) => /email không hợp lệ/i.test(m))).toBe(true);
      expect(messages.some((m) => /tối thiểu 10 ký tự/i.test(m))).toBe(true);
    }
  });

  it('UT-SCH-06: Validate preferredPackageId phải là UUID hợp lệ nếu có truyền', () => {
    const invalidData = {
      fullName: 'Lê Minh',
      phone: '0988776655',
      email: 'minh@famidoc.vn',
      healthNeeds: 'Cần bác sĩ gia đình khám định kỳ hàng tháng.',
      preferredPackageId: 'BASIC',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
  });

  it('UT-SCH-08: Validate từ khóa tìm kiếm rỗng sau trim', () => {
    const invalidData = {
      searchQuery: '   ',
    };
    const res = landingSearchSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
  });

  it('UT-SCH-09: Validate từ khóa tìm kiếm hợp lệ', () => {
    const validData = {
      searchQuery: '  bác sĩ nhi  ',
    };
    const res = landingSearchSchema.safeParse(validData);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.searchQuery).toBe('bác sĩ nhi');
    }
  });
});
