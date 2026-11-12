import { DoctorItem } from '@/features/doctors/schemas/doctor-catalog.schema';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: DoctorItem;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <article
      role="article"
      aria-label={`Bác sĩ ${doctor.name}`}
      className={cn(
        'rounded-2xl border border-outline-variant bg-surface-container-lowest p-5',
        'shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col gap-4'
      )}
    >
      {/* Avatar & basic info */}
      <div className="flex items-center gap-3">
        {doctor.avatarUrl ? (
          <img
            alt={doctor.name}
            src={doctor.avatarUrl}
            className="w-14 h-14 rounded-xl object-cover border-2 border-primary"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center text-primary font-bold text-lg shrink-0 border-2 border-primary">
            {doctor.name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 space-y-0.5">
          <h3 className="font-bold text-sm text-on-surface truncate">{doctor.name}</h3>
          <p className="text-xs font-semibold text-primary">{doctor.title} — {doctor.specialty}</p>
          <div className="flex items-center gap-1 text-[11px] text-[#fa8c16] font-bold">
            <span className="material-symbols-filled text-xs">star</span>
            <span>{doctor.rating}/5.0</span>
          </div>
        </div>
      </div>

      {/* CCHN */}
      <span className="px-2 py-0.5 rounded-md bg-primary-container text-primary text-[11px] font-semibold w-fit">
        CCHN: {doctor.cchn}
      </span>

      {/* Experience & fee */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
        <span>{doctor.experience} năm kinh nghiệm</span>
        <span className="font-bold text-primary">{formatCurrencyVND(doctor.fee)}</span>
      </div>

      {/* Book button */}
      <button
        type="button"
        onClick={() => alert(`Đặt lịch khám với ${doctor.name}`)}
        aria-label={`Đặt lịch khám với bác sĩ ${doctor.name}`}
        className={cn(
          'min-h-[40px] w-full rounded-lg px-4 py-2 bg-primary text-white text-sm font-semibold',
          'hover:bg-primary-container hover:text-primary transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
      >
        Đặt lịch khám
      </button>
    </article>
  );
}

function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, '');
}
