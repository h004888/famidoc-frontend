'use client';

interface BillingKpiStripProps {
  totalPaidVnd: number;
  paidCount: number;
  openCasesCount: number;
  latestPaidDateLabel: string;
}

export function BillingKpiStrip({
  totalPaidVnd,
  paidCount,
  openCasesCount,
  latestPaidDateLabel,
}: BillingKpiStripProps) {
  return (
    <section
      aria-label="Tóm tắt thanh toán hộ gia đình"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500">Tổng đã thanh toán</p>
        <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
          {totalPaidVnd.toLocaleString('vi-VN')} đ
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
          Gần nhất: {latestPaidDateLabel}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500">Biên lai hợp lệ</p>
        <p className="mt-1 text-lg font-bold text-emerald-700 tabular-nums">
          {paidCount} hóa đơn
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Đã xác nhận qua VietQR / SePay
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500">Hồ sơ đối soát</p>
        <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
          {openCasesCount} hồ sơ đang mở
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {openCasesCount === 0
            ? 'Mọi giao dịch đã khớp'
            : 'Admin đang kiểm tra đối soát'}
        </p>
      </div>
    </section>
  );
}
