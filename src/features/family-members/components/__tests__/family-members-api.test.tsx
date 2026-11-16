'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { FamilyMembersView } from '../family-members-view';
import { contractsApi, patientsApi } from '@/lib/api';

describe('FamilyMembersView full real API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(contractsApi, 'getFamilyGateStatus').mockResolvedValue({
      hasActiveContract: true,
      activeContract: {
        id: 'ctr-1',
        contractNumber: 'MC-REAL-001',
        memberCount: 2,
        endDate: '2027-01-01T00:00:00.000Z',
        packageName: 'Gói Trải Nghiệm',
        packageDescription: 'Chăm sóc tại nhà cơ bản',
        doctor: {
          id: 'doc-1',
          fullName: 'BS. Nguyễn Kiểm Thử',
          title: 'BS.CKI Gia Đình',
          hospitalName: 'PK FamiDoc Q.1',
          avatarUrl: null,
          phone: '0909123456',
          experienceYears: 8,
        },
      },
      pendingContract: null,
      familyUnit: {
        id: 'fam-1',
        homeAddress: '124 Nguyễn Đình Chiểu, Q.1',
        emergencyPhone: '0912345678',
        representativeName: 'Nguyễn Văn Kiểm Thử',
      },
      patientCount: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hiển thị Empty State và 0/2 thành viên khi DB trả [], không hiển thị dữ liệu demo giả', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([]);

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getByTestId('family-members-empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('member-quota-badge')).toHaveTextContent('0 / 2 thành viên');
      expect(screen.getByText('BS. Nguyễn Kiểm Thử')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn Phúc')).not.toBeInTheDocument();
      expect(screen.queryByText(/#FAM-88219/)).not.toBeInTheDocument();
    });
  });

  it('gửi payload chuẩn có relationshipToRepresentative cùng metadata y tế khi tạo thành viên mới', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([]);
    const createSpy = vi.spyOn(patientsApi, 'createFamilyMember').mockResolvedValueOnce({
      id: 'pt-102',
      familyId: 'fam-1',
      fullName: 'Trần Thị Mai',
      dateOfBirth: '1988-08-20',
      gender: 'FEMALE',
      relationshipToHead: 'CHILD',
      bloodType: 'O+',
      registeredHospital: 'BV Đại học Y Dược TP.HCM',
      status: 'ACTIVE',
      createdAt: '2026-11-14T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
    });

    const toastSpy = vi.spyOn(toast, 'success');

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getByTestId('family-members-empty-state')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Thêm thành viên đầu tiên/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Thêm thành viên đầu tiên/i }));
    await userEvent.type(screen.getByPlaceholderText(/Ví dụ: Nguyễn Thị Lan/i), 'Trần Thị Mai');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Trần Thị Mai',
          relationshipToRepresentative: 'CHILD',
          bloodType: 'O+',
          registeredHospital: 'BV Đại học Y Dược TP.HCM',
        })
      );
      expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
      expect(screen.getByTestId('member-quota-badge')).toHaveTextContent('1 / 2 thành viên');
      expect(toastSpy).toHaveBeenCalled();
    });
  });

  it('hiển thị lỗi API thật và KHÔNG tạo bản ghi/toast giả khi createFamilyMember trả lỗi', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([]);
    vi.spyOn(patientsApi, 'createFamilyMember').mockRejectedValueOnce(
      new Error('Hộ gia đình đã đạt giới hạn tối đa 2 thành viên của gói hiện tại.')
    );

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getByTestId('family-members-empty-state')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Thêm thành viên đầu tiên/i }));
    await userEvent.type(screen.getByPlaceholderText(/Ví dụ: Nguyễn Thị Lan/i), 'Thành Viên Lỗi');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Hộ gia đình đã đạt giới hạn tối đa 2 thành viên của gói hiện tại.'
      );
      expect(screen.queryByText('Thành Viên Lỗi')).not.toBeInTheDocument();
      expect(screen.queryByText(/Đã thêm thành công/)).not.toBeInTheDocument();
    });
  });

  it('khóa nút Thêm thành viên và hiện banner hết suất khi đạt 2/2, đồng thời hỗ trợ sửa & tách thành viên', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([
      {
        id: 'pt-1',
        familyId: 'fam-1',
        fullName: 'Nguyễn Minh An',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        relationshipToHead: 'SELF',
        bloodType: 'O+',
        status: 'ACTIVE',
        createdAt: '2026-11-14T00:00:00.000Z',
        updatedAt: '2026-11-14T00:00:00.000Z',
      },
      {
        id: 'pt-2',
        familyId: 'fam-1',
        fullName: 'Nguyễn Minh Bé',
        dateOfBirth: '2018-02-02',
        gender: 'FEMALE',
        relationshipToHead: 'CHILD',
        bloodType: 'A+',
        status: 'ACTIVE',
        createdAt: '2026-11-14T00:00:00.000Z',
        updatedAt: '2026-11-14T00:00:00.000Z',
      },
    ]);

    const updateSpy = vi.spyOn(patientsApi, 'updateFamilyMember').mockResolvedValueOnce({
      id: 'pt-2',
      familyId: 'fam-1',
      fullName: 'Nguyễn Minh Bé Mới',
      dateOfBirth: '2018-02-02',
      gender: 'FEMALE',
      relationshipToHead: 'CHILD',
      bloodType: 'A+',
      status: 'ACTIVE',
      createdAt: '2026-11-14T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
    });

    const detachSpy = vi.spyOn(patientsApi, 'detachFamilyMember').mockResolvedValueOnce({
      id: 'pt-2',
      familyId: 'fam-1',
      fullName: 'Nguyễn Minh Bé Mới',
      dateOfBirth: '2018-02-02',
      gender: 'FEMALE',
      relationshipToHead: 'CHILD',
      bloodType: 'A+',
      status: 'INACTIVE',
      createdAt: '2026-11-14T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
    });

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getByTestId('member-quota-reached-banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Đã đủ suất gói/i })).toBeDisabled();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Sửa thông tin của Nguyễn Minh Bé' }));
    const editInput = screen.getByDisplayValue('Nguyễn Minh Bé');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Nguyễn Minh Bé Mới');
    await userEvent.click(screen.getByRole('button', { name: /Cập nhật hồ sơ/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'pt-2',
        expect.objectContaining({ fullName: 'Nguyễn Minh Bé Mới' })
      );
      expect(screen.getByText('Nguyễn Minh Bé Mới')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Tách Nguyễn Minh Bé Mới khỏi hộ' }));
    await userEvent.click(screen.getByRole('button', { name: /Xác nhận tách/i }));

    await waitFor(() => {
      expect(detachSpy).toHaveBeenCalledWith('pt-2');
      expect(screen.queryByText('Nguyễn Minh Bé Mới')).not.toBeInTheDocument();
      expect(screen.getByTestId('member-quota-badge')).toHaveTextContent('1 / 2 thành viên');
    });
  });
});