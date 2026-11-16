/**
 * Trích xuất thông điệp lỗi thân thiện với người dùng từ các phản hồi API của NestJS
 * Hỗ trợ chuẩn RFC 7807 Problem Details, class-validator array, và ApiError wrapper.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
): string {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  const err = error as any;

  // 1. Kiểm tra payload response từ axios / httpClient (err.response?.data hoặc err.data)
  const responseData = err.response?.data || err.data;
  if (responseData) {
    if (Array.isArray(responseData.message) && responseData.message.length > 0) {
      return responseData.message.join('; ');
    }
    if (typeof responseData.message === 'string' && responseData.message.trim()) {
      return responseData.message.trim();
    }
    if (responseData.error?.detail) {
      return String(responseData.error.detail);
    }
    if (responseData.error?.message) {
      return String(responseData.error.message);
    }
    if (typeof responseData.detail === 'string') {
      return responseData.detail;
    }
  }

  // 2. ApiError instance hoặc standard Error instance
  if (Array.isArray(err.message)) {
    return err.message.join('; ');
  }
  if (typeof err.message === 'string' && err.message.trim()) {
    // Nếu là mã lỗi thô dạng "API error (400)" và có err.data chi tiết
    if (/^API error \(\d+\)$/i.test(err.message) && err.data) {
      if (Array.isArray(err.data.message)) return err.data.message.join('; ');
      if (typeof err.data.message === 'string') return err.data.message;
      if (err.data.error?.detail) return String(err.data.error.detail);
    }
    return err.message.trim();
  }

  return fallback;
}
