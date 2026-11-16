import { httpClient } from './http-client';

export interface FinanceAnalyticsDto {
  totalGmv: number;
  platformCommission: number;
  facilityPayouts: number;
  activeContractsCount: number;
  gmvTotalVnd?: number;
  escrowBalanceVnd?: number;
  facilityShareVnd?: number;
  platformShareVnd?: number;
  contractsCount?: number;
  monthlyStats?: {
    month: string;
    gmv: number;
    contracts: number;
  }[];
}

export const financeApi = {
  getAnalytics: (params?: { from?: string; to?: string }): Promise<FinanceAnalyticsDto> => {
    return httpClient.get<FinanceAnalyticsDto>('/api/v1/finance/analytics', params);
  },

  runMonthlySettlement: (payload?: { year?: number; month?: number }): Promise<any> => {
    const d = new Date();
    return httpClient.post('/api/v1/finance/settlements/monthly', {
      year: payload?.year ?? d.getFullYear(),
      month: payload?.month ?? d.getMonth() + 1,
    });
  },

  runExpirationReminders: (): Promise<{ sentCount: number }> => {
    return httpClient.post<{ sentCount: number }>('/api/v1/notifications/reminders/run');
  },
};
