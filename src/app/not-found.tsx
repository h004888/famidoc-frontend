import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Mini Brand Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/images/FamiDoc Healthcare Logo.png"
            alt="FamiDoc Logo"
            className="h-9 w-auto object-contain"
          />
        </Link>
        <Link
          href="/contact"
          className="text-xs font-bold text-slate-600 hover:text-[#0037c1] transition-colors"
        >
          Tổng đài hỗ trợ 24/7: 1900 6868
        </Link>
      </header>

      {/* Main 404 Content */}
      <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 border border-blue-200 text-[#0037c1] flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[44px]">local_hospital</span>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 tabular-nums">
            Lỗi 404 • Trang Không Tồn Tại
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Không Tìm Thấy Trang Y Tế Này
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Đường dẫn bạn vừa truy cập có thể đã được thay đổi, hết hạn phiên làm việc hoặc chưa được khởi tạo trong hệ thống FamiDoc Pro.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/family"
            className="w-full sm:w-auto px-6 py-3 bg-[#0037c1] hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">family_restroom</span>
            <span>Về Bảng Sức Khỏe Gia Đình</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Trang Chủ FamiDoc</span>
          </Link>
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        FamiDoc - Nền tảng Bác sĩ Gia đình Toàn diện &amp; Hồ sơ Sức khỏe Điện tử (EHR)
      </footer>
    </div>
  );
}
