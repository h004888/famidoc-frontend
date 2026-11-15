/**
 * Chỉ chấp nhận URL đích là đường dẫn nội bộ của chính ứng dụng.
 *
 * Tham số `redirect` do người dùng có thể sửa trên thanh địa chỉ, nên phải kiểm tra
 * ở nơi tiêu thụ chứ không tin giá trị do middleware tạo ra.
 */
export function resolveReturnUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;

  const value = raw.trim();
  if (value.length === 0) return null;

  // Phải là đường dẫn tuyệt đối trong ứng dụng.
  if (!value.startsWith('/')) return null;

  // `//example.com` là đường dẫn mạng tuyệt đối; `/\example.com` bị một số trình duyệt
  // chuẩn hoá thành `//example.com` nên cũng phải chặn.
  if (value.startsWith('//') || value.startsWith('/\\')) return null;

  // Chặn giao thức (javascript:, data:, http:...) đứng trước dấu `/` đầu tiên.
  const firstSlash = value.indexOf('/');
  const colon = value.indexOf(':');
  if (colon !== -1 && (firstSlash === -1 || colon < firstSlash)) return null;

  // Ký tự điều khiển có thể bị dùng để ngắt chuỗi khi trình duyệt phân tích URL.
  if (/[\r\n\t]/.test(value)) return null;

  return value;
}
