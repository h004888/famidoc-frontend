# Triển khai Luồng Hợp đồng 4 bên theo Phương án 1 (Modular State-Driven Feature Architecture) — Kế hoạch triển khai

**Mục tiêu:** Xây dựng trọn vẹn 9 màn hình còn thiếu cho luồng Hợp đồng 4 bên trên Famidoc Frontend, tích hợp FSM vòng đời và tuân thủ tiêu chuẩn thiết kế app-screens y tế (anti-slop).

**Cách tiếp cận:** Tiếp cận theo Phương án 1 (Modular State-Driven Architecture). Thiết lập Core Domain FSM chung cho vòng đời hợp đồng 4 bên, sau đó triển khai các màn hình theo từng Portal (Facility, Doctor, Admin, Family) đi kèm bộ Unit Test chặt chẽ chuẩn TDD Red-Green-Refactor.

**Đã tra cứu codebase (codebase-memory-mcp):**
- get_architecture: Dự án Next.js 16 + React 19 + Tailwind CSS 4, quản lý module theo `src/features/` và App Router `src/app/(dashboard)/`.
- search_graph: Đã xác định các module `src/features/admin-contracts`, `src/features/subscription-contract`, `src/features/facility-coordination`, `src/features/doctor-dashboard`.
- get_file_outline: Xác nhận `ContractSigningWizard` tại `src/features/subscription-contract/components/contract-signing-wizard.tsx` và `AdminContractsView` tại `src/features/admin-contracts/components/admin-contracts-view.tsx`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: vitest 5.0.5 + @testing-library/react + jsdom
- Vị trí đặt file test: đặt trong subfolder `__tests__` theo quy ước `*.test.tsx` hoặc `*.test.ts`.
- Lệnh chạy test: `npm test -- <path-to-test-file>`

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Mọi màn hình phải tuân thủ nghiêm ngặt design-taste-frontend (app-screens.md): style framed-sheet/achromatic-ledger, màu sắc dưới 5% pixel, không dùng icon-pill slop, số liệu định biên và y khoa trung thực.

---

### Task 1: Core Domain FSM, Contract Types, Schemas & Shared Document Sheet

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `src/features/four-party-contract/types/contract-fsm.ts`
  - `src/features/four-party-contract/schemas/contract.schema.ts`
  - `src/features/four-party-contract/components/contract-document-sheet.tsx`
  - `src/features/four-party-contract/index.ts`
- Chỉnh sửa: Không có (tạo mới module domain core)
- Test tương ứng:
  - `src/features/four-party-contract/__tests__/contract-fsm.test.ts`
  - `src/features/four-party-contract/__tests__/contract-document-sheet.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/four-party-contract/__tests__/`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Không có ban đầu (inbound=0), sẽ được import bởi Task 2, Task 3, Task 4, Task 5, Task 6
- Gọi tới: Zod schema library, clsx, tailwind-merge
- Regression test cần chạy thêm do có inbound calls: Không cần (module hoàn toàn mới)

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Đặc tả luồng Hợp đồng 4 bên (FSM: DRAFT -> FAMILY_SIGNED -> PLATFORM_SIGNED -> FACILITY_ASSIGNED -> DOCTOR_ACCEPTED -> PENDING_PAYMENT -> ACTIVE)
- Cung cấp đầu ra cho: Task 2, Task 3, Task 4, Task 5, Task 6 (sử dụng FSM state, validation quota < 30 hộ/bác sĩ, shared contract document layout)

- [x] **Bước 1 [RED]: Viết test cho State Machine transitions và Quota validation schema**
  Vị trí file test: `src/features/four-party-contract/__tests__/contract-fsm.test.ts`
  Test case:
  - Chuyển trạng thái hợp lệ theo đúng trình tự FSM: DRAFT -> FAMILY_SIGNED -> PLATFORM_SIGNED -> FACILITY_ASSIGNED -> DOCTOR_ACCEPTED -> PENDING_PAYMENT -> ACTIVE.
  - Từ chối chuyển trạng thái bất hợp lệ (ví dụ: DRAFT nhảy thẳng sang DOCTOR_ACCEPTED).
  - Validation schema từ chối phân công bác sĩ nếu quota tải >= 30 hộ.
  Kỳ vọng: chạy `npm test -- src/features/four-party-contract/__tests__/contract-fsm.test.ts` → FAIL với lý do module và schema chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 2 [GREEN]: Viết code tối thiểu định nghĩa FSM, Type và Zod Schema**
  Vị trí: `src/features/four-party-contract/types/contract-fsm.ts` và `src/features/four-party-contract/schemas/contract.schema.ts`
  Kỳ vọng: chạy `npm test -- src/features/four-party-contract/__tests__/contract-fsm.test.ts` → PASS.

- [x] **Bước 3 [REFACTOR]: Tinh chỉnh cấu trúc export tại index.ts**
  Vị trí: `src/features/four-party-contract/index.ts`
  Kỳ vọng: chạy `npm test -- src/features/four-party-contract/__tests__/contract-fsm.test.ts` → vẫn PASS.

- [x] **Bước 4 [RED]: Viết test cho Component hiển thị văn bản hợp đồng chuẩn A4 (ContractDocumentSheet)**
  Vị trí file test: `src/features/four-party-contract/__tests__/contract-document-sheet.test.tsx`
  Test case:
  - Render đầy đủ điều khoản pháp lý, gói khám và 4 ô chữ ký điện tử.
  - Trạng thái chưa ký hiển thị khung chờ trung tính (không slop).
  - Trạng thái đã ký hiển thị mã băm SHA-256 và thời gian ký định dạng chuẩn y khoa.
  Kỳ vọng: chạy `npm test -- src/features/four-party-contract/__tests__/contract-document-sheet.test.tsx` → FAIL với lý do component chưa được triển khai, không fail vì lỗi cú pháp.

- [x] **Bước 5 [GREEN]: Viết code tối thiểu cho ContractDocumentSheet**
  Vị trí: `src/features/four-party-contract/components/contract-document-sheet.tsx`
  Kỳ vọng: chạy `npm test -- src/features/four-party-contract/__tests__/contract-document-sheet.test.tsx` → PASS.

- [x] **Bước 6 [REFACTOR]: Tối ưu typography và spacing theo chuẩn framed-sheet**
  Vị trí: `src/features/four-party-contract/components/contract-document-sheet.tsx`
  Kỳ vọng: chạy `npm test -- src/features/four-party-contract/__tests__/contract-document-sheet.test.tsx` → vẫn PASS.

- [x] **Bước 7: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/four-party-contract/__tests__/`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Phía Cơ sở y tế (Facility) — Màn 1 (Inbound List) & Màn 2 (Doctor Assignment & Digital Sign)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `src/features/facility-coordination/components/facility-contract-inbound-view.tsx` (Màn 1)
  - `src/features/facility-coordination/components/facility-doctor-assign-view.tsx` (Màn 2)
  - `src/app/(dashboard)/facility/contracts/page.tsx`
  - `src/app/(dashboard)/facility/contracts/[id]/assign/page.tsx`
- Chỉnh sửa:
  - `src/features/facility-coordination/index.ts`
  - `src/components/layout/dashboard-sidebar.tsx` (Bổ sung menu "Hợp đồng tiếp nhận" cho role facility)
- Test tương ứng:
  - `src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx`
  - `src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/facility-coordination/components/__tests__/`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `src/app/(dashboard)/facility/layout.tsx` và `dashboard-sidebar.tsx`
- Gọi tới: `src/features/four-party-contract`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/facility-coordination/components/__tests__/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (Hợp đồng ở trạng thái `PLATFORM_SIGNED`)
- Cung cấp đầu ra cho: Task 3 (Hợp đồng chuyển sang `FACILITY_ASSIGNED` kèm bác sĩ được chỉ định)

- [x] **Bước 1 [RED]: Viết test cho Màn 1 - Danh sách Hợp đồng 4 bên tiếp nhận (FacilityContractInboundView)**
  Vị trí file test: `src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx`
  Test case:
  - Hiển thị bảng danh sách hợp đồng đã được Nền tảng ký duyệt (`PLATFORM_SIGNED`).
  - Lọc theo gói chăm sóc và trạng thái tiếp nhận.
  - Nút điều hướng "Phân công & Ký số" dẫn đúng về route chi tiết.
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 2 [GREEN]: Viết code tối thiểu cho FacilityContractInboundView và Page Route**
  Vị trí: `src/features/facility-coordination/components/facility-contract-inbound-view.tsx` và `src/app/(dashboard)/facility/contracts/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx` → PASS.

- [x] **Bước 3 [REFACTOR]: Chuẩn hóa bảng dữ liệu theo quy tắc alignment trong app-screens**
  Vị trí: `src/features/facility-coordination/components/facility-contract-inbound-view.tsx`
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx` → vẫn PASS.

- [x] **Bước 4 [RED]: Viết test cho Màn 2 - Phân công Bác sĩ & Ký số Cơ sở y tế (FacilityDoctorAssignView)**
  Vị trí file test: `src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx`
  Test case:
  - Hiển thị tóm tắt thông tin gia đình và gói dịch vụ.
  - Danh sách bác sĩ hiển thị quota định biên toán học thực tế (ví dụ `21/30 hộ`).
  - Disable nút chọn với các bác sĩ đã chạm ngưỡng 30/30 hộ kèm cảnh báo vi phạm định biên.
  - Modal ký số điện tử của đại diện CSYT cập nhật trạng thái hợp đồng sang `FACILITY_ASSIGNED`.
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 5 [GREEN]: Viết code tối thiểu cho FacilityDoctorAssignView và Page Route**
  Vị trí: `src/features/facility-coordination/components/facility-doctor-assign-view.tsx` và `src/app/(dashboard)/facility/contracts/[id]/assign/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx` → PASS.

- [x] **Bước 6 [REFACTOR]: Cập nhật sidebar navigation cho vai trò CSYT**
  Vị trí: `src/components/layout/dashboard-sidebar.tsx`
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx` → vẫn PASS.

- [x] **Bước 7: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/facility-coordination/components/__tests__/`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Phía Bác sĩ gia đình (Doctor) — Màn 3 (Care Needs Summary & Medical Digital Sign)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `src/features/doctor-dashboard/components/doctor-contract-review-view.tsx` (Màn 3)
  - `src/app/(dashboard)/doctor/contracts/[id]/review/page.tsx`
- Chỉnh sửa:
  - `src/features/doctor-dashboard/index.ts`
  - `src/components/layout/dashboard-sidebar.tsx` (Bổ sung menu "Hợp đồng phụ trách" cho role doctor)
- Test tương ứng:
  - `src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `src/app/(dashboard)/doctor/layout.tsx` và `dashboard-sidebar.tsx`
- Gọi tới: `src/features/four-party-contract`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 2 (Hợp đồng ở trạng thái `FACILITY_ASSIGNED`)
- Cung cấp đầu ra cho: Task 4, Task 5 (Hợp đồng chuyển sang `DOCTOR_ACCEPTED` -> kích hoạt sinh mã VietQR `PENDING_PAYMENT`)

- [x] **Bước 1 [RED]: Viết test cho Màn 3 - Bác sĩ xem Care Needs Summary & Ký số chấp thuận chuyên môn**
  Vị trí file test: `src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx`
  Test case:
  - Render bản tóm tắt Care Needs Summary: nhân khẩu học, độ tuổi, thành viên cao tuổi/trẻ nhỏ, tiền sử dị ứng và bệnh mạn tính.
  - Hiển thị bản thảo cam kết trách nhiệm theo dõi sức khỏe ban đầu.
  - Kích hoạt modal ký số y khoa điện tử và chuyển trạng thái hợp đồng thành `DOCTOR_ACCEPTED` (sẵn sàng thanh toán).
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 2 [GREEN]: Viết code tối thiểu cho DoctorContractReviewView và Route**
  Vị trí: `src/features/doctor-dashboard/components/doctor-contract-review-view.tsx` và `src/app/(dashboard)/doctor/contracts/[id]/review/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx` → PASS.

- [x] **Bước 3 [REFACTOR]: Áp dụng bảng màu lâm sàng tối giản (clinical badge) theo app-screens**
  Vị trí: `src/features/doctor-dashboard/components/doctor-contract-review-view.tsx`
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx` → vẫn PASS.

- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Phía Admin Nền tảng — Màn 4 (Platform Contract Review & Sign) & Màn 5 (Reconciliation & Fallback)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `src/features/admin-contracts/components/admin-four-party-review-view.tsx` (Màn 4)
  - `src/features/admin-contracts/components/admin-reconciliation-view.tsx` (Màn 5)
  - `src/app/(dashboard)/admin/contracts/[id]/review/page.tsx`
  - `src/app/(dashboard)/admin/reconciliation/page.tsx`
- Chỉnh sửa:
  - `src/features/admin-contracts/components/admin-contracts-view.tsx` (Bổ sung tab Hợp đồng 4 bên song song B2B)
  - `src/features/admin-contracts/index.ts`
  - `src/components/layout/dashboard-sidebar.tsx` (Bổ sung menu Đối soát SePay cho Admin)
- Test tương ứng:
  - `src/features/admin-contracts/components/__tests__/admin-four-party-review-view.test.tsx`
  - `src/features/admin-contracts/components/__tests__/admin-reconciliation-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/admin-contracts/components/__tests__/`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `src/app/(dashboard)/admin/contracts/page.tsx`
- Gọi tới: `src/features/four-party-contract`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/admin-contracts/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (Hợp đồng ở trạng thái `FAMILY_SIGNED`)
- Cung cấp đầu ra cho: Task 2 (Admin ký Nền tảng xong chuyển sang `PLATFORM_SIGNED`), Task 6 (Đối soát kích hoạt bù hợp đồng sang `ACTIVE`)

- [x] **Bước 1 [RED]: Viết test cho Màn 4 - Admin Thẩm định chi tiết Hợp đồng 4 bên & Ký số duyệt Platform**
  Vị trí file test: `src/features/admin-contracts/components/__tests__/admin-four-party-review-view.test.tsx`
  Test case:
  - Kiểm tra đối chiếu snapshot quyền lợi gói dịch vụ so với thông tin đăng ký của gia đình.
  - Xem chữ ký số của Đại diện gia đình (kèm timestamp và checksum).
  - Form xác nhận và ký duyệt số đại diện Platform, chuyển trạng thái sang `PLATFORM_SIGNED`.
  Kỳ vọng: chạy `npm test -- src/features/admin-contracts/components/__tests__/admin-four-party-review-view.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 2 [GREEN]: Viết code tối thiểu cho AdminFourPartyReviewView và Route**
  Vị trí: `src/features/admin-contracts/components/admin-four-party-review-view.tsx` và `src/app/(dashboard)/admin/contracts/[id]/review/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/admin-contracts/components/__tests__/admin-four-party-review-view.test.tsx` → PASS.

- [x] **Bước 3 [REFACTOR]: Tinh chỉnh tab Hợp đồng 4 bên trong AdminContractsView**
  Vị trí: `src/features/admin-contracts/components/admin-contracts-view.tsx`
  Kỳ vọng: chạy `npm test -- src/features/admin-contracts/components/__tests__/admin-four-party-review-view.test.tsx` → vẫn PASS.

- [x] **Bước 4 [RED]: Viết test cho Màn 5 - Đối soát giao dịch SePay & Kích hoạt bù hợp đồng (AdminReconciliationView)**
  Vị trí file test: `src/features/admin-contracts/components/__tests__/admin-reconciliation-view.test.tsx`
  Test case:
  - Bảng tra cứu log webhook SePay (mã giao dịch, số tiền, cú pháp, trạng thái MATCHED/PENDING/FAILED).
  - Nút bấm "Kích hoạt bù" (Manual Recheck & Fallback Activation) gọi hành động kích hoạt hợp đồng khi webhook bị nghẽn mạng.
  - Hiển thị thông báo thành công và nhật ký audit trail của Admin.
  Kỳ vọng: chạy `npm test -- src/features/admin-contracts/components/__tests__/admin-reconciliation-view.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 5 [GREEN]: Viết code tối thiểu cho AdminReconciliationView và Route**
  Vị trí: `src/features/admin-contracts/components/admin-reconciliation-view.tsx` và `src/app/(dashboard)/admin/reconciliation/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/admin-contracts/components/__tests__/admin-reconciliation-view.test.tsx` → PASS.

- [x] **Bước 6 [REFACTOR]: Định dạng số tiền VND và mã giao dịch theo achromatic-ledger style**
  Vị trí: `src/features/admin-contracts/components/admin-reconciliation-view.tsx`
  Kỳ vọng: chạy `npm test -- src/features/admin-contracts/components/__tests__/admin-reconciliation-view.test.tsx` → vẫn PASS.

- [x] **Bước 7: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/admin-contracts/components/__tests__/`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 5: Phía Đại diện gia đình (Family) — Màn 6 (Email OTP) & Màn 7 (Signing Tracker Stepper)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `src/features/auth/components/verify-email-otp-view.tsx` (Màn 6)
  - `src/features/subscription-contract/components/contract-signing-tracker-view.tsx` (Màn 7)
  - `src/app/auth/verify-otp/page.tsx`
  - `src/app/(dashboard)/family/subscription/tracking/page.tsx`
- Chỉnh sửa:
  - `src/features/subscription-contract/index.ts`
  - `src/features/subscription-contract/components/contract-signing-wizard.tsx` (Liên kết sau khi gia đình ký sẽ chuyển hướng đến Tracker)
- Test tương ứng:
  - `src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
  - `src/features/subscription-contract/components/__tests__/contract-signing-tracker-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/subscription-contract/components/__tests__/contract-signing-tracker-view.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `src/app/auth/page.tsx` và `contract-signing-wizard.tsx`
- Gọi tới: `src/features/four-party-contract`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/subscription-contract/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (FSM states) và luồng Wizard ký số
- Cung cấp đầu ra cho: Cập nhật trạng thái thời gian thực cho người đại diện gia đình

- [x] **Bước 1 [RED]: Viết test cho Màn 6 - Xác thực mã OTP qua Email (VerifyEmailOtpView)**
  Vị trí file test: `src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
  Test case:
  - Render 6 ô nhập mã OTP riêng biệt có tính năng auto-focus và auto-tab giữa các ô.
  - Đồng hồ đếm ngược cooldown 60 giây và kích hoạt nút gửi lại OTP khi hết giờ.
  - Hiển thị thông báo lỗi khi mã OTP sai hoặc hết hạn.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 2 [GREEN]: Viết code tối thiểu cho VerifyEmailOtpView và Route**
  Vị trí: `src/features/auth/components/verify-email-otp-view.tsx` và `src/app/auth/verify-otp/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → PASS.

- [x] **Bước 3 [REFACTOR]: Xử lý sự kiện paste OTP chuỗi 6 ký tự**
  Vị trí: `src/features/auth/components/verify-email-otp-view.tsx`
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → vẫn PASS.

- [x] **Bước 4 [RED]: Viết test cho Màn 7 - Stepper theo dõi tiến độ ký kết 4 bên (ContractSigningTrackerView)**
  Vị trí file test: `src/features/subscription-contract/components/__tests__/contract-signing-tracker-view.test.tsx`
  Test case:
  - Render Stepper 5 bước: [1] Gia đình đã ký -> [2] Chờ Nền tảng ký -> [3] Chờ CSYT gán bác sĩ & ký -> [4] Chờ Bác sĩ ký -> [5] Sẵn sàng thanh toán.
  - Đánh dấu đúng vị trí bước hiện tại dựa trên FSM state.
  - Khi hợp đồng đạt trạng thái `DOCTOR_ACCEPTED`, tự động hiển thị nút bấm chuyển đến thanh toán VietQR.
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/contract-signing-tracker-view.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 5 [GREEN]: Viết code tối thiểu cho ContractSigningTrackerView và Route**
  Vị trí: `src/features/subscription-contract/components/contract-signing-tracker-view.tsx` và `src/app/(dashboard)/family/subscription/tracking/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/contract-signing-tracker-view.test.tsx` → PASS.

- [x] **Bước 6 [REFACTOR]: Tinh chỉnh Stepper theo phong cách tối giản không dùng icon bóng bẩy**
  Vị trí: `src/features/subscription-contract/components/contract-signing-tracker-view.tsx`
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/contract-signing-tracker-view.test.tsx` → vẫn PASS.

- [x] **Bước 7: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/subscription-contract/components/__tests__/contract-signing-tracker-view.test.tsx`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 6: Phía Gia đình — Màn 8 (Payment Error & Retry) & Màn 9 (Official Contract Viewer) & Navigation Sync

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `src/features/subscription-contract/components/payment-failure-retry-view.tsx` (Màn 8)
  - `src/features/subscription-contract/components/official-contract-viewer.tsx` (Màn 9)
  - `src/app/(dashboard)/family/subscription/payment-error/page.tsx`
  - `src/app/(dashboard)/family/subscription/contract/page.tsx`
- Chỉnh sửa:
  - `src/features/subscription-contract/index.ts`
  - `src/components/layout/dashboard-sidebar.tsx` (Cập nhật điều hướng gia đình tới bản sao hợp đồng chính thức)
- Test tương ứng:
  - `src/features/subscription-contract/components/__tests__/payment-failure-retry-view.test.tsx`
  - `src/features/subscription-contract/components/__tests__/official-contract-viewer.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/subscription-contract/components/__tests__/`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `src/app/(dashboard)/family/layout.tsx` và `contract-signing-wizard.tsx`
- Gọi tới: `src/features/four-party-contract`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/subscription-contract/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1, Task 4, Task 5 (Hợp đồng chuyển sang `ACTIVE` hoặc thất bại ở cổng thanh toán VietQR)
- Cung cấp đầu ra cho: Màn hình kết thúc dịch vụ và lưu trữ hồ sơ pháp lý hoàn chỉnh

- [x] **Bước 1 [RED]: Viết test cho Màn 8 - Báo lỗi thanh toán & Hướng dẫn xử lý VietQR (PaymentFailureRetryView)**
  Vị trí file test: `src/features/subscription-contract/components/__tests__/payment-failure-retry-view.test.tsx`
  Test case:
  - Hiển thị rõ nguyên nhân thất bại: sai cú pháp chuyển khoản, thiếu tiền hoặc phiên VietQR hết hạn.
  - Hướng dẫn các bước khắc phục rõ ràng, không gây hoang mang cho người dùng.
  - Cung cấp nút "Tạo lại mã VietQR mới" và nút "Liên hệ hỗ trợ khẩn cấp".
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/payment-failure-retry-view.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 2 [GREEN]: Viết code tối thiểu cho PaymentFailureRetryView và Route**
  Vị trí: `src/features/subscription-contract/components/payment-failure-retry-view.tsx` và `src/app/(dashboard)/family/subscription/payment-error/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/payment-failure-retry-view.test.tsx` → PASS.

- [x] **Bước 3 [REFACTOR]: Thiết kế giao diện báo lỗi theo phong cách trung thực, không dùng cảnh báo lòe loẹt**
  Vị trí: `src/features/subscription-contract/components/payment-failure-retry-view.tsx`
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/payment-failure-retry-view.test.tsx` → vẫn PASS.

- [x] **Bước 4 [RED]: Viết test cho Màn 9 - Xem & Tải bản sao Hợp đồng điện tử chính thức (OfficialContractViewer)**
  Vị trí file test: `src/features/subscription-contract/components/__tests__/official-contract-viewer.test.tsx`
  Test case:
  - Render toàn văn hợp đồng có đầy đủ 4 chữ ký số điện tử (Family, Platform Admin, Healthcare Facility, Doctor).
  - Có thanh công cụ xem văn bản: phóng to, thu nhỏ, in ấn (Print) và Tải file PDF.
  - Hiển thị mã bảo mật xác thực văn bản trực tuyến (QR Verify URL & Hash SHA-256).
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/official-contract-viewer.test.tsx` → FAIL với lý do component chưa tồn tại, không fail vì lỗi cú pháp.

- [x] **Bước 5 [GREEN]: Viết code tối thiểu cho OfficialContractViewer và Route**
  Vị trí: `src/features/subscription-contract/components/official-contract-viewer.tsx` và `src/app/(dashboard)/family/subscription/contract/page.tsx`
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/official-contract-viewer.test.tsx` → PASS.

- [x] **Bước 6 [REFACTOR]: Tích hợp liên kết tải và in hợp đồng với CSS `@media print`**
  Vị trí: `src/features/subscription-contract/components/official-contract-viewer.tsx`
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/official-contract-viewer.test.tsx` → vẫn PASS.

- [x] **Bước 7: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/subscription-contract/components/__tests__/`)
  Kết quả mong đợi: tất cả PASS.
