import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { redirect } from 'next/navigation';
import FacilityDoctorAssignPage from '../page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Legacy /facility/contracts/[id]/assign redirect page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects legacy /facility/contracts/[id]/assign to /facility/coordination/[id]', async () => {
    const pageElement = FacilityDoctorAssignPage({
      params: Promise.resolve({ id: 'ct-4p-999' }),
    });

    const contentElement = (
      pageElement.props as {
        children: React.ReactElement<{ params: Promise<{ id: string }> }>;
      }
    ).children;
    const ContentComponent = contentElement.type as (props: {
      params: Promise<{ id: string }>;
    }) => Promise<React.ReactNode>;

    await ContentComponent(contentElement.props);

    expect(redirect).toHaveBeenCalledWith('/facility/coordination/ct-4p-999');

    const { container } = render(pageElement);
    expect(container).toBeTruthy();
  });
});
