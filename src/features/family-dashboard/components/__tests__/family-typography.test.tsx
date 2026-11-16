import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { FamilyDashboardView } from '../family-dashboard-view';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/family',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Medsev Typography Standard on Family Portal & Contract Signing Wizard', () => {
  it('renders FamilyDashboardView vitals with font-bold tabular-nums and without tracking-wide, font-black, or font-extrabold', () => {
    const { container } = render(<FamilyDashboardView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(screen.getByText('135/85')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('98%')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('76')).toHaveClass('font-bold', 'tabular-nums');
    expect(screen.getByText('6.8')).toHaveClass('font-bold', 'tabular-nums');
  });

  it('ensures all Family Portal & ContractSigningWizard source files contain no tracking-wide, font-black, or font-extrabold', () => {
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

  it('renders health warning Alert and updates adherence progress + calls toast.success when toggling medication', async () => {
    vi.clearAllMocks();
    const user = userEvent.setup();
    render(<FamilyDashboardView />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Lưu ý sức khỏe hôm nay: Bác Nguyễn Văn Phúc (Huyết áp 135/85 mmHg)');

    // Initial state has 3/4 taken (75%) and 1 pending ("Bấm đã uống")
    expect(screen.getByText('Tiến độ: 75% (3/4)')).toBeInTheDocument();
    const pendingButton = screen.getByRole('button', { name: 'Bấm đã uống' });

    await user.click(pendingButton);

    expect(screen.getByText('Tiến độ: 100% (4/4)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bấm đã uống' })).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Đã cập nhật trạng thái uống thuốc hôm nay của gia đình!');
  });

  it('renders FamilyDashboardView without nested <main> landmark', () => {
    const { container } = render(<FamilyDashboardView />);
    expect(container.querySelector('main')).toBeNull();
  });
});
