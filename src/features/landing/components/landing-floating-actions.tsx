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
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Hotline Emergency Floating Pill */}
      <a
        href="tel:19008821"
        className="pointer-events-auto group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Gọi hotline cấp cứu 1900 8821"
      >
        <span className="material-symbols-outlined text-lg animate-bounce">call</span>
        <span className="hidden sm:inline">Cấp Cứu 24/7:</span>
        <span className="font-mono">1900 8821</span>
      </a>

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

