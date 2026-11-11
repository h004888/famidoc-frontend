import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContractDocumentSheet } from '../components/contract-document-sheet';
import type { FourPartyContract } from '../schemas/contract.schema';

const mockPartiallySignedContract: FourPartyContract = {
  id: 'ct-4p-001',
  contractNumber: 'HD-4P-2026-0001',
  status: 'PLATFORM_SIGNED',
  packageId: 'pkg-family-gold',
  packageName: 'Gói Chăm Sóc Toàn Diện Gia Đình',
  packagePrice: 9600000,
  durationMonths: 12,
  familyId: 'fam-88219',
  familyRepresentativeName: 'Nguyễn Văn An',
  familyRepresentativePhone: '0912345678',
  familyRepresentativeEmail: 'nguyenvanan@example.com',
  familyAddress: '123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
  membersCount: 4,
  facilityId: 'fac-01',
  facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
  facilityAddress: '456 Lê Văn Sỹ, Phường 2, Tân Bình, TP. Hồ Chí Minh',
  doctorId: 'doc-01',
  doctorName: 'BS. CKII Lê Hoàng Nam',
  doctorTitle: 'Bác sĩ Gia đình Phụ trách',
  createdAt: '2026-11-09T08:00:00.000Z',
  signatures: {
    family: {
      signedBy: 'Nguyễn Văn An',
      signerRole: 'FAMILY',
      signedAt: '2026-11-09T08:30:00.000Z',
      sha256Hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
    platform: {
      signedBy: 'Ban Điều Hành Famidoc (Nguyễn Quản Trị)',
      signerRole: 'PLATFORM',
      signedAt: '2026-11-09T09:15:00.000Z',
      sha256Hash: 'b2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
    },
    // facility and doctor are NOT signed yet
  },
};

const mockFullySignedContract: FourPartyContract = {
  ...mockPartiallySignedContract,
  status: 'ACTIVE',
  signatures: {
    ...mockPartiallySignedContract.signatures,
    facility: {
      signedBy: 'Đại diện CSYT - TS.BS Vũ Thành',
      signerRole: 'FACILITY',
      signedAt: '2026-11-09T10:00:00.000Z',
      sha256Hash: 'c3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567892',
    },
    doctor: {
      signedBy: 'BS. CKII Lê Hoàng Nam',
      signerRole: 'DOCTOR',
      signedAt: '2026-11-09T10:30:00.000Z',
      sha256Hash: 'd4e5f6a1b2c37890abcdef1234567890abcdef1234567890abcdef1234567893',
    },
  },
};

describe('ContractDocumentSheet Component', () => {
  it('renders contract legal terms, package information, and 4 party headings', () => {
    render(<ContractDocumentSheet contract={mockPartiallySignedContract} />);

    // Contract Number and Legal Header
    expect(screen.getByText(/HD-4P-2026-0001/i)).toBeInTheDocument();
    expect(screen.getByText(/HỢP ĐỒNG DỊCH VỤ CHĂM SÓC SỨC KHỎE BAN ĐẦU/i)).toBeInTheDocument();
    expect(screen.getByText(/Gói Chăm Sóc Toàn Diện Gia Đình/i)).toBeInTheDocument();

    // 4 Parties
    expect(screen.getByText(/Bên A: Đại diện Hộ gia đình/i)).toBeInTheDocument();
    expect(screen.getByText(/Bên B: Nền tảng Famidoc/i)).toBeInTheDocument();
    expect(screen.getByText(/Bên C: Cơ sở Y tế/i)).toBeInTheDocument();
    expect(screen.getByText(/Bên D: Bác sĩ Gia đình/i)).toBeInTheDocument();

    // Legal articles
    expect(screen.getByText(/Điều 1: Đối tượng và phạm vi dịch vụ/i)).toBeInTheDocument();
    expect(screen.getByText(/Điều 2: Trách nhiệm và quyền hạn/i)).toBeInTheDocument();
  });

  it('renders neutral waiting frame for unsigned parties (no slop)', () => {
    render(<ContractDocumentSheet contract={mockPartiallySignedContract} />);

    // Facility and Doctor are unsigned in this contract
    const unsignedBoxes = screen.getAllByText(/Chờ ký số|Chưa ký/i);
    expect(unsignedBoxes.length).toBeGreaterThanOrEqual(2);

    // Verify neutral indicator exists
    const facilitySignZone = screen.getByTestId('signature-box-facility');
    expect(facilitySignZone).toHaveTextContent(/Chờ ký số/i);
    expect(facilitySignZone.className).toContain('border-dashed');

    const doctorSignZone = screen.getByTestId('signature-box-doctor');
    expect(doctorSignZone).toHaveTextContent(/Chờ ký số/i);
    expect(doctorSignZone.className).toContain('border-dashed');
  });

  it('renders SHA-256 hash checksum and timestamp when signed', () => {
    render(<ContractDocumentSheet contract={mockPartiallySignedContract} />);

    const familySignZone = screen.getByTestId('signature-box-family');
    expect(familySignZone).toHaveTextContent('Nguyễn Văn An');
    expect(familySignZone).toHaveTextContent('a1b2c3d4e5f67890');
    expect(familySignZone).toHaveTextContent(/2026-11-09|09\/11\/2026/);

    const platformSignZone = screen.getByTestId('signature-box-platform');
    expect(platformSignZone).toHaveTextContent('Ban Điều Hành Famidoc');
    expect(platformSignZone).toHaveTextContent('b2c3d4e5f6a17890');
  });

  it('renders all 4 signatures when fully signed', () => {
    render(<ContractDocumentSheet contract={mockFullySignedContract} />);

    expect(screen.getByTestId('signature-box-family')).toHaveTextContent('a1b2c3d4e5f67890');
    expect(screen.getByTestId('signature-box-platform')).toHaveTextContent('b2c3d4e5f6a17890');
    expect(screen.getByTestId('signature-box-facility')).toHaveTextContent('c3d4e5f6a1b27890');
    expect(screen.getByTestId('signature-box-doctor')).toHaveTextContent('d4e5f6a1b2c37890');
  });

  it('conforms to typography foundation spec without font-mono or font-black/extrabold', () => {
    const { container } = render(<ContractDocumentSheet contract={mockFullySignedContract} />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });
});
