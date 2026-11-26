import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '@/lib/api/http-client';
import { medicalBooksApi } from '@/lib/api/medical-books.api';

vi.mock('@/lib/api/http-client', () => ({
  httpClient: { get: vi.fn() },
}));

describe('medicalBooksApi.timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests timeline with cursor and limit when cursor is provided', async () => {
    const controller = new AbortController();
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      success: true,
      data: { items: [], nextCursor: null },
    });

    const result = await medicalBooksApi.timeline(
      'fam-1',
      'pat-1',
      'cur-1',
      controller.signal,
    );

    expect(httpClient.get).toHaveBeenCalledWith(
      '/api/v1/medical-books/families/fam-1/patients/pat-1/timeline',
      { cursor: 'cur-1', limit: 20 },
      { signal: controller.signal, cache: 'no-store' },
    );
    expect(result).toEqual({ items: [], nextCursor: null });
  });

  it('omits cursor param when cursor is null', async () => {
    const controller = new AbortController();
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      success: true,
      data: { items: [], nextCursor: null },
    });

    await medicalBooksApi.timeline('fam-1', 'pat-1', null, controller.signal);

    expect(httpClient.get).toHaveBeenCalledWith(
      '/api/v1/medical-books/families/fam-1/patients/pat-1/timeline',
      { limit: 20 },
      { signal: controller.signal, cache: 'no-store' },
    );
  });
});
