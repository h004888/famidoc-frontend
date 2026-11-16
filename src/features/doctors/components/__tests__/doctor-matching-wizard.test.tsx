import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorMatchingWizard } from '../doctor-matching-wizard';

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

describe('DoctorMatchingWizard (/doctors/matching)', () => {
  it('links primary doctor selection CTA to /doctors/<id> and does not render legacy ContractSigningWizard modal', () => {
    render(<DoctorMatchingWizard />);

    const selectLinks = screen.getAllByRole('link', { name: /Chọn Bác Sĩ Này & Chọn Gói/i });
    expect(selectLinks).toHaveLength(3);
    expect(selectLinks[0]).toHaveAttribute('href', '/doctors/doc-01');
    expect(selectLinks[1]).toHaveAttribute('href', '/doctors/doc-03');
    expect(selectLinks[2]).toHaveAttribute('href', '/doctors/doc-04');

    const profileLinks = screen.getAllByRole('link', { name: /Xem Hồ Sơ Năng Lực & CCHN/i });
    expect(profileLinks[0]).toHaveAttribute('href', '/doctors/doc-01');

    const allHrefs = screen.getAllByRole('link').map((el) => el.getAttribute('href') ?? '');
    expect(allHrefs.some((href) => href.includes('/family/subscription'))).toBe(false);
    expect(screen.queryByText(/SCR-15/i)).not.toBeInTheDocument();
  });
});
