import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export type SettlementDisbursementStatus = 'PENDING' | 'CONFIRMED' | 'SETTLED' | 'FAILED';
export type SettlementReviewStatus = 'PENDING' | 'CONFIRMED' | 'DISPUTED';

export interface FacilitySettlementItemDto {
  id: string;
  settlementId: string;
  invoiceId: string;
  recognitionYear?: number | null;
  recognitionMonth?: number | null;
  recognitionBasis: string;
  serviceFrom?: string | null;
  serviceUntil?: string | null;
  grossAmount: number;
  vatAmount: number;
  netAmount: number;
  platformFeeAmount: number;
  facilityShareAmount: number;
}

export interface FacilitySettlementDto {
  id: string;
  settlementCode: string;
  facilityId: string;
  month: number;
  year: number;
  environment: 'TEST' | 'LIVE';
  totalRealizedRevenue: number;
  platformFeeAmount: number;
  facilityPayoutAmount: number;
  disbursementStatus: SettlementDisbursementStatus;
  bankTransferOrderId?: string | null;
  transferMemo?: string | null;
  settledAt?: string | null;
  createdAt: string;
  bankDestination: {
    bankName: string;
    bankBin?: string | null;
    bankCode?: string | null;
    accountNumber: string;
    accountHolder: string;
  };
  failureReason?: string | null;
  transferEvidenceKey?: string | null;
  confirmedByUserId?: string | null;
  reviewStatus?: SettlementReviewStatus;
  reviewVersion?: number;
  reviewedAt?: string | null;
  reviewDisputeReason?: string | null;
  facility?: {
    id: string;
    facilityName: string;
    licenseNumber?: string;
    taxCode?: string;
    hotline?: string;
  };
  items?: FacilitySettlementItemDto[];
}

export interface MonthlySettlementPayload {
  action: 'PREPARE' | 'CONFIRM_TRANSFER' | 'MARK_FAILED' | 'REOPEN_REVIEW';
  year?: number;
  month?: number;
  environment?: 'TEST' | 'LIVE';
  facilityId?: string;
  settlementId?: string;
  reviewVersion?: number;
  bankTransferOrderId?: string;
  transferMemo?: string;
  amountPaidVnd?: number;
  paidAt?: string;
  evidenceKey?: string;
  failureReason?: string;
}

export type ReviewSettlementPayload = {
  environment: FacilitySettlementDto['environment'];
  reviewVersion: number;
} & (
  | { action: 'CONFIRM' }
  | { action: 'REPORT_DISCREPANCY'; reason: string }
);

export interface FinanceAnalyticsQueryDto {
  [key: string]: string | number | boolean | undefined;
  year?: number;
  month?: number;
  environment?: 'TEST' | 'LIVE';
  facilityId?: string;
}

export interface PackageSalesTotals {
  packagesSold: number;
  grossVnd: number;
  platformFeeVnd: number;
  facilityShareVnd: number;
}

export interface ParticipatingDoctorSummaryDto {
  id: string;
  doctorName: string;
  specialty: string;
  isPrimary: boolean;
  encounterCount: number;
}

export interface FacilityFamilyPackageItemDto {
  invoiceId: string;
  invoiceCode: string;
  contractId: string;
  contractNumber: string;
  contractStatus: string;
  familyId: string;
  familyName: string;
  memberCount: number;
  packageCode: string;
  packageName: string;
  durationMonths: number;
  paidAt: string | null;
  startDate: string | null;
  endDate: string | null;
  purchasedInPeriod: boolean;
  primaryDoctor: { id: string; doctorName: string; specialty: string } | null;
  participatingDoctors: ParticipatingDoctorSummaryDto[];
  packagePriceVnd: number;
  platformFeePercent: number;
  platformFeeVnd: number;
  facilitySharePercent: number;
  facilityShareVnd: number;
  periodRecognition?: {
    grossVnd: number;
    platformFeeVnd: number;
    facilityShareVnd: number;
    serviceFrom: string;
    serviceUntil: string;
  };
}

export interface FacilityBusinessDto {
  activeHouseholds: number;
  doctors: { id: string; doctorName: string; specialty: string; households: number }[];
  familyPackages?: FacilityFamilyPackageItemDto[];
  purchases: PackageSalesTotals & {
    purchasingHouseholds: number;
    byPackage: (PackageSalesTotals & { packageCode: string; packageName: string })[];
  };
}

export interface FinanceAnalyticsDto {
  settlementFrequency?: 'MONTHLY';
  year: number;
  month: number;
  environment: 'TEST' | 'LIVE';
  facilityId?: string | null;
  currency: 'VND';
  invoiceCount: number;
  recognitionBasis: string;
  grossVnd: number;
  vatVnd: number;
  netVnd: number;
  platformFeeVnd: number;
  facilityShareVnd: number;
  facilityBusiness?: FacilityBusinessDto;
  taxTreatment?: string;
  unmatchedTransactionsCount?: number;
  unreconciledInvoiceCount?: number;
  settlements: FacilitySettlementDto[];
  // Backwards compatibility fields for older components
  totalGmv?: number;
  platformCommission?: number;
  facilityPayouts?: number;
  activeContractsCount?: number;
  gmvTotalVnd?: number;
  escrowBalanceVnd?: number;
  platformShareVnd?: number;
  contractsCount?: number;
}

export interface RunSePayReconciliationPayload {
  environment?: 'TEST' | 'LIVE';
  from?: string;
  to?: string;
}

export interface SePayReconciliationRunDto {
  id: string;
  environment: string;
  trigger: string;
  status: string;
  requestedByUserId?: string | null;
  rangeFrom?: string | null;
  rangeTo?: string | null;
  fetchedCount: number;
  backfilledCount: number;
  linkedCount: number;
  matchedCount: number;
  reviewRequiredCount: number;
  ignoredCount: number;
  localOnlyCount: number;
  startedAt: string;
  completedAt?: string | null;
  errors?: unknown[];
}

export interface SePayReconciliationStatusDto {
  environment: 'TEST' | 'LIVE';
  enabled: boolean;
  state: { lastSuccessfulAt?: string | null } | null;
  latestRun: SePayReconciliationRunDto | null;
  unreconciledTransactions: number;
}

type SettlementResponse = Omit<FacilitySettlementDto, 'totalRealizedRevenue' | 'platformFeeAmount' | 'facilityPayoutAmount'> & {
  totalRealizedRevenue: number | string;
  platformFeeAmount: number | string;
  facilityPayoutAmount: number | string;
};

type PreparedSettlementResponse<T> = {
  year: number;
  month: number;
  environment: 'TEST' | 'LIVE';
  transferExecuted: boolean;
  settlements: T[];
  message?: string;
};

function normalizeSettlement(settlement: SettlementResponse): FacilitySettlementDto {
  return {
    ...settlement,
    totalRealizedRevenue: Number(settlement.totalRealizedRevenue),
    platformFeeAmount: Number(settlement.platformFeeAmount),
    facilityPayoutAmount: Number(settlement.facilityPayoutAmount),
  };
}

export const financeApi = {
  getAnalytics: async (query?: FinanceAnalyticsQueryDto): Promise<FinanceAnalyticsDto> => {
    const payload = await httpClient.get('/api/v1/finance/analytics', query, { cache: 'no-store' });
    const raw = unwrapApiEnvelope<Omit<FinanceAnalyticsDto, 'settlements'> & { settlements?: SettlementResponse[] }>(payload);
    // Chuẩn hóa dữ liệu tương thích ngược
    const gmv = raw.grossVnd ?? raw.gmvTotalVnd ?? raw.totalGmv ?? 0;
    const facShare = raw.facilityShareVnd ?? Math.round(gmv * 0.85);
    const platShare = raw.platformFeeVnd ?? Math.round(gmv * 0.15);
    return {
      ...raw,
      grossVnd: gmv,
      gmvTotalVnd: gmv,
      totalGmv: gmv,
      facilityShareVnd: facShare,
      facilityPayouts: facShare,
      platformFeeVnd: platShare,
      platformShareVnd: platShare,
      platformCommission: platShare,
      settlements: (raw.settlements ?? []).map(normalizeSettlement),
      invoiceCount: raw.invoiceCount ?? 0,
    };
  },

  executeMonthlySettlement: async (payload: MonthlySettlementPayload): Promise<
    PreparedSettlementResponse<FacilitySettlementDto> | FacilitySettlementDto
  > => {
    const response = await httpClient.post('/api/v1/finance/settlements/monthly', payload);
    const data = unwrapApiEnvelope<PreparedSettlementResponse<SettlementResponse> | SettlementResponse>(response);
    return 'settlements' in data
      ? { ...data, settlements: data.settlements.map(normalizeSettlement) }
      : normalizeSettlement(data);
  },

  reviewSettlement: async (settlementId: string, payload: ReviewSettlementPayload): Promise<FacilitySettlementDto> => {
    const response = await httpClient.patch(
      `/api/v1/finance/settlements/${encodeURIComponent(settlementId)}/review`,
      payload,
    );
    return normalizeSettlement(unwrapApiEnvelope<SettlementResponse>(response));
  },

  uploadSettlementEvidence: async (
    settlementId: string,
    environment: FacilitySettlementDto['environment'],
    file: File,
  ): Promise<{ evidenceKey: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await httpClient.upload(
      `/api/v1/finance/settlements/${encodeURIComponent(settlementId)}/evidence?environment=${environment}`,
      formData,
    );
    return unwrapApiEnvelope(response);
  },

  runSePayReconciliation: async (payload: RunSePayReconciliationPayload): Promise<SePayReconciliationRunDto> => {
    return unwrapApiEnvelope(await httpClient.post('/api/v1/finance/reconciliation/sepay', payload));
  },

  getSePayReconciliationStatus: async (environment: 'TEST' | 'LIVE'): Promise<SePayReconciliationStatusDto> => {
    return unwrapApiEnvelope(await httpClient.get('/api/v1/finance/reconciliation/sepay/status', { environment }, { cache: 'no-store' }));
  },

  listSePayReconciliations: async (params: { environment: 'TEST' | 'LIVE'; limit?: number }): Promise<SePayReconciliationRunDto[]> => {
    return unwrapApiEnvelope(await httpClient.get('/api/v1/finance/reconciliation/sepay', params, { cache: 'no-store' }));
  },

  runExpirationReminders: (): Promise<{ sentCount: number }> => {
    return httpClient.post<{ sentCount: number }>('/api/v1/notifications/reminders/run');
  },
};
