import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import { contractsApi, normalizeStaffingContract } from '../contracts.api';

describe('contractsApi.initiateFourPartyContract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('unwraps standard backend envelope and returns contract id', async () => {
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
      success: true,
      code: 201,
      data: {
        id: 'ctr-001',
        contractNumber: 'CTR-2026-001',
      },
    });

    const result = await contractsApi.initiateFourPartyContract({
      packageId: 'pkg-1',
      facilityId: 'fac-1',
      doctorId: 'doc-1',
      patientIds: ['pat-1'],
      memberCount: 1,
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/contracts/four-party', {
      packageId: 'pkg-1',
      facilityId: 'fac-1',
      doctorId: 'doc-1',
      patientIds: ['pat-1'],
      memberCount: 1,
    });
    expect(result.id).toBe('ctr-001');
  });

  it('handles flat object response without envelope', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
      id: 'ctr-002',
      contractNumber: 'CTR-2026-002',
    });

    const result = await contractsApi.initiateFourPartyContract({
      packageId: 'pkg-1',
      facilityId: 'fac-1',
      patientIds: ['pat-1', 'pat-2'],
      memberCount: 2,
    });

    expect(result.id).toBe('ctr-002');
  });

  it('initiates contract without patientIds (memberCount only) and additionalTerms', async () => {
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        id: 'ctr-003',
        contractNumber: 'CTR-2026-003',
        documensoEnvelopeId: 'env-99',
        documensoItemId: 'item-99',
        signingToken: 'tok-abc',
        signingUrl: 'https://sign.famidoc.online/sign/tok-abc',
      },
    });

    const result = await contractsApi.initiateFourPartyContract({
      packageId: 'pkg-1',
      facilityId: 'fac-1',
      doctorId: 'doc-1',
      memberCount: 3,
      additionalTerms: 'Ưu tiên khám sáng Thứ Bảy.',
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/contracts/four-party', {
      packageId: 'pkg-1',
      facilityId: 'fac-1',
      doctorId: 'doc-1',
      memberCount: 3,
      additionalTerms: 'Ưu tiên khám sáng Thứ Bảy.',
    });
    expect(result.documensoEnvelopeId).toBe('env-99');
    expect(result.signingToken).toBe('tok-abc');
    expect(result.signingUrl).toBe('https://sign.famidoc.online/sign/tok-abc');
  });

  it('unwraps getSigningSession, syncDocumenso and getFamilyGateStatus', async () => {
    const getSpy = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValueOnce({
        success: true,
        data: {
          contractId: 'ctr-003',
          contractNumber: 'CTR-2026-003',
          contractStatus: 'PENDING_APPROVAL',
          signerRole: 'FAMILY_REP',
          alreadySigned: false,
          canSign: true,
          signingToken: 'tok-abc',
          signingUrl: 'https://sign.famidoc.online/sign/tok-abc',
          signedRoles: [],
          signedPdfUrl: null,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          hasActiveContract: false,
          activeContract: null,
          pendingContract: {
            id: 'ctr-003',
            contractNumber: 'CTR-2026-003',
            contractStatus: 'PENDING_APPROVAL',
            memberCount: 3,
          },
          patientCount: 0,
        },
      });
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        synced: true,
        contractId: 'ctr-003',
        contractStatus: 'PENDING_APPROVAL',
        signedRoles: ['FAMILY_REP'],
        signedPdfUrl: '/api/v1/contracts/medical/ctr-003/signed-pdf',
      },
    });

    const session = await contractsApi.getSigningSession('ctr-003');
    const gate = await contractsApi.getFamilyGateStatus();
    const sync = await contractsApi.syncDocumenso('ctr-003');

    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/contracts/medical/ctr-003/signing-session'
    );
    expect(getSpy).toHaveBeenCalledWith('/api/v1/contracts/family/gate-status');
    expect(postSpy).toHaveBeenCalledWith(
      '/api/v1/contracts/four-party/ctr-003/sync-documenso'
    );
    expect(session.signingToken).toBe('tok-abc');
    expect(session.signingUrl).toBe('https://sign.famidoc.online/sign/tok-abc');
    expect(gate.hasActiveContract).toBe(false);
    expect(sync.signedRoles).toEqual(['FAMILY_REP']);
  });

  it('maps getMedicalContracts items cleanly without sending unsupported role query param', async () => {
    const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'ctr-mapped-1',
            contractNumber: 'CTR-2026-777',
            contractStatus: 'PENDING_APPROVAL',
            createdAt: '2026-04-10T09:00:00Z',
            memberCount: 4,
            totalAmount: 5600000,
            servicePackage: { id: 'pkg-1', packageName: 'Gói Gia Đình', durationMonths: 12 },
            familyUnit: {
              id: 'fam-1',
              homeAddress: '10 Lê Lợi',
              representativeUser: { fullName: 'Nguyễn Văn A', phoneNumber: '0901112223' },
            },
            facility: { id: 'fac-1', facilityName: 'PK FamiCare' },
            doctor: { id: 'doc-1', user: { fullName: 'BS. Bình' } },
            signatures: [
              { signerRole: 'FAMILY_REP', signerUserId: 'u-fam-1', signedAt: '2026-04-10T09:05:00Z' },
            ],
          },
        ],
      },
    });

    const list = await contractsApi.getMedicalContracts({ limit: 50 });

    expect(getSpy).toHaveBeenCalledWith('/api/v1/contracts/medical', { limit: 50 });
    expect(list).toHaveLength(1);
    expect(list[0].familyRepresentativeName).toBe('Nguyễn Văn A');
    expect(list[0].signatures?.family?.signedBy).toBe('Nguyễn Văn A');
    expect(list[0].signatures?.doctor).toBeUndefined();
    expect(list[0].documensoEnvelopeId).toBeUndefined();
  });

  it('preserves documensoEnvelopeId null and string values in mapMedicalContractToFourParty', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'ctr-env-null',
            contractNumber: 'CTR-NULL',
            contractStatus: 'PENDING_APPROVAL',
            createdAt: '2026-04-10T09:00:00Z',
            totalAmount: 5000000,
            documensoEnvelopeId: null,
          },
          {
            id: 'ctr-env-set',
            contractNumber: 'CTR-SET',
            contractStatus: 'PENDING_APPROVAL',
            createdAt: '2026-04-10T09:00:00Z',
            totalAmount: 5000000,
            documensoEnvelopeId: 'env-123',
          },
        ],
      },
    });

    const list = await contractsApi.getMedicalContracts();
    expect(list[0].documensoEnvelopeId).toBeNull();
    expect(list[1].documensoEnvelopeId).toBe('env-123');
  });

  it('unwraps getCareSummary envelope', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      success: true,
      data: {
        contractId: 'ctr-1',
        contractNumber: 'HĐ4B-001',
        packageName: 'Gói Gia Đình',
        totalMembers: 1,
        members: [
          {
            patientId: 'pat-1',
            fullName: 'Nguyễn Văn Phúc',
            age: 70,
            gender: 'MALE',
            relationshipToHead: 'PARENT',
            allergies: [],
            documents: [],
          },
        ],
      },
    });

    const summary = await contractsApi.getCareSummary('ctr-1');
    expect(summary.contractId).toBe('ctr-1');
    expect(summary.members).toHaveLength(1);
    expect(summary.members[0].fullName).toBe('Nguyễn Văn Phúc');
  });

  it('supports throwOnError in getStaffingContracts and avoids synthetic An Sinh/2026-11-12 defaults', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce(new Error('Network down'));

    await expect(
      contractsApi.getStaffingContracts(undefined, { throwOnError: true })
    ).rejects.toThrow('Network down');

    vi.spyOn(httpClient, 'get').mockRejectedValueOnce(new Error('Network down'));
    await expect(contractsApi.getStaffingContracts()).resolves.toEqual({
      data: [],
      total: 0,
    });

    const normalized = normalizeStaffingContract({ id: 'b2b-1', status: 'DRAFT' });
    expect(normalized.contractNumber).toBe('b2b-1');
    expect(normalized.facilitySigned).toBe(false);
    expect(normalized.adminSigned).toBe(false);
    expect(normalized.facilityName).not.toContain('An Sinh');
    expect(normalized.validFrom).toBe('');
    expect(normalized.validTo).toBe('');

    const waitingAdmin = normalizeStaffingContract({
      id: 'b2b-wait-admin',
      status: 'PENDING_ADMIN_SIGNATURE',
    });
    expect(waitingAdmin.facilitySigned).toBe(true);
    expect(waitingAdmin.adminSigned).toBe(false);

    const explicitFalseAdmin = normalizeStaffingContract({
      id: 'b2b-2',
      status: 'PENDING_SIGNATURE',
      adminSigned: false,
      facilitySharePercent: 'invalid',
      platformSharePercent: 'NaN',
    });
    expect(explicitFalseAdmin.status).toBe('DRAFT');
    expect(explicitFalseAdmin.adminSigned).toBe(false);
    expect(explicitFalseAdmin.facilitySharePercent).toBe(85);
    expect(explicitFalseAdmin.platformSharePercent).toBe(15);

    const unknownStatus = normalizeStaffingContract({
      id: 'b2b-3',
      status: 'CANCELLED_BY_SYSTEM',
    });
    expect(unknownStatus.status).toBe('TERMINATED');
    expect(unknownStatus.adminSigned).toBe(false);
  });

  it('unwraps getStaffingContracts and getStaffingContractById response shapes', async () => {
    vi.spyOn(httpClient, 'get')
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            {
              id: 'stf-1',
              contractCode: 'STF-2026-001',
              status: 'PENDING_FACILITY_SIGNATURE',
              facilityRevenueRate: 85,
              platformCommissionRate: 15,
            },
          ],
          total: 1,
        },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'stf-2', contractCode: 'STF-2026-002', status: 'ACTIVE' }],
        pagination: { total: 4 },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { id: 'stf-1', contractCode: 'STF-2026-001' },
      })
      .mockResolvedValueOnce({
        data: { id: 'stf-2', contractCode: 'STF-2026-002' },
      })
      .mockRejectedValueOnce(new Error('500'));

    const list1 = await contractsApi.getStaffingContracts({ limit: 100 });
    expect(list1.total).toBe(1);
    expect(list1.data[0].contractNumber).toBe('STF-2026-001');
    expect(list1.data[0].facilitySigned).toBe(false);
    expect(list1.data[0].adminSigned).toBe(false);

    const list2 = await contractsApi.getStaffingContracts();
    expect(list2.total).toBe(4);
    expect(list2.data[0].status).toBe('ACTIVE');
    expect(list2.data[0].adminSigned).toBe(true);

    const detail1 = await contractsApi.getStaffingContractById('stf-1');
    expect(detail1).toEqual({ id: 'stf-1', contractCode: 'STF-2026-001' });

    const detail2 = await contractsApi.getStaffingContractById('stf-2');
    expect(detail2).toEqual({ id: 'stf-2', contractCode: 'STF-2026-002' });

    await expect(
      contractsApi.getStaffingContractById('stf-3', { throwOnError: true })
    ).rejects.toThrow('500');
  });
});
