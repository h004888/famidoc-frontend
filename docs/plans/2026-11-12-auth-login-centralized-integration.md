# Chuẩn hóa Tích hợp API Đăng nhập Backend (POST /api/v1/auth/login) & Đồng bộ Trạng thái Trang chủ — Kế hoạch triển khai

**Mục tiêu:** Thống nhất toàn diện quy trình đăng nhập Frontend với Backend NestJS thực tế qua API `POST /api/v1/auth/login`, khắc phục triệt để sai lệch payload `{ email, password }`, giải nén Unified Response Envelope, chuẩn hóa ánh xạ vai trò `FAMILY_REP` sang `FAMILY`, và bảo đảm hiển thị phiên đăng nhập đồng bộ trên Header Trang chủ (`LandingHeader`).

**Cách tiếp cận:** Áp dụng Phương án 1 (Centralized API Client & Schema Adapter Pattern) theo chu trình TDD nghiêm ngặt (Red → Green → Refactor). Chuẩn hóa bóc tách lỗi RFC 9457 tại `http-client.ts`, đóng gói lời gọi API tại `auth.api.ts`, tái cấu trúc `AuthContext` và `LoginForm` để loại bỏ duplicate fetch, và kiểm chứng đồng bộ trạng thái đăng nhập trên `LandingHeader`.

**Đã tra cứu codebase (codebase-memory-mcp):**
- `get_architecture`: Frontend Next.js 16 + React 19 + Vitest 5.0.5 tại `famidoc-frontend`; Backend NestJS 10 tại `famidoc-backend`.
- `search_graph`: Xác nhận các symbol hiện có liên quan gồm `authApi.login` và `LoginDto` tại `src/lib/api/auth.api.ts`, `AuthContext.login` tại `src/features/auth/context/auth-context.tsx`, `LoginForm` tại `src/features/auth/components/login-form.tsx`, và `LandingHeader` tại `src/features/landing/components/landing-header.tsx`.
- `get_code_snippet`: Xác nhận Backend NestJS tại `famidoc-backend/src/modules/auth/controllers/auth.controller.ts` yêu cầu body kiểu `LoginDto` gồm `email` (bắt buộc, email hợp lệ) và `password` (bắt buộc, string); Backend bật `forbidNonWhitelisted: true` nên từ chối thuộc tính `identifier`; Response được bọc qua `TransformResponseInterceptor` thành `{ success: true, code: 200, message: "...", data: { accessToken, role: "FAMILY_REP", user: { ... } } }`.
- `trace_path`: Xác nhận `LoginForm` và `AuthContext` đang gọi raw `fetch('/api/v1/auth/login')` với `{ identifier, password }` và mong đợi flat object `{ accessToken, user }`, dẫn đến lỗi phân mảnh và gãy phiên làm việc.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Vitest 5.0.5 + @testing-library/react + jsdom
- Vị trí đặt file test: Thư mục `__tests__` theo quy ước `*.test.ts` hoặc `*.test.tsx`
- Lệnh chạy test: `npm test -- <path-to-test-file>` (thực thi từ thư mục `famidoc-frontend`)

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải tuân thủ nghiêm ngặt chu trình Red → Green → Refactor.
- Không có task nào được coi là hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Tuyệt đối không để sót các thuộc tính không hợp lệ (như `identifier`) khi gửi lên Backend để tránh bị `ValidationPipe` từ chối với lỗi 400.
- Mọi phản hồi lỗi phải được giải nén theo chuẩn RFC 9457 Problem Details (`error.detail` hoặc `error.message`).
- Duy trì tính toàn vẹn của toàn bộ các unit test hiện có trong dự án frontend.

---

### Task 1: Chuẩn hóa bóc tách lỗi RFC 9457 trong `http-client.ts` & Unpack Envelope trong `auth.api.ts`

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/lib/api/__tests__/auth-api.test.ts`
- Chỉnh sửa:
  - `src/lib/api/http-client.ts` (`HttpClient.request`)
  - `src/lib/api/auth.api.ts` (`LoginDto`, `AuthResponseDto`, `authApi.login`)
- Test tương ứng: `src/lib/api/__tests__/auth-api.test.ts`
- Kiểm chứng bằng: `npm test -- src/lib/api/__tests__/auth-api.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `AuthContext` và `LoginForm` khi thực hiện đăng nhập
- Gọi tới: `httpClient.post('/api/v1/auth/login', { email, password })`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/lib/api/__tests__/api-clients.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Thông tin `email` và `password` từ người dùng
- Cung cấp đầu ra cho: Dữ liệu đã unwrap `{ accessToken, role, user }` cho Task 2 (`AuthContext`) và Task 3 (`LoginForm`)

- [x] **Bước 1 [RED]: Viết test cho `authApi.login` gửi đúng payload email/password và giải nén response envelope**
  Vị trí file test: `src/lib/api/__tests__/auth-api.test.ts`
  Test case: Gọi `authApi.login({ email: 'rep@famidoc.vn', password: 'Password@123' })`. Mock fetch trả về Unified Envelope `{ success: true, code: 200, data: { accessToken: 'jwt-123', role: 'FAMILY_REP', user: { id: 'usr-1', email: 'rep@famidoc.vn', fullName: 'Đại Diện A', role: 'FAMILY_REP', status: 'ACTIVE' } } }`. Kiểm tra kết quả trả về đúng dữ liệu bên trong `data`, và khi backend trả về lỗi HTTP 401 với `{ error: { detail: 'Sai tên đăng nhập hoặc mật khẩu' } }`, `ApiError.message` nhận đúng câu thông báo lỗi chi tiết.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/auth-api.test.ts` → FAIL với lý do file test chưa tồn tại hoặc kiểu dữ liệu `LoginDto` chưa có trường `email`.
- [x] **Bước 2 [GREEN]: Viết code cập nhật `http-client.ts` và `auth.api.ts` để test ở Bước 1 PASS**
  Chỉnh sửa `src/lib/api/http-client.ts` để ưu tiên bóc tách `errorData?.error?.detail` trước `errorData?.message`, và chỉnh sửa `src/lib/api/auth.api.ts` cập nhật interface `LoginDto { email: string; password: string }`, `UnifiedResponse<T>`, cùng hàm `authApi.login` giải nén `res.data`.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/auth-api.test.ts` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh export kiểu dữ liệu DTO và hàm ánh xạ vai trò `mapBackendRoleToFrontendRole`**
  Đồng bộ hàm helper ánh xạ vai trò `FAMILY_REP` sang `FAMILY` trong `src/lib/api/auth.api.ts` để dùng chung cho toàn bộ ứng dụng.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/auth-api.test.ts` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/lib/api/__tests__/`
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Tái cấu trúc `AuthContext` tích hợp `authApi.login()` & Chuẩn hóa Quản lý Phiên làm việc

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/features/auth/context/__tests__/auth-context.test.tsx`
- Chỉnh sửa: `src/features/auth/context/auth-context.tsx` (`AuthProvider`, `useAuth`, `login`)
- Test tương ứng: `src/features/auth/context/__tests__/auth-context.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/auth/context/__tests__/auth-context.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Toàn bộ các component tiêu thụ `useAuth()` (bao gồm `LandingHeader`, `LoginForm`, protected routes)
- Gọi tới: `authApi.login`, `httpClient.setToken`, `saveAuthSession`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `authApi.login` từ Task 1
- Cung cấp đầu ra cho: State xác thực toàn cục (`user`, `role`, `isAuthenticated`) cho Task 3 và Task 4

- [x] **Bước 1 [RED]: Viết test cho `AuthContext.login` sử dụng `authApi.login` và đồng bộ session người dùng**
  Vị trí file test: `src/features/auth/context/__tests__/auth-context.test.tsx`
  Test case: Render hook `useAuth()` trong wrapper `AuthProvider`. Gọi `login('rep@famidoc.vn', 'Password@123')`. Kiểm tra `authApi.login` được gọi với đúng object `{ email: 'rep@famidoc.vn', password: 'Password@123' }`, vai trò `FAMILY_REP` được chuyển đổi thành `FAMILY`, `httpClient.setToken` được gọi với token thật, `isAuthenticated` chuyển sang `true`, và `user` lưu đầy đủ thông tin `fullName`, `email`, `avatarText`.
  Kỳ vọng: chạy `npm test -- src/features/auth/context/__tests__/auth-context.test.tsx` → FAIL do `AuthContext` hiện tại vẫn đang dùng raw `fetch` gửi trường `identifier`.
- [x] **Bước 2 [GREEN]: Cập nhật `auth-context.tsx` sử dụng `authApi.login` và hoàn thiện ánh xạ phiên**
  Loại bỏ hoàn toàn đoạn mã gọi `fetch('/api/v1/auth/login')` thủ công trong `auth-context.tsx`, thay thế bằng `authApi.login({ email, password })`, giải nén token và user, sau đó cập nhật session và trạng thái context.
  Kỳ vọng: chạy `npm test -- src/features/auth/context/__tests__/auth-context.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Loại bỏ các nhánh logic mock role rải rác và tinh gọn hàm điều hướng**
  Tối ưu xử lý phân quyền và điều hướng an toàn qua `getDefaultPathForRole`.
  Kỳ vọng: chạy `npm test -- src/features/auth/context/__tests__/auth-context.test.tsx` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/auth/context/__tests__/auth-context.test.tsx`
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Refactor `LoginForm` loại bỏ Duplicate Fetch & Hiển thị Thông báo Lỗi RFC 9457

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/auth/components/login-form.tsx` (`handleSubmit`)
  - `src/features/auth/components/__tests__/login-form.test.tsx`
- Test tương ứng: `src/features/auth/components/__tests__/login-form.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/auth/components/__tests__/login-form.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Trang `/login` (`src/app/(auth)/login/page.tsx`)
- Gọi tới: `login` từ `useAuth()` (hoặc `authApi.login`)
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/components/__tests__/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `AuthContext` (Task 2) và `authApi` (Task 1)
- Cung cấp đầu ra cho: Trải nghiệm đăng nhập hoàn chỉnh của người dùng

- [x] **Bước 1 [RED]: Cập nhật test `login-form.test.tsx` kiểm tra form đăng nhập với Unified Envelope và thông báo lỗi backend**
  Vị trí file test: `src/features/auth/components/__tests__/login-form.test.tsx`
  Test case: Cập nhật mock trong test để khớp cấu trúc Backend thực tế (gửi `{ email, password }`, trả về Unified Envelope `{ success: true, code: 200, data: { accessToken: 'real-jwt', role: 'FAMILY_REP', user: { ... } } }`). Bổ sung test case khi submit lỗi 401 thì hiển thị thông báo lỗi chi tiết từ RFC 9457 Problem Details (`Sai tên đăng nhập hoặc mật khẩu`).
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx` → FAIL do `LoginForm` hiện tại đang gửi `{ identifier }` và đọc sai response wrapper.
- [x] **Bước 2 [GREEN]: Chỉnh sửa `LoginForm.tsx` ủy quyền xác thực cho `useAuth().login` hoặc `authApi.login`**
  Xóa bỏ fetch thủ công trong `login-form.tsx`, tích hợp gọi `auth.login(email.trim(), password)` (hoặc `authApi.login`), bắt `ApiError` và gán thông báo lỗi chuẩn xác vào `errors.global`.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Dọn dẹp các biến cục bộ không dùng và chuẩn hóa xử lý disabled của nút Submit**
  Đảm bảo trạng thái loading và disabled được quản lý gọn gàng, đáp ứng tiêu chuẩn a11y.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx`
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Kiểm thử Tích hợp Đồng bộ Trạng thái Phiên trên Header Trang Chủ (`LandingHeader`)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/features/landing/components/__tests__/landing-header-auth.test.tsx`
- Chỉnh sửa: `src/features/landing/components/landing-header.tsx` (nếu cần tinh chỉnh hiển thị avatar / tên)
- Test tương ứng: `src/features/landing/components/__tests__/landing-header-auth.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/landing/components/__tests__/landing-header-auth.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Trang chủ `src/app/page.tsx`
- Gọi tới: `useAuth` từ `src/features/auth/context/auth-context`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/landing/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Trạng thái xác thực của `AuthContext` (Task 2)
- Cung cấp đầu ra cho: Giao diện Header Trang chủ phản ánh đúng trạng thái đăng nhập thực tế của người dùng

- [x] **Bước 1 [RED]: Viết test kiểm tra Header Trang chủ hiển thị Avatar, Tên người dùng và nút Dashboard khi đã xác thực**
  Vị trí file test: `src/features/landing/components/__tests__/landing-header-auth.test.tsx`
  Test case: Render `LandingHeader` bọc trong context có người dùng đã đăng nhập với vai trò `FAMILY`, tên `Nguyễn Văn Đại Diện`. Kiểm tra: hiển thị đúng tên, ký tự avatar `NV`, nút "Vào Bảng Điều Khiển" trỏ tới `/family`, nút "Đăng xuất" hiển thị và khi click sẽ gọi hàm `logout`. Khi chưa đăng nhập, hiển thị nút "Đăng nhập" trỏ về `/login` và "Đăng ký" trỏ về `/register`.
  Kỳ vọng: chạy `npm test -- src/features/landing/components/__tests__/landing-header-auth.test.tsx` → FAIL do file test mới chưa tồn tại.
- [x] **Bước 2 [GREEN]: Hoàn thiện code và cấu hình `LandingHeader` để đồng bộ mượt mà với `AuthContext` và role `FAMILY` từ Backend**
  Đảm bảo `LandingHeader` lấy đúng dữ liệu từ `useAuth()`, format text an toàn và render đúng giao diện theo trạng thái người dùng.
  Kỳ vọng: chạy `npm test -- src/features/landing/components/__tests__/landing-header-auth.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh responsive cho Avatar và Menu mobile trên Trang chủ**
  Đảm bảo cả trên màn hình Desktop và Mobile đều thể hiện đầy đủ trạng thái đăng nhập và nút điều hướng về Dashboard.
  Kỳ vọng: chạy `npm test -- src/features/landing/components/__tests__/landing-header-auth.test.tsx` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test của phân hệ landing và auth: `npm test -- src/features/auth/ src/features/landing/`
  Kết quả mong đợi: tất cả PASS.
