import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DoctorItem } from '@/features/doctors/schemas/doctor-catalog.schema';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: DoctorItem;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <Card
      role="article"
      aria-label={`Bác sĩ ${doctor.name}`}
      className={cn(
        'rounded-2xl border-outline-variant bg-surface-container-lowest p-5',
        'shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col gap-4'
      )}
    >
      {/* Avatar & basic info */}
      <div className="flex items-center gap-3">
        {doctor.avatarUrl ? (
          <img
            alt={doctor.name}
            src={doctor.avatarUrl}
            className="w-14 h-14 rounded-xl object-cover border-2 border-[#0046c0]"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#0046c0] font-bold text-lg shrink-0 border-2 border-[#0046c0]">
            {doctor.name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 space-y-0.5">
          <h3 className="font-bold text-sm text-on-surface truncate">{doctor.name}</h3>
          <p className="text-xs font-semibold text-[#0046c0]">{doctor.title} — {doctor.specialty}</p>
          <div className="flex items-center gap-1 text-[11px] text-[#fa8c16] font-bold">
            <span className="material-symbols-filled text-xs">star</span>
            <span>{doctor.rating}/5.0</span>
          </div>
        </div>
      </div>

      {/* CCHN */}
      <Badge variant="outline" className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0046c0] border-blue-200/80 text-[11px] font-semibold w-fit">
        CCHN: {doctor.cchn}
      </Badge>

      {/* Experience & fee */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
        <span>{doctor.experience} năm kinh nghiệm</span>
        <span className="font-bold text-[#0046c0]">{formatCurrencyVND(doctor.fee)}</span>
      </div>

      {/* Book button */}
      <Button
        type="button"
        onClick={() => alert(`Đặt lịch khám với ${doctor.name}`)}
        aria-label={`Đặt lịch khám với bác sĩ ${doctor.name}`}
        className="min-h-[40px] w-full rounded-lg px-4 py-2 bg-[#0046c0] hover:bg-[#003899] text-white text-sm font-semibold"
      >
        Đặt lịch khám
      </Button>
    </Card>
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
