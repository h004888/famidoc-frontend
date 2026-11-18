'use client';

import { Button } from '@/components/ui/button';

export function AdminPageNavigation({
  page, total, limit, onPage,
}: { page: number; total: number; limit: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
      <span>{total} bản ghi · Trang {page}/{pages}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Trang trước</Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Trang sau</Button>
      </div>
    </nav>
  );
}
