import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import { ApiError } from '@/lib/http/errors';

describe('httpClient error extraction (JSON, upload, getBlob)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers Vietnamese errorData.message over generic errorData.error.detail in request()', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: 'Số điện thoại không đúng định dạng di động Việt Nam',
        error: { detail: 'Bad Request' },
      }),
    } as Response);

    await expect(httpClient.post('/api/v1/test', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Số điện thoại không đúng định dạng di động Việt Nam',
    });
  });

  it('joins validation message array in upload()', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        message: ['Số giấy phép không hợp lệ', 'Thiếu bản scan ĐKKD'],
        error: { detail: 'Unprocessable Entity' },
      }),
    } as Response);

    const formData = new FormData();
    await expect(httpClient.upload('/api/v1/upload', formData)).rejects.toMatchObject({
      status: 422,
      message: 'Số giấy phép không hợp lệ; Thiếu bản scan ĐKKD',
    });
  });

  it('parses JSON error message on getBlob() failure instead of generic API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
      json: async () => ({
        message: 'Hợp đồng B2B này chưa có tệp PDF trên hệ thống ký số Documenso',
        error: { detail: 'Not Found' },
      }),
    } as unknown as Response);

    try {
      await httpClient.getBlob('/api/v1/contracts/staffing/123/signed-pdf');
      expect.unreachable('Expected ApiError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
      expect((err as ApiError).message).toBe(
        'Hợp đồng B2B này chưa có tệp PDF trên hệ thống ký số Documenso'
      );
    }
  });

  it('retries getBlob() once on transient HTTP 503 and resolves when retry succeeds', async () => {
    const expectedBlob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Kho lưu trữ tạm bận' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => expectedBlob,
      } as unknown as Response);

    const blob = await httpClient.getBlob('/api/v1/patients/p-1/documents/d-1/file');

    expect(blob).toBe(expectedBlob);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('retries getBlob() once on transient network error and throws ApiError if retry also fails', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Still offline'));

    await expect(
      httpClient.getBlob('/api/v1/patients/p-1/documents/d-1/file')
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      message: 'Still offline',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
