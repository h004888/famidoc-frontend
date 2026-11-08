import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pollHealthCheck } from '../smoke-test';

describe('pollHealthCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns true when target URL responds with HTTP 200 and status ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const promise = pollHealthCheck({
      url: 'https://example.com/api/health',
      maxRetries: 3,
      intervalMs: 1000,
    });

    const result = await promise;
    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries until success when initial requests fail', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const promise = pollHealthCheck({
      url: 'https://example.com/api/health',
      maxRetries: 3,
      intervalMs: 1000,
    });

    // Advance timer for retry delay
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws an error when max retries exceeded without success', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('502 Bad Gateway'));
    vi.stubGlobal('fetch', fetchMock);

    const promise = pollHealthCheck({
      url: 'https://example.com/api/health',
      maxRetries: 2,
      intervalMs: 500,
    });

    // Attach rejection catcher early
    let _caughtError: Error | null = null;
    promise.catch((err) => {
      _caughtError = err;
    });

    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(500);

    await expect(promise).rejects.toThrow(/Healthcheck failed after 2 attempts/i);
  });
});
