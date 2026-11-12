# Chuẩn hóa Tích hợp API Đăng ký Đại diện Gia đình (POST /api/v1/auth/register-representative) & Luồng Xác thực OTP — Kế hoạch triển khai

**Mục tiêu:** Tích hợp triệt để và khép kín giao diện đăng ký `RegisterForm` và màn hình xác thực `VerifyEmailOtpView` với API thực tế của Backend NestJS (`POST /api/v1/auth/register-representative`, `POST /api/v1/auth/verify-email-otp`, `POST /api/v1/auth/resend-email-otp`), xử lý đúng Unified Envelope HTTP 201, ánh xạ chính xác các mã lỗi RFC 9457 (400, 409, 429, 503) vào từng trường trên form, và loại bỏ lỗi tự động nhảy trang khi đứt kết nối.

**Cách tiếp cận:** Triển khai theo Phương án 2 (End-to-End Register ➔ Session Metadata ➔ Verify OTP Integration) áp dụng chu trình TDD (Red → Green → Refactor). Chuẩn hóa tầng client `auth.api.ts` và `auth.schema.ts` trước, sau đó tái cấu trúc `RegisterForm` và `VerifyEmailOtpView` để dùng chung `authApi`, đồng bộ metadata OTP (`expiresInSeconds`, `devOtp`) qua `sessionStorage`.

**Đã tra cứu codebase (codebase-memory-mcp):**
- `get_architecture`: Frontend Next.js 16 + React 19 + Vitest 5.0.5 tại `famidoc-frontend`; Backend NestJS 10 tại `famidoc-backend`.
- `search_graph`: Xác nhận các symbol liên quan gồm `authApi.registerRepresentative`, `authApi.verifyEmailOtp`, `authApi.resendEmailOtp` tại `src/lib/api/auth.api.ts`; `registerFamilySchema` tại `src/features/auth/schemas/auth.schema.ts`; `RegisterForm` tại `src/features/auth/components/register-form.tsx`; và `VerifyEmailOtpView` tại `src/features/auth/components/verify-email-otp-view.tsx`.
- `get_code_snippet`:
  - Tại `famidoc-backend/src/modules/auth/dtos/register-family-rep.dto.ts`: DTO yêu cầu `fullName` (bắt buộc), `phone` (khớp `/^(\+84|0)[0-9]{9,10}$/`), `email` (`@IsEmail`, bắt buộc), `password` (`@Length(8, 64)`), `confirmPassword` (tùy chọn), `acceptTerms` (`@IsBoolean`, phải `true`). Backend bật `whitelist: true, forbidNonWhitelisted: true`.
  - Tại `famidoc-backend/src/modules/auth/services/impl/auth.service.impl.ts`: Trả về HTTP 201 bọc trong Unified Envelope `{ success: true, code: 201, message: "Success", data: { email, expiresInSeconds: 300, devOtp?: string } }`. Các mã lỗi gồm 409 (`AUTH_EMAIL_ALREADY_EXISTS`, `AUTH_PHONE_ALREADY_EXISTS`, `AUTH_CONFLICT_ERROR`), 429 (cooldown 60s), 400 và 503.
  - Tại `famidoc-frontend/src/features/auth/components/register-form.tsx`: `handleSubmit` (dòng 102-150) đang gọi raw `fetch`, khối `catch` (dòng 146-149) tự ý gọi `router.push('/verify-otp?...')` ngay cả khi lỗi mạng, và JSX không render `errors.global` cũng như `errors.acceptTerms`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Vitest 5.0.5 + @testing-library/react + jsdom
- Vị trí đặt file test: Thư mục `__tests__` theo quy ước `*.test.ts` hoặc `*.test.tsx`
- Lệnh chạy test: `npm test -- <path-to-test-file>` (thực thi từ thư mục `famidoc-frontend`)

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Giữ nguyên mã nguồn Backend (`famidoc-backend`), mọi điều chỉnh tích hợp thực hiện tại Frontend (`famidoc-frontend`).
- Chỉ gửi đúng 6 trường hợp lệ trong `RegisterFamilyRepDto` lên Backend để tuân thủ `forbidNonWhitelisted: true`.
- Tuyệt đối không điều hướng sang `/verify-otp` khi API đăng ký trả về lỗi hoặc khi request gặp lỗi mạng.

---

### Task 1: Chuẩn hóa `authApi.registerRepresentative`, `verifyEmailOtp`, `resendEmailOtp` & Bộ ánh xạ lỗi RFC 9457 trong `src/lib/api/auth.api.ts`

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/lib/api/auth.api.ts` (`RegisterRepresentativeDto`, `RegisterInitiateResponseData`, `authApi.registerRepresentative`, `authApi.verifyEmailOtp`, `authApi.resendEmailOtp`, `mapRegistrationErrorToFields`)
  - `src/lib/api/__tests__/auth-api.test.ts`
- Test tương ứng: `src/lib/api/__tests__/auth-api.test.ts`
- Kiểm chứng bằng: `npm test -- src/lib/api/__tests__/auth-api.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `RegisterForm` (`src/features/auth/components/register-form.tsx`) và `VerifyEmailOtpView` (`src/features/auth/components/verify-email-otp-view.tsx`)
- Gọi tới: `httpClient.post` tại `src/lib/api/http-client.ts`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/lib/api/__tests__/api-clients.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Dữ liệu form đăng ký `RegisterRepresentativeDto` và mã xác thực `VerifyOtpDto`
- Cung cấp đầu ra cho: Dữ liệu đã giải nén `RegisterInitiateResponseData { email, expiresInSeconds, devOtp }` và hàm `mapRegistrationErrorToFields` cho Task 3 (`RegisterForm`) và Task 4 (`VerifyEmailOtpView`)

- [ ] **Bước 1 [RED]: Viết test cho `authApi.registerRepresentative` giải nén Unified Envelope HTTP 201 và hàm `mapRegistrationErrorToFields` phân loại lỗi 409/429/400**
  Vị trí file test: `src/lib/api/__tests__/auth-api.test.ts`
  Test case:
  1. Gọi `authApi.registerRepresentative` với số điện thoại có khoảng trắng `'0912 345 678'`; mock fetch trả về Unified Envelope HTTP 201 `{ success: true, code: 201, message: 'Success', data: { email: 'rep@famidoc.vn', expiresInSeconds: 300, devOtp: '123456' } }`. Kiểm tra body gửi đi đã xóa khoảng trắng ở `phone` (`'0912345678'`), chỉ gồm đúng 6 trường hợp lệ, và kết quả trả về đúng `{ email: 'rep@famidoc.vn', expiresInSeconds: 300, devOtp: '123456' }`.
  2. Kiểm tra `mapRegistrationErrorToFields(apiError)`: khi `errorCode === 'AUTH_EMAIL_ALREADY_EXISTS'` trả về `{ email: 'Email này đã được đăng ký trong hệ thống' }`; khi `errorCode === 'AUTH_PHONE_ALREADY_EXISTS'` trả về `{ phone: 'Số điện thoại này đã được đăng ký trong hệ thống' }`; khi status `429` trả về `{ global: 'Vui lòng chờ 60 giây trước khi yêu cầu gửi lại mã OTP' }`.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/auth-api.test.ts` → FAIL với lý do `mapRegistrationErrorToFields` chưa tồn tại và `registerRepresentative` chưa giải nén `res.data` cũng như chưa chuẩn hóa `phone`.
- [ ] **Bước 2 [GREEN]: Viết code tại `src/lib/api/auth.api.ts` để test ở Bước 1 PASS**
  Khai báo `RegisterInitiateResponseData`, cập nhật `authApi.registerRepresentative`, `authApi.verifyEmailOtp`, `authApi.resendEmailOtp` tự động giải nén `res.data` từ Unified Envelope (vẫn giữ thuộc tính `message` tương thích ngược), chuẩn hóa `phone` và `email`, đồng thời cài đặt hàm `mapRegistrationErrorToFields`.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/auth-api.test.ts` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh xử lý `invalidParams` của chuẩn RFC 9457 trong `mapRegistrationErrorToFields`**
  Đảm bảo nếu Backend trả về mảng `error.invalidParams`, từng phần tử `{ field, message }` được ánh xạ chính xác vào object lỗi trả về.
  Kỳ vọng: chạy `npm test -- src/lib/api/__tests__/` → vẫn PASS, hành vi không đổi.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test trong `src/lib/api/__tests__/` (`npm test -- src/lib/api/__tests__/`)
  Kết quả mong đợi: tất cả PASS, bao gồm cả regression test `api-clients.test.ts`.

---

### Task 2: Đồng bộ `registerFamilySchema` tại `src/features/auth/schemas/auth.schema.ts` khớp Ràng buộc Backend

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/auth/schemas/auth.schema.ts` (`registerFamilySchema`)
  - `src/features/auth/schemas/__tests__/auth.schema.test.ts`
- Test tương ứng: `src/features/auth/schemas/__tests__/auth.schema.test.ts`
- Kiểm chứng bằng: `npm test -- src/features/auth/schemas/__tests__/auth.schema.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `RegisterForm.handleBlur` và `RegisterForm.handleSubmit` tại `src/features/auth/components/register-form.tsx`
- Gọi tới: Thư viện `zod`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/components/__tests__/register-form.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Dữ liệu state `formData` của `RegisterForm`
- Cung cấp đầu ra cho: Dữ liệu đã xác thực hợp lệ cho Task 3 (`RegisterForm`)

- [ ] **Bước 1 [RED]: Viết test cho `registerFamilySchema` kiểm tra số điện thoại có khoảng trắng, đầu số `+84`, số 10-11 chữ số và độ dài mật khẩu tối đa 64 ký tự**
  Vị trí file test: `src/features/auth/schemas/__tests__/auth.schema.test.ts`
  Test case:
  1. Gọi `registerFamilySchema.safeParse` với `phone: '0912 345 678'` và `phone: '+84912345678'` → kỳ vọng `success: true` và `data.phone` được loại bỏ khoảng trắng.
  2. Gọi `registerFamilySchema.safeParse` với `password` dài 65 ký tự → kỳ vọng `success: false` và có lỗi tại trường `password`.
  Kỳ vọng: chạy `npm test -- src/features/auth/schemas/__tests__/auth.schema.test.ts` → FAIL với lý do regex hiện tại từ chối `'0912 345 678'` / `'+84912345678'` và chưa giới hạn tối đa 64 ký tự cho mật khẩu.
- [ ] **Bước 2 [GREEN]: Cập nhật `registerFamilySchema` tại `src/features/auth/schemas/auth.schema.ts` để test ở Bước 1 PASS**
  Cập nhật trường `phone` dùng `.transform((val) => val.replace(/\s+/g, ''))` kết hợp regex `/^(\+84|0)[0-9]{9,10}$/` (giữ nguyên câu thông báo `'Số điện thoại không đúng định dạng Việt Nam'`), và thêm `.max(64, 'Mật khẩu tối đa 64 ký tự')` cho `password`.
  Kỳ vọng: chạy `npm test -- src/features/auth/schemas/__tests__/auth.schema.test.ts` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Chuẩn hóa `.trim()` cho `fullName` và `email` trong `registerFamilySchema`**
  Đảm bảo dữ liệu đầu ra sau khi parse luôn sạch khoảng trắng thừa ở hai đầu.
  Kỳ vọng: chạy `npm test -- src/features/auth/schemas/__tests__/auth.schema.test.ts` → vẫn PASS.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/auth/schemas/__tests__/auth.schema.test.ts`
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Tái cấu trúc `RegisterForm` tích hợp `authApi.registerRepresentative`, Hiển thị Lỗi Chi tiết & Chặn Redirect Sai khi Lỗi

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/auth/components/register-form.tsx` (`RegisterForm`, `handleSubmit`)
  - `src/features/auth/components/__tests__/register-form.test.tsx`
- Test tương ứng: `src/features/auth/components/__tests__/register-form.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/auth/components/__tests__/register-form.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Trang `/register` (`src/app/(auth)/register/page.tsx`)
- Gọi tới: `authApi.registerRepresentative`, `mapRegistrationErrorToFields` từ `src/lib/api/auth.api.ts`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/components/__tests__/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `authApi.registerRepresentative`, `mapRegistrationErrorToFields` (Task 1) và `registerFamilySchema` (Task 2)
- Cung cấp đầu ra cho: Metadata OTP lưu trong `sessionStorage` (`famidoc_pending_otp_meta`) và điều hướng sang `/verify-otp?email=...` cho Task 4

- [ ] **Bước 1 [RED]: Viết test trong `register-form.test.tsx` cho luồng thành công với Unified Envelope, lỗi 409 trùng Email/SĐT, và lỗi mạng không được nhảy trang**
  Vị trí file test: `src/features/auth/components/__tests__/register-form.test.tsx`
  Test case:
  1. Khi submit hợp lệ và Backend trả về HTTP 201 Unified Envelope `{ success: true, code: 201, data: { email: 'rep@famidoc.vn', expiresInSeconds: 300, devOtp: '654321' } }`: kiểm tra `sessionStorage.getItem('famidoc_pending_otp_meta')` lưu đúng JSON `{ email: 'rep@famidoc.vn', expiresInSeconds: 300, devOtp: '654321' }` và `router.push` được gọi với `'/verify-otp?email=rep%40famidoc.vn'`.
  2. Khi Backend trả về HTTP 409 với `{ success: false, code: 409, error: { errorCode: 'AUTH_EMAIL_ALREADY_EXISTS', detail: 'This email is already registered' } }`: kiểm tra màn hình hiển thị alert `'Email này đã được đăng ký trong hệ thống'` và `router.push` KHÔNG được gọi.
  3. Khi `fetch` bị reject (lỗi mạng): kiểm tra hiển thị Banner lỗi kết nối (`role="alert"`) và `router.push` KHÔNG được gọi.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/register-form.test.tsx` → FAIL vì `RegisterForm` hiện tại chưa lưu `sessionStorage`, chưa map lỗi `AUTH_EMAIL_ALREADY_EXISTS`, và khối `catch` vẫn đang gọi `router.push`.
- [ ] **Bước 2 [GREEN]: Cập nhật `src/features/auth/components/register-form.tsx` để test ở Bước 1 PASS**
  Thay thế raw `fetch` bằng `authApi.registerRepresentative`, lưu metadata `{ email, expiresInSeconds, devOtp }` vào `sessionStorage.setItem('famidoc_pending_otp_meta', ...)`, xóa lệnh `router.push` trong `catch`, sử dụng `mapRegistrationErrorToFields(err)` để gán lỗi vào `errors`, đồng thời render Banner `errors.global` (`role="alert"`) và thông báo lỗi `errors.acceptTerms` trên JSX.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/register-form.test.tsx` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh xóa lỗi trường tương ứng khi người dùng gõ lại trong `handleChange`**
  Khi người dùng chỉnh sửa lại ô `email` hoặc `phone` đang có lỗi 409, tự động xóa thông báo lỗi của trường đó để cải thiện UX.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/register-form.test.tsx` → vẫn PASS.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/auth/components/__tests__/register-form.test.tsx`
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Chuẩn hóa `VerifyEmailOtpView` tích hợp `authApi` & Đồng bộ Metadata OTP từ `sessionStorage`

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/auth/components/verify-email-otp-view.tsx` (`VerifyEmailOtpView`, `handleSubmit`, `handleResend`)
  - `src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
- Test tương ứng: `src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Trang `/verify-otp` (`src/app/(auth)/verify-otp/page.tsx`) và `ContractSigningWizard` (`src/features/subscription-contract/components/contract-signing-wizard.tsx`)
- Gọi tới: `authApi.verifyEmailOtp`, `authApi.resendEmailOtp` từ `src/lib/api/auth.api.ts`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/ src/features/subscription-contract/`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Metadata `famidoc_pending_otp_meta` trong `sessionStorage` từ Task 3 và các hàm `authApi` từ Task 1
- Cung cấp đầu ra cho: Kích hoạt tài khoản thành công và điều hướng sang `/login?registered=true`

- [ ] **Bước 1 [RED]: Viết test trong `verify-email-otp-view.test.tsx` cho việc đồng bộ `devOtp` từ `sessionStorage` và hiển thị lỗi RFC 9457 khi Verify/Resend thất bại**
  Vị trí file test: `src/features/auth/components/__tests__/verify-email-otp-view.test.tsx`
  Test case:
  1. Thiết lập `sessionStorage.setItem('famidoc_pending_otp_meta', JSON.stringify({ email: 'an.nguyen@famidoc.vn', expiresInSeconds: 300, devOtp: '888999' }))`, render `<VerifyEmailOtpView email="an.nguyen@famidoc.vn" />` → kiểm tra hiển thị gợi ý mã OTP môi trường phát triển `'888999'` trên giao diện, và sau khi verify thành công thì xóa `'famidoc_pending_otp_meta'` khỏi `sessionStorage`.
  2. Khi API `POST /api/v1/auth/verify-email-otp` trả về HTTP 401 với RFC 9457 `{ success: false, code: 401, error: { detail: 'Invalid or expired OTP' } }` → kiểm tra hiển thị thông báo lỗi tiếng Việt `'Mã xác thực OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại.'`.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → FAIL với lý do `VerifyEmailOtpView` chưa đọc `famidoc_pending_otp_meta` từ `sessionStorage` và chưa xóa sau khi xác thực xong.
- [ ] **Bước 2 [GREEN]: Cập nhật `src/features/auth/components/verify-email-otp-view.tsx` tích hợp `authApi` và `sessionStorage` để test ở Bước 1 PASS**
  Đọc `famidoc_pending_otp_meta` từ `sessionStorage` khi khởi tạo để lấy `devOtp` (nếu khớp email), hiển thị badge gợi ý `devOtp` phục vụ kiểm thử/development, thay thế raw `fetch` trong `handleSubmit` và `handleResend` bằng `authApi.verifyEmailOtp` và `authApi.resendEmailOtp`, xóa `sessionStorage` khi xác thực thành công, và chuẩn hóa thông báo lỗi 401/429.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh xử lý lỗi khi gọi `handleResend` thất bại (HTTP 429 Cooldown)**
  Đảm bảo nếu `authApi.resendEmailOtp` ném lỗi 429, hiển thị rõ thông báo yêu cầu chờ hết thời gian giãn cách thay vì báo đã gửi thành công.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/verify-email-otp-view.test.tsx` → vẫn PASS.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan (`npm test -- src/features/auth/ src/lib/api/`)
  Kết quả mong đợi: tất cả PASS.
