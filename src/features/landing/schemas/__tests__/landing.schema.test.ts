import { describe, it, expect } from 'vitest';
import { consultationLeadSchema, landingSearchSchema } from '../landing.schema';

describe('UT-SCH: Landing Schemas Validation', () => {
  it('UT-SCH-01: Validate thành công payload tư vấn hợp lệ', () => {
    const validData = {
      fullName: 'Trần Văn An',
      phoneNumber: '0912345678',
      packageInterest: 'FAMILY',
      notes: 'Khám cho mẹ 70 tuổi',
    };
    const res = consultationLeadSchema.safeParse(validData);
    expect(res.success).toBe(true);
  });

  it('UT-SCH-02: BVA Biên dưới độ dài fullName (B-1 = 1 ký tự)', () => {
    const invalidData = {
      fullName: 'A',
      phoneNumber: '0912345678',
      packageInterest: 'FAMILY',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/Họ tên tối thiểu 2 ký tự/i);
    }
  });

  it('UT-SCH-03: BVA Biên trên độ dài fullName (B+1 = 71 ký tự)', () => {
    const invalidData = {
      fullName: 'a'.repeat(71),
      phoneNumber: '0912345678',
      packageInterest: 'FAMILY',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/Họ tên tối đa 70 ký tự/i);
    }
  });

  it('UT-SCH-04: Validate số điện thoại Việt Nam sai định dạng', () => {
    const invalidData = {
      fullName: 'Lê Minh',
      phoneNumber: '0123456789',
      packageInterest: 'BASIC',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/Số điện thoại không hợp lệ/i);
    }
  });

  it('UT-SCH-05: Validate số điện thoại chứa ký tự chữ cái', () => {
    const invalidData = {
      fullName: 'Lê Minh',
      phoneNumber: '09123abc89',
      packageInterest: 'BASIC',
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
  });

  it('UT-SCH-06: BVA Biên trên độ dài notes (B = 255 ký tự)', () => {
    const validData = {
      fullName: 'Lê Minh',
      phoneNumber: '0988776655',
      packageInterest: 'VIP',
      notes: 'x'.repeat(255),
    };
    const res = consultationLeadSchema.safeParse(validData);
    expect(res.success).toBe(true);
  });

  it('UT-SCH-07: BVA Biên trên độ dài notes (B+1 = 256 ký tự)', () => {
    const invalidData = {
      fullName: 'Lê Minh',
      phoneNumber: '0988776655',
      packageInterest: 'VIP',
      notes: 'x'.repeat(256),
    };
    const res = consultationLeadSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/Ghi chú tối đa 255 ký tự/i);
    }
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
