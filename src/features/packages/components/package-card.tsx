'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PackageItem } from '../schemas/package.schema';
import { formatCurrencyVND } from '@/lib/utils';
import { useAuth } from '@/features/auth/context/auth-context';

export function PackageCard({ pkg, onSelect }: { pkg: PackageItem; onSelect?: (pkg: PackageItem) => void }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleRegister = () => {
    if (onSelect) {
      onSelect(pkg);
    } else {
      if (isAuthenticated) {
        router.push(`/family/subscription?packageId=${pkg.id}`);
      } else {
        router.push(`/register?packageId=${pkg.id}`);
      }
    }
  };

  return (
    <Card
      className={`bg-surface-container-lowest rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 relative gap-0 ${
        pkg.isPopular
          ? 'border-2 border-[#0046c0] shadow-lg'
          : 'border border-outline-variant hover:border-[#0046c0]/60'
      }`}
    >
      {/* C-01: Contrast accessible badge #b56004 */}
      {pkg.isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#b56004] text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm border-none">
          Phổ biến nhất
        </Badge>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <span className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-[#0046c0]">
            <span className="material-symbols-outlined">medical_services</span>
          </span>
          <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff7e6] border-[#ffd591] text-[#ae5c04]">
            {pkg.tier}
          </Badge>
        </div>

        <div>
          <h3 className="text-lg font-bold text-on-surface">{pkg.name}</h3>
          <p className="text-xs text-on-surface-variant mt-1">Dành cho các hộ gia đình chăm sóc toàn diện.</p>
        </div>

        <div className="py-2">
          <span className="text-2xl font-bold text-[#0046c0] tabular-nums">{formatCurrencyVND(pkg.price)}</span>
          <span className="text-xs text-outline"> / {pkg.period}</span>
        </div>

        <ul className="space-y-2 text-xs text-on-surface-variant border-t border-outline-variant pt-3">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0046c0] text-[16px]">check</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        type="button"
        variant={pkg.isPopular ? 'default' : 'outline'}
        onClick={handleRegister}
        className={`mt-6 w-full py-2.5 h-auto rounded-lg text-xs font-semibold shadow-sm ${
          pkg.isPopular
            ? 'bg-[#0046c0] hover:bg-[#003899] text-white'
            : 'border-[#0046c0] text-[#0046c0] hover:bg-[#0046c0] hover:text-white'
        }`}
      >
        Đăng ký gói này
      </Button>
    </Card>
  );
}
