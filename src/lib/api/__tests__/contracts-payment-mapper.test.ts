import { describe, expect, it } from 'vitest';
import {
  mapMedicalContractToFourParty,
  type MedicalContractDetailDto,
} from '../contracts.api';

function contract(): MedicalContractDetailDto {
  return {
    id: '60000000-0000-4000-8000-000000000001',
    contractNumber: 'HD-001',
    contractStatus: 'PENDING_PAYMENT',
    totalAmount: '150000',
    startDate: '2026-11-01',
    endDate: '2026-12-01',
    createdAt: '2026-11-01',
    billingSnapshot: {
      package: { name: 'Gói đã ký' },
      pricing: { totalPriceVnd: 150000 },
    },
    servicePackage: { id: 'package-1', packageName: 'Gói hiện tại' },
    addenda: [
      {
        id: 'addendum-1',
        addendumNumber: 'PL-001',
        addendumType: 'MEMBER_EXTENSION',
        additionalAmount: '50000',
        status: 'PENDING_PAYMENT',
        signatures: [
          { signerRole: 'FAMILY_REP' },
          { signerRole: 'FAMILY_REP' },
          { signerRole: 'ADMIN' },
        ],
      },
    ],
  };
}

describe('Contract payment summary from the backend', () => {
  it('keeps the agreed price and maps addendum prices and signer roles', () => {
    const mapped = mapMedicalContractToFourParty(contract());
    expect(mapped.packageName).toBe('Gói đã ký');
    expect(mapped.packagePrice).toBe(150000);
    expect(mapped.addenda?.[0]).toMatchObject({
      additionalAmount: 50000,
      signedRoles: ['FAMILY_REP', 'ADMIN'],
      hasPaidInvoice: false,
    });
  });

  it('does not count a paid addendum as payment for the main contract', () => {
    const mapped = mapMedicalContractToFourParty({
      ...contract(),
      invoices: [{ addendumId: 'addendum-1', paymentStatus: 'PAID' }],
    });
    expect(mapped.hasPaidContractInvoice).toBe(false);
    expect(mapped.addenda?.[0].hasPaidInvoice).toBe(true);
  });

  it('does not count the paid main contract as payment for an addendum', () => {
    const mapped = mapMedicalContractToFourParty({
      ...contract(),
      invoices: [
        { addendumId: null, paymentStatus: 'PAID' },
        { addendumId: 'addendum-1', paymentStatus: 'PENDING' },
      ],
    });
    expect(mapped.hasPaidContractInvoice).toBe(true);
    expect(mapped.addenda?.[0].hasPaidInvoice).toBe(false);
  });

  it('does not mark cancelled and expired requests as paid', () => {
    const mapped = mapMedicalContractToFourParty({
      ...contract(),
      invoices: [
        { addendumId: null, paymentStatus: 'CANCELLED' },
        { addendumId: 'addendum-1', paymentStatus: 'EXPIRED' },
      ],
    });
    expect(mapped.hasPaidContractInvoice).toBe(false);
    expect(mapped.addenda?.[0].hasPaidInvoice).toBe(false);
  });

  it('maps renewal contract statuses (PENDING_PAYMENT with 1 sig, PENDING_ACTIVATION, CANCELLED) accurately', () => {
    const pendingPayment = mapMedicalContractToFourParty({
      ...contract(),
      upgradedFromId: 'old-1',
      contractStatus: 'PENDING_PAYMENT',
      signatures: [{ signerRole: 'FAMILY_REP', signerUserId: 'u1', signedAt: '2026-11-26' }],
    });
    expect(pendingPayment.status).toBe('PENDING_PAYMENT');
    expect(pendingPayment.upgradedFromId).toBe('old-1');

    const pendingActivation = mapMedicalContractToFourParty({
      ...contract(),
      upgradedFromId: 'old-1',
      contractStatus: 'PENDING_ACTIVATION' as any,
      signatures: [{ signerRole: 'FAMILY_REP', signerUserId: 'u1', signedAt: '2026-11-26' }],
    });
    expect(pendingActivation.rawContractStatus).toBe('PENDING_ACTIVATION');
    expect(pendingActivation.upgradedFromId).toBe('old-1');

    const cancelled = mapMedicalContractToFourParty({
      ...contract(),
      upgradedFromId: 'old-1',
      contractStatus: 'CANCELLED' as any,
    });
    expect(cancelled.status).toBe('CANCELLED');
  });
});
