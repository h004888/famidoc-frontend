import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import { ApiConnectionError, ApiError } from '@/lib/http/errors';

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

  it('localizes network failures directly in request() ApiError.message', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = httpClient.get('/api/v1/test');
    await expect(result).rejects.toBeInstanceOf(ApiConnectionError);
    await expect(result).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Không thể kết nối đến máy chủ lúc này. Vui lòng thử lại sau.',
    });
  });

  it('mentions offline mode when the browser reports it', async () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    try {
      await expect(httpClient.get('/api/v1/test')).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Thiết bị đang ngoại tuyến. Hãy kết nối mạng rồi thử lại.',
      });
    } finally {
      online.mockRestore();
    }
  });

  it('reports an invalid server response when a successful request returns HTML', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('<html></html>'));

    await expect(httpClient.get('/api/v1/test')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại sau.',
    });
  });

  it.each(['getBlob', 'upload'] as const)('localizes a fetch rejection in %s()', async (method) => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const operation = method === 'getBlob'
      ? httpClient.getBlob('/api/v1/download')
      : httpClient.upload('/api/v1/upload', new FormData());
    await expect(operation).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Không thể kết nối đến máy chủ lúc này. Vui lòng thử lại sau.',
    });
  });

  it.each(['getBlob', 'upload'] as const)('localizes a connection failure while reading the %s() response', async (method) => {
    const readBody = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, blob: readBody, json: readBody } as unknown as Response);
    const operation = method === 'getBlob'
      ? httpClient.getBlob('/api/v1/download')
      : httpClient.upload('/api/v1/upload', new FormData());
    await expect(operation).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Không thể kết nối đến máy chủ lúc này. Vui lòng thử lại sau.',
    });
    expect(readBody).toHaveBeenCalledTimes(1);
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

  it('retries getBlob() once on transient network error and throws localized ApiError if retry also fails', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(
      httpClient.getBlob('/api/v1/patients/p-1/documents/d-1/file')
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Không thể kết nối đến máy chủ lúc này. Vui lòng thử lại sau.',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
