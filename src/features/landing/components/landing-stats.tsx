'use client';

import React, { useEffect, useRef, useState } from 'react';

export function LandingStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState({
    families: 50000,
    doctors: 1200,
    minutes: 25,
    escrow: 100,
    satisfaction: 99.4,
  });

  useEffect(() => {
    // Only run animated counter in browser (not in test runner)
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 1800; // ms
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            setCounts({
              families: Math.floor(ease * 50000),
              doctors: Math.floor(ease * 1200),
              minutes: Math.max(5, Math.floor(ease * 25)),
              escrow: Math.floor(ease * 100),
              satisfaction: +(ease * 99.4).toFixed(1),
            });

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCounts({
                families: 50000,
                doctors: 1200,
                minutes: 25,
                escrow: 100,
                satisfaction: 99.4,
              });
            }
          };

          // Reset to 0 briefly and animate up
          setCounts({ families: 0, doctors: 0, minutes: 0, escrow: 0, satisfaction: 0 });
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasAnimated]);

  const formatFamilies = () => {
    if (!hasAnimated && process.env.NODE_ENV !== 'test') return '50.000+';
    return `${counts.families.toLocaleString('vi-VN')}+`;
  };

  const formatDoctors = () => {
    if (!hasAnimated && process.env.NODE_ENV !== 'test') return '1.200+';
    return `${counts.doctors.toLocaleString('vi-VN')}+`;
  };

  const formatMinutes = () => {
    if (!hasAnimated && process.env.NODE_ENV !== 'test') return '<25 phút';
    return `<${counts.minutes} phút`;
  };

  const formatEscrow = () => {
    if (!hasAnimated && process.env.NODE_ENV !== 'test') return '100%';
    return `${counts.escrow}%`;
  };

  const formatSatisfaction = () => {
    if (!hasAnimated && process.env.NODE_ENV !== 'test') return '99.4%';
    return `${counts.satisfaction}%`;
  };

  return (
    <section
      ref={sectionRef}
      id="gia-toc"
      className="relative z-20 -mt-12 sm:-mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 scroll-mt-20"
    >
      <div className="bg-white rounded-2xl shadow-[0_10px_35px_0_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Stat 1: 50.000+ */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
            <div className="flex items-center gap-2.5 text-slate-500 mb-2">
              <span className="material-symbols-outlined text-xl text-blue-700 group-hover:scale-110 transition-transform">
                family_restroom
              </span>
              <span className="text-xs font-medium text-slate-600">Hộ gia đình tin dùng</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {formatFamilies()}
            </div>
          </div>

          {/* Stat 2: 1.200+ Bác sĩ CCHN */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
            <div className="flex items-center gap-2.5 text-slate-500 mb-2">
              <span className="material-symbols-outlined text-xl text-blue-700 group-hover:scale-110 transition-transform">
                badge
              </span>
              <span className="text-xs font-medium text-slate-600">Bác sĩ CCHN uy tín</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {formatDoctors()}
            </div>
          </div>

          {/* Stat 3: <25 phút Phản ứng khẩn cấp */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-rose-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
            <div className="flex items-center gap-2.5 text-slate-500 mb-2">
              <span className="material-symbols-outlined text-xl text-rose-700 group-hover:scale-110 transition-transform">
                support_agent
              </span>
              <span className="text-xs font-medium text-slate-600">Phản ứng khẩn cấp</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {formatMinutes()}
            </div>
          </div>

          {/* Stat 4: 100% Ký quỹ Escrow */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
            <div className="flex items-center gap-2.5 text-slate-500 mb-2">
              <span className="material-symbols-outlined text-xl text-emerald-700 group-hover:scale-110 transition-transform">
                verified_user
              </span>
              <span className="text-xs font-medium text-slate-600">Ký quỹ Escrow minh bạch</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {formatEscrow()}
            </div>
          </div>

          {/* Stat 5: 99.4% Gia đình hài lòng */}
          <div className="col-span-2 md:col-span-1 p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
            <div className="flex items-center gap-2.5 text-slate-500 mb-2">
              <span className="material-symbols-outlined text-xl text-amber-700 group-hover:scale-110 transition-transform">
                hub
              </span>
              <span className="text-xs font-medium text-slate-600">Gia đình hài lòng</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {formatSatisfaction()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
