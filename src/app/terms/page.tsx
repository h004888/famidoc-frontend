import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingHeader } from '@/features/landing/components/landing-header';
import { LandingFooter } from '@/features/landing/components/landing-footer';

export const metadata: Metadata = {
  title: 'Điều Khoản Dịch Vụ & Hợp Đồng Y Tế | FamiDoc Pro',
  description:
    'Quy chế hoạt động, điều khoản dịch vụ y tế bác sĩ gia đình và hợp đồng điện tử 4 bên FamiDoc Pro theo tiêu chuẩn pháp lý Bộ Y Tế.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      <LandingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0037c1] text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Văn bản pháp lý &amp; Quy chế hoạt động</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Điều Khoản Dịch Vụ &amp; Hợp Đồng Y Tế 4 Bên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cập nhật lần cuối: Tháng 10/2026 • Áp dụng cho toàn bộ người dùng, bác sĩ và cơ sở y tế đối tác FamiDoc Pro
          </p>
        </div>

        {/* Legal Notice Callout */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-2 leading-relaxed">
          <div className="font-bold flex items-center gap-2 text-amber-900">
            <span className="material-symbols-outlined text-[20px] text-amber-700">info</span>
            <span>Tuyên Bố Pháp Lý Về Vai Trò Trung Gian Công Nghệ (Rule GB-20):</span>
          </div>
          <p>
            FamiDoc Pro đóng vai trò là nền tảng công nghệ số kết nối trực tiếp Người đại diện gia đình với các Bác sĩ gia đình độc lập có Chứng chỉ hành nghề (CCHN) và các Cơ sở y tế đối tác hợp pháp. FamiDoc chịu trách nhiệm về tính sẵn sàng, an toàn dữ liệu và bảo mật hệ thống; toàn bộ trách nhiệm chuyên môn khám bệnh, chẩn đoán lâm sàng và phác đồ điều trị thuộc về Bác sĩ trực tiếp thăm khám và Cơ sở y tế bảo trợ.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0037c1] flex items-center justify-center text-xs font-bold tabular-nums">
                1
              </span>
              <span>Cơ Chế Hợp Đồng Y Tế Điện Tử 4 Bên (4-Party Retainer Contract)</span>
            </h2>
            <p>
              Mỗi gói dịch vụ chăm sóc gia đình được xác lập qua một Hợp đồng y tế điện tử 4 bên có giá trị pháp lý tương đương hợp đồng văn bản, bao gồm:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li><strong>Bên A (Khách hàng):</strong> Người đại diện hộ gia đình đứng tên mua gói và bảo trợ các thành viên phụ thuộc.</li>
              <li><strong>Bên B (Bác sĩ gia đình):</strong> Bác sĩ chuyên khoa y học gia đình trực tiếp phụ trách y tế và cam kết chỉ số SLA.</li>
              <li><strong>Bên C (Cơ sở y tế đối tác):</strong> Bệnh viện / Phòng khám đa khoa quản lý CCHN của bác sĩ và tiếp nhận chuyển viện.</li>
              <li><strong>Bên D (FamiDoc Platform):</strong> Nền tảng điều phối công nghệ, giám sát chất lượng và trung gian thanh toán.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0037c1] flex items-center justify-center text-xs font-bold tabular-nums">
                2
              </span>
              <span>Quy Chế Thăm Khám &amp; Kê Đơn Thuốc Điện Tử</span>
            </h2>
            <p>
              Quy trình khám bệnh và kê đơn thuốc tuân thủ nghiêm ngặt Luật Khám bệnh, chữa bệnh số 15/2023/QH15, Thông tư 04/2022/TT-BYT và Thông tư 27/2021/TT-BYT của Bộ Y Tế:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>Mọi đơn thuốc điện tử phải tuân thủ chuẩn dữ liệu 1NF và được ký số HSM bởi bác sĩ trước khi phát hành.</li>
              <li>Mã đơn thuốc quốc gia có giá trị mua thuốc tại các quầy thuốc GPP toàn quốc trong vòng <strong className="text-slate-900 tabular-nums">30 ngày</strong> (CFG-04).</li>
              <li>Nghiêm cấm hành vi tự ý sửa chữa đơn thuốc, mua gom thuốc kháng sinh hoặc sử dụng đơn thuốc sai mục đích điều trị.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0037c1] flex items-center justify-center text-xs font-bold tabular-nums">
                3
              </span>
              <span>Chính Sách Đặt Lịch, Đổi Lịch &amp; Quy Tắc 4 Giờ (CFG-07)</span>
            </h2>
            <p>
              Để đảm bảo quyền lợi và kế hoạch trực của bác sĩ, FamiDoc áp dụng quy tắc đổi lịch hẹn tự động:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>Gia đình được phép tự đổi lịch khám trước giờ hẹn tối thiểu <strong className="text-slate-900 tabular-nums">04 giờ</strong> mà không bị trừ hạn mức lượt khám.</li>
              <li>Nếu hủy hoặc đổi lịch khi thời gian còn dưới 04 giờ, hệ thống sẽ khóa chức năng tự đổi và yêu cầu liên hệ Hotline Trực ban để điều phối khẩn cấp.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0037c1] flex items-center justify-center text-xs font-bold tabular-nums">
                4
              </span>
              <span>Thanh Toán VietQR &amp; Giải Quyết Khiếu Nại</span>
            </h2>
            <p>
              Hóa đơn dịch vụ được thanh toán qua mã động VietQR với thời gian chờ hiệu lực trong <strong className="text-slate-900 tabular-nums">15 phút</strong> (CFG-05). Trong trường hợp phát sinh tranh chấp hoặc khiếu nại về thái độ/chất lượng phục vụ:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>Hội đồng trọng tài FamiDoc và Cơ sở y tế sẽ thẩm tra nhật ký EMR, tọa độ GPS và băng ghi hình WebRTC.</li>
              <li>Chế tài xử lý bao gồm cảnh cáo, đình chỉ hoặc đổi bác sĩ gia đình phụ trách mới; hệ thống không áp dụng chính sách bồi hoàn tiền mặt trực tiếp ngoài thỏa thuận chấm dứt hợp đồng.</li>
            </ul>
          </section>
        </div>

        {/* Bottom Contact Help */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Cần giải đáp thêm về pháp lý? Liên hệ ban pháp chế qua email{' '}
            <a href="mailto:phapche@famidoc.vn" className="text-[#0037c1] font-bold hover:underline">
              phapche@famidoc.vn
            </a>
          </div>
          <Link
            href="/contact"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
          >
            Gửi yêu cầu hỗ trợ
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
