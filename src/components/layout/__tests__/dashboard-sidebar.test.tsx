import { describe, expect, it } from 'vitest';
import { ROLE_MENUS } from '../dashboard-sidebar';
import { canAccessFamilyRenewalPages } from '../family-subscription-gate';

describe('ROLE_MENUS video consultation labels', () => {
  it('shows payment settings only in the ADMIN menu', () => {
    expect(ROLE_MENUS.ADMIN.items.some(item => item.href === '/admin/payment-settings')).toBe(true);
    for (const role of ['FAMILY', 'DOCTOR', 'FACILITY'] as const) expect(ROLE_MENUS[role].items.some(item => item.href === '/admin/payment-settings')).toBe(false);
  });
  it('uses "Phòng khám Video" instead of "Phòng khám Video 24/7" for FAMILY', () => {
    const telemedItem = ROLE_MENUS.FAMILY.items.find(
      (item) => item.href === '/family/telemedicine',
    );
    expect(telemedItem?.label).toBe('Phòng khám Video');
  });

  it('keeps /family/appointments/book-video and /doctor/encounters/[id]/wrap-up off the top-level sidebar', () => {
    const familyHrefs = ROLE_MENUS.FAMILY.items.map((i) => i.href);
    const doctorHrefs = ROLE_MENUS.DOCTOR.items.map((i) => i.href);
    expect(familyHrefs).not.toContain('/family/appointments/book-video');
    expect(doctorHrefs.some((h) => h.includes('wrap-up'))).toBe(false);
  });

  it('allows family renewal pages when hasHistoricalContracts is true', () => {
    const gate = {
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 1,
      hasHistoricalContracts: true,
    };
    expect(canAccessFamilyRenewalPages('/family/subscription', gate)).toBe(true);
    expect(canAccessFamilyRenewalPages('/family/subscription/ctr-1', gate)).toBe(true);
    expect(canAccessFamilyRenewalPages('/family/appointments', gate)).toBe(false);
  });
});
