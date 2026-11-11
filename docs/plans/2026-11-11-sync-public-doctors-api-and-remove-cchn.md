# Đồng bộ Hợp đồng API Danh bạ Bác sĩ Công khai và Loại bỏ cchnNumber — Kế hoạch triển khai

**Mục tiêu:** Đồng bộ toàn diện dữ liệu và cấu trúc API `GET /api/v1/public/doctors` giữa Backend và Frontend, hỗ trợ lọc theo khu vực/thành phố và ảnh đại diện, đồng thời loại bỏ triệt để trường dư thừa `cchnNumber` khỏi toàn bộ codebase Frontend.

**Cách tiếp cận:** Tiếp cận theo Phương án 1 (Full-Stack Contract Sync). Bổ sung bộ lọc `city` và thuộc tính `avatarUrl` trong Backend DTO & Service; chuẩn hóa Frontend API Client để bóc tách Unified Response Envelope `{ data, meta }`; chuyển đổi bộ lọc trên Frontend `DoctorDirectoryView` sang Server-side Query chuẩn; và xóa sạch toàn bộ mã nguồn liên quan đến `cchnNumber` theo chu trình TDD Red → Green → Refactor.

**Đã tra cứu codebase (codebase-memory-mcp):**
- Đã xác nhận qua `get_architecture`: Frontend dùng Next.js 16 + Vitest; Backend dùng NestJS 12 + Prisma ORM + Jest.
- Đã xác nhận qua `search_code`: `cchnNumber` tồn tại ở `src/features/doctors/components/doctor-directory-view.tsx` (dòng 16 trong interface `Doctor`, dòng 53... trong `MOCK_DOCTORS`, dòng 336 trong mapper, dòng 386 trong text filter), nhưng **không hề được hiển thị trên bất kỳ thẻ JSX nào**.
- Đã xác nhận qua `read_file`: Backend controller `PublicController.lookupDoctorDirectory` tại `src/modules/public/controllers/public.controller.ts` dùng `@ApiStandardResponse({ isPaginated: true })` và `TransformResponseInterceptor`, trả về Envelope chuẩn `{ success: true, data: PublicDoctorItemDto[], meta: { pagination: {...} } }`.
- Đã xác nhận qua `read_file`: Frontend `publicApi.getDoctors()` tại `src/lib/api/public.api.ts` gọi `httpClient.get<PublicDoctorDto[]>('/api/v1/public/doctors')`, ép kiểu trực tiếp thành Array dẫn đến lỗi runtime `docs.map is not a function` khi nhận Envelope.
- Đã xác nhận qua `get_code_snippet`: Backend `LookupDoctorDirectoryDto` tại `src/modules/public/dtos/lookup-doctors.dto.ts` có `search`, `facilityId`, `specialty`, `minExperienceYears`, `page`, `limit`, nhưng thiếu trường `city`.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Backend Framework: Jest
- Vị trí đặt file test Backend: `src/modules/public/__tests__/*.spec.ts`
- Lệnh chạy test Backend: `npm test -- src/modules/public/__tests__/public-doctors-standard-response.spec.ts`
- Frontend Framework: Vitest
- Vị trí đặt file test Frontend: `src/lib/api/__tests__/*.test.ts` và `src/features/doctors/components/__tests__/*.test.tsx`
- Lệnh chạy test Frontend: `npm test src/lib/api/__tests__/api-clients.test.ts`

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Không để lại code chết (dead code) hoặc placeholder (TBD, TODO).
- Giữ nguyên toàn bộ các endpoint và logic nghiệp vụ khác của `PublicController` và các module liên quan.

---

### Task 1: Bổ sung bộ lọc Thành phố (city) và trường avatarUrl cho Backend Public Doctors API

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa:
  - `famidoc-backend/src/modules/public/dtos/lookup-doctors.dto.ts` (`LookupDoctorDirectoryDto`)
  - `famidoc-backend/src/modules/public/dtos/public-doctors-response.dto.ts` (`PublicDoctorItemDto`)
  - `famidoc-backend/src/modules/public/services/impl/public.service.impl.ts` (`PublicServiceImpl.lookupDoctorDirectory`)
- Test tương ứng: `famidoc-backend/src/modules/public/__tests__/public-doctors-standard-response.spec.ts`
- Kiểm chứng bằng: `npm test -- src/modules/public/__tests__/public-doctors-standard-response.spec.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `PublicController.lookupDoctorDirectory` (`GET /api/v1/public/doctors`)
- Gọi tới: `prisma.doctor.findMany`, `prisma.doctor.count`
- Regression test cần chạy thêm do có inbound calls: `npm test -- src/modules/public/__tests__/public.controller.spec.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Không có (task nền tảng phía Backend)
- Cung cấp đầu ra cho: Task 2 (Frontend Client gọi endpoint này với param `city` và nhận trường `avatarUrl`)

- [x] **Bước 1 [RED]: Viết test kiểm tra bộ lọc city và trường avatarUrl trong Public Doctors Response**
  Vị trí file test: `famidoc-backend/src/modules/public/__tests__/public-doctors-standard-response.spec.ts`
  Test case:
  - Gửi request `GET /api/v1/public/doctors?city=Hà Nội&page=1&limit=10`
  - Kỳ vọng: Response status 200, `res.body.data[0]` có chứa trường `avatarUrl` (chuỗi URL hoặc null), và mock service nhận được tham số `city: 'Hà Nội'`.
  Lệnh kiểm tra: chạy `npm test -- src/modules/public/__tests__/public-doctors-standard-response.spec.ts`
  Kỳ vọng: kết quả FAIL do `LookupDoctorDirectoryDto` chưa cho phép param `city` (ValidationPipe chặn do whitelist) hoặc thiếu thuộc tính `avatarUrl` trong assertion.
- [x] **Bước 2 [GREEN]: Cập nhật DTO và Service phía Backend để test ở Bước 1 PASS**
  Chỉnh sửa:
  - Tại `src/modules/public/dtos/lookup-doctors.dto.ts`: thêm `@ApiPropertyOptional({ description: 'Lọc theo tỉnh/thành phố của cơ sở y tế', example: 'Hà Nội' }) @IsOptional() @IsString() city?: string;`
  - Tại `src/modules/public/dtos/public-doctors-response.dto.ts`: thêm `@ApiPropertyOptional({ example: 'https://images.unsplash.com/...', nullable: true }) avatarUrl?: string | null;` vào `PublicDoctorItemDto`.
  - Tại `src/modules/public/services/impl/public.service.impl.ts`:
    * Trong `where`: nếu `dto.city?.trim()` có giá trị, thêm điều kiện `where.facility = { ...where.facility, address: { contains: dto.city.trim(), mode: 'insensitive' } };`
    * Trong `doctor.findMany select`: thêm quan hệ lấy ảnh đại diện `user: { select: { avatarUrl: true } }`.
    * Trong mapper trả về: gán `avatarUrl: doc.user?.avatarUrl || null`.
  Lệnh kiểm tra: chạy `npm test -- src/modules/public/__tests__/public-doctors-standard-response.spec.ts`
  Kỳ vọng: kết quả PASS.
- [x] **Bước 3 [REFACTOR]: Tinh chỉnh cấu trúc filter Prisma và xử lý sanitize chuỗi tìm kiếm**
  Refactor: chuẩn hóa điều kiện tìm kiếm `city` và `search` không phân biệt chữ hoa/thường (case-insensitive mode), không thay đổi contract.
  Lệnh kiểm tra: chạy `npm test -- src/modules/public/__tests__/public-doctors-standard-response.spec.ts`
  Kỳ vọng: kết quả vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test module public của backend `npm test -- src/modules/public/__tests__/public-doctors-standard-response.spec.ts`
  Kết quả mong đợi: tất cả PASS 100%.

---

### Task 2: Chuẩn hóa Frontend API Client bóc tách Response Envelope và hỗ trợ Query Params

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: không có
- Chỉnh sửa: `famidoc-frontend/src/lib/api/public.api.ts`
- Test tương ứng: `famidoc-frontend/src/lib/api/__tests__/api-clients.test.ts`
- Kiểm chứng bằng: `npm test src/lib/api/__tests__/api-clients.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `DoctorDirectoryView` (`src/features/doctors/components/doctor-directory-view.tsx`)
- Gọi tới: `httpClient.get` (`src/lib/api/http-client.ts`)
- Regression test cần chạy thêm do có inbound calls: `npm test src/lib/api/__tests__/api-clients.test.ts`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Backend API `GET /api/v1/public/doctors` (Task 1)
- Cung cấp đầu ra cho: Giao diện `DoctorDirectoryView` (Task 3)

- [x] **Bước 1 [RED]: Viết test cho publicApi.getDoctors với Query Params và bóc tách Envelope chuẩn**
  Vị trí file test: `famidoc-frontend/src/lib/api/__tests__/api-clients.test.ts`
  Test case:
  - Giả lập backend trả về đúng Envelope chuẩn: `{ success: true, code: 200, data: [{ id: 'doc-1', doctorName: 'BS. Nguyễn Văn A', specialty: 'Y học gia đình', academicTitle: 'PGS.TS', ratingAvg: 4.9, totalReviews: 120, isAvailable: true, avatarUrl: 'https://...', facility: { id: 'f-1', facilityName: 'BV Đại học Y Dược' } }], meta: { pagination: { page: 1, pageSize: 9, totalRecords: 45, totalPages: 5 } } }`
  - Gọi `publicApi.getDoctors({ city: 'TP. Hồ Chí Minh', specialty: 'general', search: 'Nguyễn' })`
  - Kỳ vọng: Hàm trả về đối tượng có cấu trúc `{ items: PublicDoctorDto[], pagination: PaginationMeta }` và URL gọi chứa các searchParams tương ứng.
  Lệnh kiểm tra: chạy `npm test src/lib/api/__tests__/api-clients.test.ts`
  Kỳ vọng: kết quả FAIL do `publicApi.getDoctors` hiện tại không nhận tham số query và không giải nén Envelope.
- [x] **Bước 2 [GREEN]: Cập nhật public.api.ts để test ở Bước 1 PASS**
  Chỉnh sửa:
  - Khai báo interface `PublicDoctorsQuery` gồm: `search?: string`, `specialty?: string`, `city?: string`, `page?: number`, `limit?: number`.
  - Cập nhật interface `PublicDoctorDto`:
    ```ts
    export interface PublicDoctorDto {
      id: string;
      doctorName: string;
      specialty: string;
      academicTitle?: string | null;
      ratingAvg: number;
      totalReviews: number;
      isAvailable: boolean;
      avatarUrl?: string | null;
      facility?: {
        id: string;
        facilityName: string;
        address?: string;
        hotline?: string;
      } | null;
    }
    ```
  - Cập nhật hàm `publicApi.getDoctors`:
    ```ts
    getDoctors: async (params?: PublicDoctorsQuery): Promise<{ items: PublicDoctorDto[]; pagination?: { page: number; pageSize: number; totalRecords: number; totalPages: number } }> => {
      const res = await httpClient.get<any>('/api/v1/public/doctors', params as Record<string, string | number | boolean | undefined>);
      if (res && res.data && Array.isArray(res.data)) {
        return {
          items: res.data,
          pagination: res.meta?.pagination,
        };
      }
      if (Array.isArray(res)) {
        return { items: res };
      }
      return { items: [] };
    }
    ```
  Lệnh kiểm tra: chạy `npm test src/lib/api/__tests__/api-clients.test.ts`
  Kỳ vọng: kết quả PASS.
- [x] **Bước 3 [REFACTOR]: Tinh chỉnh type definitions và an toàn hóa trường hợp response lỗi**
  Refactor: tách interface `StandardPaginationMeta` tái sử dụng, bảo đảm không còn `any` không an toàn.
  Lệnh kiểm tra: chạy `npm test src/lib/api/__tests__/api-clients.test.ts`
  Kỳ vọng: kết quả vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test API client `npm test src/lib/api/__tests__/api-clients.test.ts`
  Kết quả mong đợi: tất cả PASS 100%.

---

### Task 3: Loại bỏ hoàn toàn cchnNumber và đồng bộ giao diện DoctorDirectoryView với API thật

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `famidoc-frontend/src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
- Chỉnh sửa: `famidoc-frontend/src/features/doctors/components/doctor-directory-view.tsx`
- Test tương ứng: `famidoc-frontend/src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
- Kiểm chứng bằng: `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: `src/app/doctors/page.tsx`
- Gọi tới: `publicApi.getDoctors`, `publicApi.getFacilities`
- Regression test cần chạy thêm do có inbound calls: `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: `publicApi.getDoctors` (Task 2)
- Cung cấp đầu ra cho: Người dùng truy cập trang `/doctors`

- [x] **Bước 1 [RED]: Viết test cho DoctorDirectoryView không còn cchnNumber và gọi publicApi theo bộ lọc**
  Vị trí file test: `famidoc-frontend/src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Test case:
  - Render `<DoctorDirectoryView />` với mock API trả về danh sách bác sĩ chứa `doctorName: 'BS. Lê Thị B'`, `academicTitle: 'ThS.BS'`, `ratingAvg: 4.8`, `totalReviews: 88`.
  - Khẳng định: giao diện render thành công tên bác sĩ, học vị, rating, cơ sở y tế.
  - Khẳng định: component không còn phụ thuộc hay yêu cầu thuộc tính `cchnNumber`.
  - Thay đổi dropdown thành phố sang `'Hà Nội'` → khẳng định `publicApi.getDoctors` được gọi với `{ city: 'Hà Nội' }`.
  Lệnh kiểm tra: chạy `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Kỳ vọng: kết quả FAIL vì view hiện tại đang mapping dữ liệu theo kiểu cũ, gọi API rỗng không params và vẫn phụ thuộc trường `cchnNumber`.
- [x] **Bước 2 [GREEN]: Xóa sạch cchnNumber và cập nhật cơ chế nạp dữ liệu từ API cho DoctorDirectoryView**
  Chỉnh sửa tại `famidoc-frontend/src/features/doctors/components/doctor-directory-view.tsx`:
  - Trong `interface Doctor`: xóa bỏ hoàn toàn dòng `cchnNumber: string;`.
  - Trong `MOCK_DOCTORS`: xóa thuộc tính `cchnNumber` ở tất cả 9 bản ghi bác sĩ mẫu.
  - Trong hàm mapping từ `publicApi.getDoctors`:
    * Map `d.doctorName` sang `name`
    * Map `d.academicTitle || 'Bác sĩ'` sang `title`
    * Map `d.ratingAvg` sang `rating`
    * Map `d.totalReviews` sang `reviewCount`
    * Map `d.facility?.facilityName || 'Bệnh viện liên kết'` sang `hospital`
    * Map `d.avatarUrl || '/images/medsev/home-one/doctor/1.jpg'` sang `avatarUrl`
    * Xóa bỏ dòng gán `cchnNumber: 'CCHN-...'`
  - Trong logic tìm kiếm lọc: xóa đoạn `doc.cchnNumber.toLowerCase().includes(...)`.
  - Gắn `useEffect` phụ thuộc các tham số lọc hoặc gọi API khi người dùng thay đổi chuyên khoa, từ khóa hoặc thành phố.
  - Hiển thị badge số lượng bác sĩ dựa trên tổng số thực từ server `pagination.totalRecords` (hoặc độ dài danh sách nếu fallback mock).
  Lệnh kiểm tra: chạy `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Kỳ vọng: kết quả PASS.
- [x] **Bước 3 [REFACTOR]: Tinh chỉnh cấu trúc code và loại bỏ các biến phụ không dùng**
  Refactor:
  - Rà soát toàn bộ file `doctor-directory-view.tsx` đảm bảo không còn bất kỳ tham chiếu nào tới `cchn` hay `cchnNumber`.
  - Tối ưu hóa render card với avatar fallback an toàn (nếu ảnh lỗi URL tự động gán fallback placeholder).
  Lệnh kiểm tra: chạy `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Kỳ vọng: kết quả vẫn PASS.
- [x] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test component danh bạ bác sĩ `npm test src/features/doctors/components/__tests__/doctor-directory-view.test.tsx`
  Kết quả mong đợi: tất cả PASS 100%.
