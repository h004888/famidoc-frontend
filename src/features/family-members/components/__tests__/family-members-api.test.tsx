'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { FamilyMembersView } from '../family-members-view';
import { contractsApi, patientsApi } from '@/lib/api';
import { FAMILY_GATE_REFRESH_EVENT } from '@/components/layout/family-subscription-gate';

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
      expect(screen.getByRole('heading', { name: 'Quản lý Thành viên' })).toBeInTheDocument();
      expect(screen.getAllByText(/gói Gói Trải Nghiệm/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/mã số bảo hiểm y tế/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn Phúc')).not.toBeInTheDocument();
      expect(screen.queryByText(/#FAM-88219/)).not.toBeInTheDocument();
      expect(screen.queryByText('Bảng Sức Khỏe Gia Đình')).not.toBeInTheDocument();
      expect(screen.queryByText(/MC-REAL-001/)).not.toBeInTheDocument();
      expect(screen.queryByText('Đồng bộ Hồ sơ FamiDoc')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Hợp Đồng & Gói Dịch Vụ/i })).not.toBeInTheDocument();
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
    expect(screen.queryByLabelText(/Số CCCD/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Mã số thẻ BHYT/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nơi ĐKKCB ban đầu/i)).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const gateEventListener = vi.fn();
    window.addEventListener(FAMILY_GATE_REFRESH_EVENT, gateEventListener);

    await userEvent.click(screen.getByRole('button', { name: /Thêm thành viên đầu tiên/i }));
    expect(screen.getByText(/Còn 2\/2 suất/)).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/Ví dụ: Nguyễn Thị Lan/i), 'Trần Thị Mai');
    await userEvent.type(screen.getByLabelText(/Ngày tháng năm sinh/i), '1988-08-20');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Trần Thị Mai',
          dateOfBirth: '1988-08-20',
          relationshipToRepresentative: 'CHILD',
          bloodType: 'O+',
        })
      );
      expect(screen.getAllByText('Trần Thị Mai').length).toBeGreaterThan(0);
      expect(screen.getByTestId('member-quota-badge')).toHaveTextContent('1 / 2 thành viên');
      expect(gateEventListener).toHaveBeenCalledTimes(1);
      expect(toastSpy).toHaveBeenCalled();
    });
    window.removeEventListener(FAMILY_GATE_REFRESH_EVENT, gateEventListener);
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
    await userEvent.type(screen.getByLabelText(/Ngày tháng năm sinh/i), '1992-03-10');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Hộ gia đình đã đạt giới hạn tối đa 2 thành viên của gói hiện tại.'
      );
      expect(screen.queryByText('Thành Viên Lỗi')).not.toBeInTheDocument();
      expect(screen.queryByText(/Đã thêm thành công/)).not.toBeInTheDocument();
    });
  });

  it('chặn gửi form khi thiếu ngày sinh hoặc ngày sinh tương lai / > 120 tuổi', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([]);
    const createSpy = vi.spyOn(patientsApi, 'createFamilyMember');

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getByTestId('family-members-empty-state')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Thêm thành viên đầu tiên/i }));
    await userEvent.type(screen.getByPlaceholderText(/Ví dụ: Nguyễn Thị Lan/i), 'Nguyễn Test');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vui lòng nhập ngày tháng năm sinh của thành viên.'
    );

    const dobInput = screen.getByLabelText(/Ngày tháng năm sinh/i);
    await userEvent.type(dobInput, '2999-01-01');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ngày sinh không thể là ngày trong tương lai.'
    );

    await userEvent.clear(dobInput);
    await userEvent.type(dobInput, '1850-01-01');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ngày sinh không hợp lệ (tuổi vượt quá 120 năm).'
    );
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('gửi giới tính Khác, nhóm máu AB- và các dòng dị ứng có cấu trúc, cảnh báo nếu 1 dị ứng lỗi', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([]);
    const createSpy = vi.spyOn(patientsApi, 'createFamilyMember').mockResolvedValueOnce({
      id: 'pt-200',
      familyId: 'fam-1',
      fullName: 'Lê Minh Khang',
      dateOfBirth: '1995-04-12',
      gender: 'OTHER',
      relationshipToHead: 'OTHER',
      bloodType: 'AB-',
      status: 'ACTIVE',
      createdAt: '2026-11-14T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
    });
    const allergySpy = vi
      .spyOn(patientsApi, 'addMemberAllergy')
      .mockResolvedValueOnce({
        id: 'al-1',
        allergenType: 'FOOD',
        allergenName: 'Hải sản',
        severity: 'LIFE_THREATENING_ANAPHYLAXIS',
        clinicalManifestation: 'Khó thở',
      })
      .mockRejectedValueOnce(new Error('Network error'));
    const toastSpy = vi.spyOn(toast, 'success');

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getByTestId('family-members-empty-state')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Thêm thành viên đầu tiên/i }));
    await userEvent.type(screen.getByLabelText(/Họ và tên người thân/i), 'Lê Minh Khang');
    await userEvent.selectOptions(screen.getByLabelText(/Quan hệ với chủ hộ/i), 'Khác');
    await userEvent.type(screen.getByLabelText(/Ngày tháng năm sinh/i), '1995-04-12');
    await userEvent.click(screen.getByRole('button', { name: 'Khác' }));
    await userEvent.selectOptions(screen.getByLabelText(/Nhóm máu/i), 'AB-');

    await userEvent.click(screen.getByRole('button', { name: /\+ Thêm dị ứng/i }));
    await userEvent.type(screen.getByLabelText('Chất hoặc thuốc gây dị ứng 1'), 'Hải sản');
    await userEvent.selectOptions(screen.getByLabelText('Nhóm dị ứng 1'), 'FOOD');
    await userEvent.selectOptions(
      screen.getByLabelText('Mức độ dị ứng 1'),
      'LIFE_THREATENING_ANAPHYLAXIS'
    );
    await userEvent.type(screen.getByLabelText('Triệu chứng gặp phải 1'), 'Khó thở');

    await userEvent.click(screen.getByRole('button', { name: /\+ Thêm dị ứng/i }));
    await userEvent.type(screen.getByLabelText('Chất hoặc thuốc gây dị ứng 2'), 'Phấn hoa');
    await userEvent.selectOptions(screen.getByLabelText('Nhóm dị ứng 2'), 'ENVIRONMENTAL');

    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Lê Minh Khang',
          dateOfBirth: '1995-04-12',
          gender: 'OTHER',
          relationshipToRepresentative: 'OTHER',
          bloodType: 'AB-',
        })
      );
      expect(allergySpy).toHaveBeenCalledTimes(2);
      expect(allergySpy).toHaveBeenNthCalledWith(1, 'pt-200', {
        allergenType: 'FOOD',
        allergenName: 'Hải sản',
        severity: 'LIFE_THREATENING_ANAPHYLAXIS',
        clinicalManifestation: 'Khó thở',
      });
      expect(allergySpy).toHaveBeenNthCalledWith(2, 'pt-200', {
        allergenType: 'ENVIRONMENTAL',
        allergenName: 'Phấn hoa',
        severity: 'MILD',
        clinicalManifestation: undefined,
      });
      expect(toastSpy).toHaveBeenCalledWith(
        expect.stringContaining('chưa lưu được toàn bộ ghi chú dị ứng')
      );
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
        allergies: [
          {
            id: 'al-existing',
            allergenType: 'DRUG',
            allergenName: 'Penicillin',
            severity: 'MODERATE',
          },
        ],
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

    await userEvent.click(screen.getAllByRole('button', { name: 'Sửa thông tin của Nguyễn Minh Bé' })[0]);
    const editInput = screen.getByDisplayValue('Nguyễn Minh Bé');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Nguyễn Minh Bé Mới');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'pt-2',
        expect.objectContaining({ fullName: 'Nguyễn Minh Bé Mới' })
      );
      expect(screen.getAllByText('Nguyễn Minh Bé Mới').length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByRole('button', { name: 'Gỡ Nguyễn Minh Bé Mới khỏi danh sách' })[0]);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Gỡ thành viên khỏi danh sách?');
    expect(screen.getByRole('alertdialog')).not.toHaveTextContent('MC-REAL-001');
    await userEvent.click(screen.getByRole('button', { name: /Gỡ thành viên/i }));

    await waitFor(() => {
      expect(detachSpy).toHaveBeenCalledWith('pt-2');
      expect(screen.queryByText('Nguyễn Minh Bé Mới')).not.toBeInTheDocument();
      expect(screen.getByTestId('member-quota-badge')).toHaveTextContent('1 / 2 thành viên');
      expect(screen.getAllByRole('button', { name: /Thêm thành viên mới/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Xem hồ sơ/i })[0]).toHaveAttribute(
        'href',
        '/family/members/pt-1'
      );
      expect(screen.getAllByText('Không có bệnh nền').length).toBeGreaterThan(0);
    });
  });

  it('hiển thị lỗi kèm nút Tải lại danh sách (không chồng Empty State) và khôi phục khi retry thành công', async () => {
    const getSpy = vi
      .spyOn(patientsApi, 'getFamilyMembers')
      .mockRejectedValueOnce(new Error('Mất kết nối máy chủ'))
      .mockResolvedValueOnce([]);

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Mất kết nối máy chủ');
      expect(screen.queryByTestId('family-members-empty-state')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Tải lại danh sách/i }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('family-members-empty-state')).toBeInTheDocument();
    });
  });

  it('cho phép gõ dấu phẩy/khoảng trắng ở ô Bệnh nền khi sửa và chặn gửi dòng dị ứng có triệu chứng nhưng thiếu tên', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([
      {
        id: 'pt-1',
        familyId: 'fam-1',
        fullName: 'Nguyễn Minh An',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        relationshipToHead: 'SELF',
        bloodType: 'O+',
        allergies: [
          {
            id: 'al-existing',
            allergenType: 'DRUG',
            allergenName: 'Penicillin',
            severity: 'MODERATE',
          },
        ],
        status: 'ACTIVE',
        createdAt: '2026-11-14T00:00:00.000Z',
        updatedAt: '2026-11-14T00:00:00.000Z',
      },
    ]);
    const updateSpy = vi.spyOn(patientsApi, 'updateFamilyMember').mockResolvedValueOnce({
      id: 'pt-1',
      familyId: 'fam-1',
      fullName: 'Nguyễn Minh An',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      relationshipToHead: 'SELF',
      bloodType: 'O+',
      chronicDiseases: 'Tiểu đường, Huyết áp cao',
      status: 'ACTIVE',
      createdAt: '2026-11-14T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
    });

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getAllByText('Nguyễn Minh An').length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByRole('button', { name: 'Sửa thông tin của Nguyễn Minh An' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Cập nhật thông tin thành viên');
    expect(screen.getByRole('dialog')).toHaveTextContent('Nguyễn Minh An · Chủ hộ (Đại diện)');
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Gói Trải Nghiệm');
    expect(screen.getByRole('dialog')).not.toHaveTextContent('MC-REAL-001');
    expect(screen.getByText('Cố định theo tài khoản')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('Thông tin y tế');
    // Allergy rows are inline-editable; verify existing allergy appears in the form
    expect(
      screen.getByLabelText('Chất hoặc thuốc gây dị ứng 1')
    ).toHaveAttribute('value', 'Penicillin');
    await userEvent.click(screen.getByRole('button', { name: 'Tăng huyết áp' }));
    const chronicInput = screen.getByLabelText(/Bệnh nền đang theo dõi/i);
    expect(chronicInput).toHaveValue('Tăng huyết áp');
    await userEvent.clear(chronicInput);
    await userEvent.type(chronicInput, 'Tiểu đường, Huyết áp cao');
    expect(chronicInput).toHaveValue('Tiểu đường, Huyết áp cao');

    await userEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'pt-1',
        expect.objectContaining({ chronicDiseases: 'Tiểu đường, Huyết áp cao' })
      );
    });

    await userEvent.click(screen.getAllByRole('button', { name: /Thêm thành viên/i })[0]);
    await userEvent.type(screen.getByLabelText(/Họ và tên người thân/i), 'Lê Thị Hoa');
    await userEvent.type(screen.getByLabelText(/Ngày tháng năm sinh/i), '1991-05-05');
    await userEvent.click(screen.getByRole('button', { name: /\+ Thêm dị ứng/i }));
    await userEvent.type(screen.getByLabelText('Triệu chứng gặp phải 1'), 'Nổi mề đay');
    await userEvent.click(screen.getByRole('button', { name: /Lưu thành viên/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vui lòng nhập tên chất hoặc thuốc gây dị ứng cho dòng đã ghi triệu chứng.'
    );
  });

  it('cho phép chỉnh sửa trực tiếp dị ứng trong modal sửa mà không hiện thẻ điều hướng Xem hồ sơ và giữ nguyên thuộc tính dị ứng cũ', async () => {
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([
      {
        id: 'pt-1',
        familyId: 'fam-1',
        fullName: 'Phạm Ngọc Thọ',
        dateOfBirth: '1985-04-10',
        gender: 'MALE',
        relationshipToHead: 'SELF',
        bloodType: 'O+',
        allergies: [
          {
            id: 'al-food-1',
            allergenType: 'FOOD',
            allergenName: 'Tôm cua',
            severity: 'LIFE_THREATENING_ANAPHYLAXIS',
            clinicalManifestation: 'Khó thở',
          },
        ],
        status: 'ACTIVE',
        createdAt: '2026-11-14T00:00:00.000Z',
        updatedAt: '2026-11-14T00:00:00.000Z',
      },
    ]);

    const updateSpy = vi.spyOn(patientsApi, 'updateFamilyMember').mockResolvedValueOnce({
      id: 'pt-1',
      familyId: 'fam-1',
      fullName: 'Phạm Ngọc Thọ',
      dateOfBirth: '1985-04-10',
      gender: 'MALE',
      relationshipToHead: 'SELF',
      bloodType: 'O+',
      status: 'ACTIVE',
      createdAt: '2026-11-14T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
    });
    const deleteAllergySpy = vi.spyOn(patientsApi, 'deleteMemberAllergy').mockResolvedValueOnce({
      id: 'al-food-1',
      allergenType: 'FOOD',
      allergenName: 'Tôm cua',
      severity: 'LIFE_THREATENING_ANAPHYLAXIS',
    });
    const addAllergySpy = vi.spyOn(patientsApi, 'addMemberAllergy').mockResolvedValueOnce({
      id: 'al-drug-2',
      allergenType: 'DRUG',
      allergenName: 'Penicillin',
      severity: 'MODERATE',
      clinicalManifestation: 'Phát ban',
    });

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getAllByText('Phạm Ngọc Thọ').length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByRole('button', { name: 'Sửa thông tin của Phạm Ngọc Thọ' })[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveTextContent('Quản lý chi tiết trong Xem hồ sơ');
    expect(dialog).not.toHaveTextContent('Tiền sử dị ứng hiện có');
    expect(screen.getByLabelText('Chất hoặc thuốc gây dị ứng 1')).toHaveValue('Tôm cua');
    expect(screen.getByLabelText('Nhóm dị ứng 1')).toHaveValue('FOOD');
    expect(screen.getByLabelText('Mức độ dị ứng 1')).toHaveValue('LIFE_THREATENING_ANAPHYLAXIS');
    expect(screen.getByLabelText('Triệu chứng gặp phải 1')).toHaveValue('Khó thở');

    await userEvent.click(screen.getByRole('button', { name: 'Xóa dị ứng 1' }));
    await userEvent.click(screen.getByRole('button', { name: /\+ Thêm dị ứng/i }));
    await userEvent.type(screen.getByLabelText('Chất hoặc thuốc gây dị ứng 1'), 'Penicillin');
    await userEvent.selectOptions(screen.getByLabelText('Mức độ dị ứng 1'), 'MODERATE');
    await userEvent.type(screen.getByLabelText('Triệu chứng gặp phải 1'), 'Phát ban');

    await userEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(deleteAllergySpy).toHaveBeenCalledWith('pt-1', 'al-food-1');
      expect(addAllergySpy).toHaveBeenCalledWith('pt-1', {
        allergenType: 'DRUG',
        allergenName: 'Penicillin',
        severity: 'MODERATE',
        clinicalManifestation: 'Phát ban',
      });
      expect(screen.getAllByText('Penicillin').length).toBeGreaterThan(0);
    });
  });
});