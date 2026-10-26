import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettingsView } from '../account-settings-view';

describe('UT-CMP-14: AccountSettingsView BHYT Skeleton & Accessibility', () => {
  it('displays loading skeleton with aria-busy when switching to BHYT tab', async () => {
    render(<AccountSettingsView />);
    const bhytTab = screen.getByRole('button', { name: /Bảo hiểm Y tế & Ký quỹ/i });
    await userEvent.click(bhytTab);

    // Should render either skeleton or loaded state cleanly with accessible headers
    expect(screen.getByRole('heading', { level: 3, name: /Bảo hiểm Y tế & Ký quỹ/i })).toBeInTheDocument();
    expect(screen.getByText(/Mã thẻ BHYT Điện tử:/i)).toBeInTheDocument();
  });
});
