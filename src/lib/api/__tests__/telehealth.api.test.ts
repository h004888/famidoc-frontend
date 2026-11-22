import { describe, expect, it, vi, beforeEach } from 'vitest';
import { telehealthApi } from '../telehealth.api';
import { httpClient } from '../http-client';

vi.mock('../http-client', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('telehealthApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('issueSessionToken unwraps API envelope', async () => {
    (httpClient.post as any).mockResolvedValue({
      success: true,
      data: {
        token: 'lk-jwt',
        url: 'wss://rtc.famidoc.online',
        roomName: 'telehealth-enc-1',
        participantIdentity: 'FAMILY_REP:u1',
        session: { id: 's1', encounterId: 'enc-1', roomSid: 'telehealth-enc-1' },
      },
    });

    const res = await telehealthApi.issueSessionToken('enc-1');
    expect(httpClient.post).toHaveBeenCalledWith('/api/v1/telehealth/sessions/enc-1/token', {});
    expect(res.token).toBe('lk-jwt');
    expect(res.url).toBe('wss://rtc.famidoc.online');
  });

  it('uploadAttachment sends FormData with file and caption', async () => {
    (httpClient.post as any).mockResolvedValue({
      success: true,
      data: { id: 'm1', attachmentName: 'bp.png' },
    });

    const file = new File(['abc'], 'bp.png', { type: 'image/png' });
    const res = await telehealthApi.uploadAttachment('enc-1', file, 'Máy đo');

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    const [url, body] = (httpClient.post as any).mock.calls[0];
    expect(url).toBe('/api/v1/telehealth/sessions/enc-1/messages/attachment');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
    expect(body.get('caption')).toBe('Máy đo');
    expect(res.attachmentName).toBe('bp.png');
  });

  it('fetchAttachmentBlob requests blob responseType', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    (httpClient.get as any).mockResolvedValue(blob);

    const res = await telehealthApi.fetchAttachmentBlob('enc-1', 'm1');
    expect(httpClient.get).toHaveBeenCalledWith(
      '/api/v1/telehealth/sessions/enc-1/messages/m1/attachment',
      { responseType: 'blob' },
    );
    expect(res).toBe(blob);
  });
});
