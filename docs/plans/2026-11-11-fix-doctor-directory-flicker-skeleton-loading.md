# Khắc phục hiện tượng nhấp nháy dữ liệu Mock bằng Skeleton Loading — Kế hoạch triển khai

**Mục tiêu:** Loại bỏ hoàn toàn hiện tượng nhấp nháy (flicker) và giật bố cục (Content Layout Shift) khi truy cập trang danh bạ bác sĩ, bằng cách khởi tạo state danh sách rỗng, bổ sung cờ trạng thái `isLoading`, và hiển thị hiệu ứng Skeleton Loading lấp lánh chuẩn Medsev trong khi chờ nạp dữ liệu thật từ Backend API.

**Cách tiếp cận:** Triển khai theo Phương án 1 (Client-Side Skeleton Loading). Khởi tạo `doctorsList` bằng mảng rỗng `[]` và `isLoading = true`; bọc toàn bộ chu kỳ gọi API trong khối `finally(() => setIsLoading(false))`; xây dựng component `DoctorCardSkeleton` với 6 thẻ khung xương có hiệu ứng `animate-pulse` mô phỏng chính xác kích thước thẻ bác sĩ thật; và chỉ fallback về `MOCK_DOCTORS` khi API gặp sự cố mạng (network failure). Toàn bộ được kiểm chứng theo quy trình TDD Red → Green → Refactor.

**Đã tra cứu codebase (codebase-memory-mcp):**
- Đã xác nhận qua `read_file`: Tại [`doctor-directory-view.tsx`](file:///C:/Users/ADMIN/Downloads/famidoc/famidoc-frontend/src/features/doctors/components/doctor-directory-view.tsx#L312), state được khởi tạo trực tiếp bằng `useState<Doctor[]>(MOCK_DOCTORS)` mà không có cờ `isLoading`. Điều này làm React render ngay lập tức 9 thẻ mock lên màn hình trước khi `useEffect` gửi yêu cầu API.
- Đã xác nhận qua `read_file`: Hiện tại `useEffect` chỉ lắng nghe `[searchQuery, selectedCity, selectedSpecialty]` và gọi `setDoctorsList(mapped)` sau 200–300ms, gây ra hiện tượng giật cục từ 9 thẻ mock thụt xuống còn 2 thẻ thật.
- Đã xác nhận qua `read_file`: Bộ test hiện có tại [`doctor-directory-view.test.tsx`](file:///C:/Users/ADMIN/Downloads/famidoc/famidoc-frontend/src/features/doctors/components/__tests__/doctor-directory-view.test.tsx) kiểm tra render thành công nhưng chưa kiểm tra trạng thái loading và skeleton.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Frontend Framework: Vitest + React Testing Library
- Vị trí đặt file test Frontend: `src/features/doctors/components/__tests__/*.test.tsx`
- Lệnh chạy test Frontend: `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Không được làm ảnh hưởng đến các chức năng tìm kiếm, chuyển tab và lọc theo khu vực đã tích hợp.
- Tuyệt đối không để lại placeholder (TODO, TBD).

---

### Task 1: Bổ sung cờ isLoading, khởi tạo state rỗng và hiển thị Skeleton Loading Cards

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `famidoc-frontend/src/features/doctors/components/doctor-directory-view.tsx` (`DoctorDirectoryView`)
- Test tương ứng: `famidoc-frontend/src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
- Kiểm chứng bằng: `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `src/app/doctors/page.tsx`
- Gọi tới: `publicApi.getDoctors`, `publicApi.getFacilities`
- Regression test cần chạy thêm do có inbound calls: `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: API Client `publicApi.getDoctors`
- Cung cấp đầu ra cho: Giao diện người dùng truy cập trang `/doctors` mượt mà, không giật màn hình

- [x] **Bước 1 [RED]: Viết test xác nhận hiển thị Skeleton Cards và không xuất hiện dữ liệu Mock khi đang tải**
  Vị trí file test: `famidoc-frontend/src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Test case:
  - Thiết lập mock `publicApi.getDoctors` trả về một Promise chưa resolve ngay (pending).
  - Render `<DoctorDirectoryView />`.
  - Khẳng định 1: Trên màn hình xuất hiện khối skeleton container với testid `doctors-skeleton-grid` chứa ít nhất 6 thẻ skeleton `doctor-skeleton`.
  - Khẳng định 2: Trên màn hình hoàn toàn KHÔNG xuất hiện tên bác sĩ mock cũ như `"Nguyễn Văn Hoài"`.
  - Sau khi resolve Promise với 2 bác sĩ thật: khẳng định các thẻ skeleton biến mất và thay thế bằng các thẻ bác sĩ thật.
  Lệnh kiểm tra: chạy `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Kỳ vọng: kết quả FAIL vì component hiện tại không có skeleton grid và lập tức render 9 bác sĩ mock khi mount.
- [x] **Bước 2 [GREEN]: Cập nhật DoctorDirectoryView thêm isLoading, state rỗng và giao diện Skeleton**
  Chỉnh sửa tại `famidoc-frontend/src/features/doctors/components/doctor-directory-view.tsx`:
  - Khai báo state: `const [isLoading, setIsLoading] = useState<boolean>(true);`
  - Đổi khởi tạo danh sách bác sĩ: `const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);`
  - Trong `useEffect`:
    * Trước khi gọi API: `setIsLoading(true);`
    * Sau khi nhận dữ liệu thành công: `setDoctorsList(mapped);`
    * Trong khối `catch`: nếu lỗi mạng mới fallback gán `setDoctorsList(MOCK_DOCTORS);`
    * Trong khối `finally`: `setIsLoading(false);`
  - Trong JSX render tab `doctors`:
    * Nếu `isLoading === true`: render lưới skeleton gồm 6 thẻ giả lập có class `animate-pulse`, khung ảnh xám `aspect-[4/4] bg-slate-200`, các thanh giả lập học vị, tên, chuyên khoa và đánh giá sao.
    * Nếu `isLoading === false`: render danh sách `filteredDoctors` (hoặc Empty State nếu không có kết quả).
  Lệnh kiểm tra: chạy `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Kỳ vọng: kết quả PASS.
- [x] **Bước 3 [REFACTOR]: Tách riêng component DoctorCardSkeleton để tối ưu hóa mã nguồn**
  Refactor:
  - Tạo component nội bộ `DoctorCardSkeleton` gọn gàng, tái sử dụng cấu trúc Tailwind CSS đồng nhất với thẻ thật.
  - Tối ưu hóa chuyển cảnh mượt mà với transition opacity.
  Lệnh kiểm tra: chạy `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Kỳ vọng: kết quả vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test component danh bạ bác sĩ `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Kết quả mong đợi: tất cả PASS 100%.
