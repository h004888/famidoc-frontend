import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingHeader } from '@/features/landing/components/landing-header';
import { LandingFooter } from '@/features/landing/components/landing-footer';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Mật Dữ Liệu Y Tế & Quyền Riêng Tư | FamiDoc Pro',
  description:
    'Cam kết bảo mật dữ liệu sức khỏe điện tử (EHR), mã hóa đầu cuối AES-256 và tuân thủ Nghị định 13/2023/NĐ-CP của FamiDoc Pro.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      <LandingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Nghị định 13/2023/NĐ-CP &amp; Tiêu chuẩn Bảo mật Y tế HIPAA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Chính Sách Bảo Mật Dữ Liệu Y Tế &amp; Hồ Sơ Sức Khỏe Điện Tử (EHR)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            FamiDoc Pro cam kết bảo vệ dữ liệu sức khỏe cá nhân của bạn với các tiêu chuẩn an ninh thông tin cao cấp nhất.
          </p>
        </div>

        {/* Highlight Shield Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-2 leading-relaxed">
          <div className="font-bold flex items-center gap-2 text-emerald-900">
            <span className="material-symbols-outlined text-[20px] text-emerald-700">security</span>
            <span>Nguyên Tắc Cốt Lõi Về Bảo Vệ Dữ Liệu Nhạy Cảm:</span>
          </div>
          <p>
            Dữ liệu y tế (chỉ số sinh hiệu, tiền sử bệnh án, hồ sơ dị ứng, kết quả xét nghiệm và đơn thuốc) được phân loại là <strong>Dữ liệu cá nhân nhạy cảm</strong>. Chúng tôi áp dụng quy tắc mã hóa đầu cuối khi lưu trữ (AES-256) và khi truyền tải (TLS 1.3), chỉ cho phép Bác sĩ quản nhiệm và các bên có thẩm quyền truy cập khi có sự đồng thuận rõ ràng từ Người đại diện gia đình.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold tabular-nums">
                1
              </span>
              <span>Dữ Liệu Thu Thập &amp; Mục Đích Sử Dụng</span>
            </h2>
            <p>Hệ thống chỉ thu thập các dữ liệu cần thiết phục vụ công tác khám chữa bệnh ban đầu và phòng ngừa rủi ro y khoa:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li><strong>Thông tin nhân khẩu:</strong> Họ tên, ngày sinh, số CCCD/Định danh cá nhân, mã số thẻ BHYT phục vụ liên thông cơ sở y tế.</li>
              <li><strong>Dữ liệu lâm sàng &amp; sinh hiệu:</strong> Chỉ số huyết áp, nhịp tim, đường huyết, SpO2, triệu chứng bệnh lý và hình ảnh tổn thương gửi qua Telehealth.</li>
              <li><strong>Mục đích:</strong> Phục vụ trực tiếp việc chẩn đoán, theo dõi bệnh mạn tính dài hạn, kê đơn điện tử và liên thông cấp cứu chuyển tuyến.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold tabular-nums">
                2
              </span>
              <span>Tiêu Chuẩn Mã Hóa &amp; Bất Biến Bệnh Án ISO 27799</span>
            </h2>
            <p>
              Bệnh án điện tử EMR sau khi được Bác sĩ ký số sẽ tự động khóa trạng thái bất biến (<span className="font-semibold text-slate-900">IsFinalized = True</span>). Không một cá nhân nào (kể cả quản trị viên hệ thống) có quyền chỉnh sửa hoặc xóa dữ liệu lâm sàng gốc; mọi bổ sung thông tin bắt buộc phải ghi nhận qua hình thức Phụ lục lâm sàng (Clinical Addendum) có gắn dấu thời gian (Timestamp).
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold tabular-nums">
                3
              </span>
              <span>Thời Gian Lưu Trữ &amp; Quyền Của Chủ Thể Dữ Liệu</span>
            </h2>
            <p>
              Tuân thủ quy chế hồ sơ bệnh án của Bộ Y Tế, hồ sơ bệnh án ngoại trú được lưu trữ bảo mật tối thiểu <strong className="text-slate-900 tabular-nums">10 năm</strong>. Người đại diện gia đình có toàn quyền:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>Tra cứu, xuất báo cáo PDF bệnh án điện tử và chia sẻ cho bác sĩ bệnh viện tuyến trên bất kỳ lúc nào.</li>
              <li>Cấu hình phân quyền xem hồ sơ y tế giữa các thành viên trong gia đình tại mục Cài đặt quyền riêng tư.</li>
              <li>Yêu cầu sao lưu hoặc hủy định danh tài khoản khi chấm dứt hợp đồng dịch vụ theo quy định pháp luật.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold tabular-nums">
                4
              </span>
              <span>Nhật Ký Truy Cập Kiểm Toán (Audit Logs)</span>
            </h2>
            <p>
              Mọi hành vi mở xem hồ sơ bệnh án (READ_EHR), kê đơn thuốc hoặc trích xuất tài liệu đều được hệ thống tự động ghi nhật ký kiểm toán không thể can thiệp (bảng <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs text-slate-800">audit_logs</code>) bao gồm: ID người truy cập, thời gian chính xác, địa chỉ IP và lý do chuyên môn.
            </p>
          </section>
        </div>

        {/* Contact Strip */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Bộ phận Bảo vệ Dữ liệu Y tế (DPO):{' '}
            <a href="mailto:privacy@famidoc.vn" className="text-[#0037c1] font-bold hover:underline">
              privacy@famidoc.vn
            </a>
          </div>
          <Link
            href="/contact"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
          >
            Liên hệ hỗ trợ
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
