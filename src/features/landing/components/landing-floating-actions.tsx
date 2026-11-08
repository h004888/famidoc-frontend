'use client';

import React, { useState, useEffect } from 'react';

export function LandingFloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Scroll To Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Cuộn lên đầu trang"
          className="pointer-events-auto w-11 h-11 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-[#0046c0] shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-1 active:scale-95 cursor-pointer animate-fade-in"
        >
          <span className="material-symbols-outlined text-xl">arrow_upward</span>
        </button>
      )}
    </div>
  );
}

