import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerFamilySchema,
  forgotPasswordSchema,
} from '../auth.schema';

describe('UT-SCH-01..05: Auth Schemas & Contracts Validation', () => {
  describe('loginSchema', () => {
    it('UT-SCH-01: validates valid phone and password', () => {
      const result = loginSchema.safeParse({
        phone: '0912345678',
        password: 'Password123',
        role: 'FAMILY',
      });
      expect(result.success).toBe(true);
    });

    it('UT-SCH-02: invalidates phone numbers with invalid format or length', () => {
      const result = loginSchema.safeParse({
        phone: '012345678', // only 9 digits
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.phone).toBeDefined();
      }
    });

    it('UT-SCH-03: invalidates passwords shorter than 8 characters', () => {
      const result = loginSchema.safeParse({
        phone: '0912345678',
        password: 'Short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });
  });

  describe('registerFamilySchema', () => {
    it('UT-SCH-04: validates full registration input', () => {
      const result = registerFamilySchema.safeParse({
        fullName: 'Nguyễn Văn An',
        phone: '0912345678',
        email: 'an.nguyen@famidoc.vn',
        identityCard: '001099012345',
        relationship: 'Chủ hộ',
        password: 'Password123',
        confirmPassword: 'Password123',
        acceptTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it('fails when passwords do not match or CCCD is not 12 digits', () => {
      const result = registerFamilySchema.safeParse({
        fullName: 'Nguyễn Văn An',
        phone: '0912345678',
        identityCard: '123', // not 12 digits
        relationship: 'Chủ hộ',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
        acceptTerms: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined();
        expect(result.error.flatten().fieldErrors.identityCard).toBeDefined();
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('UT-SCH-05: validates valid email or phone', () => {
      expect(forgotPasswordSchema.safeParse({ contact: 'user@famidoc.vn' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ contact: '0987654321' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ contact: 'invalid-string' }).success).toBe(false);
    });
  });
});
