import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FamilyDashboardView } from '../family-dashboard-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/family',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Medsev Typography Standard on Family Portal & Contract Signing Wizard', () => {
  it('renders FamilyDashboardView vitals with font-bold tabular-nums and without font-mono, font-black, or font-extrabold', () => {
    const { container } = render(<FamilyDashboardView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(screen.getByText('135/85')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('98%')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('76')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('6.8')).toHaveClass('font-bold', 'tabular-nums');
  });

  it('ensures all Family Portal & ContractSigningWizard source files contain no font-mono, font-black, or font-extrabold', () => {
    const familyFiles = [
      '../family-dashboard-view.tsx',
      '../../../family-members/components/family-members-view.tsx',
      '../../../appointments/components/family-appointments-view.tsx',
      '../../../billing/components/family-billing-view.tsx',
      '../../../subscription-contract/components/subscription-contract-view.tsx',
      '../../../subscription-contract/components/contract-signing-wizard.tsx',
      '../../../chronic-care/components/chronic-care-view.tsx',
    ];

    for (const relPath of familyFiles) {
      const fullPath = path.resolve(__dirname, relPath);
      const source = fs.readFileSync(fullPath, 'utf-8');
      expect(source, `Typography violation in ${relPath}`).not.toMatch(
        /\bfont-(mono|black|extrabold)\b/,
      );
    }
  });
});
