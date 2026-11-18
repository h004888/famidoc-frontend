import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doctorsApi } from '../doctors.api';
import { httpClient } from '../http-client';

describe('doctorsApi.getFacilityDoctors pagination & cleanup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aggregates multiple pages via fetchPaginatedList so > 50 (and > 10) facility doctors are loaded', async () => {
    const page1Items = Array.from({ length: 50 }, (_, i) => ({
      id: `doc-${i + 1}`,
      doctorName: `BS ${i + 1}`,
    }));
    const page2Items = Array.from({ length: 15 }, (_, i) => ({
      id: `doc-${i + 51}`,
      doctorName: `BS ${i + 51}`,
    }));

    const getSpy = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValueOnce({
        data: { items: page1Items, total: 65 },
      })
      .mockResolvedValueOnce({
        data: { items: page2Items, total: 65 },
      });

    const result = await doctorsApi.getFacilityDoctors();

    expect(result).toHaveLength(65);
    expect(result[0].id).toBe('doc-1');
    expect(result[64].id).toBe('doc-65');
    expect(getSpy).toHaveBeenNthCalledWith(
      1,
      '/api/v1/facilities/doctors',
      { page: 1, limit: 50 },
      { cache: 'no-store' }
    );
    expect(getSpy).toHaveBeenNthCalledWith(
      2,
      '/api/v1/facilities/doctors',
      { page: 2, limit: 50 },
      { cache: 'no-store' }
    );
  });

  it('does not expose dead methods resendDoctorInvite, updateDoctorStatus, or unlinkDoctor', () => {
    expect((doctorsApi as Record<string, unknown>).resendDoctorInvite).toBeUndefined();
    expect((doctorsApi as Record<string, unknown>).updateDoctorStatus).toBeUndefined();
    expect((doctorsApi as Record<string, unknown>).unlinkDoctor).toBeUndefined();
  });
});
