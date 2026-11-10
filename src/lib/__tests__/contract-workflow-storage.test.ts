import { describe, it, expect, beforeEach } from 'vitest';
import {
  getContractWorkflow,
  updateContractStep,
  resetContractWorkflow,
  DEFAULT_WORKFLOW_STATE,
} from '../contract-workflow-storage';

describe('Contract Workflow Storage and Snapshot Caching', () => {
  beforeEach(() => {
    resetContractWorkflow();
  });

  it('maintains strict reference equality between repeated getContractWorkflow calls when data is unchanged', () => {
    const snap1 = getContractWorkflow();
    const snap2 = getContractWorkflow();
    expect(snap1).toBe(snap2); // Strict reference equality for useSyncExternalStore getSnapshot
  });

  it('updates reference when saveContractWorkflow or updateContractStep is called', () => {
    const initial = getContractWorkflow();
    const updated = updateContractStep('PENDING_FACILITY_SIGN', {
      adminSigned: true,
      adminSignedAt: '10/11/2026 15:00',
    });

    expect(updated.step).toBe('PENDING_FACILITY_SIGN');
    expect(updated.adminSigned).toBe(true);

    const fresh = getContractWorkflow();
    expect(fresh).toBe(updated);
    expect(fresh).not.toBe(initial);
  });

  it('resets back to default state and provides fresh cached snapshot', () => {
    updateContractStep('ACTIVE');
    const reset = resetContractWorkflow();
    expect(reset.step).toBe(DEFAULT_WORKFLOW_STATE.step);

    const fresh = getContractWorkflow();
    expect(fresh).toBe(reset);
  });
});
