# Đồng Bộ Phông Chữ Chuẩn Medsev (Nhóm 1) Toàn Hệ Thống — Kế hoạch triển khai

**Mục tiêu:** Đưa toàn bộ 32 màn hình, 3 Layout khung và các Modal trong ứng dụng FamiDoc về chung một chuẩn phông chữ duy nhất (`Poppins` / `font-sans` kết hợp `tabular-nums` và thang độ đậm `font-normal`..`font-bold`) giống hệt Nhóm 1 (Các màn hình Công khai / Marketing — Medsev Typography Standard), loại bỏ triệt để xung đột với `font-mono`, các "class ma" chưa định nghĩa và các độ đậm `font-black`/`font-extrabold` gây lệch chuẩn.

**Cách tiếp cận:** Áp dụng Phương án A (Medsev Pure Tailwind Typography) theo chu trình TDD (Red → Green → Refactor) qua 6 task độc lập. Trước hết chuẩn hóa tầng cấu hình gốc (`src/app/globals.css` và `DESIGN.md`) để bảo toàn tính kế thừa CSS của `Poppins`, sau đó lần lượt dọn sạch 30 vị trí "class ma" (`font-headline-*`, `font-body-*`, `font-label-*`), 88 vị trí lạm dụng `font-mono` và 21 vị trí lệch độ đậm (`font-black`, `font-extrabold`) trên 33 file TSX, khóa chặt bằng bộ kiểm thử tự động quét toàn bộ mã nguồn `src/`.

**Đã tra cứu codebase (codebase-memory-mcp):**
- `list_projects`: Xác nhận project đã được index với tên `C-Users-ADMIN-Downloads-famidoc-famidoc-frontend`.
- `get_architecture`: Dự án gồm 2257 nodes, 4180 edges, chia thành các package `app` (32 routes + 3 layouts), `features` (27 modules), `components` (`dashboard-sidebar.tsx`, `dashboard-topbar-user.tsx`), `lib`.
- `search_code` (pattern `font-(sans|serif|mono|poppins|inter|body|heading|headline|label|title|display|\[)`): Xác nhận 161 vị trí khớp trên 41 files trong `src/`, trong đó có 88 vị trí dùng `font-mono` trên 32 files và 30 vị trí dùng các class chưa định nghĩa (`font-headline-*`, `font-body-*`, `font-label-*`, `text-headline-*`, `text-body-*`, `text-label-*`) tại `src/app/(auth)/layout.tsx` và `src/features/auth/components/login-form.tsx`.
- `search_code` (pattern `font-(black|extrabold)`): Xác nhận 21 vị trí trên 9 files dùng độ đậm 800/900 lệch với chuẩn `font-bold` (700) của Nhóm 1.
- `get_code_snippet`: Đã đọc chi tiết `LandingHeader`, `LandingFooter`, `LandingHero`, `LandingServices`, `DoctorDirectoryView`, `DoctorDetailView`, `PackagesCatalogView`, `PackageDetailView`, `ContractSigningWizard` để xác nhận chuẩn hiển thị thực tế của Nhóm 1.
- `query_graph` & `trace_path`: Đã xác nhận sơ đồ `IMPORTS` từ 32 file `page.tsx` trong `src/app/` tới 27 feature modules trong `src/features/`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: `vitest` (v5.0.5) kết hợp `@testing-library/react` (jsdom) và `node:fs` cho các bài kiểm thử đặc tả tĩnh — xác nhận tại `C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.vitest.config` (`vitest.config.ts`).
- Vị trí đặt file test: `src/**/__tests__/**/*.test.{ts,tsx}` (nằm trong thư mục `__tests__` cùng cấp với module hoặc trong `src/lib/__tests__/`).
- Lệnh chạy test: `npm test` (chạy toàn bộ test suite) hoặc `npm test -- <đường-dẫn-file-test>` (chạy từng file test cụ thể).

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Duy trì duy nhất phông chữ `Poppins` (`font-sans`) trên toàn bộ 32 màn hình; sử dụng `tabular-nums` thay cho `font-mono` để căn thẳng hàng chữ số, giá tiền, chỉ số sinh tồn, ngày giờ và mã định danh mà không làm biến dạng chữ tiếng Việt có dấu.
- Không sử dụng các class chưa định nghĩa trong Tailwind v4 (`font-headline-*`, `font-body-*`, `font-label-*`, `text-headline-*`, `text-body-*`, `text-label-*`).
- Không sử dụng `font-black` (900) hoặc `font-extrabold` (800) trên phông `Poppins`; độ đậm tối đa cho tiêu đề và KPI là `font-bold` (700) theo đúng chuẩn Nhóm 1.

---

### Task 1: Chuẩn hóa tầng cấu hình Typography gốc tại `src/app/globals.css` và `DESIGN.md`

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/lib/__tests__/typography-foundation-spec.test.ts`
- Chỉnh sửa:
  - `src/app/globals.css` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.app.globals`, dòng 143-156)
  - `DESIGN.md` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.DESIGN`, dòng 51-125 và dòng 192-198)
- Test tương ứng: `src/lib/__tests__/typography-foundation-spec.test.ts`
- Kiểm chứng bằng: `npm test -- src/lib/__tests__/typography-foundation-spec.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `src/app/layout.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.app.layout.RootLayout`) import trực tiếp `src/app/globals.css`.
- Gọi tới: Không có phụ thuộc downstream trong đồ thị hàm.
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/lib/__tests__/contrast-tokens.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Không có (Task nền tảng đầu tiên).
- Cung cấp đầu ra cho: Task 2, Task 3, Task 4, Task 5, Task 6 (quy tắc kế thừa phông chữ `Poppins` và tiện ích `.tabular-nums` chuẩn hóa).

- [x] **Bước 1 [RED]: Viết test kiểm tra đặc tả Typography gốc trong `src/app/globals.css` và `DESIGN.md`**
  Vị trí file test: `src/lib/__tests__/typography-foundation-spec.test.ts`
  Test case:
  1. Đọc `src/app/globals.css`, kiểm tra quy tắc CSS toàn cục chỉ đặt `font-family: 'Poppins', var(--font-sans), sans-serif;` trên `html, body, button, input, select, textarea` và KHÔNG đặt trực tiếp lên các thẻ con `span, label, td, th, li, p, a, h1, h2, h3, h4, h5, h6` (để không chặn tính kế thừa CSS từ thẻ cha).
  2. Đọc `DESIGN.md`, kiểm tra toàn bộ các mục `fontFamily:` trong phần YAML frontmatter đều khai báo `Poppins` và không còn chuỗi `fontFamily: Inter`.
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/typography-foundation-spec.test.ts` → FAIL với lý do `src/app/globals.css` dòng 144 đang chứa `h1, h2, h3, h4, h5, h6, p, a, span, label, td, th, li` và `DESIGN.md` đang chứa `fontFamily: Inter`, không fail vì lỗi cú pháp.
- [x] **Bước 2 [GREEN]: Cập nhật `src/app/globals.css` và `DESIGN.md` để thỏa mãn đặc tả Typography gốc**
  Tại `src/app/globals.css` (dòng 144-146): Rút gọn bộ chọn `html, body, button, input, select, textarea, h1, h2, h3, h4, h5, h6, p, a, span, label, td, th, li` thành `html, body, button, input, select, textarea` để mọi thẻ văn bản con kế thừa tự nhiên từ `body`.
  Tại `DESIGN.md` (dòng 53-120 và dòng 194): Đổi toàn bộ `fontFamily: Inter` sang `fontFamily: Poppins` và cập nhật đoạn mô tả mục `## Typography` từ `Inter` sang `Poppins`.
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/typography-foundation-spec.test.ts` → PASS.
- [x] **Bước 3 [REFACTOR]: Không cần refactor thêm cho cấu hình tĩnh ở bước này**
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/typography-foundation-spec.test.ts` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/lib/__tests__/typography-foundation-spec.test.ts src/lib/__tests__/contrast-tokens.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Xóa bỏ "class ma" và đồng bộ phông chữ tại Cụm Màn hình Xác thực (`AuthLayout`, `LoginForm`, `RegisterForm`)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Chỉnh sửa:
  - `src/app/(auth)/layout.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.app.(auth).layout.AuthLayout`, dòng 6, 23, 39, 69, 77, 80, 111, 114, 145, 148, 150, 153, 156, 159, 164, 175, 192)
  - `src/features/auth/components/login-form.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.auth.components.login-form.LoginForm`, dòng 78, 81, 92, 107, 126, 142, 177, 183, 193, 213, 223, 250, 254)
  - `src/features/auth/components/register-form.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.auth.components.register-form.RegisterForm`, dòng 135, 271, 309)
- Test tương ứng:
  - `src/features/auth/components/__tests__/login-form.test.tsx`
  - `src/features/auth/components/__tests__/register-form.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/auth/components/__tests__/login-form.test.tsx src/features/auth/components/__tests__/register-form.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi:
  - `src/app/(auth)/login/page.tsx` (`LoginPage`) gọi `LoginForm`
  - `src/app/(auth)/register/page.tsx` (`RegisterPage`) gọi `RegisterForm`
- Gọi tới: `useAuth`, `loginSchema`, `registerFamilySchema`.
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/auth/schemas/__tests__/auth.schema.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (nền tảng kế thừa `Poppins` từ `globals.css`).
- Cung cấp đầu ra cho: Task 6 (hoàn tất chuẩn hóa cụm Auth để vượt qua bài kiểm thử quét toàn cục).

- [x] **Bước 1 [RED]: Viết test kiểm tra không còn "class ma" và không còn `font-mono` / `font-black` trên cụm Auth**
  Vị trí file test: `src/features/auth/components/__tests__/login-form.test.tsx` và `src/features/auth/components/__tests__/register-form.test.tsx`
  Test case:
  1. Trong `login-form.test.tsx`: Render `<LoginForm />` và đọc nội dung `src/app/(auth)/layout.tsx`, kiểm tra DOM của `LoginForm` và mã nguồn `AuthLayout` không chứa bất kỳ class nào khớp regex `/\b(font|text)-(headline|body|label)-(lg|md|sm)\b/`, đồng thời tiêu đề `h1` "Đăng nhập FamiDoc" có class `font-bold` chuẩn Nhóm 1.
  2. Trong `register-form.test.tsx`: Render `<RegisterForm />`, kiểm tra tiêu đề `h1` có class `font-bold` (không dùng `font-black`) và các ô input CCCD, Số điện thoại dùng class `tabular-nums` nhưng KHÔNG chứa class `font-mono`.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx src/features/auth/components/__tests__/register-form.test.tsx` → FAIL với lý do tìm thấy `font-headline-md`, `font-body-md`, `font-label-lg`, `font-black`, `font-mono`, không fail vì lỗi cú pháp.
- [x] **Bước 2 [GREEN]: Chuẩn hóa class Typography trong `src/app/(auth)/layout.tsx`, `login-form.tsx` và `register-form.tsx`**
  1. Tại `src/app/(auth)/layout.tsx`: Xóa toàn bộ 17 vị trí dùng `font-body-md`, `text-body-md`, `font-label-lg`, `font-body-sm`, `font-label-sm`, `font-headline-sm`; đặt `font-sans text-sm` ở thẻ gốc dòng 6.
  2. Tại `src/features/auth/components/login-form.tsx`: Xóa toàn bộ 13 vị trí dùng `font-headline-md`, `text-headline-md`, `font-body-md`, `text-body-md`, `font-label-lg`, `text-label-lg`, `font-body-sm`, `font-label-sm`; đổi `font-semibold` trên thẻ `h1` dòng 78 thành `font-bold`.
  3. Tại `src/features/auth/components/register-form.tsx`: Đổi `font-black` ở dòng 135 thành `font-bold`; xóa `font-mono` (giữ `tabular-nums`) ở dòng 271 và dòng 309.
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx src/features/auth/components/__tests__/register-form.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Không cần refactor thêm vì các class đã gọn theo chuẩn Tailwind thuần**
  Kỳ vọng: chạy `npm test -- src/features/auth/components/__tests__/login-form.test.tsx src/features/auth/components/__tests__/register-form.test.tsx` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/auth/components/__tests__/login-form.test.tsx src/features/auth/components/__tests__/register-form.test.tsx src/features/auth/schemas/__tests__/auth.schema.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Chuẩn hóa Typography nội bộ Nhóm 1 — Các màn hình Công khai / Marketing (9 files)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Chỉnh sửa:
  - `src/features/landing/components/landing-stats.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.landing.components.landing-stats.LandingStats`, dòng 114, 127, 140, 153, 166)
  - `src/features/landing/components/landing-packages.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.landing.components.landing-packages.LandingPackages`, dòng 146)
  - `src/features/landing/components/landing-process.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.landing.components.landing-process.LandingProcess`, dòng 70)
  - `src/features/landing/components/landing-doctors.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.landing.components.landing-doctors.LandingDoctors`, dòng 172, 244)
  - `src/features/packages/components/packages-catalog-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.packages.components.packages-catalog-view.PackagesCatalogView`, dòng 432, 542, 627)
  - `src/features/packages/components/package-detail-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.packages.components.package-detail-view.PackageDetailView`, dòng 437, 500, 601)
  - `src/features/doctors/components/doctor-detail-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctors.components.doctor-detail-view.DoctorDetailView`, dòng 487, 495, 504, 675, 676, 763, 881)
  - `src/features/doctors/components/doctor-matching-wizard.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctors.components.doctor-matching-wizard.DoctorMatchingWizard`, dòng 137, 463, 489, 492)
  - `src/features/contact/components/contact-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.contact.components.contact-view.ContactView`, dòng 242, 433)
- Test tương ứng:
  - `src/features/landing/components/__tests__/landing-components.test.tsx`
  - `src/features/packages/components/__tests__/packages-catalog.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/landing/components/__tests__/landing-components.test.tsx src/features/packages/components/__tests__/packages-catalog.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `HomePage` (`src/app/page.tsx`), `PackagesPage` (`src/app/packages/page.tsx`), `PackageDetailPage` (`src/app/packages/[id]/page.tsx`), `DoctorDetailPage` (`src/app/doctors/[id]/page.tsx`), `DoctorMatchingPage` (`src/app/doctors/matching/page.tsx`), `ContactPage` (`src/app/contact/page.tsx`), `DoctorDirectoryView` (`src/features/doctors/components/doctor-directory-view.tsx`).
- Gọi tới: `LandingHeader`, `LandingFooter`, `ContractSigningWizard`, các hàm format trong `src/features/landing/utils/landing-utils.ts`.
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/landing/components/__tests__/landing-hero.test.tsx src/features/packages/components/__tests__/package-card.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (nền tảng CSS `Poppins`).
- Cung cấp đầu ra cho: Task 6 (đảm bảo toàn bộ 7 màn hình Nhóm 1 hoàn toàn sạch bóng `font-mono` và `font-black`/`font-extrabold`).

- [x] **Bước 1 [RED]: Viết test xác nhận các màn hình Nhóm 1 dùng `tabular-nums` thay vì `font-mono` và dùng `font-bold` thay vì `font-black`/`font-extrabold`**
  Vị trí file test: `src/features/landing/components/__tests__/landing-components.test.tsx` và `src/features/packages/components/__tests__/packages-catalog.test.tsx`
  Test case:
  1. Trong `landing-components.test.tsx`: Kiểm tra khi render `LandingStats`, `LandingPackages`, `LandingProcess`, `LandingDoctors`, không có phần tử nào mang class `font-mono`, và các số liệu/giá gói mang class `tabular-nums`.
  2. Trong `packages-catalog.test.tsx`: Kiểm tra DOM của `PackagesCatalogView` cùng mã nguồn của `PackageDetailView`, `DoctorDetailView`, `DoctorMatchingWizard`, `ContactView` không chứa class `font-mono`, `font-black`, `font-extrabold`.
  Kỳ vọng: chạy `npm test -- src/features/landing/components/__tests__/landing-components.test.tsx src/features/packages/components/__tests__/packages-catalog.test.tsx` → FAIL với lý do các component đang chứa `font-mono`, `font-black`, `font-extrabold`.
- [x] **Bước 2 [GREEN]: Thay `font-mono` bằng `tabular-nums` và đổi `font-black`/`font-extrabold` sang `font-bold` trên 9 files Nhóm 1**
  1. Đổi toàn bộ `font-mono` thành `tabular-nums` tại:
     - `src/features/landing/components/landing-stats.tsx` (dòng 114, 127, 140, 153, 166)
     - `src/features/landing/components/landing-packages.tsx` (dòng 146)
     - `src/features/landing/components/landing-process.tsx` (dòng 70)
     - `src/features/landing/components/landing-doctors.tsx` (dòng 172, 244)
     - `src/features/packages/components/packages-catalog-view.tsx` (dòng 432, 542, 627)
     - `src/features/packages/components/package-detail-view.tsx` (dòng 437, 500, 601)
     - `src/features/doctors/components/doctor-detail-view.tsx` (dòng 487, 495, 504, 675, 676, 763, 881)
     - `src/features/contact/components/contact-view.tsx` (dòng 242, 433)
  2. Đổi `font-extrabold` / `font-black` thành `font-bold` tại `src/features/doctors/components/doctor-matching-wizard.tsx` (dòng 137, 463, 489, 492).
  Kỳ vọng: chạy `npm test -- src/features/landing/components/__tests__/landing-components.test.tsx src/features/packages/components/__tests__/packages-catalog.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Không cần refactor thêm**
  Kỳ vọng: chạy `npm test -- src/features/landing/components/__tests__/landing-components.test.tsx src/features/packages/components/__tests__/packages-catalog.test.tsx` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/landing/components/__tests__/landing-components.test.tsx src/features/packages/components/__tests__/packages-catalog.test.tsx src/features/landing/components/__tests__/landing-hero.test.tsx src/features/packages/components/__tests__/package-card.test.tsx`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Chuẩn hóa Typography Nhóm 3 — Cổng Hộ Gia Đình & Wizard Ký Hợp Đồng (6 files)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/features/family-dashboard/components/__tests__/family-typography.test.tsx`
- Chỉnh sửa:
  - `src/features/family-dashboard/components/family-dashboard-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.family-dashboard.components.family-dashboard-view.FamilyDashboardView`, dòng 195, 288, 329, 341, 353, 365, 394, 583, 596, 615)
  - `src/features/family-members/components/family-members-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.family-members.components.family-members-view.FamilyMembersView`, dòng 293, 420)
  - `src/features/appointments/components/family-appointments-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.appointments.components.family-appointments-view.FamilyAppointmentsView`, dòng 318, 724)
  - `src/features/billing/components/family-billing-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.billing.components.family-billing-view.FamilyBillingView`, dòng 189, 219, 288, 350)
  - `src/features/subscription-contract/components/subscription-contract-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.subscription-contract.components.subscription-contract-view.SubscriptionContractView`, dòng 70, 88, 270)
  - `src/features/subscription-contract/components/contract-signing-wizard.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.subscription-contract.components.contract-signing-wizard.ContractSigningWizard`, dòng 97, 380, 390, 433, 483)
- Test tương ứng: `src/features/family-dashboard/components/__tests__/family-typography.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/family-dashboard/components/__tests__/family-typography.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `FamilyPage` (`/family`), `FamilyMembersPage` (`/family/members`), `FamilyAppointmentsPage` (`/family/appointments`), `FamilyBillingPage` (`/family/billing`), `FamilySubscriptionPage` (`/family/subscription`), `PackageDetailView` và `DoctorMatchingWizard` (gọi `ContractSigningWizard`).
- Gọi tới: `ContractSigningWizard` (từ `SubscriptionContractView`).
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/family-dashboard/schemas/__tests__/family.schema.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (nền tảng CSS `Poppins`).
- Cung cấp đầu ra cho: Task 6 (hoàn tất chuẩn hóa toàn bộ phân hệ Hộ Gia Đình).

- [x] **Bước 1 [RED]: Viết test kiểm tra đồng bộ phông chữ chuẩn Nhóm 1 trên 6 view của Cổng Hộ Gia Đình**
  Vị trí file test: `src/features/family-dashboard/components/__tests__/family-typography.test.tsx`
  Test case:
  1. Render `<FamilyDashboardView />`, kiểm tra 4 thẻ chỉ số sinh tồn (Huyết áp, SpO2, Nhịp tim, Đường huyết) sử dụng `font-bold tabular-nums` và không có phần tử nào chứa `font-mono`, `font-black` hay `font-extrabold`.
  2. Kiểm tra mã nguồn của `FamilyMembersView`, `FamilyAppointmentsView`, `FamilyBillingView`, `SubscriptionContractView` và `ContractSigningWizard` không chứa `font-mono`, `font-black`, `font-extrabold`.
  Kỳ vọng: chạy `npm test -- src/features/family-dashboard/components/__tests__/family-typography.test.tsx` → FAIL với lý do tìm thấy `font-mono`, `font-black`, `font-extrabold` trong các view trên.
- [x] **Bước 2 [GREEN]: Chuẩn hóa class Typography trên 6 files thuộc Cổng Hộ Gia Đình & `ContractSigningWizard`**
  1. Tại `src/features/family-dashboard/components/family-dashboard-view.tsx`: Đổi `font-black` / `font-extrabold` (dòng 195, 329, 341, 353, 365, 394) thành `font-bold`; đổi `font-mono` (dòng 288, 329, 341, 353, 365, 583, 596, 615) thành `tabular-nums`.
  2. Tại `src/features/family-members/components/family-members-view.tsx` (dòng 293, 420), `src/features/appointments/components/family-appointments-view.tsx` (dòng 318, 724), `src/features/billing/components/family-billing-view.tsx` (dòng 189, 219, 288, 350): Đổi `font-mono` thành `tabular-nums`.
  3. Tại `src/features/subscription-contract/components/subscription-contract-view.tsx`: Đổi `font-extrabold` (dòng 70) thành `font-bold`; đổi `font-mono` (dòng 88, 270) thành `tabular-nums`.
  4. Tại `src/features/subscription-contract/components/contract-signing-wizard.tsx`: Đổi `font-mono` ở dòng 97, 380 (họ tên người ký), 390, 433, 483 thành `tabular-nums`.
  Kỳ vọng: chạy `npm test -- src/features/family-dashboard/components/__tests__/family-typography.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Không cần refactor thêm**
  Kỳ vọng: chạy `npm test -- src/features/family-dashboard/components/__tests__/family-typography.test.tsx` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/family-dashboard/components/__tests__/family-typography.test.tsx src/features/family-dashboard/schemas/__tests__/family.schema.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 5: Chuẩn hóa Typography Nhóm 4 & Nhóm 5 — Cổng Bác Sĩ & Cổng Cơ Sở Y Tế (9 files)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Chỉnh sửa:
  - `src/features/doctor-dashboard/components/doctor-dashboard-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-dashboard.components.doctor-dashboard-view.DoctorDashboardView`, dòng 152, 181, 329, 368, 485, 493)
  - `src/features/doctor-encounters/components/doctor-encounters-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-encounters.components.doctor-encounters-view.DoctorEncountersView`, dòng 353, 420)
  - `src/features/doctor-telemedicine/components/doctor-telemedicine-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-telemedicine.components.doctor-telemedicine-view.DoctorTelemedicineView`, dòng 69, 80)
  - `src/features/doctor-timetable/components/doctor-timetable-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-timetable.components.doctor-timetable-view.DoctorTimetableView`, dòng 110, 133, 211)
  - `src/features/doctor-verification/components/doctor-verification-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-verification.components.doctor-verification-view.DoctorVerificationView`, dòng 117)
  - `src/features/facility-dashboard/components/facility-dashboard-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.facility-dashboard.components.facility-dashboard-view.FacilityDashboardView`, dòng 106, 146, 186, 313)
  - `src/features/facility-staff/components/facility-staff-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.facility-staff.components.facility-staff-view.FacilityStaffView`, dòng 248, 364)
  - `src/features/facility-coordination/components/facility-coordination-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.facility-coordination.components.facility-coordination-view.FacilityCoordinationView`, dòng 233, 319)
  - `src/features/facility-revenue/components/facility-revenue-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.facility-revenue.components.facility-revenue-view.FacilityRevenueView`, dòng 139, 194, 292, 306)
- Test tương ứng: `src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `DoctorPage` (`/doctor`), `DoctorEncountersPage` (`/doctor/encounters`), `DoctorTelemedicinePage` (`/doctor/telemedicine`), `DoctorTimetablePage` (`/doctor/timetable`), `DoctorVerificationPage` (`/doctor/verification`), `FacilityPage` (`/facility`), `FacilityStaffPage` (`/facility/staff`), `FacilityCoordinationPage` (`/facility/coordination`), `FacilityRevenuePage` (`/facility/revenue`).
- Gọi tới: Không có phụ thuộc sang feature khác.
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/doctor-dashboard/schemas/__tests__/doctor.schema.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (nền tảng CSS `Poppins`).
- Cung cấp đầu ra cho: Task 6 (hoàn tất chuẩn hóa phân hệ Bác Sĩ và Cơ Sở Y Tế).

- [x] **Bước 1 [RED]: Mở rộng test tại `src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx` để kiểm tra đồng bộ Typography trên 9 files Bác Sĩ & Cơ Sở Y Tế**
  Vị trí file test: `src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx`
  Test case:
  1. Render `<DoctorDashboardView />`, kiểm tra DOM không có phần tử nào chứa `font-mono` hoặc `font-extrabold`.
  2. Kiểm tra mã nguồn của toàn bộ 9 files thuộc Cổng Bác Sĩ (5 files) và Cổng Cơ Sở Y Tế (4 files) không chứa `font-mono`, `font-black`, `font-extrabold`.
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx` → FAIL với lý do phát hiện `font-mono`, `font-black`, `font-extrabold` trong 9 files trên.
- [x] **Bước 2 [GREEN]: Chuẩn hóa class Typography trên 9 files thuộc Cổng Bác Sĩ & Cổng Cơ Sở Y Tế**
  1. Đổi `font-extrabold` / `font-black` thành `font-bold` tại:
     - `src/features/doctor-dashboard/components/doctor-dashboard-view.tsx` (dòng 152, 181)
     - `src/features/doctor-timetable/components/doctor-timetable-view.tsx` (dòng 110, 133)
     - `src/features/facility-dashboard/components/facility-dashboard-view.tsx` (dòng 146)
  2. Đổi toàn bộ `font-mono` thành `tabular-nums` tại:
     - `src/features/doctor-dashboard/components/doctor-dashboard-view.tsx` (dòng 152, 329, 368, 485, 493)
     - `src/features/doctor-encounters/components/doctor-encounters-view.tsx` (dòng 353, 420)
     - `src/features/doctor-telemedicine/components/doctor-telemedicine-view.tsx` (dòng 69, 80)
     - `src/features/doctor-timetable/components/doctor-timetable-view.tsx` (dòng 211)
     - `src/features/doctor-verification/components/doctor-verification-view.tsx` (dòng 117)
     - `src/features/facility-dashboard/components/facility-dashboard-view.tsx` (dòng 106, 186, 313)
     - `src/features/facility-staff/components/facility-staff-view.tsx` (dòng 248, 364)
     - `src/features/facility-coordination/components/facility-coordination-view.tsx` (dòng 233, 319)
     - `src/features/facility-revenue/components/facility-revenue-view.tsx` (dòng 139, 194, 292, 306)
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Không cần refactor thêm**
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx` → vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx src/features/doctor-dashboard/schemas/__tests__/doctor.schema.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 6: Chuẩn hóa Typography Nhóm 6 & Nhóm 7 — Cổng Admin & Màn hình Dùng chung (7 files) và khóa cổng chặn kiểm thử toàn cục

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Chỉnh sửa:
  - `src/features/admin-dashboard/components/admin-dashboard-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.admin-dashboard.components.admin-dashboard-view.AdminDashboardView`, dòng 133, 177, 313, 345, 426)
  - `src/features/admin-users/components/admin-users-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.admin-users.components.admin-users-view.AdminUsersView`, dòng 265, 375, 376, 377, 382)
  - `src/features/admin-packages/components/admin-packages-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.admin-packages.components.admin-packages-view.AdminPackagesView`, dòng 263, 401, 412, 423)
  - `src/features/admin-contracts/components/admin-contracts-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.admin-contracts.components.admin-contracts-view.AdminContractsView`, dòng 187, 255)
  - `src/features/admin-disputes/components/admin-disputes-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.admin-disputes.components.admin-disputes-view.AdminDisputesView`, dòng 151)
  - `src/features/notifications/components/notifications-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.notifications.components.notifications-view.NotificationsView`, dòng 126, 257, 278, 288)
  - `src/features/account-settings/components/account-settings-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.account-settings.components.account-settings-view.AccountSettingsView`, dòng 75, 343)
- Test tương ứng:
  - `src/features/notifications/components/__tests__/notifications-view.test.tsx`
  - `src/features/account-settings/components/__tests__/settings-view.test.tsx`
  - `src/lib/__tests__/typography-foundation-spec.test.ts`
- Kiểm chứng bằng: `npm test`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `AdminPage` (`/admin`), `AdminUsersPage` (`/admin/users`), `AdminPackagesPage` (`/admin/packages`), `AdminContractsPage` (`/admin/contracts`), `AdminDisputesPage` (`/admin/disputes`), `NotificationsPage` (`/notifications`), `SettingsPage` (`/settings`).
- Gọi tới: `settingsSchema` (từ `AccountSettingsView`).
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/account-settings/schemas/__tests__/settings.schema.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1, Task 2, Task 3, Task 4, Task 5.
- Cung cấp đầu ra cho: Toàn bộ hệ thống 32 màn hình đạt trạng thái đồng nhất 100% phông chữ chuẩn Nhóm 1.

- [x] **Bước 1 [RED]: Viết test quét toàn bộ cây thư mục `src/` để phát hiện bất kỳ xung đột phông chữ nào còn sót lại**
  Vị trí file test: `src/lib/__tests__/typography-foundation-spec.test.ts`, `src/features/notifications/components/__tests__/notifications-view.test.tsx`, `src/features/account-settings/components/__tests__/settings-view.test.tsx`
  Test case:
  1. Trong `typography-foundation-spec.test.ts`: Duyệt đệ quy toàn bộ các file `.tsx` trong `src/app/`, `src/components/`, `src/features/` (trừ thư mục `__tests__`), khẳng định KHÔNG có file nào chứa:
     - Class `font-mono` (`/\bfont-mono\b/`)
     - Class `font-black` hoặc `font-extrabold` (`/\bfont-(black|extrabold)\b/`)
     - Các "class ma" (`/\b(font|text)-(headline|body|label)-(lg|md|sm)\b/`)
  2. Trong `notifications-view.test.tsx` và `settings-view.test.tsx`: Kiểm tra DOM khi render `<NotificationsView />` và `<AccountSettingsView />` dùng `tabular-nums` và không chứa `font-mono` hay `font-extrabold`.
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/typography-foundation-spec.test.ts src/features/notifications/components/__tests__/notifications-view.test.tsx src/features/account-settings/components/__tests__/settings-view.test.tsx` → FAIL với lý do 7 files thuộc Nhóm 6 & Nhóm 7 vẫn còn chứa `font-mono` và `font-extrabold`.
- [x] **Bước 2 [GREEN]: Chuẩn hóa class Typography trên 7 files thuộc Cổng Admin, Thông báo & Cài đặt tài khoản**
  1. Đổi `font-extrabold` thành `font-bold` tại:
     - `src/features/admin-dashboard/components/admin-dashboard-view.tsx` (dòng 133, 177)
     - `src/features/notifications/components/notifications-view.tsx` (dòng 126, 257)
  2. Đổi toàn bộ `font-mono` thành `tabular-nums` tại:
     - `src/features/admin-dashboard/components/admin-dashboard-view.tsx` (dòng 313, 345, 426)
     - `src/features/admin-users/components/admin-users-view.tsx` (dòng 265, 375, 376, 377, 382)
     - `src/features/admin-packages/components/admin-packages-view.tsx` (dòng 263, 401, 412, 423)
     - `src/features/admin-contracts/components/admin-contracts-view.tsx` (dòng 187, 255)
     - `src/features/admin-disputes/components/admin-disputes-view.tsx` (dòng 151)
     - `src/features/notifications/components/notifications-view.tsx` (dòng 278, 288)
     - `src/features/account-settings/components/account-settings-view.tsx` (dòng 75, 343)
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/typography-foundation-spec.test.ts src/features/notifications/components/__tests__/notifications-view.test.tsx src/features/account-settings/components/__tests__/settings-view.test.tsx` → PASS.
- [x] **Bước 3 [REFACTOR]: Không cần refactor thêm**
  Kỳ vọng: chạy `npm test` → toàn bộ test suite vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test suite của dự án (`npm test`)
  Kết quả mong đợi: tất cả test files đều PASS 100%, không còn bất kỳ xung đột phông chữ nào trên toàn bộ 32 màn hình.
