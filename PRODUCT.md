# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary users — Gia đình & Người đại diện hộ gia đình (`/family/*`, `/booking/*`, `/onboarding`):** Phụ huynh, con cái trưởng thành chăm sóc cha mẹ lớn tuổi hoặc trẻ nhỏ tại Việt Nam; cần quản lý hồ sơ sức khỏe thành viên, đặt gói chăm sóc bác sĩ gia đình, theo dõi lịch khám tại nhà, tư vấn từ xa và đơn thuốc trên cả máy tính và điện thoại.
- **Secondary / operational users (cổng vận hành phụ trợ):**
  - **Bác sĩ gia đình (`/doctor/*`):** Tiếp nhận hợp đồng gia đình, thăm khám tại nhà hoặc qua video, ghi nhận bệnh án, chỉ số sinh tồn và kê đơn.
  - **Cơ sở y tế đối tác (`/facility/*`):** Điều phối hợp đồng 4 bên, phân công bác sĩ phụ trách, theo dõi doanh thu và xử lý phản ánh.
  - **Quản trị viên nền tảng (`/admin/*`):** Kiểm duyệt bác sĩ, cơ sở y tế, gói dịch vụ, hợp đồng, đối soát và khiếu nại.

## Product Purpose

FamiDoc Pro là nền tảng chăm sóc sức khỏe gia đình theo mô hình Bác sĩ Gia đình riêng, kết nối mỗi gia đình với một bác sĩ phụ trách cố định thông qua hợp đồng điện tử 4 bên để theo dõi sức khỏe liên tục tại nhà và trực tuyến, thay thế việc đi khám rời rạc khi đã phát bệnh.

Thành công của sản phẩm được đo bằng việc người đại diện gia đình có thể hoàn tất chọn bác sĩ/gói chăm sóc, ký hợp đồng và thanh toán, sau đó quản lý thành viên, lịch khám, hồ sơ sức khỏe và đơn thuốc một cách rõ ràng, ít nhầm lẫn và không bị rào cản thuật ngữ chuyên môn.

## Positioning

Khác với các ứng dụng đặt lịch khám lẻ theo từng lần, FamiDoc Pro vận hành theo **hợp đồng chăm sóc gia đình 4 bên** (Gia đình – Bác sĩ – Cơ sở y tế – FamiDoc) gắn với hạn mức suất thành viên theo gói, cho phép bác sĩ phụ trách theo dõi xuyên suốt toàn bộ gia đình qua thăm khám tại nhà, tư vấn video trực tuyến và hồ sơ sức khỏe chung.

## Operating Context

- **Luồng kích hoạt dịch vụ (`/doctors`, `/packages`, `/booking/*`, `/onboarding`):** Chọn bác sĩ/gói dịch vụ → khởi tạo và theo dõi ký hợp đồng 4 bên (Documenso) → thanh toán kích hoạt (`PENDING_PAYMENT` → `ACTIVE`).
- **Cổng Hộ gia đình (`/family/*`):**
  - Tổng quan sức khỏe gia đình (`/family`)
  - Quản lý Thành viên & Hồ sơ sức khỏe từng người (`/family/members`, `/family/members/[id]`), theo dõi bệnh nền, dị ứng, nhóm máu, tài liệu y tế và suất thành viên trong gói
  - Lịch hẹn khám tại nhà & tư vấn từ xa (`/family/appointments`, `/family/telemedicine` qua LiveKit)
  - Sổ khám, đơn thuốc & chỉ số sinh tồn (`/family/medical-book`, `/family/prescriptions`, `/family/vitals`)
  - Thanh toán, hợp đồng & phản hồi (`/family/billing`, `/family/subscription/*`, `/family/feedback`)
- **Cơ chế cổng truy cập (`FamilySubscriptionGate`):** Các tác vụ chăm sóc chủ động yêu cầu hợp đồng ở trạng thái `ACTIVE`; khi chưa có hợp đồng kích hoạt, người dùng được điều hướng về luồng `/booking/*` hoặc `/doctors`, trong khi vẫn giữ quyền xem lại sổ khám (`/family/medical-book`) và đơn thuốc đã chia sẻ (`/family/prescriptions`).

## Capabilities and Constraints

- **Ràng buộc dữ liệu thực:** Giao diện phải phản ánh đúng dữ liệu thật từ API (`patientsApi`, `contractsApi`, `encountersApi`, v.v.); không chèn dữ liệu bệnh nhân giả, số liệu mẫu cứng hoặc thông điệp thành công giả khi API lỗi.
- **Quy tắc nghiệp vụ thành viên:** Số thành viên hoạt động bị giới hạn theo `memberCount` của gói đang kích hoạt; không cho phép gỡ Chủ hộ (`SELF`); việc gỡ thành viên khác là vô hiệu hóa mềm (`INACTIVE`) để bảo toàn lịch sử khám và hoàn lại 1 suất trống trong gói.
- **Thuật ngữ giao diện tiếng Việt:** Ưu tiên ngôn ngữ đời thường, rõ nghĩa cho người dùng phổ thông (ví dụ: *"gói chăm sóc"*, *"thành viên"*, *"người thân"*, *"hồ sơ sức khỏe"*, *"sổ khám"*, *"chất/thuốc gây dị ứng"*); tránh thuật ngữ hành chính hoặc kỹ thuật nội bộ (*"sổ hộ tịch y tế"*, *"tách khỏi hộ"*, *"danh sách thành viên hoạt động"*, *"dị nguyên"*).
- **Tính năng đã có tích hợp thực tế:** Xác thực OTP/email, quản lý hồ sơ thành viên & tài liệu y tế, ký hợp đồng 4 bên qua Documenso, tư vấn video qua LiveKit, theo dõi gói & thanh toán.

## Brand Commitments

- **Tên thương hiệu:** FamiDoc / FamiDoc Pro (`hotro@famidoc.vn`).
- **Tài nguyên nhận diện hiện có:** Logo chính thức tại `famidoc-frontend/public/images/FamiDoc Healthcare Logo.png`.
- **Giọng điệu sản phẩm:** Chuyên nghiệp, tin cậy, ân cần và dễ hiểu với gia đình Việt; thông báo lỗi và xác nhận hành động cần nêu rõ đối tượng, hệ quả và hướng xử lý tiếp theo.
- **Tuyên bố chưa được kiểm chứng (không coi là bằng chứng sự thật):** Các câu copy mẫu đang xuất hiện trên trang Landing như *"cấp chứng chỉ hành nghề chính thức bởi Bộ Y Tế"*, *"Chuẩn HL7 FHIR"*, *"Phản hồi < 2 phút"*, hoặc các con số thống kê/ca bệnh minh họa trong `LandingHero` là nội dung giao diện tham khảo, chưa có tài liệu kiểm chứng pháp lý kèm theo — không mở rộng hoặc trích dẫn như cam kết chính thức trừ khi được bổ sung bằng chứng thật.

## Evidence on Hand

- Mã nguồn hoàn chỉnh của 4 cổng giao diện Next.js (`famidoc-frontend/src/app/`) và API backend NestJS (`famidoc-backend/src/modules/`).
- Tài liệu đặc tả nghiệp vụ và thiết kế trong `openspec/` và `docs/`.
- Logo thương hiệu (`famidoc-frontend/public/images/FamiDoc Healthcare Logo.png`) và ảnh minh họa giao diện trong `famidoc-frontend/public/images/`.
- **Thiếu vắng cần lưu ý:** Chưa có chứng nhận pháp lý Bộ Y Tế, chứng chỉ kiểm định HL7 FHIR, bộ số liệu SLA thực tế hoặc lời chứng thực khách hàng thật được lưu trong repo — mọi bề mặt mới không được tự bịa các bằng chứng này.

## Product Principles

1. **Gia đình là trung tâm, bác sĩ là điểm tựa liên tục:** Mọi tính năng trên cổng `/family/*` phải phục vụ việc người đại diện theo dõi sức khỏe người thân dễ dàng theo gói dịch vụ đang dùng.
2. **Minh bạch trạng thái và dữ liệu thật:** Trạng thái hợp đồng, suất thành viên, lịch khám và lỗi hệ thống phải trung thực, tách bạch rõ giữa đang tải, rỗng, lỗi và có dữ liệu.
3. **Ngôn ngữ y tế gần gũi, an toàn khi thao tác:** Dùng tiếng Việt đời thường, làm rõ thông tin sinh tồn quan trọng (như dị ứng, bệnh nền) và nêu rõ hệ quả trước các thao tác nhạy cảm.
4. **Rõ ràng trước khi phô trương:** Trên các màn hình tác vụ y tế, khả năng đọc quét nhanh, độ tin cậy và nhất quán thuật ngữ quan trọng hơn trang trí.

## Accessibility & Inclusion

- **Chuẩn mục tiêu:** WCAG 2.1 Level AA.
- **Đối tượng cần ưu tiên hỗ trợ:** Người lớn tuổi và người chăm sóc thao tác trên điện thoại — yêu cầu vùng chạm tối thiểu 44×44px, độ tương phản chữ/nền đạt chuẩn, nhãn `<label>` gắn kết rõ ràng cho trình đọc màn hình, hỗ trợ bàn phím (`Escape`, focus ring) và tiếng Việt có dấu rõ ràng ở mọi kích thước.
