import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHero } from '../landing-hero';

describe('UT-CMP-01: LandingHero Component (High-End Concierge Medical)', () => {
  it('renders main heading with clinical prestige styling', () => {
    render(<LandingHero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Y học Gia đình Tận tâm/i);
  });

  it('renders call to action link for registering family doctor', () => {
    render(<LandingHero />);
    expect(
      screen.getByRole('link', { name: /Đăng ký Bác sĩ Riêng/i })
    ).toBeInTheDocument();
  });
});
