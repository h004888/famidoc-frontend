import { describe, it, expect } from 'vitest';
import { profileSettingsSchema, changePasswordSchema } from '../settings.schema';

describe('UT-SCH-06: Profile & Security Settings Schemas', () => {
  it('validates valid profile settings input', () => {
    const valid = profileSettingsSchema.safeParse({
      fullName: 'Nguyễn Văn An',
      phone: '0912345678',
      email: 'an.nguyen@famidoc.vn',
      birthDate: '1985-05-15',
      gender: 'MALE',
      address: 'Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội',
      insuranceCardNumber: 'GD4010123456789',
      bloodType: 'O+',
      allergies: 'Dị ứng phấn hoa',
    });
    expect(valid.success).toBe(true);
  });

  it('validates password matching on password change', () => {
    const mismatch = changePasswordSchema.safeParse({
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmNewPassword: 'MismatchPassword123',
    });
    expect(mismatch.success).toBe(false);
  });
});
