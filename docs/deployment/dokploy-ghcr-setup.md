# Hướng dẫn cấu hình Dokploy & GitHub Container Registry (GHCR)

Tài liệu này hướng dẫn chi tiết các bước thiết lập để Dokploy tự động kéo Docker Image đã được build sẵn từ GitHub Container Registry (`ghcr.io`), không còn phải compile mã nguồn trên VPS.

---

## 1. Tạo GitHub Personal Access Token (PAT)

Để Dokploy có quyền kéo (pull) private package từ GitHub:

1. Đăng nhập vào GitHub, truy cập: **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)** (hoặc [nhấn vào đây](https://github.com/settings/tokens)).
2. Nhấn **Generate new token (classic)**.
3. Điền thông tin:
   - **Note**: `dokploy-ghcr-pull-famidoc`
   - **Expiration**: Chọn thời hạn mong muốn (khuyến nghị 90 ngày hoặc No expiration nếu là server cá nhân).
   - **Scopes**: Tích chọn duy nhất quyền:
     - `read:packages` (Download packages from GitHub Package Registry)
4. Nhấn **Generate token** và **sao chép mã token** (token bắt đầu bằng `ghp_...`).

---

## 2. Cấu hình Registry trên Dokploy Dashboard

1. Mở bảng điều khiển Dokploy (`https://your-dokploy-domain`).
2. Vào menu **Settings** -> mục **Registries** (hoặc biểu tượng Container Registries).
3. Nhấn **Create Registry**:
   - **Name**: `GitHub Container Registry` (hoặc `GHCR`)
   - **Registry URL**: `ghcr.io`
   - **Username**: Tài khoản GitHub của bạn (ví dụ: `h004888`)
   - **Password / Token**: Dán mã GitHub Personal Access Token (`ghp_...`) vừa tạo ở Bước 1.
4. Nhấn **Save / Test Connection** để kiểm tra kết nối thành công.

---

## 3. Chuyển Application trên Dokploy sang Docker Provider

1. Trên Dokploy, chọn Application **`famidoc-frontend-yyiwii`** (hoặc ứng dụng frontend của bạn).
2. Chuyển sang tab **General**:
   - Tại mục **Source Type**, chuyển từ **GitHub / Git** sang **Docker**.
   - **Registry**: Chọn `GitHub Container Registry` (vừa tạo ở Bước 2).
   - **Docker Image**:
     - Nhánh `main`: `ghcr.io/h004888/famidoc-frontend:latest`
     - Hoặc nhánh test: `ghcr.io/h004888/famidoc-frontend:hungpx` (hoặc `dev`)
3. Chuyển sang tab **Environment**:
   - Đảm bảo biến môi trường runtime được khai báo:
     ```env
     PORT=3000
     INTERNAL_BACKEND_URL=http://famidoc-backend:4000
     ```
4. Chuyển sang tab **Deployments**:
   - Sao chép đường dẫn **Webhook URL** (dạng `https://your-dokploy-domain/api/deploy/...`).

---

## 4. Cấu hình GitHub Repository Secrets

Truy cập GitHub Repository: **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Tên Secret | Bắt buộc | Mô tả | Ví dụ |
| :--- | :---: | :--- | :--- |
| `DOKPLOY_WEBHOOK_URL` | **Có** | Webhook URL lấy từ tab Deployments của Dokploy để kích hoạt deploy | `https://dokploy.example.com/api/deploy/app_token` |
| `NEXT_PUBLIC_API_URL` | **Có** | Domain API công khai cho client-side React bundle (Build Argument) | `https://api.famidoc.vn` |
| `FRONTEND_PROD_URL` | *Tùy chọn* | Domain công khai của trang frontend để chạy Smoke Test sau deploy | `https://famidoc.vn` |

---

## 5. Quy trình tự động khi Push code

Từ bây giờ:
1. Bạn push code lên nhánh `dev`, `main` hoặc `hungpx`.
2. GitHub Actions tự động:
   - Kiểm tra ESLint, chạy Vitest unit tests.
   - Chạy `npm run build` để rà soát 100% lỗi cú pháp và kiểu TypeScript.
   - Đóng gói Docker image và đẩy lên `ghcr.io`.
   - Gửi webhook báo Dokploy kéo bản image vừa tạo.
   - Chạy `smoke-test` kiểm tra URL frontend phản hồi HTTP 200 OK.
3. VPS Dokploy chỉ mất 2-3 giây để pull image và restart container mượt mà!
