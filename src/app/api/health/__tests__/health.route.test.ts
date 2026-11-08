import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('GET /api/health', () => {
  it('returns HTTP 200 with status ok, uptime, and iso timestamp', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(typeof data.uptime).toBe('number');
    expect(data.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof data.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(data.timestamp))).toBe(false);
  });
});
