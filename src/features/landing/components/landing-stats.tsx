import React from 'react';

export function LandingStats() {
  return (
    <section
      id="gia-toc"
      className="py-6 bg-white border-y border-[#c4c5d7]/70 shadow-sm relative z-20 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 items-center">
          {/* Stat 1: 50.000+ */}
          <div className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0037c1] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">family_restroom</span>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-[#0037c1]">50.000+</div>
              <div className="text-xs text-[#444654] font-medium">Hộ gia đình tin dùng</div>
            </div>
          </div>

          {/* Stat 2: 1.200+ Bác sĩ CCHN */}
          <div className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0037c1] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-[#0037c1]">1.200+</div>
              <div className="text-xs text-[#444654] font-medium">Bác sĩ CCHN uy tín</div>
            </div>
          </div>

          {/* Stat 3: <25 phút Phản ứng khẩn cấp */}
          <div className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0037c1] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-[#0037c1]">&lt;25 phút</div>
              <div className="text-xs text-[#444654] font-medium">Phản ứng khẩn cấp</div>
            </div>
          </div>

          {/* Stat 4: 100% Ký quỹ Escrow */}
          <div className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#52c41a] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-[#52c41a]">100%</div>
              <div className="text-xs text-[#444654] font-medium">Ký quỹ Escrow minh bạch</div>
            </div>
          </div>

          {/* Stat 5: 99.4% Gia đình hài lòng */}
          <div className="col-span-2 md:col-span-1 p-3.5 rounded-2xl bg-[#fff7e6] border border-[#ffd591] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fa8c16] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-[#fa8c16]">99.4%</div>
              <div className="text-xs text-[#444654] font-medium">Gia đình hài lòng</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
