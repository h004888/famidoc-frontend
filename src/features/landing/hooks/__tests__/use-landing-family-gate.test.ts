import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLandingFamilyGate } from '../use-landing-family-gate';
import { contractsApi } from '@/lib/api/contracts.api';

let mockAuthState = {
  isAuthenticated: true,
  role: 'FAMILY',
  isLoading: false,
};

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockAuthState,
}));

describe('useLandingFamilyGate - session reset on 401', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = { isAuthenticated: true, role: 'FAMILY', isLoading: false };
  });

  it('resets hasError and gateStatus when isAuthenticated transitions to false', async () => {
    vi.spyOn(contractsApi, 'getFamilyGateStatus').mockRejectedValueOnce(
      new Error('Unauthorized'),
    );

    const { result, rerender } = renderHook(() => useLandingFamilyGate());
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    mockAuthState = { isAuthenticated: false, role: 'FAMILY', isLoading: false };
    rerender();

    expect(result.current.isFamily).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.gateStatus).toBeNull();
  });
});
