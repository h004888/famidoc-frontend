import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Landmark,
  ReceiptText,
  ShieldAlert,
} from 'lucide-react';
import type { FacilitySettlementDto } from '@/lib/api/finance.api';
import { formatCurrencyVND } from '@/lib/utils';

export function SettlementTaxNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-amber-300/90 bg-amber-50/90 text-amber-950 ${
        compact ? 'space-y-2 p-3 text-xs' : 'space-y-2.5 p-4 text-sm'
      } leading-relaxed`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-amber-950">
          <ShieldAlert aria-hidden="true" className="size-4 shrink-0 text-amber-700" />
          <span>Thuế của bên nhận tiền · Nền tảng không hỗ trợ đóng thuế</span>
        </p>
        <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
          CSYT &amp; Bác sĩ tự kê khai thuế
        </span>
      </div>
      <ul className="list-disc space-y-1.5 pl-5 text-amber-950/95">
        <li>
          <strong>Nền tảng không hỗ trợ khấu trừ, kê khai hay nộp thuế thay cho CSYT và bác sĩ.</strong>{' '}
          Khoản 85% trả cho CSYT chưa khấu trừ hoặc nộp thay thuế thuộc nghĩa vụ của CSYT và bác sĩ.
          CSYT và bác sĩ tự xác định, kê khai và nộp các khoản thuế phát sinh theo hoạt động, hợp đồng và quy định áp dụng.
        </li>
        <li>
          VAT áp dụng theo từng dịch vụ. Dịch vụ khám bệnh, chữa bệnh thuộc đối tượng không chịu VAT theo quy định.
          Bảng chi trả này chưa xác nhận bên nhận đã hoàn thành nghĩa vụ thuế.
        </li>
        <li>Phí nền tảng 15% đã bao gồm thuế của phí nền tảng nếu phát sinh.</li>
      </ul>
    </div>
  );
}

export function MonthlyPayoutPolicyBanner({
  role,
}: {
  role: 'admin' | 'facility';
}) {
  const isFacility = role === 'facility';

  return (
    <section
      aria-label="Quy định nghĩa vụ thuế"
      className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/95 via-amber-50/60 to-white p-4 sm:p-5"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-950">
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-amber-700" />
            <span>Quy định nghĩa vụ thuế (Quan trọng)</span>
          </h3>
          <span className="rounded-full border border-amber-400/70 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
            Không hỗ trợ đóng thuế thay
          </span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white/90 p-3.5 text-xs leading-relaxed text-amber-950 sm:text-sm">
          <p className="font-semibold text-amber-950">
            Nền tảng FamiDoc KHÔNG hỗ trợ kê khai, khấu trừ hay nộp thuế thay cho Cơ sở y tế (CSYT) và Bác sĩ.
          </p>
          <p className="mt-1 text-xs text-amber-900">
            Khoản 85% trả cho CSYT chưa khấu trừ hoặc nộp thay thuế thuộc nghĩa vụ của CSYT và bác sĩ.
            CSYT và bác sĩ tự xác định, kê khai và nộp các khoản thuế phát sinh (TNDN, TNCN bác sĩ, hóa đơn dịch vụ...) theo hoạt động, hợp đồng và quy định áp dụng.
          </p>
        </div>

        <ul className="space-y-1.5 text-xs leading-relaxed text-amber-950/90">
          <li className="flex items-start gap-2">
            <ReceiptText aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
            <span>
              VAT áp dụng theo từng dịch vụ. Dịch vụ khám bệnh, chữa bệnh thuộc đối tượng không chịu VAT theo quy định.
              Bảng chi trả này chưa xác nhận bên nhận đã hoàn thành nghĩa vụ thuế.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Landmark aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
            <span>
              Phí nền tảng 15% đã bao gồm thuế của phí nền tảng nếu phát sinh (FamiDoc tự chịu trách nhiệm thuế trên phần 15% này).
            </span>
          </li>
        </ul>
      </div>

      {isFacility && (
        <div className="flex items-center gap-2 border-t border-amber-200/80 pt-2.5 text-xs font-medium text-amber-900">
          <Building2 aria-hidden="true" className="size-3.5 shrink-0 text-amber-700" />
          <span>
            CSYT tự hạch toán 85% doanh thu nhận về và thực hiện nghĩa vụ thuế với bác sĩ, cơ quan thuế.
          </span>
        </div>
      )}
    </section>
  );
}

export function SettlementPaymentSummary({ item }: { item: FacilitySettlementDto }) {
  const settled = item.disbursementStatus === 'SETTLED';
  const gross = Math.max(0, item.totalRealizedRevenue);
  const payoutPct = gross > 0 ? Math.round((item.facilityPayoutAmount / gross) * 100) : 85;
  const feePct = Math.max(0, 100 - payoutPct);

  return (
    <section aria-label="Số tiền và kỳ chi trả CSYT" className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <CalendarClock aria-hidden="true" className="size-4 text-primary" />
            <span>Kỳ chi trả hàng tháng</span>
          </div>
          <span className="rounded-full bg-white px-3 py-0.5 text-xs font-bold text-slate-900 ring-1 ring-slate-200">
            Tháng {item.month}/{item.year}
          </span>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-200/70">
            <dt className="text-xs text-slate-600">Doanh thu phân bổ trong tháng (100%)</dt>
            <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums">
              {formatCurrencyVND(item.totalRealizedRevenue)}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-200/70">
            <dt className="text-xs text-slate-600">Phí nền tảng (15%)</dt>
            <dd className="mt-0.5 font-semibold text-slate-700 tabular-nums">
              − {formatCurrencyVND(item.platformFeeAmount)}
            </dd>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 sm:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-xs font-semibold text-blue-950 sm:text-sm">
                {settled ? 'Số tiền đã chi trả CSYT (85%)' : 'Số tiền phải chuyển CSYT (85%)'}
              </dt>
              <dd className="wrap-anywhere text-lg font-bold text-primary tabular-nums sm:text-xl">
                {formatCurrencyVND(item.facilityPayoutAmount)}
              </dd>
            </div>
            <p className="mt-1 text-[11px] text-blue-900/90">
              Khoản thanh toán gộp hàng tháng từ nền tảng cho CSYT · Chưa khấu trừ thuế của CSYT và bác sĩ.
            </p>
            <div className="mt-2.5 space-y-1">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="bg-primary transition-all"
                  style={{ width: `${payoutPct}%` }}
                  title={`CSYT nhận ${payoutPct}%`}
                />
                <div
                  className="bg-slate-400 transition-all"
                  style={{ width: `${feePct}%` }}
                  title={`Phí nền tảng ${feePct}%`}
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600">
                <span className="text-primary">CSYT nhận ({payoutPct}%)</span>
                <span>Phí nền tảng ({feePct}%)</span>
              </div>
            </div>
          </div>
        </dl>
      </div>
      <SettlementTaxNotice compact />
    </section>
  );
}
