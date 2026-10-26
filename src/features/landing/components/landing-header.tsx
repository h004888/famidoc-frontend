'use client';

import React from 'react';
import Link from 'next/link';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-[#e4e8ed] transition-all duration-300 shadow-[0_4px_25px_-5px_rgba(0,37,139,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Live Status */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              alt="FamiDoc Logo"
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP2vLQlo-MlGsI60EM5op1cowa65mzi3lQCTKVDEhd4eOaX_AXD-_4doTHhY3JsZHdyJlWx3ltpzrzhvAPzoe5ZPqr69VWvahuedT5UOCn908_fbKE8Sx-szaLJm6wj50WPDvkCB5G_09YUJCBIM-OfKscXyFy5UKaO3_PBYaH8q_K5KgYZnyl7ZZy4kUUbwsud2gALiXSlvdTtGhcubqJgE8TlyaZjRsXyjKcmN3QCFaCti5EqT90rByysgWpb4D_Qoc"
            />
            <span className="sr-only">FamiDoc Pro</span>
          </Link>
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#f6ffed] border border-[#b7eb8f] text-[#52c41a] text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#52c41a] animate-pulse" />
            <span>
              Bác sĩ trực tuyến: <strong className="text-[#237804]">32 BS sẵn sàng</strong>
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Điều hướng chính">
          <Link
            href="#tong-quan"
            className="px-3.5 py-2 text-sm font-semibold text-[#444654] hover:text-[#0037c1] rounded-lg hover:bg-[#eaedff]/60 transition-colors"
          >
            Dịch vụ
          </Link>
          <Link
            href="#goi-kham"
            className="px-3.5 py-2 text-sm font-semibold text-[#444654] hover:text-[#0037c1] rounded-lg hover:bg-[#eaedff]/60 transition-colors"
          >
            Gói khám
          </Link>
          <Link
            href="#tru-cot"
            className="px-3.5 py-2 text-sm font-semibold text-[#444654] hover:text-[#0037c1] rounded-lg hover:bg-[#eaedff]/60 transition-colors"
          >
            Quy trình
          </Link>
          <Link
            href="#bac-si"
            className="px-3.5 py-2 text-sm font-semibold text-[#444654] hover:text-[#0037c1] rounded-lg hover:bg-[#eaedff]/60 transition-colors"
          >
            Bác sĩ
          </Link>
          <Link
            href="#tu-van"
            className="px-3.5 py-2 text-sm font-semibold text-[#444654] hover:text-[#0037c1] rounded-lg hover:bg-[#eaedff]/60 transition-colors"
          >
            Tư vấn
          </Link>
        </nav>

        {/* Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pulse Emergency 115 Button */}
          <button
            type="button"
            onClick={() => {
              window.location.href = 'tel:19008821';
            }}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#e02424] bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fca5a5] rounded-xl transition-all duration-200"
            aria-label="Cấp cứu: 1900 8821"
          >
            <span className="w-2 h-2 rounded-full bg-[#e02424] animate-pulse" />
            <span className="tracking-wide">Cấp cứu: 1900 8821</span>
          </button>

          {/* Login Button */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-bold text-[#0037c1] bg-[#eaedff] hover:bg-[#dde1ff] rounded-xl transition-colors"
          >
            Đăng nhập
          </Link>

          {/* Main Cobalt CTA Button */}
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0037c1] via-[#1554e8] to-[#0037c1] hover:from-[#00258b] hover:to-[#0037c1] text-white text-xs sm:text-sm font-bold shadow-glow-cobalt hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <span>Đăng ký</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
