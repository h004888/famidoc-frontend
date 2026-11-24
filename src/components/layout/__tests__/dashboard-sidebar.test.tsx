import { describe, expect, it } from 'vitest';
import { ROLE_MENUS } from '../dashboard-sidebar';

describe('ROLE_MENUS video consultation labels', () => {
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
});
