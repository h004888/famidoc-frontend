import { describe, it, expect } from 'vitest';
import { mockDoctorsList } from '@/features/doctors/data/mock-doctors';

// We'll import schema from the main file
import * as DoctorCatalogSchemaModule from '@/features/doctors/schemas/doctor-catalog.schema';

const { doctorItemSchema, doctorCatalogFilterSchema } = DoctorCatalogSchemaModule;

describe('UT-Schema-DoctorCatalog: Doctor Catalog Schemas', () => {
  describe('doctorItemSchema validation', () => {
    const validDoctorData = {
      id: 'DOC-001',
      name: 'BSCKII Nguyễn Văn An',
      specialty: 'Nội tổng quát',
      title: 'BSCKII',
      rating: 4.8,
      experience: 15,
      fee: 300000,
      avatarUrl: 'https://example.com/avatar.jpg',
      cchn: '001234/BYT',
    };

    it('passes for a valid doctor object with all fields', () => {
      const result = doctorItemSchema.safeParse(validDoctorData);
      expect(result.success).toBe(true);
    });

    it('fails when required fields are missing', () => {
      const incompleteData = { ...validDoctorData, name: undefined };
      const result = doctorItemSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
    });

    it('fails when id is empty string', () => {
      const data = { ...validDoctorData, id: '' };
      const result = doctorItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('fails when rating is not a positive number', () => {
      const data = { ...validDoctorData, rating: -1 };
      const result = doctorItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('fails when fee is negative', () => {
      const data = { ...validDoctorData, fee: -100 };
      const result = doctorItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('parses experience as non-negative integer', () => {
      const data = { ...validDoctorData, experience: 0 };
      const result = doctorItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('doctorCatalogFilterSchema validation', () => {
    it('defaults page to 1 when omitted', () => {
      const result = doctorCatalogFilterSchema.parse({});
      expect(result.page).toBe(1);
    });

    it('accepts a valid page number >= 1', () => {
      const result = doctorCatalogFilterSchema.parse({ page: 5 });
      expect(result.page).toBe(5);
    });

    it('rejects page < 1', () => {
      const result = doctorCatalogFilterSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('defaults limit to 6 when omitted', () => {
      const result = doctorCatalogFilterSchema.parse({});
      expect(result.limit).toBe(6);
    });

    it('accepts a valid limit (positive integer)', () => {
      const result = doctorCatalogFilterSchema.parse({ limit: 10 });
      expect(result.limit).toBe(10);
    });

    it('rejects limit <= 0', () => {
      const result = doctorCatalogFilterSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('accepts an optional specialty string', () => {
      const result = doctorCatalogFilterSchema.parse({ specialty: 'Nhi khoa' });
      expect(result.specialty).toBe('Nhi khoa');
    });

    it('accepts an optional searchTerm string', () => {
      const result = doctorCatalogFilterSchema.parse({ searchTerm: 'Nguyễn' });
      expect(result.searchTerm).toBe('Nguyễn');
    });

    it('accepts combination of all filter params', () => {
      const result = doctorCatalogFilterSchema.parse({
        page: 2,
        limit: 8,
        specialty: 'Tim mạch',
        searchTerm: 'Bác sĩ',
      });
      expect(result).toEqual({ page: 2, limit: 8, specialty: 'Tim mạch', searchTerm: 'Bác sĩ' });
    });
  });

  describe('mockDoctorsList', () => {
    it('contains at least 12 doctors', () => {
      expect(mockDoctorsList.length).toBeGreaterThanOrEqual(12);
    });

    it('all doctors pass doctorItemSchema', () => {
      for (const doc of mockDoctorsList) {
        const result = doctorItemSchema.safeParse(doc);
        expect(result.success).toBe(true);
      }
    });

    it('has doctors from multiple specialties', () => {
      const specialties = new Set(mockDoctorsList.map((d) => d.specialty));
      // Must have at least Nội tổng quát, Nhi khoa, Lão khoa, Tim mạch
      expect(specialties.has('Nội tổng quát')).toBe(true);
      expect(specialties.has('Nhi khoa')).toBe(true);
      expect(specialties.has('Lão khoa')).toBe(true);
      expect(specialties.has('Tim mạch')).toBe(true);
    });

    it('specialties are distributed evenly (at least 2 per specialty)', () => {
      const counts: Record<string, number> = {};
      for (const d of mockDoctorsList) {
        counts[d.specialty] = (counts[d.specialty] || 0) + 1;
      }
      for (const specialty in counts) {
        expect(counts[specialty]).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
