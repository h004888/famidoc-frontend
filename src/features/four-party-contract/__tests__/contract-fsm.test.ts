import { describe, it, expect } from 'vitest';
import {
  CONTRACT_STATUSES,
  type ContractStatus,
  canTransitionContractStatus,
  getNextContractStatuses,
  transitionContractStatus,
  CONTRACT_TRANSITION_MAP,
} from '../types/contract-fsm';
import {
  doctorAssignmentSchema,
  contractSchema,
  MAX_HOUSEHOLDS_PER_DOCTOR,
} from '../schemas/contract.schema';

describe('Four-Party Contract FSM Transitions', () => {
  it('allows valid sequential transitions across full four-party lifecycle', () => {
    const validSequence: ContractStatus[] = [
      'DRAFT',
      'FAMILY_SIGNED',
      'PLATFORM_SIGNED',
      'FACILITY_ASSIGNED',
      'DOCTOR_ACCEPTED',
      'PENDING_PAYMENT',
      'ACTIVE',
    ];

    for (let i = 0; i < validSequence.length - 1; i++) {
      const current = validSequence[i];
      const next = validSequence[i + 1];

      expect(canTransitionContractStatus(current, next)).toBe(true);
      expect(getNextContractStatuses(current)).toContain(next);
      expect(transitionContractStatus(current, next)).toBe(next);
    }
  });

  it('rejects invalid state jumps and backward transitions', () => {
    // DRAFT cannot jump directly to DOCTOR_ACCEPTED or ACTIVE
    expect(canTransitionContractStatus('DRAFT', 'DOCTOR_ACCEPTED')).toBe(false);
    expect(canTransitionContractStatus('DRAFT', 'ACTIVE')).toBe(false);
    expect(() => transitionContractStatus('DRAFT', 'DOCTOR_ACCEPTED')).toThrow();

    // FAMILY_SIGNED cannot skip PLATFORM_SIGNED to FACILITY_ASSIGNED
    expect(canTransitionContractStatus('FAMILY_SIGNED', 'FACILITY_ASSIGNED')).toBe(false);

    // Cannot transition backward from ACTIVE to DRAFT
    expect(canTransitionContractStatus('ACTIVE', 'DRAFT')).toBe(false);
    expect(() => transitionContractStatus('ACTIVE', 'DRAFT')).toThrow();

    // DOCTOR_ACCEPTED cannot jump directly to ACTIVE skipping payment
    expect(canTransitionContractStatus('DOCTOR_ACCEPTED', 'ACTIVE')).toBe(false);
  });

  it('provides comprehensive transition map containing all defined statuses', () => {
    for (const status of CONTRACT_STATUSES) {
      expect(CONTRACT_TRANSITION_MAP).toHaveProperty(status);
      expect(Array.isArray(CONTRACT_TRANSITION_MAP[status])).toBe(true);
    }
  });
});

describe('Doctor Assignment Quota Schema Validation', () => {
  it('accepts doctor assignment when assigned household quota is below threshold (< 30)', () => {
    const validData = {
      doctorId: 'doc-123',
      doctorName: 'BS. CKII Lê Hoàng Nam',
      facilityId: 'fac-001',
      contractId: 'contract-4p-001',
      currentAssignedHouseholds: 21,
    };

    const result = doctorAssignmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentAssignedHouseholds).toBe(21);
    }
  });

  it('rejects doctor assignment when assigned household quota is 30 or higher (quota limit)', () => {
    expect(MAX_HOUSEHOLDS_PER_DOCTOR).toBe(30);

    const atLimitData = {
      doctorId: 'doc-456',
      doctorName: 'BS. CKI Trần Mai',
      facilityId: 'fac-001',
      contractId: 'contract-4p-002',
      currentAssignedHouseholds: 30,
    };

    const resultAtLimit = doctorAssignmentSchema.safeParse(atLimitData);
    expect(resultAtLimit.success).toBe(false);
    if (!resultAtLimit.success) {
      const errorMsg = resultAtLimit.error.issues[0]?.message;
      expect(errorMsg).toMatch(/30|định biên|quota/i);
    }

    const overLimitData = {
      ...atLimitData,
      currentAssignedHouseholds: 31,
    };

    const resultOverLimit = doctorAssignmentSchema.safeParse(overLimitData);
    expect(resultOverLimit.success).toBe(false);
  });

  it('validates four-party contract schema structure with digital signatures', () => {
    const mockContract = {
      id: 'ct-88219',
      contractNumber: 'HD-4P-2026-88219',
      status: 'FAMILY_SIGNED',
      packageId: 'pkg-family-12m',
      packageName: 'Gói Toàn Diện Gia Đình (12 Tháng)',
      packagePrice: 9600000,
      familyId: 'fam-01',
      familyRepresentativeName: 'Nguyễn Văn An',
      familyRepresentativePhone: '0912345678',
      familyRepresentativeEmail: 'nguyenvanan@example.com',
      facilityId: 'fac-01',
      facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
      membersCount: 4,
      createdAt: '2026-11-09T08:00:00.000Z',
      signatures: {
        family: {
          signedBy: 'Nguyễn Văn An',
          signerRole: 'FAMILY',
          signedAt: '2026-11-09T08:30:00.000Z',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      },
    };

    const parsed = contractSchema.safeParse(mockContract);
    expect(parsed.success).toBe(true);
  });
});
