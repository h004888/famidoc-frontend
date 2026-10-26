'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PackageItem } from '../schemas/package.schema';
import { formatCurrencyVND } from '@/lib/utils';

export function PackageCard({ pkg, onSelect }: { pkg: PackageItem; onSelect?: (pkg: PackageItem) => void }) {
  const router = useRouter();

  const handleRegister = () => {
    if (onSelect) {
      onSelect(pkg);
    } else {
      router.push(`/register?packageId=${pkg.id}`);
    }
  };

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 relative ${
        pkg.isPopular
          ? 'border-2 border-primary-container shadow-lg'
          : 'border border-outline-variant hover:border-primary-container'
      }`}
    >
      {/* C-01: Contrast accessible badge #b56004 */}
      {pkg.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#b56004] text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm">
          Phổ biến nhất
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <span className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined">medical_services</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff7e6] border border-[#ffd591] text-[#ae5c04]">
            {pkg.tier}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-on-surface">{pkg.name}</h3>
          <p className="text-xs text-on-surface-variant mt-1">Dành cho các hộ gia đình chăm sóc toàn diện.</p>
        </div>

        <div className="py-2">
          <span className="text-2xl font-bold text-primary">{formatCurrencyVND(pkg.price)}</span>
          <span className="text-xs text-outline"> / {pkg.period}</span>
        </div>

        <ul className="space-y-2 text-xs text-on-surface-variant border-t border-outline-variant pt-3">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[16px]">check</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleRegister}
        className={`mt-6 w-full py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all text-center block ${
          pkg.isPopular
            ? 'bg-primary-container text-white hover:bg-primary'
            : 'border border-primary text-primary hover:bg-primary hover:text-white'
        }`}
      >
        Đăng ký gói này
      </button>
    </div>
  );
}
