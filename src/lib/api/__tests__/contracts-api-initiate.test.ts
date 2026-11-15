import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import { contractsApi } from '../contracts.api';

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
  });
});
