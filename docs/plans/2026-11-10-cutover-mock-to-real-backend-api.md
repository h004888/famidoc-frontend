# Xóa bỏ Mockup & Tích hợp Toàn diện API Thực tế từ Backend (Phương án 1) — Kế hoạch triển khai

**Mục tiêu:** Chuyển đổi triệt để toàn bộ các thành phần giao diện Frontend từ dữ liệu giả lập (Mockup, `DEFAULT_USERS`, `DEFAULT_MOCK_CONTRACT`, `MOCK_EHR`, `MOCK_DOCTORS`) sang sử dụng API thực tế từ NestJS Backend và cơ sở dữ liệu PostgreSQL/Redis theo chu trình TDD.

**Cách tiếp cận:** Triển khai theo Phương án 1 (End-to-End Slice Cutover). Tích hợp lần lượt từng phân hệ khép kín bắt đầu từ Xác thực & Phiên làm việc (Auth & JWT Token) ➔ Quy trình Hợp đồng 4 bên ➔ Hồ sơ sức khỏe & Bệnh án gia đình ➔ Danh bạ Bác sĩ & CSYT công khai. Toàn bộ dữ liệu mock sẽ bị xóa sạch khỏi thư mục `src/features/` và chỉ được giữ lại trong các file kiểm thử `*.test.tsx` độc lập.

**Đã tra cứu codebase (codebase-memory-mcp):**
- `get_architecture`: Frontend sử dụng Next.js 16 + React 19 + Vitest 5.0.5; Backend NestJS 10 + Prisma ORM + PostgreSQL + Docker Redis (cổng 6379).
- `search_graph`: Xác nhận các hằng số mockup cần loại bỏ gồm `DEFAULT_USERS` tại `src/lib/auth-storage.ts`, `DEFAULT_MOCK_CONTRACTS` tại `facility-contract-inbound-view.tsx`, `DEFAULT_MOCK_CONTRACT` tại `facility-doctor-assign-view.tsx`, `doctor-contract-review-view.tsx`, `admin-four-party-review-view.tsx`, `MOCK_EHR` tại `family-members-view.tsx`, `MOCK_DOCTORS` và `MOCK_FACILITIES` tại `doctor-directory-view.tsx`.
- `get_code_snippet`: Xác nhận Backend NestJS đã có đầy đủ các endpoint hoạt động tại `POST /api/v1/auth/login`, `POST /api/v1/auth/verify-email-otp`, `GET /api/v1/contracts/medical`, `GET /api/v1/patients`, `GET /api/v1/public/doctors`.
- `trace_path`: Xác nhận `AuthContext` đang gọi `saveAuthSession(selectedRole, assignedUser)` từ `DEFAULT_USERS` thay vì nhận JWT token từ `authApi.login()`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Vitest 5.0.5 + @testing-library/react + jsdom
- Vị trí đặt file test: Thư mục `__tests__` theo quy ước `*.test.tsx` hoặc `*.test.ts`
- Lệnh chạy test: `npm test -- <path-to-test-file>`

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải tuân thủ nghiêm ngặt chu trình Red → Green → Refactor.
- Không có task nào được coi là hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Tuyệt đối không để sót bất kỳ hằng số mockup nào (`DEFAULT_MOCK_*`, `MOCK_*`, `DEFAULT_USERS`) trong mã nguồn runtime `src/features/`. Dữ liệu mock chỉ tồn tại trong các file test `__tests__/*.test.tsx`.
- Duy trì tính toàn vẹn của toàn bộ 166 unit tests hiện có trong dự án.

---

### Task 1: Auth Integration — Chuyển đổi Đăng nhập thực tế qua API Backend & Lưu JWT Token

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/auth/context/auth-context.tsx`
  - `src/features/auth/components/login-form.tsx`
  - `src/lib/auth-storage.ts`
- Test tương ứng: `src/features/auth/components/__tests__/login-form.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/auth/components/__tests__/login-form.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Người dùng đăng nhập hệ thống tại route `/login`
- Gọi tới: `authApi.login({ identifier, password })` và `httpClient.setToken(accessToken)`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Form đăng nhập `LoginForm` (email/số điện thoại và mật khẩu)
- Cung cấp đầu ra cho: JWT Bearer Token lưu vào Cookie và LocalStorage phục vụ các API phân hệ sau

- [x] **Bước 1 [RED]: Viết test cho hành vi LoginForm gọi authApi.login và lưu session từ Backend response**
  Vị trí file test: `src/features/auth/components/__tests__/login-form.test.tsx`
  Test case: Nhập email `rep@famidoc.vn` và mật khẩu `Password@123`, submit form và kiểm tra hàm API đăng nhập được gọi với payload đúng, nhận token JWT thực tế.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx` → FAIL với lý do LoginForm chưa gọi authApi thực tế hoặc mock match chưa thỏa mãn.
- [x] **Bước 2 [GREEN]: Viết code tích hợp authApi.login vào AuthContext và LoginForm**
  Chỉnh sửa `src/features/auth/context/auth-context.tsx` và `src/features/auth/components/login-form.tsx` để gọi `authApi.login()`, nhận `accessToken` và thông tin `user` thật từ backend, lưu cookie `famidoc_token` và `famidoc_role`. Xóa logic gán cứng `DEFAULT_USERS`.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh xử lý lỗi API và hiển thị thông báo lỗi 401 tiếng Việt**
  Chuẩn hóa thông báo lỗi khi thông tin đăng nhập không chính xác từ phản hồi NestJS `UnauthorizedException`.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx` → PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test auth: `npm test -- src/features/auth/`
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Verify & Resend OTP Flow — Hoàn thiện tích hợp API Xác thực và Gửi lại OTP

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/auth/components/verify-email-otp-view.tsx`
  - `src/app/(auth)/verify-otp/page.tsx`
- Test tương ứng: `src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Người dùng kích hoạt tài khoản tại route `/verify-otp?email=...`
- Gọi tới: `POST /api/v1/auth/verify-email-otp` và `POST /api/v1/auth/resend-email-otp`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/components/__tests__/register-form.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Mã OTP 6 chữ số người dùng nhập và query parameter `email` trên URL
- Cung cấp đầu ra cho: Tài khoản được kích hoạt trong cơ sở dữ liệu PostgreSQL, điều hướng sang `/login?registered=true`

- [x] **Bước 1 [RED]: Viết test kiểm tra VerifyEmailOtpView gửi request POST tới API Backend khi không có prop expectedOtp**
  Vị trí file test: `src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
  Test case: Render component không truyền prop `expectedOtp`, nhập 6 chữ số OTP và kiểm tra `globalThis.fetch` được gọi tới `/api/v1/auth/verify-email-otp` với đúng payload email và otp.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → FAIL do test case mới kiểm tra mock fetch chưa khớp hoặc chưa được khai báo.
- [x] **Bước 2 [GREEN]: Hoàn thiện code VerifyEmailOtpView gọi API thực tế và xử lý phản hồi 201/401**
  Chỉnh sửa `src/features/auth/components/verify-email-otp-view.tsx` để gửi request xác thực và gửi lại OTP qua endpoint `/api/v1/auth/verify-email-otp` và `/api/v1/auth/resend-email-otp`.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh hàm handleResend và đồng bộ hóa focus ô nhập**
  Làm sạch code, giữ trải nghiệm đếm ngược 60s cooldown mượt mà và focus tự động.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Four-Party Contract Workflow — Xóa Mock Contract & Đấu nối contracts.api.ts

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/facility-coordination/components/facility-contract-inbound-view.tsx`
  - `src/features/facility-coordination/components/facility-doctor-assign-view.tsx`
  - `src/features/doctor-dashboard/components/doctor-contract-review-view.tsx`
  - `src/features/admin-contracts/components/admin-four-party-review-view.tsx`
- Test tương ứng:
  - `src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx`
  - `src/features/facility-coordination/components/__tests__/facility-doctor-assign-view.test.tsx`
  - `src/features/doctor-dashboard/components/__tests__/doctor-contract-review-view.test.tsx`
  - `src/features/admin-contracts/components/__tests__/admin-four-party-review-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/facility-coordination/ src/features/doctor-dashboard/ src/features/admin-contracts/`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Các phân hệ Bác sĩ (`/doctor/contracts`), CSYT (`/facility/coordination`), Quản trị (`/admin/contracts`)
- Gọi tới: `contractsApi.getMedicalContracts()`, `contractsApi.getMedicalContractById(id)`, `contractsApi.getCareSummary(id)`, `contractsApi.signFourPartyContract(id, payload)`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/subscription-contract/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Token định danh của Bác sĩ / CSYT / Admin sau khi đăng nhập (Task 1)
- Cung cấp đầu ra cho: Trạng thái hợp đồng chuyển dịch thực tế trong cơ sở dữ liệu (`CREATED` ➔ `FACILITY_ASSIGNED` ➔ `DOCTOR_ACCEPTED` ➔ `PLATFORM_SIGNED`)

- [x] **Bước 1 [RED]: Viết test kiểm tra các view hợp đồng fetch dữ liệu động từ contractsApi khi mount**
  Vị trí file test: `src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx`
  Test case: Kiểm tra component tự động gọi `contractsApi.getMedicalContracts` khi khởi tạo và hiển thị danh sách hợp đồng trả về từ API Backend thay vì đọc hằng số tĩnh.
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx` → FAIL do component hiện tại vẫn ưu tiên đọc `DEFAULT_MOCK_CONTRACTS`.
- [x] **Bước 2 [GREEN]: Xóa bỏ DEFAULT_MOCK_CONTRACTS và DEFAULT_MOCK_CONTRACT, tích hợp contractsApi**
  Chỉnh sửa `facility-contract-inbound-view.tsx`, `facility-doctor-assign-view.tsx`, `doctor-contract-review-view.tsx`, `admin-four-party-review-view.tsx`: Xóa sạch các biến mock tĩnh khỏi component. Thêm `useEffect` nạp dữ liệu từ `contractsApi`, hiển thị Loading Skeleton khi đang tải và Empty State khi không có dữ liệu.
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/components/__tests__/facility-contract-inbound-view.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Chuẩn hóa xử lý lỗi mạng và trạng thái hợp đồng không tìm thấy (404)**
  Hiển thị Alert Banner thân thiện khi hợp đồng không tồn tại hoặc lỗi kết nối.
  Kỳ vọng: chạy `npm test -- src/features/facility-coordination/ src/features/doctor-dashboard/ src/features/admin-contracts/` → PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/facility-coordination/ src/features/doctor-dashboard/ src/features/admin-contracts/`
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Family Members & Patient EHR — Xóa MOCK_EHR & Đấu nối patients.api.ts

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/family-members/components/family-members-view.tsx`
  - `src/features/family-dashboard/components/family-member-care-view.tsx`
- Test tương ứng: `src/features/family-members/components/__tests__/family-members-api.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Người đại diện gia đình xem danh sách người thân tại `/family/members` và chi tiết bệnh án tại `/family/members/[id]`
- Gọi tới: `patientsApi.getFamilyMembers()`, `patientsApi.getPatientById(id)`, `patientsApi.addPatientAllergy()`, `patientsApi.uploadPatientDocument()`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/family-dashboard/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Phiên làm việc của FAMILY đã đăng nhập (Task 1)
- Cung cấp đầu ra cho: Danh sách thành viên và bệnh án điện tử thực tế liên kết với hợp đồng chăm sóc

- [x] **Bước 1 [RED]: Viết test kiểm tra FamilyMemberCareView tải thông tin bệnh án và dị ứng từ API Backend thay vì MOCK_EHR**
  Vị trí file test: `src/features/family-members/components/__tests__/family-members-api.test.tsx`
  Test case: Kiểm tra khi chọn một bệnh nhân, component thực hiện gọi API chi tiết bệnh nhân từ backend và render thông tin tiền sử/dị ứng thật.
  Kỳ vọng: chạy `npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx` → FAIL do component đang phụ thuộc vào object tĩnh `MOCK_EHR`.
- [x] **Bước 2 [GREEN]: Xóa hằng số MOCK_EHR và tích hợp patientsApi vào view chi tiết thành viên**
  Chỉnh sửa `family-members-view.tsx` và `family-member-care-view.tsx`: Xóa bỏ export `MOCK_EHR`. Nạp dữ liệu thành viên và bệnh án động qua `patientsApi.getPatientById(id)` và các endpoints liên kết.
  Kỳ vọng: chạy `npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Tối ưu hóa render danh sách dị ứng và tệp đính kèm y tế**
  Làm sạch code, giữ nguyên định dạng nhãn theo tiêu chuẩn thiết kế y tế (badge dị ứng, loại tài liệu).
  Kỳ vọng: chạy `npm test -- src/features/family-members/components/__tests__/family-members-api.test.tsx` → PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/family-members/ src/features/family-dashboard/`
  Kết quả mong đợi: tất cả PASS.

---

### Task 5: Public Doctors & Facilities Directory — Xóa MOCK_DOCTORS/FACILITIES & Nối Public API

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/lib/api/public.api.ts`
- Chỉnh sửa:
  - `src/features/doctors/components/doctor-directory-view.tsx`
  - `src/lib/api/index.ts`
- Test tương ứng: `src/lib/api/__tests__/api-clients.test.ts`
- Kiểm chứng bằng: `npm test -- src/lib/api/__tests__/api-clients.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Trang công khai tra cứu bác sĩ và cơ sở y tế tại `/doctors`
- Gọi tới: `GET /api/v1/public/doctors` và `GET /api/v1/public/facilities`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/doctors/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Ô tìm kiếm từ khóa, bộ lọc chuyên khoa, cơ sở y tế
- Cung cấp đầu ra cho: Danh bạ bác sĩ và CSYT động phục vụ người dùng chọn bác sĩ gia đình

- [x] **Bước 1 [RED]: Viết test cho module publicApi gọi GET /api/v1/public/doctors và GET /api/v1/public/facilities**
  Vị trí file test: `src/lib/api/__tests__/api-clients.test.ts`
  Test case: Gọi `publicApi.getDoctors()` và `publicApi.getFacilities()`, kiểm tra endpoint và phương thức HTTP GET gửi lên backend.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/api-clients.test.ts` → FAIL do `publicApi` chưa được định nghĩa.
- [x] **Bước 2 [GREEN]: Tạo mới publicApi và xóa bỏ 200+ dòng MOCK_DOCTORS / MOCK_FACILITIES trong DoctorDirectoryView**
  Tạo `src/lib/api/public.api.ts` kết nối tới các endpoint công khai của backend. Cập nhật `doctor-directory-view.tsx` để lấy danh sách từ API qua `useEffect`, xóa sạch các mảng dữ liệu tĩnh `MOCK_DOCTORS` và `MOCK_FACILITIES`.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/api-clients.test.ts` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh debounce ô tìm kiếm bác sĩ và xử lý kết quả rỗng**
  Tối ưu hóa lượt gọi API khi người dùng gõ tìm kiếm, hiển thị Empty State chuẩn Medsev khi không tìm thấy bác sĩ phù hợp.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/api-clients.test.ts` → PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test suite của frontend: `npm test`
  Kết quả mong đợi: tất cả 39 file test và 166+ bài test đều PASS.
