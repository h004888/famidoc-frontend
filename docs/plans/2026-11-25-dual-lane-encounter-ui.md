# Triển khai Giao diện Luồng Ca khám 2 Làn Song Song (Gia đình ↔ Bác sĩ ↔ Đối soát) — Kế hoạch triển khai

**Mục tiêu:** Xây dựng và nâng cấp trọn bộ 9 màn hình giao diện (F1–F4, D1–D4, O1) trong `famidoc-frontend` khớp chính xác với bộ ASCII mockup và luồng Ca khám 2 làn song song (tự động Active theo lịch, không check-in/di chuyển, Gia đình xác nhận & đánh giá độc lập, Bác sĩ thao tác 4 bước trong Visit Workspace có Lưu nháp / Chốt hồ sơ + EHR Sync + Đơn thuốc điện tử, Vận hành đối soát `PENDING_RECORD` / `NO_SHOW` / `DISPUTED`).

**Cách tiếp cận:** Bắt đầu từ lớp domain pure logic (`encounter-dual-lane.ts`) tính toán trạng thái 2 làn, bộ đếm hạn 24h và Stepper 3 bước để toàn bộ UI dùng chung một nguồn sự thật. Sau đó triển khai lần lượt theo từng làn: Làn Gia đình (F3a/F3b → F1 → F2/F4) với ngôn ngữ đời thường và quy tắc "1 hộp việc chính tại 1 thời điểm", Làn Bác sĩ (D1/D2 → D3 Visit Workspace 4 bước → D4 Hủy & Lập đơn thay thế), và cuối cùng là Làn Đối soát Vận hành (O1). Mọi task tuân thủ nghiêm chu trình TDD Red → Green → Refactor.

**Đã tra cứu codebase (`codebase-memory-mcp`):**
- `list_projects` & `get_architecture` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend`): dự án dùng Next.js App Router (`src/app/(dashboard)/`), tổ chức theo feature modules (`src/features/*`), UI primitives shadcn/Radix (`src/components/ui/*`), API clients (`src/lib/api/*`).
- `search_graph` & `get_code_snippet`: xác nhận chính xác các file/symbol hiện có:
  - `src/lib/api/encounters.api.ts`: `EncounterStatus` (hiện có `CONFIRMED`, `ON_THE_WAY`, `ARRIVED`, `IN_PROGRESS`, `WRAP_UP`, `COMPLETED`, `NO_SHOW`), `EncounterItem` (đã có `familyConfirmedArrivalAt`, `clinicalEmrs`, `participants`, `contract`), `encountersApi.confirmArrival`, `encountersApi.remindWrapUp`, `encountersApi.getDoctorTimetable`, `encountersApi.getFamilyTimetable`, `encountersApi.getEncounterDetail`, `encountersApi.getFacilityScheduleBoard`.
  - `src/lib/api/reviews.api.ts`: `reviewsApi.submitDoctorReview`, `reviewsApi.submitComplaint`, `reviewsApi.listComplaints`.
  - `src/lib/api/medical-books.api.ts`: `medicalBooksApi.visit`, `medicalBooksApi.confirm`.
  - `src/lib/api/patients.api.ts`: `patientsApi.addMemberVitalSign`, `patientsApi.addMemberAllergy`, `patientsApi.updateFamilyMember`.
  - `src/features/doctor-encounters/components/doctor-encounters-view.tsx`: `DoctorEncountersView` hiện render `DoctorBookVisitView` khi có `encounterId` và `MedicalBookView` khi không có.
  - `src/features/doctor-encounters/components/prescription-form.tsx`: `PrescriptionForm` đã hỗ trợ `includePrescription`, `isReplacement`, `replacementReason`.
- `trace_path`: xác nhận inbound/outbound của các view mục tiêu:
  - `AdminDisputesView` có 2 inbound callers là `FacilityCoordinationView` (`src/features/facility-coordination/components/facility-coordination-view.tsx`) và `FacilityComplaintsPage` (`src/app/(dashboard)/facility/complaints/page.tsx`).
  - `PrescriptionForm` có 3 inbound callers trong `src/features/prescriptions/components/medical-book-view.tsx` (`VisitPage`, `VisitPages`, `DoctorBookVisitView`).
  - `FamilyPrescriptionDetailView` có 2 inbound callers trong `src/app/(dashboard)/family/prescriptions/[id]/page.tsx` (`PrescriptionDetailContent`, `FamilyPrescriptionDetailPage`).
  - `FamilyDashboardView`, `FamilyAppointmentsView`, `FamilyFeedbackView`, `DoctorDashboardView`, `DoctorTimetableView`, `DoctorEncountersView`, `FacilityCoordinationView` đều là page-level view (`inbound=0` trong graph call).

**Framework test & quy ước (đã xác nhận qua `vitest.config.ts`, `package.json` và `search_graph`):**
- Framework: Vitest `^5.0.5` + `@testing-library/react` `^16.3.3` + `@testing-library/user-event` `^14.6.8` + `jsdom` (setup tại `src/test/setup.ts`).
- Vị trí đặt file test: thư mục `__tests__/` nằm cùng cấp với module/components, hậu tố `.test.ts` hoặc `.test.tsx` (pattern trong `vitest.config.ts`: `src/**/__tests__/**/*.test.{ts,tsx}`).
- Lệnh chạy test (chạy trong thư mục `famidoc-frontend`): `npm test -- <path-to-test-file>` hoặc toàn bộ bằng `npm test`.

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Phía Gia đình tuyệt đối không hiển thị thuật ngữ kỹ thuật nội bộ (`ACTIVE`, `PENDING_RECORD`, `DISPUTED`, `EHR Sync`, `ON_THE_WAY`, `ARRIVED`) — luôn hiển thị nhãn tiếng Việt đời thường, rõ bước, dễ hiểu cho người lớn tuổi.
- Phía Bác sĩ không hiển thị bất kỳ nút thao tác check-in / di chuyển thủ công nào (`markOnTheWay`, `markArrived`); ca khám tự động Active theo lịch.
- Giữ nguyên tương thích ngược cho các props của `AdminDisputesView` và `PrescriptionForm` vì có nhiều inbound callers đã xác nhận qua `trace_path`.
- Giả định cấu hình mặc định: cửa sổ Active bắt đầu từ 00:00 ngày khám (hoặc trước giờ hẹn 60 phút), nút xác nhận Gia đình mở từ đúng thời điểm bắt đầu khung giờ khám (`scheduledDate + scheduledTime`), thời hạn bác sĩ hoàn tất EHR là 24 giờ sau giờ kết thúc ca khám, thời hạn tự đóng nếu gia đình quên xác nhận là 48 giờ.

---

### Task 1: Xây dựng module logic trạng thái Ca khám 2 làn & Stepper dùng chung

**Đối tượng liên quan (đã xác nhận qua `codebase-memory-mcp`):**
- Tạo mới: `src/lib/encounter-dual-lane.ts`
- Chỉnh sửa: `src/lib/api/encounters.api.ts` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.lib.api.encounters.api.EncounterStatus`)
- Test tương ứng: `src/lib/__tests__/encounter-dual-lane.test.ts`
- Kiểm chứng bằng: `npm test -- src/lib/__tests__/encounter-dual-lane.test.ts`

**Ảnh hưởng liên quan (từ `trace_path`):**
- Được gọi bởi: chưa có (module tạo mới); `EncounterStatus` chỉ bổ sung union member `'PENDING_RECORD' | 'DISPUTED'` nên tương thích ngược hoàn toàn.
- Gọi tới: kiểu `EncounterItem`, `EncounterStatus` từ `src/lib/api/encounters.api.ts`.
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/lib/api/__tests__/api-clients.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: dữ liệu `EncounterItem` từ `encountersApi`.
- Cung cấp đầu ra cho: Task 2, Task 3, Task 4, Task 5, Task 6, Task 8 (dùng `deriveDualLaneState`, `canFamilyConfirmAttendance`, `getFamilyVisitStepper`, `formatRemainingRecordDeadline`).

- [ ] **Bước 1 [RED]: Viết unit test cho `isEncounterActiveToday` và `canFamilyConfirmAttendance`**
  Vị trí file test: `src/lib/__tests__/encounter-dual-lane.test.ts`
  Test case:
  1. Ca khám `CONFIRMED` ngày `2026-11-25` lúc `14:00`: tại `09:00` cùng ngày → `isEncounterActiveToday` trả `true`, nhưng `canFamilyConfirmAttendance` trả `false` (chưa đến giờ hẹn).
  2. Cùng ca khám tại `14:00` và `15:30` cùng ngày → cả `isEncounterActiveToday` và `canFamilyConfirmAttendance` đều trả `true`.
  3. Ca khám đã có `familyConfirmedArrivalAt` khác null hoặc `encounterStatus === 'NO_SHOW'` → `canFamilyConfirmAttendance` trả `false`.
  4. Ca khám ngày mai (`2026-11-26`) tại `2026-11-25 14:00` → cả hai hàm trả `false`.
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/encounter-dual-lane.test.ts` → FAIL với lỗi module `src/lib/encounter-dual-lane` chưa tồn tại hoặc hàm chưa export.

- [ ] **Bước 2 [GREEN]: Triển khai `isEncounterActiveToday`, `canFamilyConfirmAttendance` và mở rộng `EncounterStatus`**
  Cập nhật `EncounterStatus` trong `src/lib/api/encounters.api.ts` thêm `'PENDING_RECORD' | 'DISPUTED'`, và tạo `src/lib/encounter-dual-lane.ts` triển khai tối thiểu 2 hàm trên.
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/encounter-dual-lane.test.ts` → PASS.

- [ ] **Bước 3 [RED]: Viết unit test cho `deriveDualLaneState` (đủ 4 quy tắc đối soát) và `getFamilyVisitStepper`**
  Vị trí file test: `src/lib/__tests__/encounter-dual-lane.test.ts`
  Test case:
  1. Gia đình đã xác nhận (`familyConfirmedArrivalAt != null`) + Bác sĩ đã chốt ít nhất 1 `clinicalEmrs` (`isFinalized: true`) → `reconciledStatus: 'COMPLETED'`, nhãn Gia đình `"Hoàn tất • Đã có kết quả"`.
  2. Gia đình đã xác nhận + Bác sĩ chưa chốt phiếu nào (`clinicalEmrs` rỗng hoặc toàn `isFinalized: false`) → `reconciledStatus: 'PENDING_RECORD'`, tính đúng `remainingRecordHours` trong khung 24h sau giờ kết thúc ca, nhãn Gia đình `"Chờ bác sĩ gửi hồ sơ"`.
  3. Gia đình chưa xác nhận quá 48h sau ca khám + Bác sĩ đã chốt ít nhất 1 phiếu → `reconciledStatus: 'COMPLETED'`, `autoClosedByTimeout: true`.
  4. Gia đình báo không đến (`encounterStatus === 'NO_SHOW'` hoặc `'DISPUTED'` hoặc có flag `hasNoShowDispute: true`) bất kể bác sĩ đã nhập hay chưa → `reconciledStatus: 'DISPUTED'`, `allowReview: false`, `autoCloseLocked: true`, nhãn Gia đình `"Đang kiểm tra sự cố"`.
  5. `getFamilyVisitStepper` trả đúng 3 bước (`Đã chốt lịch`, `Khám hôm nay`, `Kết quả khám`) với trạng thái `done | current | upcoming` cho từng trạng thái trên.
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/encounter-dual-lane.test.ts` → FAIL vì `deriveDualLaneState` và `getFamilyVisitStepper` chưa được triển khai.

- [ ] **Bước 4 [GREEN]: Triển khai `deriveDualLaneState` và `getFamilyVisitStepper` tại `src/lib/encounter-dual-lane.ts`**
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/encounter-dual-lane.test.ts` → PASS.

- [ ] **Bước 5 [REFACTOR]: Tách hằng số thời gian (`RECORD_DEADLINE_HOURS = 24`, `AUTO_CLOSE_HOURS = 48`) và helper parse ngày giờ VN**
  Mục đích: tránh hardcode rải rác và đảm bảo xử lý nhất quán ngày/giờ Việt Nam.
  Kỳ vọng: chạy `npm test -- src/lib/__tests__/encounter-dual-lane.test.ts` → vẫn PASS.

- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/lib/__tests__/encounter-dual-lane.test.ts src/lib/api/__tests__/api-clients.test.ts`
  Kết quả mong đợi: tất cả test PASS, không lỗi TypeScript.

---

### Task 2: Xây dựng Modal Xác nhận 2 nhánh cho Gia đình — F3a (Đã đến + Đánh giá) & F3b (Không đến + Báo sự cố)

**Đối tượng liên quan (đã xác nhận qua `codebase-memory-mcp`):**
- Tạo mới: `src/features/appointments/components/family-visit-confirm-modal.tsx`
- Chỉnh sửa: không có
- Test tương ứng: `src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx`

**Ảnh hưởng liên quan (từ `trace_path`):**
- Được gọi bởi: chưa có (sẽ được dùng ở Task 3 `FamilyTodayVisitCard` và Task 4 `FamilyAppointmentsView`).
- Gọi tới: `encountersApi.confirmArrival` (`src/lib/api/encounters.api.ts`), `reviewsApi.submitDoctorReview`, `reviewsApi.submitComplaint` (`src/lib/api/reviews.api.ts`), shadcn `Dialog` (`src/components/ui/dialog.tsx`).
- Regression test cần chạy thêm do có inbound calls: không cần.

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: props `{ open, mode: 'ARRIVED' | 'NO_SHOW', encounter: EncounterItem, onClose, onCompleted }` từ Task 3 và Task 4.
- Cung cấp đầu ra cho: callback `onCompleted({ action: 'ARRIVED' | 'NO_SHOW', reviewed?: boolean })` để cha reload danh sách ca khám.

- [ ] **Bước 1 [RED]: Viết test cho nhánh F3a (`mode="ARRIVED"`) — xác nhận có đến & đánh giá bác sĩ**
  Vị trí file test: `src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx`
  Test case:
  1. Khi mở với `mode="ARRIVED"`, hiển thị rõ tiến trình `Bước 1/2: Xác nhận` và `Bước 2/2: Đánh giá buổi khám`, 5 nút chọn sao (1–5) và ô nhận xét không bắt buộc.
  2. Khi người dùng chọn 4 sao, nhập nhận xét và bấm `"Gửi đánh giá"` → gọi `encountersApi.confirmArrival(encounter.id)` và `reviewsApi.submitDoctorReview({ doctorId, rating: 4, comment })`, sau đó gọi `onCompleted({ action: 'ARRIVED', reviewed: true })`.
  3. Khi người dùng bấm `"Để sau, đóng lại"` → chỉ gọi `encountersApi.confirmArrival(encounter.id)`, KHÔNG gọi `submitDoctorReview`, và gọi `onCompleted({ action: 'ARRIVED', reviewed: false })`.
  Kỳ vọng: chạy `npm test -- src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx` → FAIL vì component `FamilyVisitConfirmModal` chưa tồn tại.

- [ ] **Bước 2 [GREEN]: Triển khai nhánh `mode="ARRIVED"` trong `src/features/appointments/components/family-visit-confirm-modal.tsx`**
  Kỳ vọng: chạy `npm test -- src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx` → PASS.

- [ ] **Bước 3 [RED]: Viết test cho nhánh F3b (`mode="NO_SHOW"`) — báo sự cố bác sĩ không đến & tắt form đánh giá**
  Vị trí file test: `src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx`
  Test case:
  1. Khi mở với `mode="NO_SHOW"`, KHÔNG hiển thị bộ chọn sao đánh giá; hiển thị cảnh báo ca khám sẽ tạm khóa để Vận hành xác minh và 3 tùy chọn tình huống (radio).
  2. Khi chọn tình huống `"Đã quá giờ hẹn, bác sĩ không đến"`, nhập chi tiết và bấm `"Gửi báo cáo sự cố"` → gọi `reviewsApi.submitComplaint({ contractId, encounterId, category: 'NO_SHOW', description })`, KHÔNG gọi `confirmArrival` hay `submitDoctorReview`, rồi gọi `onCompleted({ action: 'NO_SHOW' })`.
  3. Khi API trả lỗi → hiển thị thông báo lỗi rõ ràng bằng tiếng Việt và không đóng modal.
  Kỳ vọng: chạy `npm test -- src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx` → FAIL vì nhánh `NO_SHOW` chưa được xử lý.

- [ ] **Bước 4 [GREEN]: Triển khai nhánh `mode="NO_SHOW"` trong `src/features/appointments/components/family-visit-confirm-modal.tsx`**
  Kỳ vọng: chạy `npm test -- src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx` → PASS.

- [ ] **Bước 5 [REFACTOR]: Không cần refactor bổ sung (component gọn dưới 200 dòng, tách rõ 2 nhánh render)**

- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx`
  Kết quả mong đợi: tất cả test PASS.

---

### Task 3: Nâng cấp Trang chủ Gia đình — F1 (`FamilyDashboardView` + `FamilyTodayVisitCard`)

**Đối tượng liên quan (đã xác nhận qua `codebase-memory-mcp`):**
- Tạo mới: `src/features/family-dashboard/components/family-today-visit-card.tsx`
- Chỉnh sửa: `src/features/family-dashboard/components/family-dashboard-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.family-dashboard.components.family-dashboard-view.FamilyDashboardView`)
- Test tương ứng: `src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx`

**Ảnh hưởng liên quan (từ `trace_path`):**
- Được gọi bởi: `FamilyDashboardView` có `inbound=0` (được render trực tiếp bởi `src/app/(dashboard)/family/page.tsx`).
- Gọi tới: `deriveDualLaneState`, `canFamilyConfirmAttendance`, `getFamilyVisitStepper` (Task 1), `FamilyVisitConfirmModal` (Task 2), `encountersApi.getFamilyTimetable` (`src/lib/api/encounters.api.ts`).
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/family-dashboard/components/__tests__/family-typography.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (`encounter-dual-lane.ts`), Task 2 (`FamilyVisitConfirmModal`).
- Cung cấp đầu ra cho: điều hướng trực tiếp sang F4 (`/family/prescriptions` hoặc `/family/members/[id]`) khi bác sĩ đã chốt hồ sơ.

- [ ] **Bước 1 [RED]: Viết test cho 3 trạng thái hiển thị của `FamilyTodayVisitCard` (mockup F1)**
  Vị trí file test: `src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx`
  Test case:
  1. **Trạng thái 1 (Trước giờ hẹn, VD 09:00 cho lịch 14:00):** hiển thị thanh tiến trình 3 bước (`Đã chốt lịch → Khám hôm nay → Kết quả khám`), thông báo *"Gia đình chưa cần thao tác gì lúc này. Nút xác nhận sẽ tự động hiện ra từ lúc 14:00"*, và KHÔNG hiển thị 2 nút xác nhận.
  2. **Trạng thái 2 (Từ 14:00 trở đi, chưa xác nhận):** hiển thị câu hỏi *"Bác sĩ có đến khám hôm nay không?"* cùng 2 nút `Bác sĩ ĐÃ ĐẾN khám` và `Bác sĩ KHÔNG ĐẾN`; bấm từng nút mở đúng `FamilyVisitConfirmModal` với `mode="ARRIVED"` hoặc `mode="NO_SHOW"`.
  3. **Trạng thái 3a (Đã xác nhận, BS chưa chốt hồ sơ):** hiển thị *"Gia đình đã xác nhận. Đang chờ bác sĩ gửi kết quả"*, KHÔNG hiển thị chuỗi kỹ thuật `PENDING_RECORD`.
  4. **Trạng thái 3b (Đã xác nhận, BS đã chốt hồ sơ):** hiển thị nút liên kết `Xem kết quả khám & Đơn thuốc` trỏ tới `/family/prescriptions`.
  Kỳ vọng: chạy `npm test -- src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx` → FAIL vì `FamilyTodayVisitCard` chưa tồn tại.

- [ ] **Bước 2 [GREEN]: Tạo `FamilyTodayVisitCard` tại `src/features/family-dashboard/components/family-today-visit-card.tsx`**
  Kỳ vọng: chạy `npm test -- src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx` → PASS.

- [ ] **Bước 3 [RED]: Viết test kiểm tra `FamilyDashboardView` đặt `FamilyTodayVisitCard` ngay đầu màn hình khi có ca khám hôm nay**
  Vị trí file test: `src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx`
  Test case: khi `encountersApi.getFamilyTimetable` trả về 1 ca khám `CONFIRMED` trong ngày hôm nay, `FamilyDashboardView` hiển thị hộp `"Thăm khám hôm nay"` ở vị trí đầu trang trước danh sách thành viên; nếu không có ca hôm nay thì ẩn hộp này.
  Kỳ vọng: chạy `npm test -- src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx` → FAIL vì `FamilyDashboardView` chưa tích hợp `FamilyTodayVisitCard`.

- [ ] **Bước 4 [GREEN]: Tích hợp `FamilyTodayVisitCard` vào đầu `FamilyDashboardView` (`src/features/family-dashboard/components/family-dashboard-view.tsx`)**
  Kỳ vọng: chạy `npm test -- src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx` → PASS.

- [ ] **Bước 5 [REFACTOR]: Không cần refactor bổ sung.**

- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx src/features/family-dashboard/components/__tests__/family-typography.test.tsx`
  Kết quả mong đợi: tất cả test PASS.

---

### Task 4: Nâng cấp Lịch khám Gia đình — F2 (`FamilyAppointmentsView`) & Kết quả khám/Đơn thuốc — F4 (`FamilyPrescriptionDetailView`)

**Đối tượng liên quan (đã xác nhận qua `codebase-memory-mcp`):**
- Tạo mới: không có
- Chỉnh sửa:
  - `src/features/appointments/components/family-appointments-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.appointments.components.family-appointments-view.FamilyAppointmentsView`)
  - `src/features/prescriptions/components/family-prescriptions-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.prescriptions.components.family-prescriptions-view.FamilyPrescriptionDetailView`)
- Test tương ứng: `src/features/appointments/components/__tests__/family-appointments-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/appointments/components/__tests__/family-appointments-view.test.tsx`

**Ảnh hưởng liên quan (từ `trace_path`):**
- Được gọi bởi: `FamilyAppointmentsView` có `inbound=0`; `FamilyPrescriptionDetailView` có 2 inbound callers trong `src/app/(dashboard)/family/prescriptions/[id]/page.tsx` (`PrescriptionDetailContent`, `FamilyPrescriptionDetailPage`).
- Gọi tới: `deriveDualLaneState`, `canFamilyConfirmAttendance` (Task 1), `FamilyVisitConfirmModal` (Task 2), `encountersApi.getFamilyTimetable`.
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/prescriptions/components/__tests__/prescriptions-flow.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1, Task 2.
- Cung cấp đầu ra cho: người dùng Gia đình theo dõi toàn bộ danh sách ca khám (F2) và xem chi tiết kết quả khám + đơn thuốc đã chốt (F4).

- [ ] **Bước 1 [RED]: Viết test cho `FamilyAppointmentsView` theo bố cục mockup F2**
  Vị trí file test: `src/features/appointments/components/__tests__/family-appointments-view.test.tsx`
  Test case:
  1. Hiển thị 3 tab rõ việc cần làm: `Hôm nay / Cần xác nhận`, `Sắp tới`, `Đã hoàn tất`.
  2. Mỗi thẻ ca khám hiển thị rõ 2 dòng trạng thái `Phía Gia đình` và `Phía Bác sĩ` bằng tiếng Việt đời thường; KHÔNG hiển thị badge/trạng thái di chuyển `Đang di chuyển` hay `Đã đến nơi` từ luồng check-in cũ.
  3. Ca trong tab `Hôm nay / Cần xác nhận` đã đến giờ khám có 2 nút `Bác sĩ ĐÃ ĐẾN` và `Bác sĩ KHÔNG ĐẾN` mở `FamilyVisitConfirmModal`.
  4. Ca đã hoàn tất có nút `Xem kết quả & Đơn thuốc`; ca báo không đến hiển thị nhãn `Đang kiểm tra sự cố`.
  Kỳ vọng: chạy `npm test -- src/features/appointments/components/__tests__/family-appointments-view.test.tsx` → FAIL vì `FamilyAppointmentsView` hiện tại vẫn dùng nhãn trạng thái cũ (`arrived`/`in_progress`) và chưa có cấu trúc 2 phía + 3 tab mới.

- [ ] **Bước 2 [GREEN]: Cập nhật `FamilyAppointmentsView` trong `src/features/appointments/components/family-appointments-view.tsx`**
  Kỳ vọng: chạy `npm test -- src/features/appointments/components/__tests__/family-appointments-view.test.tsx` → PASS.

- [ ] **Bước 3 [RED]: Viết test cho bố cục 3 phần và quy tắc chỉ đọc bản đã chốt trên `FamilyPrescriptionDetailView` (mockup F4)**
  Vị trí file test: `src/features/appointments/components/__tests__/family-appointments-view.test.tsx`
  Test case:
  1. `FamilyPrescriptionDetailView` hiển thị rõ 3 phần tách biệt: `Phần 1: Bác sĩ kết luận & dặn dò`, `Phần 2: Đơn thuốc điện tử` (tên thuốc, liều dùng, số ngày, tổng số lượng, lời dặn chung), và liên kết xem hồ sơ sức khỏe thành viên.
  2. Đơn thuốc có trạng thái `REPLACED` / `CANCELLED` hiển thị rõ nhãn đã bị thay thế và liên kết tới đơn mới thay thế (không gây nhầm uống nhầm đơn cũ).
  Kỳ vọng: chạy `npm test -- src/features/appointments/components/__tests__/family-appointments-view.test.tsx` → FAIL vì `FamilyPrescriptionDetailView` chưa nhóm rõ các tiêu đề phần theo mockup F4.

- [ ] **Bước 4 [GREEN]: Cập nhật cấu trúc hiển thị của `FamilyPrescriptionDetailView` trong `src/features/prescriptions/components/family-prescriptions-view.tsx`**
  Giữ nguyên signature props để không phá vỡ `FamilyPrescriptionDetailPage`.
  Kỳ vọng: chạy `npm test -- src/features/appointments/components/__tests__/family-appointments-view.test.tsx` → PASS.

- [ ] **Bước 5 [REFACTOR]: Không cần refactor bổ sung.**

- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/appointments/components/__tests__/family-appointments-view.test.tsx src/features/prescriptions/components/__tests__/prescriptions-flow.test.tsx`
  Kết quả mong đợi: tất cả test mới và regression test đều PASS.

---

### Task 5: Nâng cấp Bảng lâm sàng Bác sĩ — D1 (`DoctorDashboardView`) & Lịch trực — D2 (`DoctorTimetableView`)

**Đối tượng liên quan (đã xác nhận qua `codebase-memory-mcp`):**
- Tạo mới: `src/features/doctor-timetable/components/__tests__/doctor-timetable-view.test.tsx`
- Chỉnh sửa:
  - `src/features/doctor-dashboard/components/doctor-dashboard-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-dashboard.components.doctor-dashboard-view.DoctorDashboardView`)
  - `src/features/doctor-timetable/components/doctor-timetable-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-timetable.components.doctor-timetable-view.DoctorTimetableView`)
- Test tương ứng:
  - `src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx` (đã tồn tại — cập nhật thêm test case)
  - `src/features/doctor-timetable/components/__tests__/doctor-timetable-view.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx src/features/doctor-timetable/components/__tests__/doctor-timetable-view.test.tsx`

**Ảnh hưởng liên quan (từ `trace_path`):**
- Được gọi bởi: `DoctorDashboardView` (`inbound=0`), `DoctorTimetableView` (`inbound=0`).
- Gọi tới: `deriveDualLaneState`, `isEncounterActiveToday` (Task 1), `encountersApi.getDoctorTimetable`.
- Regression test cần chạy thêm do có inbound calls: không cần (nhưng phải giữ toàn bộ test hiện có trong `doctor-view.test.tsx` PASS).

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (`encounter-dual-lane.ts`).
- Cung cấp đầu ra cho: điều hướng trực tiếp sang Task 6 (`/doctor/encounters?encounterId=<id>`) khi bấm `"Mở Workspace Ca khám"` hoặc `"Tiếp tục hoàn tất hồ sơ"`.

- [ ] **Bước 1 [RED]: Viết test cho `DoctorDashboardView` (mockup D1) — bỏ check-in, thêm khu vực Ca Active & Ca chờ chốt 24h**
  Vị trí file test: `src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx`
  Test case:
  1. Khi có ca khám `CONFIRMED` hôm nay, hiển thị khối `"Ca khám hôm nay"` với trạng thái `Đang diễn ra (ACTIVE)` và 1 nút duy nhất `"Mở Workspace Ca khám"` trỏ tới `/doctor/encounters?encounterId=<id>`.
  2. KHÔNG hiển thị bất kỳ nút nào có chữ `"Đang di chuyển"`, `"Check-in"`, hay `"Đã đến nhà"`.
  3. Khi có ca đã được gia đình xác nhận nhưng chưa chốt đủ phiếu khám (`PENDING_RECORD`), hiển thị khối `"Ca cần bổ sung & chốt hồ sơ"` kèm số giờ còn lại trong hạn 24h và nút `"Tiếp tục hoàn tất hồ sơ"` trỏ tới `/doctor/encounters?encounterId=<id>`.
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx` → FAIL vì `DoctorDashboardView` chưa có 2 khối mới và chưa bỏ hoàn toàn luồng check-in cũ.

- [ ] **Bước 2 [GREEN]: Cập nhật `DoctorDashboardView` trong `src/features/doctor-dashboard/components/doctor-dashboard-view.tsx`**
  Kỳ vọng: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx` → PASS.

- [ ] **Bước 3 [RED]: Viết test cho `DoctorTimetableView` (mockup D2) — hiển thị badge `ACTIVE` / `Chờ EHR` và mở thẳng Workspace**
  Vị trí file test: `src/features/doctor-timetable/components/__tests__/doctor-timetable-view.test.tsx`
  Test case:
  1. Ca khám hôm nay hiển thị badge `ACTIVE` và nút `"Mở ca"` điều hướng tới `/doctor/encounters?encounterId=<id>`.
  2. Ca quá giờ nhưng chưa chốt EHR hiển thị badge `Chờ EHR` kèm số giờ còn lại và link mở thẳng Workspace.
  3. Không hiển thị nút check-in / di chuyển trong chi tiết ca trên lịch tuần.
  Kỳ vọng: chạy `npm test -- src/features/doctor-timetable/components/__tests__/doctor-timetable-view.test.tsx` → FAIL vì `DoctorTimetableView` chưa gắn badge trạng thái 2 làn và link mở thẳng Workspace.

- [ ] **Bước 4 [GREEN]: Cập nhật `DoctorTimetableView` trong `src/features/doctor-timetable/components/doctor-timetable-view.tsx`**
  Kỳ vọng: chạy `npm test -- src/features/doctor-timetable/components/__tests__/doctor-timetable-view.test.tsx` → PASS.

- [ ] **Bước 5 [REFACTOR]: Không cần refactor bổ sung.**

- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx src/features/doctor-timetable/components/__tests__/doctor-timetable-view.test.tsx`
  Kết quả mong đợi: tất cả test PASS.

---

### Task 6: Xây dựng Không gian làm việc Ca khám Bác sĩ 4 bước — D3 (`DoctorVisitWorkspace`)

**Đối tượng liên quan (đã xác nhận qua `codebase-memory-mcp`):**
- Tạo mới: `src/features/doctor-encounters/components/doctor-visit-workspace.tsx`
- Chỉnh sửa: `src/features/doctor-encounters/components/doctor-encounters-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-encounters.components.doctor-encounters-view.DoctorEncountersView`)
- Test tương ứng: `src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx`

**Ảnh hưởng liên quan (từ `trace_path`):**
- Được gọi bởi: `DoctorEncountersView` (`inbound=0`, được render bởi `src/app/(dashboard)/doctor/encounters/page.tsx`).
- Gọi tới: `encountersApi.getEncounterDetail`, `medicalBooksApi.visit`, `medicalBooksApi.confirm`, `patientsApi.addMemberVitalSign`, `patientsApi.addMemberAllergy`, `patientsApi.updateFamilyMember`, `PrescriptionForm`, `deriveDualLaneState` (Task 1).
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/prescriptions/components/__tests__/prescriptions-flow.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: query param `encounterId` từ D1/D2 (Task 5) và `encounter-dual-lane.ts` (Task 1).
- Cung cấp đầu ra cho: Task 7 (tích hợp khối Đơn thuốc tùy chọn & luồng Hủy/Thay thế đơn ngay trong Bước 3 của Workspace).

- [ ] **Bước 1 [RED]: Viết test cho Bước 1 (Checklist chọn nhiều thành viên trong hộ) & Header trạng thái 2 làn của `DoctorVisitWorkspace`**
  Vị trí file test: `src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx`
  Test case:
  1. Khi nạp `encounterId`, hiển thị thanh quy trình 4 bước (`1. Chọn thành viên → 2. Ghi khám & EHR → 3. Đơn thuốc → 4. Chốt`), trạng thái xác nhận từ Làn Gia đình, và đồng hồ đếm ngược hạn chốt 24h.
  2. Cột trái liệt kê toàn bộ thành viên trong hộ gia đình (`encounter.contract.members`), cho phép bác sĩ tích chọn nhiều thành viên thực tế có khám hôm nay, chuyển qua lại giữa các thành viên đã chọn, và hiển thị bộ đếm `Đã chốt X/Y người`.
  Kỳ vọng: chạy `npm test -- src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx` → FAIL vì `DoctorVisitWorkspace` chưa tồn tại.

- [ ] **Bước 2 [GREEN]: Tạo `DoctorVisitWorkspace` với Header + Bước 1 chọn thành viên và nối vào `DoctorEncountersView`**
  Cập nhật `src/features/doctor-encounters/components/doctor-encounters-view.tsx` để khi có `encounterId` sẽ render `DoctorVisitWorkspace` (vẫn giữ `MedicalBookView` khi không có `encounterId`).
  Kỳ vọng: chạy `npm test -- src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx` → PASS.

- [ ] **Bước 3 [RED]: Viết test cho Bước 2A (Diễn biến khám), Bước 2B (EHR Sync sinh hiệu/bệnh nền/dị ứng), Bước 3 (Đơn thuốc tùy chọn) và Bước 4 (Lưu Nháp vs Chốt hồ sơ)**
  Vị trí file test: `src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx`
  Test case:
  1. **Lưu Nháp:** bác sĩ nhập triệu chứng + chỉ số huyết áp `145/90` rồi bấm `"Lưu Nháp (Gia đình chưa thấy)"` → lưu bản nháp vào `localStorage` theo key `famidoc_visit_draft:<encounterId>:<patientId>`, đánh dấu thành viên là `Đang ghi (Nháp)`, KHÔNG gọi `medicalBooksApi.confirm` hay `patientsApi.addMemberVitalSign`.
  2. **Chốt hồ sơ không kê đơn:** checkbox `"Có phát sinh đơn thuốc"` mặc định tắt; bấm `"Chốt hồ sơ"` → gọi `medicalBooksApi.confirm` (không kèm `prescription`), đồng thời gọi `patientsApi.addMemberVitalSign` với sinh hiệu đã nhập và `patientsApi.addMemberAllergy` nếu có thêm dị ứng mới; xóa nháp local và đổi trạng thái thành viên sang `✓ Đã chốt hồ sơ`.
  3. **Chốt hồ sơ có kê đơn:** bật checkbox `"Có phát sinh đơn thuốc"` → hiển thị bảng nhập thuốc; điền thuốc và bấm `"Chốt hồ sơ & Phát hành đơn"` → gọi `medicalBooksApi.confirm` kèm `prescription.details`.
  Kỳ vọng: chạy `npm test -- src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx` → FAIL vì Bước 2–4 chưa được triển khai.

- [ ] **Bước 4 [GREEN]: Triển khai Bước 2A, 2B (EHR Sync), Bước 3 (Đơn thuốc tùy chọn) và Bước 4 (Lưu Nháp / Chốt) trong `src/features/doctor-encounters/components/doctor-visit-workspace.tsx`**
  Kỳ vọng: chạy `npm test -- src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx` → PASS.

- [ ] **Bước 5 [REFACTOR]: Tách helper quản lý bản nháp (`loadVisitDraft` / `saveVisitDraft` / `clearVisitDraft`) ra cuối file hoặc file util nhỏ cùng thư mục để code dễ đọc và tránh trùng lặp**
  Kỳ vọng: chạy `npm test -- src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx` → vẫn PASS.

- [ ] **Bước 6: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx src/features/prescriptions/components/__tests__/prescriptions-flow.test.tsx`
  Kết quả mong đợi: tất cả test PASS.

---

### Task 7: Nâng cấp Luồng Khóa đơn & Modal Hủy/Lập đơn thay thế — D4 (`PrescriptionForm`)

**Đối tượng liên quan (đã xác nhận qua `codebase-memory-mcp`):**
- Tạo mới: `src/features/doctor-encounters/components/__tests__/prescription-replacement.test.tsx`
- Chỉnh sửa: `src/features/doctor-encounters/components/prescription-form.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.doctor-encounters.components.prescription-form.PrescriptionForm`)
- Test tương ứng: `src/features/doctor-encounters/components/__tests__/prescription-replacement.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/doctor-encounters/components/__tests__/prescription-replacement.test.tsx`

**Ảnh hưởng liên quan (từ `trace_path`):**
- Được gọi bởi: `VisitPage`, `VisitPages`, `DoctorBookVisitView` trong `src/features/prescriptions/components/medical-book-view.tsx`, và `DoctorVisitWorkspace` (Task 6).
- Gọi tới: `medicalBooksApi.confirm`, `prescriptionsApi.share`.
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/prescriptions/components/__tests__/prescriptions-flow.test.tsx` và `npm test -- src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `visit: BookVisitDetail` (đã có `visit.prescription` khi đơn đã phát hành) từ Task 6 (`DoctorVisitWorkspace`) và `MedicalBookView`.
- Cung cấp đầu ra cho: callback `onConfirmed()` để reload đơn thuốc mới nhất và lịch sử vết hủy trên EHR.

- [ ] **Bước 1 [RED]: Viết test cho trạng thái khóa đơn đã phát hành & modal D4 Hủy/Lập đơn thay thế**
  Vị trí file test: `src/features/doctor-encounters/components/__tests__/prescription-replacement.test.tsx`
  Test case:
  1. Khi `visit.prescription` đã tồn tại và `isReplacement` chưa bật: hiển thị banner `"Đơn thuốc đã phát hành (Đã khóa — Không thể sửa đè)"` và nút `"Hủy đơn cũ & Lập đơn thay thế"`; không cho sửa đè trực tiếp lên đơn cũ.
  2. Khi bấm `"Hủy đơn cũ & Lập đơn thay thế"`: mở giao diện D4 nạp sẵn danh sách thuốc từ đơn cũ, yêu cầu nhập `"Lý do hủy đơn cũ (Bắt buộc)"`.
  3. Khi để trống `replacementReason` → nút `"Xác nhận Hủy đơn cũ & Phát hành đơn thay thế"` bị vô hiệu hóa hoặc báo lỗi validation, KHÔNG gọi API.
  4. Khi nhập đủ lý do hủy + sửa hàm lượng thuốc và xác nhận → gọi API phát hành đơn thay thế kèm `replacementReason` và gọi `onConfirmed()`.
  Kỳ vọng: chạy `npm test -- src/features/doctor-encounters/components/__tests__/prescription-replacement.test.tsx` → FAIL vì luồng khóa đơn và mở modal D4 chưa được hoàn thiện đúng spec trên.

- [ ] **Bước 2 [GREEN]: Cập nhật `PrescriptionForm` trong `src/features/doctor-encounters/components/prescription-form.tsx` để khóa sửa đè đơn đã phát hành và bổ sung luồng D4**
  Giữ nguyên các props hiện có (`visit`, `onConfirmed`, `onPendingChange`, `onSaveFamilyDraft`, `onDraftChange`, `disabled`, `isReplacement`) để không phá vỡ `MedicalBookView`.
  Kỳ vọng: chạy `npm test -- src/features/doctor-encounters/components/__tests__/prescription-replacement.test.tsx` → PASS.

- [ ] **Bước 3 [REFACTOR]: Không cần refactor bổ sung.**

- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test -- src/features/doctor-encounters/components/__tests__/prescription-replacement.test.tsx src/features/prescriptions/components/__tests__/prescriptions-flow.test.tsx src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx`
  Kết quả mong đợi: tất cả test mới và regression test đều PASS.

---

### Task 8: Nâng cấp Bảng Đối soát Ca khám 2 làn cho Vận hành / CSYT — O1 (`DualLaneReconciliationTable`, `AdminDisputesView`, `FacilityCoordinationView`)

**Đối tượng liên quan (đã xác nhận qua `codebase-memory-mcp`):**
- Tạo mới: `src/features/admin-disputes/components/dual-lane-reconciliation-table.tsx`
- Chỉnh sửa:
  - `src/features/admin-disputes/components/admin-disputes-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.admin-disputes.components.admin-disputes-view.AdminDisputesView`)
  - `src/features/facility-coordination/components/facility-coordination-view.tsx` (`C-Users-ADMIN-Downloads-famidoc-famidoc-frontend.src.features.facility-coordination.components.facility-coordination-view.FacilityCoordinationView`)
- Test tương ứng: `src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx`
- Kiểm chứng bằng: `npm test -- src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx`

**Ảnh hưởng liên quan (từ `trace_path`):**
- Được gọi bởi: `AdminDisputesView` có 2 inbound callers là `FacilityCoordinationView` (`src/features/facility-coordination/components/facility-coordination-view.tsx`) và `FacilityComplaintsPage` (`src/app/(dashboard)/facility/complaints/page.tsx`). Do đó KHÔNG đổi props bắt buộc của `AdminDisputesView`.
- Gọi tới: `deriveDualLaneState` (Task 1), `encountersApi.remindWrapUp`, `encountersApi.getFacilityScheduleBoard`.
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/features/admin-disputes/components/__tests__/admin-disputes-view.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (`deriveDualLaneState`), dữ liệu ca khám & khiếu nại `NO_SHOW` phát sinh từ Task 2 (F3b).
- Cung cấp đầu ra cho: đội Vận hành (Admin) và Điều phối CSYT theo dõi song song 2 làn, nhắc bác sĩ chốt EHR trong hạn 24h và xử lý tranh chấp `NO_SHOW / DISPUTED`.

- [ ] **Bước 1 [RED]: Viết test cho `DualLaneReconciliationTable` (mockup O1)**
  Vị trí file test: `src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx`
  Test case:
  1. Hiển thị 3 bộ lọc: `Tất cả`, `Cần xử lý: NO_SHOW/DISPUTED`, `Chờ hồ sơ 24h` kèm số lượng chính xác.
  2. Mỗi dòng hiển thị song song cột `Làn Gia đình` và cột `Làn Bác sĩ`, cùng trạng thái đối soát (`COMPLETED`, `PENDING_RECORD`, `DISPUTED / NO_SHOW`).
  3. Dòng `PENDING_RECORD` có nút `"Gửi nhắc bác sĩ"` → bấm vào gọi `encountersApi.remindWrapUp(encounter.id)` và hiển thị xác nhận đã gửi nhắc.
  4. Dòng `DISPUTED / NO_SHOW` hiển thị nhãn `"Bị khóa tự đóng"` và nút `"Xử lý đối soát"` gọi callback `onInspectDispute(encounter)`.
  Kỳ vọng: chạy `npm test -- src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx` → FAIL vì `DualLaneReconciliationTable` chưa tồn tại.

- [ ] **Bước 2 [GREEN]: Tạo `DualLaneReconciliationTable` tại `src/features/admin-disputes/components/dual-lane-reconciliation-table.tsx`**
  Kỳ vọng: chạy `npm test -- src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx` → PASS.

- [ ] **Bước 3 [RED]: Viết test tích hợp tab `"Đối soát ca khám 2 làn"` vào `AdminDisputesView` và `FacilityCoordinationView`**
  Vị trí file test: `src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx`
  Test case: khi render `AdminDisputesView`, tab `"Đối soát ca khám 2 làn"` hiển thị và chuyển đổi sang `DualLaneReconciliationTable` mà không làm hỏng các tab khiếu nại hiện có.
  Kỳ vọng: chạy `npm test -- src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx` → FAIL vì `AdminDisputesView` chưa có tab `"Đối soát ca khám 2 làn"`.

- [ ] **Bước 4 [GREEN]: Tích hợp `DualLaneReconciliationTable` vào `AdminDisputesView` và `FacilityCoordinationView`**
  Kỳ vọng: chạy `npm test -- src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx` → PASS.

- [ ] **Bước 5 [REFACTOR]: Không cần refactor bổ sung.**

- [ ] **Bước 6: Xác nhận hoàn tất task và toàn bộ kế hoạch**
  Cách kiểm tra: chạy `npm test -- src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx src/features/admin-disputes/components/__tests__/admin-disputes-view.test.tsx` và chạy toàn bộ bộ test liên quan của 8 task:
  `npm test -- src/lib/__tests__/encounter-dual-lane.test.ts src/features/appointments/components/__tests__/family-visit-confirm-modal.test.tsx src/features/family-dashboard/components/__tests__/family-today-visit-card.test.tsx src/features/appointments/components/__tests__/family-appointments-view.test.tsx src/features/doctor-dashboard/components/__tests__/doctor-view.test.tsx src/features/doctor-timetable/components/__tests__/doctor-timetable-view.test.tsx src/features/doctor-encounters/components/__tests__/doctor-visit-workspace.test.tsx src/features/doctor-encounters/components/__tests__/prescription-replacement.test.tsx src/features/admin-disputes/components/__tests__/dual-lane-reconciliation-table.test.tsx`
  Kết quả mong đợi: 100% test PASS, không phát sinh regression ở `family-typography.test.tsx`, `prescriptions-flow.test.tsx`, và `admin-disputes-view.test.tsx`.
