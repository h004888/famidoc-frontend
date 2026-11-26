import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { medicalBooksApi, type TimelineEvent } from '@/lib/api/medical-books.api';
import { downloadBookDocument } from '../download-book-document';
import { HealthTimeline } from '../health-timeline';

vi.mock('@/lib/api/medical-books.api', () => ({
  medicalBooksApi: { timeline: vi.fn() },
}));

vi.mock('../download-book-document', () => ({
  downloadBookDocument: vi.fn(),
}));

describe('HealthTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const visitEvent: TimelineEvent = {
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
  };

  const docEvent: TimelineEvent = {
    id: 'doc-1',
    type: 'DOCUMENT',
    occurredAt: '2026-11-19T00:00:00.000Z',
    title: 'X-quang phổi',
    summary: null,
    actorName: null,
    source: 'FAMILY_UPLOAD',
    link: { documentId: 'doc-1' },
    canOpenDetail: false,
    attachments: [
      {
        id: 'doc-1',
        name: 'X-quang phổi',
        downloadAvailable: true,
        isImage: true,
      },
    ],
  };

  it('renders timeline items with Vietnam date/time, diagnosis, doctor, and family upload badge', async () => {
    vi.mocked(medicalBooksApi.timeline).mockResolvedValueOnce({
      items: [visitEvent, docEvent],
      nextCursor: null,
    });

    render(
      <HealthTimeline familyId="fam-1" patientId="pat-1" onOpenVisit={vi.fn()} />,
    );

    expect(await screen.findByText('Khám tại nhà')).toBeInTheDocument();
    expect(screen.getByText('20/11/2026')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('Viêm họng cấp')).toBeInTheDocument();
    expect(screen.getByText('Bác sĩ: BS. Minh')).toBeInTheDocument();
    expect(screen.getByText('X-quang phổi')).toBeInTheDocument();
    expect(screen.getAllByText('Gia đình tự thêm')).toHaveLength(1);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Khám tại nhà')).toBeInTheDocument();
    expect(within(items[1]).getByText('X-quang phổi')).toBeInTheDocument();
  });

  it('shows empty state when no events returned', async () => {
    vi.mocked(medicalBooksApi.timeline).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    render(
      <HealthTimeline familyId="fam-1" patientId="pat-1" onOpenVisit={vi.fn()} />,
    );

    expect(
      await screen.findByText('Chưa có hoạt động nào trong sổ khám.'),
    ).toBeInTheDocument();
  });

  it('shows error alert and retries on button click', async () => {
    vi.mocked(medicalBooksApi.timeline)
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce({ items: [visitEvent], nextCursor: null });

    render(
      <HealthTimeline familyId="fam-1" patientId="pat-1" onOpenVisit={vi.fn()} />,
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Không tải được dòng thời gian.');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Khám tại nhà')).toBeInTheDocument();
    expect(medicalBooksApi.timeline).toHaveBeenCalledTimes(2);
  });

  it('loads more pages with cursor and hides button when nextCursor is null', async () => {
    vi.mocked(medicalBooksApi.timeline)
      .mockResolvedValueOnce({ items: [visitEvent], nextCursor: 'c1' })
      .mockResolvedValueOnce({ items: [docEvent], nextCursor: null });

    render(
      <HealthTimeline familyId="fam-1" patientId="pat-1" onOpenVisit={vi.fn()} />,
    );

    expect(await screen.findByText('Khám tại nhà')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }));

    expect(await screen.findByText('X-quang phổi')).toBeInTheDocument();
    expect(screen.getByText('Khám tại nhà')).toBeInTheDocument();
    expect(medicalBooksApi.timeline).toHaveBeenNthCalledWith(
      2,
      'fam-1',
      'pat-1',
      'c1',
      expect.any(AbortSignal),
    );
    expect(
      screen.queryByRole('button', { name: 'Xem thêm' }),
    ).not.toBeInTheDocument();
  });

  it('calls onOpenVisit only when canOpenDetail is true', async () => {
    const onOpenVisit = vi.fn();
    const otherDoctorVisit: TimelineEvent = {
      ...visitEvent,
      id: 'enc-2',
      title: 'Khám tại cơ sở',
      summary: 'Viêm phế quản',
      actorName: 'BS. Lan',
      canOpenDetail: false,
    };

    vi.mocked(medicalBooksApi.timeline).mockResolvedValueOnce({
      items: [visitEvent, otherDoctorVisit],
      nextCursor: null,
    });

    render(
      <HealthTimeline
        familyId="fam-1"
        patientId="pat-1"
        onOpenVisit={onOpenVisit}
      />,
    );

    await screen.findByText('Khám tại nhà');
    const items = screen.getAllByRole('listitem');
    fireEvent.click(
      within(items[0]).getByRole('button', { name: 'Xem chi tiết' }),
    );
    expect(onOpenVisit).toHaveBeenCalledWith('enc-1');

    expect(within(items[1]).getByText('Viêm phế quản')).toBeInTheDocument();
    expect(
      within(items[1]).queryByRole('button', { name: 'Xem chi tiết' }),
    ).toBeNull();
  });

  it('downloads document attachment and shows error alert on failure', async () => {
    vi.mocked(medicalBooksApi.timeline).mockResolvedValueOnce({
      items: [docEvent],
      nextCursor: null,
    });
    vi.mocked(downloadBookDocument)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('x'));

    render(
      <HealthTimeline familyId="fam-1" patientId="pat-1" onOpenVisit={vi.fn()} />,
    );

    const downloadBtn = await screen.findByRole('button', {
      name: 'Tải xuống',
    });
    fireEvent.click(downloadBtn);
    expect(downloadBookDocument).toHaveBeenCalledWith(
      'fam-1',
      'pat-1',
      'doc-1',
      'X-quang phổi',
    );
    await waitFor(() => expect(downloadBtn).not.toBeDisabled());

    fireEvent.click(downloadBtn);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Chưa tải được tệp. Vui lòng thử lại.');
  });
});
