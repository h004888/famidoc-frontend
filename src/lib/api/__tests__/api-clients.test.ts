import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import { patientsApi } from '../patients.api';
import { contractsApi } from '../contracts.api';
import { authApi } from '../auth.api';
import { publicApi } from '../public.api';

describe('Task 3: Typed API Client Services (Patients, Contracts, Auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('httpClient with Bearer token injection', () => {
    it('attaches Authorization: Bearer token when token is set', async () => {
      httpClient.setToken('test-jwt-token-xyz');
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response);

      await httpClient.get('/test-endpoint');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token-xyz',
          }),
        })
      );
      httpClient.clearToken();
      fetchSpy.mockRestore();
    });
  });

  describe('patientsApi endpoints', () => {
    it('calls GET /api/v1/patients for family members list', async () => {
      const mockPatients = [{ id: 'p-1', fullName: 'Nguyễn Văn A' }];
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPatients,
      } as Response);

      const res = await patientsApi.getFamilyMembers();
      expect(res).toEqual(mockPatients);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/patients'),
        expect.objectContaining({ method: 'GET' })
      );
      fetchSpy.mockRestore();
    });

    it('calls POST /api/v1/patients with CreatePatientDto payload', async () => {
      const payload = {
        fullName: 'Bé Nguyễn C',
        dateOfBirth: '2020-01-01',
        gender: 'MALE' as const,
        relationshipToHead: 'CHILD' as const,
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'p-new', ...payload }),
      } as Response);

      const res = await patientsApi.createFamilyMember(payload);
      expect(res.id).toBe('p-new');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/patients'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
      fetchSpy.mockRestore();
    });
  });

  describe('contractsApi endpoints', () => {
    it('calls GET /api/v1/contracts/medical to list contracts', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 'ctr-1' }],
      } as Response);

      const res = await contractsApi.getMedicalContracts({ role: 'DOCTOR' });
      expect(res).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contracts/medical?role=DOCTOR'),
        expect.objectContaining({ method: 'GET' })
      );
      fetchSpy.mockRestore();
    });

    it('calls GET /api/v1/contracts/medical/:id/care-summary for doctor review', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ contractId: 'ctr-1', members: [] }),
      } as Response);

      const res = await contractsApi.getCareSummary('ctr-1');
      expect(res.contractId).toBe('ctr-1');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contracts/medical/ctr-1/care-summary'),
        expect.objectContaining({ method: 'GET' })
      );
      fetchSpy.mockRestore();
    });

    it('calls PUT /api/v1/contracts/four-party/:id/sign to execute digital signature', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ signatureHash: 'hash-123' }),
      } as Response);

      const res = await contractsApi.signContract('ctr-1', { termsHash: 'hash-abc' });
      expect(res.signatureHash).toBe('hash-123');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contracts/four-party/ctr-1/sign'),
        expect.objectContaining({ method: 'PUT' })
      );
      fetchSpy.mockRestore();
    });

    it('calls PATCH /api/v1/contracts/:id/assign-doctor to assign a doctor', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'ctr-1', doctorId: 'doc-99' }),
      } as Response);

      const res = await contractsApi.assignDoctor('ctr-1', { doctorId: 'doc-99' });
      expect(res.doctorId).toBe('doc-99');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contracts/ctr-1/assign-doctor'),
        expect.objectContaining({ method: 'PATCH' })
      );
      fetchSpy.mockRestore();
    });
  });

  describe('authApi endpoints', () => {
    it('calls POST /api/v1/auth/register-representative for representative registration', async () => {
      const payload = {
        fullName: 'Nguyễn Văn ĐD',
        phone: '0912345678',
        email: 'rep@famidoc.vn',
        password: 'Password@123',
        acceptTerms: true,
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: 'OTP sent' }),
      } as Response);

      const res = await authApi.registerRepresentative(payload);
      expect(res.message).toBe('OTP sent');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/register-representative'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
      fetchSpy.mockRestore();
    });
  });

  describe('publicApi endpoints', () => {
    it('calls GET /api/v1/public/doctors for public doctor directory', async () => {
      const mockDocs = [{ id: 'doc-1', fullName: 'BS. Trần Văn A' }];
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDocs,
      } as Response);

      const res = await publicApi.getDoctors();
      expect(res).toEqual(mockDocs);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/public/doctors'),
        expect.objectContaining({ method: 'GET' })
      );
      fetchSpy.mockRestore();
    });

    it('calls GET /api/v1/public/facilities for public facilities directory', async () => {
      const mockFacs = [{ id: 'fac-1', name: 'Bệnh viện Y Dược' }];
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFacs,
      } as Response);

      const res = await publicApi.getFacilities();
      expect(res).toEqual(mockFacs);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/public/facilities'),
        expect.objectContaining({ method: 'GET' })
      );
      fetchSpy.mockRestore();
    });
  });
});
