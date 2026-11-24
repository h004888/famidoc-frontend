'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface DraftContractPdfModalProps {
  open: boolean;
  pdfUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onProceedToSign: () => void;
}

export function DraftContractPdfModal({
  open,
  pdfUrl,
  isLoading,
  error,
  onClose,
  onProceedToSign,
}: DraftContractPdfModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-5 py-3.5">
          <DialogTitle className="text-sm font-bold text-slate-900">
            Xem trước hợp đồng dịch vụ bác sĩ gia đình (Bản nháp)
          </DialogTitle>
        </DialogHeader>

        <div className="h-[65vh] bg-slate-100">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-600">
              Đang kết xuất bản nháp PDF...
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm font-medium text-rose-700">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              title="Xem trước bản nháp hợp đồng PDF"
              src={pdfUrl}
              className="h-full w-full border-0"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
          <p className="text-xs text-slate-600">
            Bản nháp chỉ dùng để kiểm tra thông tin, chưa tạo hợp đồng chính thức.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Đóng &amp; Sửa thông tin
            </button>
            <button
              type="button"
              onClick={onProceedToSign}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Tiến hành ký
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
