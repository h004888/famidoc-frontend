import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FamilyMemberCareView } from '../family-member-care-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/family/members/mem-1',
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    patientsApi: {
      ...actual.patientsApi,
      getFamilyMembers: vi.fn().mockResolvedValue([]),
      getPatientDetail: vi.fn().mockResolvedValue(null),
    },
  };
});

describe('FamilyMemberCareView Responsive Layout', () => {
  it('renders cleanly without nested <main> and includes mobile card container', () => {
    const { container } = render(<FamilyMemberCareView memberId="mem-1" />);
    expect(container.querySelector('main')).toBeNull();
    expect(container.querySelector('.md\\:hidden')).not.toBeNull();
  });
});
