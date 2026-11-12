import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerFamilySchema,
  forgotPasswordSchema,
} from '../auth.schema';

describe('UT-SCH-01..05: Auth Schemas & Contracts Validation', () => {
  describe('loginSchema', () => {
    it('UT-SCH-01: validates valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'an.nguyen@famidoc.vn',
        password: 'Password123',
        role: 'FAMILY',
      });
      expect(result.success).toBe(true);
    });

    it('UT-SCH-02: invalidates email with invalid format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it('UT-SCH-03: invalidates passwords shorter than 8 characters', () => {
      const result = loginSchema.safeParse({
        email: 'an.nguyen@famidoc.vn',
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

    // ===========================================================================
    // Phone normalization & extended format support (Task 2)
    // ===========================================================================
    describe('phone normalization & extended formats (Task 2)', () => {
      it('accepts phone with spaces and strips them', () => {
        const result = registerFamilySchema.safeParse({
          fullName: 'Nguyễn Văn An',
          phone: '0912 345 678',
          email: 'an.nguyen@famidoc.vn',
          relationship: 'Chủ hộ',
          password: 'Password123',
          confirmPassword: 'Password123',
          acceptTerms: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.phone).toBe('0912345678');
        }
      });

      it('accepts +84 international prefix format', () => {
        const result = registerFamilySchema.safeParse({
          fullName: 'Nguyễn Văn An',
          phone: '+84912345678',
          email: 'an.nguyen@famidoc.vn',
          relationship: 'Chủ hộ',
          password: 'Password123',
          confirmPassword: 'Password123',
          acceptTerms: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // giữ nguyên tiền tố +84 sau khi đã xóa khoảng trắng
          expect(result.data.phone).toBe('+84912345678');
        }
      });
    });

    // ===========================================================================
    // Password max-length (Task 2)
    // ===========================================================================
    describe('password max 64 characters (Task 2)', () => {
      it('rejects password longer than 64 characters', () => {
        const longPassword = 'A'.repeat(65);
        const result = registerFamilySchema.safeParse({
          fullName: 'Nguyễn Văn An',
          phone: '0912345678',
          email: 'an.nguyen@famidoc.vn',
          relationship: 'Chủ hộ',
          password: longPassword,
          confirmPassword: longPassword,
          acceptTerms: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.password).toBeDefined();
        }
      });
    });

    // ===========================================================================
    // trim fullName and email (Task 2 Refactor)
    // ===========================================================================
    describe('trim fullName and email (Task 2 Refactor)', () => {
      it('trims whitespace from fullName', () => {
        const result = registerFamilySchema.safeParse({
          fullName: '  Nguyễn Văn An  ',
          phone: '0912345678',
          email: 'an.nguyen@famidoc.vn',
          relationship: 'Chủ hộ',
          password: 'Password123',
          confirmPassword: 'Password123',
          acceptTerms: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.fullName).toBe('Nguyễn Văn An');
        }
      });

      it('trims whitespace from email', () => {
        const result = registerFamilySchema.safeParse({
          fullName: 'Nguyễn Văn An',
          phone: '0912345678',
          email: '  an.nguyen@famidoc.vn  ',
          relationship: 'Chủ hộ',
          password: 'Password123',
          confirmPassword: 'Password123',
          acceptTerms: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('an.nguyen@famidoc.vn');
        }
      });
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
