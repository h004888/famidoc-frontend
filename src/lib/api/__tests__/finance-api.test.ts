import { afterEach, describe, expect, it, vi } from 'vitest';
import { financeApi } from '../finance.api';
import { httpClient } from '../http-client';

describe('financeApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads amounts from the API envelope and normalizes Prisma decimal strings', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      success: true,
      data: {
        grossVnd: 1000000, facilityShareVnd: 850000, platformFeeVnd: 150000,
        settlements: [{
          id: 'statement-1',
          totalRealizedRevenue: '1000000.00',
          facilityPayoutAmount: '850000.00',
          platformFeeAmount: '150000.00',
        }],
      },
    });

    const report = await financeApi.getAnalytics();
    expect(report.grossVnd).toBe(1000000);
    expect(report.settlements[0].facilityPayoutAmount).toBe(850000);
    expect(report.settlements[0].platformFeeAmount).toBe(150000);
  });
});
