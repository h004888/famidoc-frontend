import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 0) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (totalPages === 1) {
    return (
      <nav role="navigation" aria-label="Phân trang" className="flex items-center justify-center">
        <button
          type="button"
          aria-current="page"
          aria-label={`Chuyển đến trang 1`}
          disabled
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md px-3 py-2 text-sm font-bold bg-primary text-white cursor-not-allowed opacity-50"
        >
          1
        </button>
      </nav>
    );
  }

  return (
    <nav role="navigation" aria-label="Phân trang" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Chuyển đến trang trước"
        className={cn(
          'min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          currentPage === 1
            ? 'text-muted-foreground cursor-not-allowed opacity-50'
            : 'text-on-surface hover:bg-primary-container/10 hover:text-primary'
        )}
      >
        Trước
      </button>

      <div className="flex items-center gap-1" role="group" aria-label="Danh sách số trang">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Chuyển đến trang ${page}`}
            className={cn(
              'min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              page === currentPage
                ? 'bg-primary text-white font-bold'
                : 'text-on-surface hover:bg-primary-container/10 hover:text-primary'
            )}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Chuyển đến trang sau"
        className={cn(
          'min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          currentPage === totalPages
            ? 'text-muted-foreground cursor-not-allowed opacity-50'
            : 'text-on-surface hover:bg-primary-container/10 hover:text-primary'
        )}
      >
        Sau
      </button>
    </nav>
  );
}
