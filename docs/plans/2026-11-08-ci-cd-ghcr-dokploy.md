# Nâng cấp CI/CD sang GitHub Container Registry (GHCR) & Dokploy — Kế hoạch triển khai

**Mục tiêu:** Xây dựng quy trình CI/CD chuẩn hóa tách rời Build (GitHub Actions) và Run (Dokploy), đóng gói Docker Image lên GHCR kèm cơ chế Healthcheck & Smoke-test tự động để xóa bỏ hoàn toàn tình trạng "GitHub Actions báo xanh nhưng Dokploy báo đỏ".

**Cách tiếp cận:** Chuyển đổi toàn bộ quá trình biên dịch TypeScript và đóng gói Dockerfile sang runner của GitHub Actions, đẩy image bất biến (`sha-${{ github.sha }}` và `latest`) lên GHCR. Dokploy chuyển sang Docker Provider chỉ thực hiện kéo image về chạy và khởi động lại container trong 2 giây, kết hợp kịch bản smoke-test tự động xác minh frontend online thành công.

**Đã tra cứu codebase (codebase-memory-mcp):**
- Đã xác nhận qua `search_graph`: [`Dockerfile`](file:///C:/Users/ADMIN/Downloads/famidoc/famidoc-frontend/Dockerfile) đã có kiến trúc multi-stage standalone runner với Node 24-alpine.
- Đã xác nhận qua `search_code`: Biến build-time duy nhất của Next.js là `NEXT_PUBLIC_API_URL` nằm ở dòng 17-18 của Dockerfile và `src/lib/http/server-client.ts`.
- Đã xác nhận qua `get_architecture`: Frontend Next.js 16.4.2 với Turbopack, App Router, output standalone đã kích hoạt trong `next.config.ts`.
- Đã xác nhận qua `search_graph`: Chưa có endpoint `/api/health` để kiểm tra tình trạng sống của container.

**Framework test & quy ước (đã xác nhận qua codebase-memory-mcp):**
- Framework: Vitest (`vitest run` trong `package.json`)
- Vị trí đặt file test: Thư mục `__tests__/` liền kề mã nguồn, đặt tên file theo định dạng `*.test.ts` hoặc `*.test.tsx`
- Lệnh chạy test: `npm test` (hoặc `npm run test`)

## Ràng buộc chung (Global Constraints)

- Mọi task viết/sửa hành vi code phải theo chu trình Red → Green → Refactor.
- Không có task nào được đánh dấu hoàn tất nếu thiếu test tự động tương ứng và log xác nhận PASS.
- Không lưu trữ bất kỳ token, secret hay mật khẩu tĩnh nào trong mã nguồn Git.
- Docker image phải duy trì tính tương thích với multi-stage standalone build hiện tại của Next.js.

---

### Task 1: Xây dựng Healthcheck API Endpoint (`/api/health`) cho container và Dokploy

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/app/api/health/route.ts`
- Chỉnh sửa: Không có (endpoint mới)
- Test tương ứng: `src/app/api/health/__tests__/health.route.test.ts`
- Kiểm chứng bằng: `npm test src/app/api/health/__tests__/health.route.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Dockerfile HEALTHCHECK directive, Dokploy Healthcheck, và GitHub Actions Smoke Test
- Gọi tới: `process.uptime()`, `Response.json()`
- Regression test cần chạy thêm do có inbound calls: không cần (endpoint mới)

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: HTTP GET request từ client/công cụ giám sát
- Cung cấp đầu ra cho: Task 2 (Smoke-test runner) và Task 3 (Dockerfile HEALTHCHECK) để xác nhận container sẵn sàng phục vụ

- [ ] **Bước 1 [RED]: Viết test cho hành vi trả về HTTP 200 và thông tin trạng thái hệ thống của GET /api/health**
  Vị trí file test: `src/app/api/health/__tests__/health.route.test.ts`
  Test case: Gọi hàm handler `GET()` của route, kiểm tra HTTP status trả về 200, body chứa `{ status: "ok" }`, có trường `uptime` là số dương và `timestamp` định dạng ISO string.
  Kỳ vọng: chạy `npm test src/app/api/health/__tests__/health.route.test.ts` → FAIL với lý do module `src/app/api/health/route.ts` chưa tồn tại.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại src/app/api/health/route.ts để test ở Bước 1 PASS**
  Nội dung triển khai: Xuất hàm `GET()` trả về `Response.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }, { status: 200 })`.
  Kỳ vọng: chạy `npm test src/app/api/health/__tests__/health.route.test.ts` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tinh chỉnh kiểu dữ liệu phản hồi chuẩn TypeScript**
  Nội dung: Khai báo interface `HealthCheckResponse` và export type để tái sử dụng ở client/smoke test, giữ nguyên hành vi runtime.
  Kỳ vọng: chạy `npm test src/app/api/health/__tests__/health.route.test.ts` → vẫn PASS.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test src/app/api/health/__tests__/health.route.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 2: Viết module kiểm thử tự động sau deploy (Smoke-test runner)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/lib/smoke-test.ts` và script thực thi `scripts/smoke-test.mjs`
- Chỉnh sửa: Không có
- Test tương ứng: `src/lib/__tests__/smoke-test.test.ts`
- Kiểm chứng bằng: `npm test src/lib/__tests__/smoke-test.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: GitHub Actions CI/CD step "Post-Deploy Smoke Test"
- Gọi tới: `fetch()` gọi vào endpoint `/api/health` của môi trường đích
- Regression test cần chạy thêm do có inbound calls: không cần

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: URL frontend đích (`FRONTEND_URL`) và tham số timeout/retries từ Task 1
- Cung cấp đầu ra cho: Task 4 (GitHub Actions workflow) để quyết định pipeline xanh hay đỏ dựa trên trạng thái thực tế của Dokploy

- [ ] **Bước 1 [RED]: Viết test cho hàm pollHealthCheck kiểm tra phản hồi thành công hoặc ném lỗi khi timeout**
  Vị trí file test: `src/lib/__tests__/smoke-test.test.ts`
  Test case: Mock `fetch` trả về 200 sau 2 lần thử (kiểm tra retry logic) và mock fetch luôn lỗi/500 vượt quá số lần retry để xác nhận trả về `false` hoặc ném lỗi `TimeoutError`.
  Kỳ vọng: chạy `npm test src/lib/__tests__/smoke-test.test.ts` → FAIL với lý do hàm `pollHealthCheck` chưa được định nghĩa.
- [ ] **Bước 2 [GREEN]: Viết code tối thiểu tại src/lib/smoke-test.ts và scripts/smoke-test.mjs để test ở Bước 1 PASS**
  Nội dung triển khai: Viết hàm `pollHealthCheck({ url, maxRetries, intervalMs })` thực hiện vòng lặp fetch với sleep, trả về boolean; tạo script `scripts/smoke-test.mjs` nhận `process.env.TARGET_URL` để gọi hàm này.
  Kỳ vọng: chạy `npm test src/lib/__tests__/smoke-test.test.ts` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu hóa log thông báo tiến trình cho console**
  Nội dung: Thêm format log hiển thị số lần retry và mã trạng thái HTTP rõ ràng khi chạy trên GitHub Actions runner.
  Kỳ vọng: chạy `npm test src/lib/__tests__/smoke-test.test.ts` → vẫn PASS.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test liên quan tới task (`npm test src/lib/__tests__/smoke-test.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 3: Cập nhật Dockerfile hỗ trợ Container Healthcheck

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `src/lib/__tests__/dockerfile-spec.test.ts`
- Chỉnh sửa: `Dockerfile`
- Test tương ứng: `src/lib/__tests__/dockerfile-spec.test.ts`
- Kiểm chứng bằng: `npm test src/lib/__tests__/dockerfile-spec.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Docker runtime daemon trên Dokploy server
- Gọi tới: `node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1))"`
- Regression test cần chạy thêm do có inbound calls: không cần

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Task 1 (Endpoint `/api/health`)
- Cung cấp đầu ra cho: Dokploy tự động phát hiện container healthy/unhealthy để điều hướng traffic

- [ ] **Bước 1 [RED]: Viết test kiểm tra Dockerfile có chỉ thị HEALTHCHECK trỏ vào /api/health**
  Vị trí file test: `src/lib/__tests__/dockerfile-spec.test.ts`
  Test case: Đọc nội dung file `Dockerfile` và kiểm tra khớp chuỗi directive `HEALTHCHECK` với lệnh kiểm tra endpoint `/api/health`.
  Kỳ vọng: chạy `npm test src/lib/__tests__/dockerfile-spec.test.ts` → FAIL với lý do `Dockerfile` hiện tại chưa có directive `HEALTHCHECK`.
- [ ] **Bước 2 [GREEN]: Bổ sung lệnh HEALTHCHECK vào Dockerfile để test ở Bước 1 PASS**
  Nội dung triển khai: Thêm directive sau vào Stage runner của `Dockerfile`:
  `HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"`
  Kỳ vọng: chạy `npm test src/lib/__tests__/dockerfile-spec.test.ts` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): không cần refactor**
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy toàn bộ test (`npm test src/lib/__tests__/dockerfile-spec.test.ts`)
  Kết quả mong đợi: tất cả PASS.

---

### Task 4: Tái cấu trúc Workflow GitHub Actions (.github/workflows/ci-cd.yml)

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Chỉnh sửa: `.github/workflows/ci-cd.yml`
- Test tương ứng: `src/lib/__tests__/ci-workflow-spec.test.ts`
- Kiểm chứng bằng: `npm test src/lib/__tests__/ci-workflow-spec.test.ts`

**Ảnh hưởng liên quan (từ trace_path / detect_changes):**
- Được gọi bởi: Git Push / PR events trên các nhánh `dev`, `main`
- Gọi tới: GitHub Container Registry (`ghcr.io`), Dokploy Webhook, và Smoke-test runner
- Regression test cần chạy thêm do có inbound calls: không cần

**Giao diện/Kết nối với các task khác:**
- Nhận đầu vào từ: Dockerfile ở Task 3, Smoke test ở Task 2, và kết quả kiểm thử toàn diện
- Cung cấp đầu ra cho: Triển khai hoàn chỉnh trên Dokploy

- [ ] **Bước 1 [RED]: Viết test kiểm tra cấu trúc workflow ci-cd.yml có đủ các job Quality Gate, Build & Push GHCR, Deploy và Smoke-test**
  Vị trí file test: `src/lib/__tests__/ci-workflow-spec.test.ts`
  Test case: Parse cấu trúc file `.github/workflows/ci-cd.yml` và kiểm tra sự tồn tại của:
  1. `npm run build` trong job test/quality-gate.
  2. Bước login `ghcr.io` sử dụng `secrets.GITHUB_TOKEN`.
  3. Bước `docker/build-push-action` với build-args `NEXT_PUBLIC_API_URL`.
  4. Bước gọi `scripts/smoke-test.mjs` sau khi kích hoạt deploy.
  Kỳ vọng: chạy `npm test src/lib/__tests__/ci-workflow-spec.test.ts` → FAIL với lý do workflow hiện tại thiếu các bước GHCR và Smoke Test.
- [ ] **Bước 2 [GREEN]: Cập nhật file .github/workflows/ci-cd.yml để test ở Bước 1 PASS**
  Nội dung triển khai: Viết lại file workflow hoàn chỉnh:
  - Job 1: `quality-gate` (chạy `npm run lint`, `npm test`, `npm run build`).
  - Job 2: `build-and-push` (chạy khi push vào dev/main): Set up Buildx, Login GHCR, Build & Push Docker image với 2 tag: `:latest` và `:sha-${{ github.sha }}`.
  - Job 3: `deploy-dokploy`: Kích hoạt webhook Dokploy và chạy `node scripts/smoke-test.mjs`.
  Kỳ vọng: chạy `npm test src/lib/__tests__/ci-workflow-spec.test.ts` → PASS.
- [ ] **Bước 3 [REFACTOR] (nếu cần): Tối ưu hóa GitHub Actions Cache cho Docker Buildx**
  Nội dung: Sử dụng `cache-from: type=gha` và `cache-to: type=gha,mode=max` để tăng tốc độ build Docker trên GitHub runner từ 3 phút xuống 30 giây.
  Kỳ vọng: chạy `npm test src/lib/__tests__/ci-workflow-spec.test.ts` → vẫn PASS.
- [ ] **Bước 4: Xác nhận hoàn tất task**
  Cách kiểm tra: chạy `npm test src/lib/__tests__/ci-workflow-spec.test.ts`
  Kết quả mong đợi: tất cả PASS.

---

### Task 5: Soạn thảo cẩm nang cấu hình Dokploy Dashboard & GitHub Secrets

**Đối tượng liên quan (đã xác nhận qua codebase-memory-mcp):**
- Tạo mới: `docs/deployment/dokploy-ghcr-setup.md`
- Chỉnh sửa: Không có

**Giao diện/Kết nối với các task khác:**
- Hướng dẫn người dùng các bước click trên giao diện Dokploy và GitHub repo settings để hoàn tất kết nối.

- [ ] **Bước 1: Viết tài liệu hướng dẫn cấu hình chi tiết tại docs/deployment/dokploy-ghcr-setup.md**
  Nội dung bao gồm:
  1. Hướng dẫn tạo GitHub Personal Access Token (Classic PAT với scope `read:packages`).
  2. Hướng dẫn thêm Registry mới trên Dokploy Dashboard (`ghcr.io`, Username, PAT).
  3. Hướng dẫn chuyển Application Source Type từ Git sang Docker (`ghcr.io/h004888/famidoc-frontend:latest`).
  4. Hướng dẫn khai báo các GitHub Repository Secrets: `DOKPLOY_WEBHOOK_URL`, `NEXT_PUBLIC_API_URL`, `FRONTEND_PROD_URL`.
- [ ] **Bước 2: Xác nhận hoàn tất tài liệu**
  Cách kiểm tra: Rà soát đảm bảo các URL, tên biến và trường cấu hình khớp hoàn toàn với file workflow đã cấu hình.
