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

    it('unwraps StandardApiResponse envelope for getFamilyMembers and calls DELETE on detachFamilyMember', async () => {
      const envelopedList = {
        success: true,
        statusCode: 200,
        data: [{ id: 'p-env-1', fullName: 'Nguyễn Minh Tâm' }],
      };
      const fetchGet = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => envelopedList,
      } as Response);

      const list = await patientsApi.getFamilyMembers();
      expect(list).toEqual([{ id: 'p-env-1', fullName: 'Nguyễn Minh Tâm' }]);
      fetchGet.mockRestore();

      const fetchDel = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          data: { id: 'p-env-1', status: 'INACTIVE' },
        }),
      } as Response);

      const detached = await patientsApi.detachFamilyMember('p-env-1');
      expect(detached.status).toBe('INACTIVE');
      expect(fetchDel).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/patients/p-env-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      fetchDel.mockRestore();
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
        expect.stringMatching(/\/api\/v1\/contracts\/medical$/),
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

    it('bóc envelope khi lấy chi tiết hợp đồng cho trang theo dõi', async () => {
      const detail = {
        id: 'ctr-1',
        contractNumber: 'MC2026TEST01',
        contractStatus: 'PENDING_PAYMENT',
        totalAmount: '9600000.00',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        facility: { facilityName: 'Bệnh viện Đại học Y Dược' },
        doctor: { user: { fullName: 'BS. Trần Thanh Mai' } },
        servicePackage: { packageName: 'Gói Toàn Diện Gia Đình' },
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, code: 200, data: detail }),
      } as Response);

      const res = await contractsApi.getMedicalContractDetail('ctr-1');

      expect(res).toEqual(detail);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contracts/medical/ctr-1'),
        expect.objectContaining({ method: 'GET' })
      );
      fetchSpy.mockRestore();
    });

    it('giữ nguyên payload khi backend không bọc envelope', async () => {
      const detail = {
        id: 'ctr-2',
        contractNumber: 'MC2026TEST02',
        contractStatus: 'ACTIVE',
        totalAmount: 12000000,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2027-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => detail,
      } as Response);

      const res = await contractsApi.getMedicalContractDetail('ctr-2');

      expect(res).toEqual(detail);
      fetchSpy.mockRestore();
    });

    it('truyền query forceSync=1 khi ép kiểm tra Documenso', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'ctr-3', contractStatus: 'PENDING_APPROVAL' }),
      } as Response);

      await contractsApi.getMedicalContractDetail('ctr-3', { forceSync: true });

      const [requestedUrl] = fetchSpy.mock.calls[0];
      expect(String(requestedUrl)).toContain('/api/v1/contracts/medical/ctr-3');
      expect(String(requestedUrl)).toContain('forceSync=1');
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
    it('calls GET /api/v1/public/doctors with query params and extracts envelope pagination', async () => {
      const mockEnvelope = {
        success: true,
        code: 200,
        data: [
          {
            id: 'doc-1',
            doctorName: 'BS. Nguyễn Văn A',
            specialty: 'Y học gia đình',
            academicTitle: 'PGS.TS',
            ratingAvg: 4.9,
            totalReviews: 120,
            isAvailable: true,
            avatarUrl: 'https://images.unsplash.com/doc-1',
            facility: {
              id: 'f-1',
              facilityName: 'BV Đại học Y Dược',
            },
          },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 9,
            totalRecords: 45,
            totalPages: 5,
          },
        },
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockEnvelope,
      } as Response);

      const res = await publicApi.getDoctors({
        city: 'TP. Hồ Chí Minh',
        specialty: 'general',
        search: 'Nguyễn',
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].doctorName).toBe('BS. Nguyễn Văn A');
      expect(res.pagination?.totalRecords).toBe(45);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/v1\/public\/doctors\?.*city=TP\.\+H%E1%BB%93\+Ch%C3%AD\+Minh/),
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

  describe('httpClient Dual-Storage token lifecycle (Remember Me)', () => {
    const TOKEN_KEY = 'famidoc_token';
    const LEGACY_TOKEN_KEY = 'famidoc_auth_token';

    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      httpClient.clearToken();
      (httpClient as unknown as { token: string | null }).token = null;
    });

    it('Case 1: setToken(token, false) lưu vào sessionStorage, không lưu localStorage', () => {
      httpClient.setToken('tok-session', false);

      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('tok-session');
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('Case 2: setToken(token, true) lưu vào localStorage, không lưu sessionStorage', () => {
      httpClient.setToken('tok-persist', true);

      expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-persist');
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('Case 3: clearToken xóa token trong bộ nhớ và cả khóa chuẩn lẫn khóa cũ trên cả 2 storage', () => {
      localStorage.setItem(TOKEN_KEY, 'persistent-token');
      localStorage.setItem(LEGACY_TOKEN_KEY, 'legacy-token');
      sessionStorage.setItem(TOKEN_KEY, 'session-token');
      sessionStorage.setItem(LEGACY_TOKEN_KEY, 'legacy-session-token');

      httpClient.clearToken();

      expect((httpClient as unknown as { token: string | null }).token).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
    });

    it('Case 4: getToken fallback memory -> sessionStorage -> localStorage', () => {
      sessionStorage.setItem(TOKEN_KEY, 'from-session');
      expect(httpClient.getToken()).toBe('from-session');

      (httpClient as unknown as { token: string | null }).token = null;
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(TOKEN_KEY, 'from-local');
      expect(httpClient.getToken()).toBe('from-local');

      (httpClient as unknown as { token: string | null }).token = 'from-memory';
      expect(httpClient.getToken()).toBe('from-memory');
    });
  });

  describe('Single-flight 401 refresh interceptor', () => {
    it('deduplicates concurrent 401 responses into a single /api/v1/auth/refresh call and retries both requests', async () => {
      httpClient.setToken('expired-at');
      (httpClient as any).setRefreshToken('valid-rt');
      const onRefreshed = vi.fn();
      (httpClient as any).setTokenRefreshedHandler(onRefreshed);

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.endsWith('/api/v1/auth/refresh')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: { accessToken: 'fresh-at', refreshToken: 'fresh-rt' },
            }),
          } as Response;
        }
        if (url.includes('/api/v1/payments/requests/p-1')) {
          return {
            ok: fetchSpy.mock.calls.filter((c) => String(c[0]).includes('p-1')).length > 1,
            status: fetchSpy.mock.calls.filter((c) => String(c[0]).includes('p-1')).length > 1 ? 200 : 401,
            json: async () => ({ id: 'p-1' }),
          } as Response;
        }
        return {
          ok: fetchSpy.mock.calls.filter((c) => String(c[0]).includes('gate-status')).length > 1,
          status: fetchSpy.mock.calls.filter((c) => String(c[0]).includes('gate-status')).length > 1 ? 200 : 401,
          json: async () => ({ activeContract: null }),
        } as Response;
      });

      const [r1, r2] = await Promise.all([
        httpClient.get<{ id: string }>('/api/v1/payments/requests/p-1'),
        httpClient.get<{ activeContract: null }>('/api/v1/contracts/family/gate-status'),
      ]);

      expect(r1.id).toBe('p-1');
      expect(r2.activeContract).toBeNull();
      const refreshCalls = fetchSpy.mock.calls.filter((c) =>
        String(c[0]).endsWith('/api/v1/auth/refresh'),
      );
      expect(refreshCalls).toHaveLength(1);
      expect(onRefreshed).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'fresh-at', refreshToken: 'fresh-rt' }),
      );

      httpClient.clearToken();
      (httpClient as any).setTokenRefreshedHandler(null);
      fetchSpy.mockRestore();
    });

    it('invokes onUnauthorized once when refresh fails on 401', async () => {
      httpClient.setToken('expired-at');
      (httpClient as any).setRefreshToken('bad-rt');
      const onUnauthorized = vi.fn();
      (httpClient as any).setUnauthorizedHandler(onUnauthorized);

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      await expect(httpClient.get('/api/v1/payments/requests/p-1')).rejects.toThrow();
      expect(onUnauthorized).toHaveBeenCalledTimes(1);

      httpClient.clearToken();
      (httpClient as any).setUnauthorizedHandler(null);
      fetchSpy.mockRestore();
    });
  });
});
