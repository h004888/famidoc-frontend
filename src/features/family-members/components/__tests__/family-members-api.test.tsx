'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FamilyMembersView } from '../family-members-view';
import { patientsApi } from '@/lib/api';

describe('Task 4: FamilyMembersView Integration with patientsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches family members from patientsApi.getFamilyMembers on mount', async () => {
    const mockList = [
      {
        id: 'pt-101',
        familyId: 'fam-1',
        fullName: 'Nguyễn Văn Minh',
        dateOfBirth: '1985-05-15',
        gender: 'MALE' as const,
        relationshipToHead: 'SELF' as const,
        createdAt: '2026-11-09T00:00:00.000Z',
        updatedAt: '2026-11-09T00:00:00.000Z',
      },
    ];

    const getSpy = vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce(mockList);

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalled();
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
    });

    getSpy.mockRestore();
  });

  it('submits new member modal to patientsApi.createFamilyMember and appends to list', async () => {
    const mockList = [
      {
        id: 'pt-101',
        familyId: 'fam-1',
        fullName: 'Nguyễn Văn Minh',
        dateOfBirth: '1985-05-15',
        gender: 'MALE' as const,
        relationshipToHead: 'SELF' as const,
        createdAt: '2026-11-09T00:00:00.000Z',
        updatedAt: '2026-11-09T00:00:00.000Z',
      },
    ];

    const getSpy = vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce(mockList);
    const createSpy = vi.spyOn(patientsApi, 'createFamilyMember').mockResolvedValueOnce({
      id: 'pt-102',
      familyId: 'fam-1',
      fullName: 'Trần Thị Mai',
      dateOfBirth: '1988-08-20',
      gender: 'FEMALE',
      relationshipToHead: 'SPOUSE',
      createdAt: '2026-11-09T00:00:00.000Z',
      updatedAt: '2026-11-09T00:00:00.000Z',
    });

    render(<FamilyMembersView />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Thêm thành viên/i });
    await userEvent.click(addBtn);

    const nameInput = screen.getByPlaceholderText(/Ví dụ: Nguyễn Thị Lan/i);
    await userEvent.type(nameInput, 'Trần Thị Mai');

    const submitModalBtn = screen.getByRole('button', { name: /Lưu vào sổ hộ tịch/i });
    await userEvent.click(submitModalBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Trần Thị Mai',
        })
      );
      expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
    });

    getSpy.mockRestore();
    createSpy.mockRestore();
  });
});
