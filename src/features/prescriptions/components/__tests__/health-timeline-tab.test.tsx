import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  medicalBooksApi,
  type BookVisitDetail,
} from '@/lib/api/medical-books.api';
import { MedicalBookView } from '../medical-book-view';

vi.mock('@/lib/api/medical-books.api', () => ({
  medicalBooksApi: {
    families: vi.fn(),
    visits: vi.fn(),
    visit: vi.fn(),
    documents: vi.fn(),
    timeline: vi.fn(),
  },
}));

vi.mock('@/lib/api/http-client', () => ({
  httpClient: { get: vi.fn(), patch: vi.fn() },
}));

describe('MemberBook timeline tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(medicalBooksApi.families).mockResolvedValue({
      items: [
        {
          id: 'fam-1',
          representativeName: 'Đại diện 1',
          members: [
            {
              id: 'pat-1',
              fullName: 'Thành viên 1',
              dateOfBirth: '1990-01-01',
              relationshipToHead: 'SELF',
            },
          ],
        },
      ],
      hasNextPage: false,
    });
    vi.mocked(medicalBooksApi.visits).mockResolvedValue({
      items: [],
      hasNextPage: false,
    });
    vi.mocked(medicalBooksApi.documents).mockResolvedValue([]);
  });

  it('shows timeline tab unselected by default and loads timeline on click', async () => {
    vi.mocked(medicalBooksApi.timeline).mockResolvedValueOnce({
      items: [
        {
          id: 'enc-1',
          type: 'VISIT',
          occurredAt: '2026-11-20T01:30:00.000Z',
          title: 'Khám tại nhà',
          summary: 'Viêm họng cấp',
          actorName: 'BS. Minh',
          source: 'CLINICAL',
          link: { encounterId: 'enc-1' },
          canOpenDetail: true,
          attachments: [],
        },
      ],
      nextCursor: null,
    });

    render(<MedicalBookView doctor={false} />);

    const visitsTab = await screen.findByRole('button', { name: 'Lần khám' });
    const timelineTab = screen.getByRole('button', { name: 'Dòng thời gian' });

    expect(visitsTab).toHaveAttribute('aria-pressed', 'true');
    expect(timelineTab).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(timelineTab);

    expect(timelineTab).toHaveAttribute('aria-pressed', 'true');
    expect(medicalBooksApi.timeline).toHaveBeenCalledWith(
      'fam-1',
      'pat-1',
      null,
      expect.any(AbortSignal),
    );
    expect(await screen.findByText('Khám tại nhà')).toBeInTheDocument();
  });

  it('opens visit detail in timeline tab and returns without losing loaded pages', async () => {
    const visitDetail: BookVisitDetail = {
      id: 'enc-9',
      scheduledDate: '2026-11-18T00:00:00.000Z',
      scheduledTime: '1970-01-01T08:00:00.000Z',
      encounterType: 'HOME_VISIT',
      patient: {
        id: 'pat-1',
        fullName: 'Thành viên 1',
        dateOfBirth: '1990-01-01',
        relationshipToHead: 'SELF',
        familyId: 'fam-1',
      },
      recipient: { id: 'rep-1', name: 'Đại diện 1' },
      doctorName: 'BS. Lan',
      isFinalized: true,
      finalizedAt: '2026-11-18T10:00:00.000Z',
      prescription: null,
      exam: {
        chiefComplaint: 'Ho',
        clinicalFindings: 'Phổi trong',
        icd10Code: 'J00',
        icd10Diagnosis: 'Cảm lạnh',
        treatmentPlan: 'Nghỉ ngơi',
      },
    };

    vi.mocked(medicalBooksApi.timeline)
      .mockResolvedValueOnce({
        items: [
          {
            id: 'enc-1',
            type: 'VISIT',
            occurredAt: '2026-11-20T01:30:00.000Z',
            title: 'Khám trang 1',
            summary: 'Sốt',
            actorName: 'BS. Minh',
            source: 'CLINICAL',
            link: { encounterId: 'enc-1' },
            canOpenDetail: true,
            attachments: [],
          },
        ],
        nextCursor: 'c1',
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'enc-9',
            type: 'VISIT',
            occurredAt: '2026-11-18T01:00:00.000Z',
            title: 'Khám trang 2',
            summary: 'Cảm lạnh',
            actorName: 'BS. Lan',
            source: 'CLINICAL',
            link: { encounterId: 'enc-9' },
            canOpenDetail: true,
            attachments: [],
          },
        ],
        nextCursor: null,
      });
    vi.mocked(medicalBooksApi.visit).mockResolvedValueOnce(visitDetail);

    render(<MedicalBookView doctor={false} />);

    const timelineTab = await screen.findByRole('button', {
      name: 'Dòng thời gian',
    });
    fireEvent.click(timelineTab);

    expect(await screen.findByText('Khám trang 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }));
    expect(await screen.findByText('Khám trang 2')).toBeInTheDocument();

    const detailButtons = screen.getAllByRole('button', {
      name: 'Xem chi tiết',
    });
    fireEvent.click(detailButtons[1]);

    expect(medicalBooksApi.visit).toHaveBeenCalledWith(
      'enc-9',
      expect.any(AbortSignal),
      'pat-1',
    );
    expect(timelineTab).toHaveAttribute('aria-pressed', 'true');
    const list = screen.getByRole('list', {
      name: 'Dòng thời gian sổ khám',
      hidden: true,
    });
    expect(list.closest('[hidden]')).not.toBeNull();

    const backBtn = await screen.findByRole('button', {
      name: 'Quay lại dòng thời gian',
    });
    fireEvent.click(backBtn);

    expect(list.closest('[hidden]')).toBeNull();
    expect(screen.getByText('Khám trang 1')).toBeInTheDocument();
    expect(screen.getByText('Khám trang 2')).toBeInTheDocument();
    expect(medicalBooksApi.timeline).toHaveBeenCalledTimes(2);
  });
});
