'use client';

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorContractsInboundView } from '../doctor-contracts-inbound-view';
import type { FourPartyContract } from '@/features/four-party-contract';

const MOCK_DOCTOR_CONTRACTS: FourPartyContract[] = [
  {
    id: 'ct-doc-001',
    contractNumber: 'HĐ-4B-2026-0088',
    status: 'FACILITY_ASSIGNED',
    packageId: 'pkg-tam-dai',
    packageName: 'Gói Chăm Sóc Sức Khỏe Tam Đại',
    packagePrice: 12500000,
    durationMonths: 12,
    familyId: 'fam-102',
    familyRepresentativeName: 'Trần Văn Mạnh',
    familyRepresentativePhone: '0987654321',
    familyRepresentativeEmail: 'manh.tran@example.com',
    familyAddress: '456 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM',
    membersCount: 5,
    facilityId: 'fac-01',
    facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
    assignedDoctorId: 'doc-current',
    assignedDoctorName: 'BS. CKII Lê Hoàng Nam',
    createdAt: '2026-11-09T09:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Trần Văn Mạnh',
        signerRole: 'FAMILY',
        signedAt: '2026-11-09T09:15:00.000Z',
        sha256Hash: 'a1b2c3d4e5f6',
      },
      platform: {
        signedBy: 'FamiDoc Admin',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-09T09:30:00.000Z',
        sha256Hash: 'b2c3d4e5f6a1',
      },
      facility: {
        signedBy: 'Đại diện Bệnh viện',
        signerRole: 'FACILITY',
        signedAt: '2026-11-09T09:45:00.000Z',
        sha256Hash: 'c3d4e5f6a1b2',
      },
    },
  },
  {
    id: 'ct-doc-002',
    contractNumber: 'HĐ-4B-2026-0099',
    status: 'ACTIVE',
    packageId: 'pkg-cao-tuoi',
    packageName: 'Gói Quản Lý Bệnh Mạn Tính Người Cao Tuổi',
    packagePrice: 8500000,
    durationMonths: 12,
    familyId: 'fam-105',
    familyRepresentativeName: 'Lê Thị Thu',
    familyRepresentativePhone: '0901234567',
    familyRepresentativeEmail: 'thu.le@example.com',
    familyAddress: '789 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    membersCount: 2,
    facilityId: 'fac-01',
    facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
    assignedDoctorId: 'doc-current',
    assignedDoctorName: 'BS. CKII Lê Hoàng Nam',
    createdAt: '2026-11-01T08:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Lê Thị Thu',
        signerRole: 'FAMILY',
        signedAt: '2026-11-01T08:15:00.000Z',
        sha256Hash: 'd4e5f6a1b2c3',
      },
      platform: {
        signedBy: 'FamiDoc Admin',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-01T08:30:00.000Z',
        sha256Hash: 'e5f6a1b2c3d4',
      },
      facility: {
        signedBy: 'Đại diện Bệnh viện',
        signerRole: 'FACILITY',
        signedAt: '2026-11-01T08:45:00.000Z',
        sha256Hash: 'f6a1b2c3d4e5',
      },
      doctor: {
        signedBy: 'BS. CKII Lê Hoàng Nam',
        signerRole: 'DOCTOR',
        signedAt: '2026-11-01T09:00:00.000Z',
        sha256Hash: '1a2b3c4d5e6f',
      },
    },
  },
];

describe('Màn hình Bác sĩ: DoctorContractsInboundView (/doctor/contracts)', () => {
  it('renders assigned contracts list with proper metadata and contract number', () => {
    render(<DoctorContractsInboundView initialContracts={MOCK_DOCTOR_CONTRACTS} />);
    expect(screen.getByText('HĐ-4B-2026-0088')).toBeInTheDocument();
    expect(screen.getByText('Trần Văn Mạnh')).toBeInTheDocument();
    expect(screen.getByText('Gói Chăm Sóc Sức Khỏe Tam Đại')).toBeInTheDocument();

    expect(screen.getByText('HĐ-4B-2026-0099')).toBeInTheDocument();
    expect(screen.getByText('Lê Thị Thu')).toBeInTheDocument();
  });

  it('renders status badges distinguishing pending medical review vs active care', () => {
    render(<DoctorContractsInboundView initialContracts={MOCK_DOCTOR_CONTRACTS} />);
    expect(screen.getByText(/Chờ tiếp nhận y tế/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Đang phụ trách/i).length).toBeGreaterThan(0);
  });

  it('provides action link directing to contract review and care needs summary screen', () => {
    render(<DoctorContractsInboundView initialContracts={MOCK_DOCTOR_CONTRACTS} />);
    const reviewLink = screen.getByRole('link', { name: /Thẩm định & Ký số/i });
    expect(reviewLink).toHaveAttribute('href', '/doctor/contracts/ct-doc-001/review');
  });

  it('renders an empty state container when no contracts are assigned to doctor', () => {
    render(<DoctorContractsInboundView initialContracts={[]} />);
    expect(screen.getByText(/Chưa có hợp đồng nào được phân công/i)).toBeInTheDocument();
  });
});
