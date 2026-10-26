import { describe, it, expect } from 'vitest';
import { packageItemSchema } from '../package.schema';

describe('UT-SCH-07: Package Schema Contract Validation', () => {
  it('validates standard care package item', () => {
    const valid = packageItemSchema.safeParse({
      id: 'pkg-family',
      name: 'Gia Đình Toàn Diện',
      price: 1290000,
      period: 'tháng',
      tier: 'Toàn diện',
      badgeColor: 'amber',
      isPopular: true,
      features: [
        'Bác sĩ riêng chỉ định thăm khám',
        '6 lượt khám tận nhà / năm',
        'Xét nghiệm máu & sinh hóa cơ bản',
      ],
      doctorTier: 'Bác sĩ chuyên khoa I / Thạc sĩ',
    });
    expect(valid.success).toBe(true);
  });
});
