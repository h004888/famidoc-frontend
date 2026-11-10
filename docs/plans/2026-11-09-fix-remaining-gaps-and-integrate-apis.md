# Khắc phục thiếu sót kỹ thuật & Đấu nối API luồng Hợp đồng 4 bên (Phương án 1) — Kế hoạch triển khai

**Mục tiêu:** Xử lý triệt để 3 tồn đọng kỹ thuật (lỗi 404 danh sách hợp đồng bác sĩ, bất nhất route auth & form đăng ký, và xây dựng tầng Typed API Client kết nối thực tế giữa Frontend và Backend) tuân thủ nghiêm ngặt chu trình TDD.

**Cách tiếp cận:** Tiếp cận theo Phương án 1 (Typed API Services + Component Integration). Xây dựng module Typed API Client tập trung trong `src/lib/api/`, chuẩn hóa cấu trúc route App Router cho nhóm Auth, tạo trang danh mục hợp đồng bác sĩ `/doctor/contracts`, và đấu nối dữ liệu thực tế cho các view giao diện.

**Đã tra cứu codebase (codebase-memory-mcp):**
- `get_architecture`: Frontend Next.js 16 + React 19 + Vitest 5.0.5, quản lý tính năng theo `src/features/` và App Router `src/app/`.
- `query_graph`: Đã xác nhận `dashboard-sidebar.tsx` trỏ tới `/doctor/contracts` nhưng thư mục chỉ có `[id]/review/page.tsx` (thiếu `page.tsx` danh mục).
- `search_graph`: Đã xác nhận `register-form.tsx` đang dùng `setTimeout` giả lập đẩy về `/login?registered=true`, trong khi `verify-otp` nằm tại `src/app/auth/verify-otp/page.tsx` thay vì Route Group `src/app/(auth)/`.
- `get_code_snippet`: Đã xác nhận Backend NestJS có đầy đủ các endpoint `/api/v1/patients`, `/api/v1/contracts/medical`, `/api/v1/auth/register-representative`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: vitest 5.0.5 + @testing-library/react + jsdom
- Vị trí đặt file test: Thư mục `__tests__` theo quy ước `*.test.tsx` hoặc `*.test.ts`
- Lệnh chạy test: `npm test -- <path-to-test-file>`

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Mọi route và component giao diện phải tuân thủ chuẩn kiểu TypeScript nghiêm ngặt, không dùng `any`.
- Giữ vững toàn bộ 146 unit tests Vitest hiện tại đang PASS.

---

### Task 1: Đồng bộ Route Auth & Luồng Đăng ký sang OTP (/verify-otp)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/app/(auth)/verify-otp/page.tsx`
- Chỉnh sửa:
  - `src/features/auth/components/register-form.tsx`
  - Xóa bỏ route lệch: `src/app/auth/verify-otp/page.tsx`
- Test tương ứng:
  - `src/features/auth/components/__tests__/register-form.test.tsx`
  - `src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/auth/components/__tests__/`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Người dùng đăng ký tài khoản đại diện gia đình tại `/register`
- Gọi tới: `VerifyEmailOtpView` và chuyển hướng tới `/verify-otp?email=...`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/components/__tests__/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Dữ liệu nhập vào của người dùng trong `RegisterForm`
- Cung cấp đầu ra cho: Màn hình nhập OTP `VerifyEmailOtpView` với param `email` trên URL query

- [x] **Bước 1 [RED]: Viết test cho hành vi RegisterForm gọi API đăng ký và điều hướng sang /verify-otp**
  Vị trí file test: `src/features/auth/components/__tests__/register-form.test.tsx`
  Test case:
  - Mock fetch API `/api/v1/auth/register-representative` trả về thành công 201.
  - Sau khi submit form hợp lệ, form gọi đúng endpoint với payload DTO chuẩn.
  - Điều hướng tới `/verify-otp?email=representative%40famidoc.vn` thay vì `/login`.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/register-form.test.tsx` → FAIL với lý do form hiện tại vẫn push tới `/login?registered=true`.
- [x] **Bước 2 [GREEN]: Viết code tối thiểu tại register-form.tsx và tạo route mới tại src/app/(auth)/verify-otp/page.tsx**
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/register-form.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Xóa file cũ src/app/auth/verify-otp/page.tsx và dọn dẹp import**
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/` → vẫn PASS, hành vi không đổi.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/auth/components/__tests__/`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Màn hình Danh sách Hợp đồng Bác sĩ phụ trách (/doctor/contracts) & Khắc phục Lỗi 404

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `src/features/doctor-dashboard/components/doctor-contracts-inbound-view.tsx`
  - `src/app/(dashboard)/doctor/contracts/page.tsx`
- Chỉnh sửa: `src/features/doctor-dashboard/index.ts`
- Test tương ứng: `src/features/doctor-dashboard/components/__tests__/doctor-contracts-inbound-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-contracts-inbound-view.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Menu "Hợp đồng phụ trách" tại `dashboard-sidebar.tsx` (route `/doctor/contracts`)
- Gọi tới: `doctor-contract-review-view.tsx` thông qua link điều hướng `/doctor/contracts/[id]/review`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/doctor-dashboard/components/__tests__/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Danh sách hợp đồng y tế phân công cho bác sĩ (từ backend hoặc mock ban đầu)
- Cung cấp đầu ra cho: Điều hướng chi tiết sang màn hình thẩm định và ký số y tế `doctor/contracts/[id]/review`

- [x] **Bước 1 [RED]: Viết test cho DoctorContractsInboundView hiển thị danh sách hợp đồng và liên kết điều hướng**
  Vị trí file test: `src/features/doctor-dashboard/components/__tests__/doctor-contracts-inbound-view.test.tsx`
  Test case:
  - Render danh sách các hợp đồng được chỉ định cho bác sĩ với mã hợp đồng, tên đại diện gia đình, gói dịch vụ.
  - Hiển thị badge trạng thái chuẩn: `PENDING_APPROVAL` (Chờ ký tiếp nhận), `DOCTOR_ACCEPTED` (Đã tiếp nhận y tế), `ACTIVE` (Đang phụ trách).
  - Nút "Thẩm định & Ký số" liên kết chuẩn xác tới `/doctor/contracts/[id]/review`.
  - Hiển thị empty state khi bác sĩ chưa có hợp đồng nào được phân công.
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-contracts-inbound-view.test.tsx` → FAIL với lý do component chưa tồn tại.
- [x] **Bước 2 [GREEN]: Viết code tối thiểu cho doctor-contracts-inbound-view.tsx và tạo page.tsx tại src/app/(dashboard)/doctor/contracts/page.tsx**
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-contracts-inbound-view.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Export component tại index.ts và tinh chỉnh typography theo chuẩn framed-sheet**
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/` → vẫn PASS, hành vi không đổi.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/doctor-dashboard/components/__tests__/`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Xây dựng Tầng Typed API Client Services (Patients, Contracts, Auth)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới:
  - `src/lib/api/http-client.ts`
  - `src/lib/api/patients.api.ts`
  - `src/lib/api/contracts.api.ts`
  - `src/lib/api/auth.api.ts`
  - `src/lib/api/index.ts`
- Chỉnh sửa: Không có (tạo mới module API Client)
- Test tương ứng: `src/lib/api/__tests__/api-clients.test.ts`
- Kiểm chứng bằng: `npm test -- src/lib/api/__tests__/api-clients.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Các view giao diện trong `family-members`, `subscription-contract`, `facility-coordination`, `doctor-dashboard`, `admin-contracts`
- Gọi tới: Backend NestJS REST API endpoints (`/api/v1/patients`, `/api/v1/contracts/medical`, `/api/v1/auth`)
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/lib/__tests__/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: DTO payload và auth token lưu trong cookie/localStorage
- Cung cấp đầu ra cho: Dữ liệu kiểu mạnh cho Task 4 và Task 5

- [x] **Bước 1 [RED]: Viết test cho các hàm HTTP Client và Typed API Services**
  Vị trí file test: `src/lib/api/__tests__/api-clients.test.ts`
  Test case:
  - `httpClient` tự động chèn header `Authorization: Bearer <token>` nếu có token.
  - `patientsApi.getFamilyMembers` gọi đúng `GET /api/v1/patients` và trả về mảng danh sách bệnh nhân.
  - `patientsApi.createFamilyMember` gửi đúng `POST /api/v1/patients`.
  - `contractsApi.getMedicalContracts` gọi đúng `GET /api/v1/contracts/medical`.
  - `contractsApi.getCareSummary` gọi đúng `GET /api/v1/contracts/medical/:id/care-summary`.
  - `contractsApi.signContract` gửi đúng `PUT /api/v1/contracts/four-party/:id/sign`.
  - `contractsApi.assignDoctor` gửi đúng `PATCH /api/v1/contracts/:id/assign-doctor`.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/api-clients.test.ts` → FAIL với lý do module `src/lib/api` chưa tồn tại.
- [x] **Bước 2 [GREEN]: Viết code tối thiểu định nghĩa httpClient, patientsApi, contractsApi, authApi**
  Vị trí: `src/lib/api/http-client.ts`, `src/lib/api/patients.api.ts`, `src/lib/api/contracts.api.ts`, `src/lib/api/auth.api.ts`, `src/lib/api/index.ts`
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/api-clients.test.ts` → PASS.
- [x] **Bước 3 [REFACTOR]: Chuẩn hóa xử lý lỗi ApiError thống nhất với src/lib/http/errors.ts**
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/api-clients.test.ts` → vẫn PASS, hành vi không đổi.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/lib/api/__tests__/api-clients.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Đấu nối API Quản lý Thành viên Gia đình vào FamilyMembersView

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Chỉnh sửa: `src/features/family-members/components/family-members-view.tsx`
- Test tương ứng: `src/features/family-members/components/__tests__/family-members-api.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Trang `src/app/(dashboard)/family/members/page.tsx`
- Gọi tới: `patientsApi.getFamilyMembers()`, `patientsApi.createFamilyMember()`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/family-dashboard/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `patientsApi` được xây dựng từ Task 3
- Cung cấp đầu ra cho: Dữ liệu hồ sơ thành viên thực tế hiển thị trên màn hình Sổ Hộ Khẩu Y Tế

- [x] **Bước 1 [RED]: Viết test cho FamilyMembersView gọi API tải danh sách và submit thêm thành viên mới**
  Vị trí file test: `src/features/family-members/components/__tests__/family-members-api.test.tsx`
  Test case:
  - Khi render, gọi `patientsApi.getFamilyMembers()` và hiển thị danh sách thành viên trả về từ server.
  - Khi mở modal thêm thành viên, nhập form và bấm submit, gọi đúng `patientsApi.createFamilyMember()` với các trường: `fullName`, `dateOfBirth`, `gender`, `relationshipToHead`.
  - Cập nhật danh sách hiển thị ngay sau khi thêm thành công mà không cần tải lại toàn bộ trang.
  Kỳ vọng: chạy `npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx` → FAIL với lý do component hiện tại chỉ dùng state mock tĩnh `MEMBERS`.
- [x] **Bước 2 [GREEN]: Cập nhật family-members-view.tsx kết nối patientsApi tải dữ liệu và thêm thành viên**
  Kỳ vọng: chạy `npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Xử lý loading spinner nhẹ nhàng và thông báo lỗi thân thiện khi API thất bại**
  Kỳ vọng: chạy `npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx` → vẫn PASS, hành vi không đổi.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 5: Đấu nối API cho Các Màn hình Ký kết & Đối soát 4 bên (Facility, Doctor, Admin, Family)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Chỉnh sửa:
  - `src/features/facility-coordination/components/facility-contract-inbound-view.tsx`
  - `src/features/facility-coordination/components/facility-doctor-assign-view.tsx`
  - `src/features/doctor-dashboard/components/doctor-contract-review-view.tsx`
  - `src/features/admin-contracts/components/admin-four-party-review-view.tsx`
  - `src/features/admin-contracts/components/admin-reconciliation-view.tsx`
  - `src/features/subscription-contract/components/contract-signing-tracker-view.tsx`
- Test tương ứng:
  - `src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx`
  - `src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx`
  - `src/features/admin-contracts/components/__tests__/admin-four-party-review-view.test.tsx`
  - `src/features/admin-contracts/components/__tests__/admin-reconciliation-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/four-party-contract/ src/features/facility-coordination/ src/features/doctor-dashboard/ src/features/admin-contracts/`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Các trang Dashboard App Router tương ứng của 4 vai trò
- Gọi tới: `contractsApi` để lấy dữ liệu thực tế và thực thi ký số / đối soát
- Regression test cần chạy thêm do có inbound calls: `npm test` toàn dự án frontend

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `contractsApi` được xây dựng từ Task 3
- Cung cấp đầu ra cho: Luồng ký số và thanh toán đồng bộ 100% giữa Frontend và Backend NestJS

- [x] **Bước 1 [RED]: Viết test tích hợp hành động ký số và phân công bác sĩ gọi contractsApi**
  Vị trí file test: `src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx`
  Test case:
  - `facility-doctor-assign-view`: Khi bấm "Phân công & Ký số", gọi `contractsApi.assignDoctor()` rồi gọi `contractsApi.signContract()`.
  - `doctor-contract-review-view`: Khi bấm "Ký số tiếp nhận y tế", gọi đúng `contractsApi.signContract()`.
  - `admin-four-party-review-view`: Khi bấm "Ký số thỏa thuận", gọi đúng `contractsApi.signContract()`.
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx` → FAIL với lý do component chưa tích hợp contractsApi.
- [x] **Bước 2 [GREEN]: Cập nhật các component trên gọi contractsApi và cập nhật giao diện khi hoàn tất**
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Cập nhật contract-signing-tracker-view hỗ trợ polling trạng thái hợp đồng định kỳ**
  Kỳ vọng: chạy `npm test -- src/features/subscription-contract/components/__tests__/` → vẫn PASS, hành vi không đổi.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/four-party-contract/ src/features/facility-coordination/ src/features/doctor-dashboard/ src/features/admin-contracts/`)
  Kết quả mong đợi: tất cả PASS.
