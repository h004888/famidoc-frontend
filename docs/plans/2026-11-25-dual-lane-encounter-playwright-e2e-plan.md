# Kế hoạch Kiểm thử E2E Playwright — Luồng Ca Khám 2 Làn Song Song (Full-Stack + PostgreSQL Seeding)

**Nguồn đặc tả:** [2026-11-25-dual-lane-encounter-fullstack-integration.md](file:///C:/Users/ADMIN/Downloads/famidoc/famidoc-backend/docs/plans/2026-11-25-dual-lane-encounter-fullstack-integration.md)
**Phạm vi:** Kiểm thử toàn trình (Browser UI + API thật + PostgreSQL thật) cho 7 task đã triển khai giữa `famidoc-frontend` (`http://localhost:3000`) và `famidoc-backend` (`http://localhost:4000`).

---

## 1. Chiến lược Giả lập & Cô lập Dữ liệu PostgreSQL (`postgresql-tools`)

Sử dụng script [dual-lane-e2e-seed.py](file:///C:/Users/ADMIN/Downloads/famidoc/famidoc-frontend/e2e/scripts/dual-lane-e2e-seed.py) (gọi `psycopg2` / tương thích `postgresql-tools`) với **UUID cố định prefix `e2e00000-...`** và email prefix `e2e_dual_lane_...` để:
1. **Không làm bẩn dữ liệu thật**: mọi bản ghi được gắn ID cố định, tự xóa sạch theo thứ tự khóa ngoại trong bước `cleanup` (`notifications` → `audit_logs` → `complaints` → `prescription_details` → `prescriptions` → `clinical_emr` → `encounter_participants` → `encounters` → `contract_members` → `medical_contracts` → `patients` → `family_units` → `users`).
2. **Đảm bảo migration enum**: kiểm tra/áp dụng `ALTER TYPE "EncounterStatus" ADD VALUE IF NOT EXISTS 'PENDING_RECORD' / 'DISPUTED'`.
3. **Tái sử dụng Facility & Doctor đang hoạt động** (`20000000-0000-4000-8000-000000000001` / `30000000-0000-4000-8000-000000000001`) hoặc tạo tài khoản `FAMILY_REP`, `DOCTOR`, `ADMIN` cô lập với mật khẩu bcrypt cố định (`E2eDualLane@2026!`) để đăng nhập thực tế qua `/api/v1/auth/login` và giao diện.

### Ma trận dữ liệu giả lập (6 Encounter mẫu cô lập)

| Mã Ca Khám | UUID | Loại & Trạng thái ban đầu | Thời gian hẹn (VN +07:00) | EMR / Đơn thuốc sẵn có | Mục đích kiểm thử |
|---|---|---|---|---|---|
| `ENC_CONFIRM_PENDING` | `e2e00000-0000-4000-8000-000000000101` | `HOME_VISIT` / `CONFIRMED` | Hôm nay, quá giờ hẹn 1h | Chưa có EMR | Gia đình bấm xác nhận → `PENDING_RECORD`, sau đó Bác sĩ chốt bệnh án → `COMPLETED` |
| `ENC_CONFIRM_COMPLETE` | `e2e00000-0000-4000-8000-000000000102` | `HOME_VISIT` / `CONFIRMED` | Hôm nay, quá giờ hẹn 2h | Đã có `clinical_emr` (`is_finalized=true`) | Gia đình bấm xác nhận → tự đối soát lên thẳng `COMPLETED` |
| `ENC_FUTURE_GUARD` | `e2e00000-0000-4000-8000-000000000103` | `HOME_VISIT` / `CONFIRMED` | Ngày mai (`+24h`) | Chưa có EMR | Chặn xác nhận trước giờ hẹn (`400 BadRequest`) |
| `ENC_TELEHEALTH_GUARD` | `e2e00000-0000-4000-8000-000000000104` | `TELEHEALTH` / `CONFIRMED` | Hôm nay, quá giờ hẹn 1h | Chưa có EMR | Chặn `confirm-arrival` trên `TELEHEALTH` (`400 BadRequest`) |
| `ENC_NO_SHOW_DISPUTE` | `e2e00000-0000-4000-8000-000000000105` | `HOME_VISIT` / `CONFIRMED` | Hôm nay, quá giờ hẹn 1h | Chưa có EMR | Gia đình báo sự cố `DOCTOR_ABSENT` (F3b) → khóa sang `DISPUTED`, hiển thị trên bảng Đối soát 2 làn (O1), và khóa tự chuyển `COMPLETED` khi bác sĩ chốt hồ sơ |
| `ENC_RX_REPLACE` | `e2e00000-0000-4000-8000-000000000106` | `HOME_VISIT` / `COMPLETED` | Hôm qua | Đã có `clinical_emr` (`is_finalized=true`) + `prescriptions` (`ISSUED`, `RX-E2E-DL-01`) | Bác sĩ mở D4 trên UI, xác nhận khóa đơn cũ, nhập lý do hủy ≥ 10 ký tự → gọi `POST /api/v1/prescriptions/:id/replacements` tạo đơn mới & hủy đơn cũ trong DB |

---

## 2. Ma trận Kịch bản Kiểm thử E2E Playwright (`e2e/dual-lane-encounter.spec.ts`)

| ID | Tên kịch bản | Vai trò | Thao tác Playwright (UI + API) | Khẳng định kết quả (UI + PostgreSQL) |
|---|---|---|---|---|
| **E2E-01** | Làn 1 (Gia đình xác nhận trước) → `PENDING_RECORD` → Làn 2 (Bác sĩ chốt EMR) → `COMPLETED` | `FAMILY_REP` → `DOCTOR` | 1. Gia đình mở `/family/appointments`, bấm xác nhận `ENC_CONFIRM_PENDING` qua `FamilyVisitConfirmModal` (F3a).<br>2. Kiểm tra DB `encounter_status = 'PENDING_RECORD'`, `family_confirmed_arrival_at IS NOT NULL`.<br>3. Bác sĩ mở `/doctor/encounters?encounterId=...` (D3), nhập thông tin khám & chốt bệnh án (`POST /api/v1/medical-books/visits/:id/confirm`). | UI hiển thị hoàn tất; DB chuyển `encounter_status = 'COMPLETED'`, `clinical_emr.is_finalized = true`. |
| **E2E-02** | Làn 2 trước (đã có EMR finalized) → Gia đình xác nhận → tự đối soát `COMPLETED` | `FAMILY_REP` | Gia đình mở `/family/appointments` và xác nhận `ENC_CONFIRM_COMPLETE`. | API trả `200`, DB cập nhật thẳng `encounter_status = 'COMPLETED'` (không dừng ở `PENDING_RECORD`). |
| **E2E-03** | Ràng buộc bảo vệ giờ hẹn VN (`+07:00`) & bảo vệ `TELEHEALTH` | `FAMILY_REP` | Gọi `PATCH /api/v1/encounters/:id/confirm-arrival` cho `ENC_FUTURE_GUARD` và `ENC_TELEHEALTH_GUARD` trong context trình duyệt đã đăng nhập. | Trả `400 BadRequest` với thông điệp tiếng Việt đời thường; trạng thái trong DB giữ nguyên `CONFIRMED`. |
| **E2E-04** | Báo sự cố `DOCTOR_ABSENT` (F3b) → khóa `DISPUTED` & Đối soát (O1) & Khóa tự đóng | `FAMILY_REP` → `ADMIN` → `DOCTOR` | 1. Gia đình mở F3b cho `ENC_NO_SHOW_DISPUTE`, chọn lý do & gửi báo cáo không đến.<br>2. Admin mở `/admin/disputes` kiểm tra `DualLaneReconciliationTable` hiển thị mục `Cần xử lý: NO_SHOW/DISPUTED`.<br>3. Bác sĩ gọi `confirmVisitRecord` cho `ENC_NO_SHOW_DISPUTE`. | DB cập nhật `encounter_status = 'DISPUTED'`, có bản ghi `complaints` (`DOCTOR_ABSENT`); sau khi bác sĩ gửi `confirmVisitRecord`, DB vẫn giữ nguyên `DISPUTED` (không chuyển `COMPLETED`). |
| **E2E-05** | Luồng D4 thay thế đơn thuốc đã phát hành (`prescriptionsApi.replace`) | `DOCTOR` | Bác sĩ mở `/doctor/encounters?encounterId=ENC_RX_REPLACE`, xác nhận UI hiển thị **Đã khóa — Không thể sửa đè**, bấm `Hủy đơn cũ & Lập đơn thay thế`, nhập lý do ≥ 10 ký tự và xác nhận. | Network request gọi đúng `POST /api/v1/prescriptions/:id/replacements` (không gọi `share`); DB đánh dấu đơn cũ `CANCELLED` và tạo đơn mới `ISSUED` có `replaces_prescription_id` trỏ về đơn cũ. |
| **E2E-06** | Kiểm chứng tác động phụ thuộc `contracts` (chặn hủy hợp đồng khi còn `PENDING_RECORD` / `DISPUTED`) | `FAMILY_REP` / `ADMIN` | Với hợp đồng đang có ca `DISPUTED` (`ENC_NO_SHOW_DISPUTE`), kiểm tra DB & luồng bảo vệ hợp đồng. | Xác nhận hợp đồng còn ca `DISPUTED` được `hasEncounterInProgress` phát hiện và không cho chấm dứt sai quy định. |

---

## 3. Lệnh thực thi & Dọn dẹp

```bash
# 1. Seed dữ liệu cô lập vào PostgreSQL
python famidoc-frontend/e2e/scripts/dual-lane-e2e-seed.py seed

# 2. Chạy Playwright E2E (khi backend :4000 và frontend :3000 đang chạy)
cd famidoc-frontend && npx playwright test e2e/dual-lane-encounter.spec.ts

# 3. Dọn dẹp sạch toàn bộ dữ liệu giả lập
python famidoc-frontend/e2e/scripts/dual-lane-e2e-seed.py cleanup
```
