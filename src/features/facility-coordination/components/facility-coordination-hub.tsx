'use client';

import React, { useState } from 'react';
import { FacilityContractInboundView } from './facility-contract-inbound-view';
import { FacilityCoordinationView } from './facility-coordination-view';

export function FacilityCoordinationHub() {
  const [section, setSection] = useState<'contracts' | 'schedule'>('contracts');

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8">
        <div
          role="tablist"
          aria-label="Điều phối Cơ sở Y tế"
          className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80 shadow-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={section === 'contracts'}
            onClick={() => setSection('contracts')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              section === 'contracts'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hợp đồng Y tế 4 bên
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'schedule'}
            onClick={() => setSection('schedule')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              section === 'schedule'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ca trực &amp; Lịch khám ngoại viện
          </button>
        </div>
      </div>

      {section === 'contracts' ? (
        <FacilityContractInboundView />
      ) : (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <FacilityCoordinationView />
        </div>
      )}
    </div>
  );
}
