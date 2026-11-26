'use client';

import { useEffect, useState } from 'react';
import { FileText, Pill, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  medicalBooksApi,
  type TimelineEvent,
} from '@/lib/api/medical-books.api';
import { prescriptionErrorMessage } from '@/lib/api/prescriptions.api';
import { downloadBookDocument } from './download-book-document';

function formatVnDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatVnTime(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function EventIcon({ type }: { type: TimelineEvent['type'] }) {
  if (type === 'VISIT') {
    return <Stethoscope className="h-4 w-4 text-teal-700" aria-hidden="true" />;
  }
  if (type === 'PRESCRIPTION') {
    return <Pill className="h-4 w-4 text-sky-700" aria-hidden="true" />;
  }
  return <FileText className="h-4 w-4 text-amber-700" aria-hidden="true" />;
}

function TimelineItem({
  event,
  downloading,
  onOpenVisit,
  onDownload,
}: {
  event: TimelineEvent;
  downloading: string;
  onOpenVisit: (encounterId: string) => void;
  onDownload: (id: string, name: string) => void;
}) {
  return (
    <li className="flex gap-4">
      <div className="w-24 shrink-0 pt-1 text-right text-xs text-slate-600">
        <div className="font-medium text-slate-800">
          {formatVnDate(event.occurredAt)}
        </div>
        {event.type !== 'DOCUMENT' && (
          <div>{formatVnTime(event.occurredAt)}</div>
        )}
      </div>
      <div className="relative flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
          <EventIcon type={event.type} />
        </div>
        <div className="w-px flex-1 bg-slate-200" />
      </div>
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">{event.title}</h3>
          {event.source === 'FAMILY_UPLOAD' && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Gia đình tự thêm
            </span>
          )}
        </div>
        {event.summary && (
          <p className="mt-1 text-sm text-slate-700">{event.summary}</p>
        )}
        {event.actorName && (
          <p className="mt-1 text-xs text-slate-600">
            Bác sĩ: {event.actorName}
          </p>
        )}
        {(event.canOpenDetail && event.link.encounterId) ||
        event.attachments.some((a) => a.downloadAvailable) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {event.canOpenDetail && event.link.encounterId && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onOpenVisit(event.link.encounterId!)}
              >
                Xem chi tiết
              </Button>
            )}
            {event.attachments
              .filter((att) => att.downloadAvailable)
              .map((att) => (
                <Button
                  key={att.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={downloading === att.id}
                  onClick={() => onDownload(att.id, att.name)}
                >
                  Tải xuống
                </Button>
              ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function HealthTimeline({
  familyId,
  patientId,
  onOpenVisit,
}: {
  familyId: string;
  patientId: string;
  onOpenVisit: (encounterId: string) => void;
}) {
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [downloading, setDownloading] = useState('');
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    medicalBooksApi
      .timeline(familyId, patientId, null, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          prescriptionErrorMessage(err, 'Không tải được dòng thời gian.'),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [familyId, patientId, reloadTick]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    const controller = new AbortController();
    setLoadingMore(true);
    setError('');
    try {
      const page = await medicalBooksApi.timeline(
        familyId,
        patientId,
        nextCursor,
        controller.signal,
      );
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(
        prescriptionErrorMessage(err, 'Không tải được dòng thời gian.'),
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleDownload(id: string, name: string) {
    setDownloading(id);
    setDownloadError('');
    try {
      await downloadBookDocument(familyId, patientId, id, name);
    } catch (err) {
      setDownloadError(
        prescriptionErrorMessage(err, 'Chưa tải được tệp. Vui lòng thử lại.'),
      );
    } finally {
      setDownloading('');
    }
  }

  if (loading) {
    return (
      <p className="py-6 text-sm text-slate-600">Đang tải dòng thời gian...</p>
    );
  }

  if (error && items.length === 0) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
      >
        <span>{error}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setReloadTick((t) => t + 1)}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-6 text-sm text-slate-600">
        Chưa có hoạt động nào trong sổ khám.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {downloadError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {downloadError}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </div>
      )}
      <ol aria-label="Dòng thời gian sổ khám" className="space-y-4">
        {items.map((event) => (
          <TimelineItem
            key={`${event.type}-${event.id}`}
            event={event}
            downloading={downloading}
            onOpenVisit={onOpenVisit}
            onDownload={handleDownload}
          />
        ))}
      </ol>
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={handleLoadMore}
          >
            Xem thêm
          </Button>
        </div>
      )}
    </div>
  );
}
