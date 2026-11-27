const DEFAULT_ERROR_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
const hasVietnameseText = (text: string) =>
  /[ăâđêôơưĂÂĐÊÔƠƯ\u1ea0-\u1ef9ÀÁÃÈÉÌÍÒÓÙÚÝàáãèéìíòóùúý]/u.test(text);

function networkErrorMessage() {
  // Mất kết nối tới máy chủ có thể xảy ra ngay cả khi thiết bị đang online.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Thiết bị đang ngoại tuyến. Hãy kết nối mạng rồi thử lại.';
  }
  return 'Không thể kết nối đến máy chủ lúc này. Vui lòng thử lại sau.';
}

export function isNetworkFailureMessage(message: string): boolean {
  return /^(?:TypeError:\s*)?(?:Failed to fetch|Fetch failed|Load failed|Network\s*Error|Network request failed)\b/i.test(message.trim());
}

/**
 * Chuẩn hóa các thông điệp lỗi tiếng Anh phổ biến từ mạng / NestJS / class-validator
 * sang tiếng Việt thân thiện với người dùng.
 */
export function localizeApiErrorMessage(
  rawMessage: string,
  fallback = DEFAULT_ERROR_MESSAGE,
): string {
  const message = rawMessage.trim();
  const safeFallback = hasVietnameseText(fallback)
    ? fallback
    : DEFAULT_ERROR_MESSAGE;
  if (!message) return safeFallback;

  if (isNetworkFailureMessage(message)) {
    return networkErrorMessage();
  }

  const exactMap: Record<string, string> = {
    'One or more fields in the request failed validation constraints.':
      'Một số trường dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.',
    'Internal server error':
      'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.',
    'An unexpected internal server error occurred.':
      'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.',
    'Bad Request': 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.',
    Unauthorized: 'Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.',
    'Incorrect username or password. Please check again.':
      'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
    'Invalid credentials':
      'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
    'Invalid email or password':
      'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
    'Invalid email or password.':
      'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
    Forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    'Not Found': 'Không tìm thấy dữ liệu yêu cầu.',
    Conflict: 'Dữ liệu đang bị xung đột hoặc đã được cập nhật trước đó.',
    'Unprocessable Entity': 'Dữ liệu gửi lên không đúng định dạng yêu cầu.',
    'Too Many Requests':
      'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
    'Service Unavailable':
      'Dịch vụ đang tạm thời không khả dụng. Vui lòng thử lại sau.',
    'Bad Gateway': 'Không thể kết nối đến dịch vụ xử lý. Vui lòng thử lại sau.',
    'Gateway Timeout': 'Máy chủ phản hồi quá chậm. Vui lòng thử lại sau.',
    'Request Timeout': 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.',
    'The operation was aborted.':
      'Yêu cầu đã bị hủy. Vui lòng thử lại nếu cần.',
    'Only closed months can be settled':
      'Chỉ có thể lập bảng quyết toán cho các tháng đã kết thúc.',
    'Settlement not found': 'Không tìm thấy bảng quyết toán.',
    'Settled statements cannot be overwritten':
      'Bảng quyết toán đã chi trả xong, không thể ghi đè.',
    'Finance access is restricted':
      'Bạn không có quyền truy cập dữ liệu tài chính.',
    'Facility not found': 'Không tìm thấy thông tin cơ sở y tế.',
    'Provide both year and month':
      'Vui lòng cung cấp đầy đủ cả năm và tháng đối soát.',
    'Transferred amount does not match the facility share':
      'Số tiền đã chuyển không khớp với phần chi trả của cơ sở y tế.',
    'Transfer time must be between statement creation and now':
      'Thời điểm chuyển khoản phải nằm trong khoảng từ khi lập bảng quyết toán đến hiện tại.',
    'Provide your settlement evidence object key':
      'Đường dẫn tệp chứng từ quyết toán không hợp lệ.',
    'Settlement period does not match the selected statement':
      'Kỳ quyết toán không khớp với bảng đang chọn.',
    'A SePay reconciliation is already running':
      'Đang có một lượt đồng bộ SePay khác đang chạy. Vui lòng đợi hoàn tất.',
    'Only Admin can run SePay reconciliation':
      'Chỉ Quản trị viên mới có quyền chạy đối soát SePay.',
    'Only Admin can prepare or confirm settlements':
      'Chỉ Quản trị viên mới được lập bảng hoặc xác nhận chi trả quyết toán.',
    'Cannot reach SePay API':
      'Không thể kết nối tới hệ thống SePay. Vui lòng thử lại sau.',
    'Contract is not pending':
      'Hợp đồng không ở trạng thái chờ thanh toán (nếu hợp đồng đang hiệu lực, vui lòng chọn kèm phụ lục chờ thanh toán).',
    'Contract is not ready for payment':
      'Hợp đồng chưa đủ điều kiện thanh toán.',
    'Family already has an active contract':
      'Hộ gia đình đã có một hợp đồng khác đang hiệu lực.',
    'Contract payment has already been recorded':
      'Hợp đồng này đã được ghi nhận thanh toán.',
    'Billing contract not found':
      'Không tìm thấy hợp đồng hoặc phụ lục cần thu tiền.',
    'Payment or contract not found':
      'Không tìm thấy hợp đồng hoặc yêu cầu thanh toán.',
    'Payment request not found': 'Không tìm thấy yêu cầu thanh toán.',
    'A paid request cannot be cancelled':
      'Không thể hủy yêu cầu thanh toán đã được xác nhận chi trả.',
    'Invalid contract payment amount':
      'Số tiền thanh toán của hợp đồng không hợp lệ.',
    'Demo contracts and live contracts must use separate payment environments':
      'Hợp đồng dữ liệu thử và hợp đồng thật phải dùng hai môi trường thanh toán riêng biệt.',
  };

  const translated = Object.entries(exactMap).find(
    ([source]) => source.toLowerCase() === message.toLowerCase(),
  )?.[1];
  if (translated) return translated;

  const apiCodeMatch = /^API error \((\d+)\)$/i.exec(message);
  if (apiCodeMatch) {
    const code = Number(apiCodeMatch[1]);
    if (code === 401)
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (code === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (code === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
    if (code === 409)
      return 'Dữ liệu đã thay đổi hoặc bị xung đột. Vui lòng tải lại trang.';
    if (code === 400 || code === 422) {
      return 'Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin.';
    }
    if (code >= 500)
      return 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.';
    return safeFallback;
  }

  // Dịch nhanh các mẫu thông báo class-validator mặc định bằng tiếng Anh nếu còn sót
  if (/must be a UUID/i.test(message)) {
    return 'Mã định danh không đúng định dạng UUID hợp lệ.';
  }
  if (/must be an integer number/i.test(message)) {
    return 'Giá trị số phải là số nguyên hợp lệ.';
  }
  if (/must be a valid ISO 8601 date string/i.test(message)) {
    return 'Thời điểm nhập vào chưa đúng định dạng ngày giờ hợp lệ.';
  }
  if (/should not exist$/i.test(message)) {
    return 'Yêu cầu chứa trường dữ liệu không được hỗ trợ.';
  }

  return hasVietnameseText(message) ? message : safeFallback;
}

/**
 * Trích xuất thông điệp lỗi thân thiện bằng tiếng Việt từ các phản hồi API của NestJS
 * Hỗ trợ chuẩn RFC 7807 Problem Details, class-validator array, và ApiError wrapper.
 */
type ErrorRecord = Record<string, unknown>;
function asRecord(value: unknown): ErrorRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as ErrorRecord)
    : undefined;
}

function invalidReason(payload: ErrorRecord): string | undefined {
  const nestedError = asRecord(payload.error);
  for (const params of [
    nestedError?.invalidParams,
    payload.invalidParams,
  ]) {
    if (!Array.isArray(params)) continue;
    const messages = params
      .map((param) => {
        const record = asRecord(param);
        const msg = record?.message ?? record?.reason;
        return typeof msg === 'string' && msg.trim() ? msg.trim() : '';
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join(' ');
  }
  for (const conditions of [
    nestedError?.conditions,
    payload.conditions,
  ]) {
    if (!Array.isArray(conditions)) continue;
    const messages = conditions
      .map((cond) => {
        const record = asRecord(cond);
        const msg = record?.message;
        return typeof msg === 'string' && msg.trim() ? msg.trim() : '';
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join(' ');
  }
  return undefined;
}

export function extractErrorMessage(
  error: unknown,
  fallback = DEFAULT_ERROR_MESSAGE,
): string {
  const safeFallback = localizeApiErrorMessage(fallback);
  if (!error) return safeFallback;
  if (typeof error === 'string')
    return localizeApiErrorMessage(error, safeFallback);
  const root = asRecord(error);
  if (!root) return safeFallback;
  const response = asRecord(root.response);
  const payloads = [response?.data, root.data, root.details, root]
    .map(asRecord)
    .filter((value): value is ErrorRecord => Boolean(value));

  // Lỗi của trường cụ thể luôn đứng trước thông báo HTTP chung ở mọi dạng bọc.
  for (const payload of payloads) {
    const reason = invalidReason(payload);
    if (reason) return localizeApiErrorMessage(reason, safeFallback);
  }
  for (const payload of payloads) {
    if (Array.isArray(payload.message) && payload.message.length) {
      return payload.message
        .map((message) =>
          localizeApiErrorMessage(String(message), safeFallback),
        )
        .join('; ');
    }
    const nested = asRecord(payload.error);
    // Ưu tiên error.detail theo chuẩn mới (không dùng root message chung chung).
    const candidates = [
      nested?.detail,
      payload.message,
      payload.detail,
      nested?.message,
      payload.title,
    ];
    const specific = candidates.find(
      (value): value is string =>
        typeof value === 'string' &&
        Boolean(value.trim()) &&
        hasVietnameseText(value),
    );
    if (specific) return specific.trim();
    const candidate = candidates.find(
      (value): value is string =>
        typeof value === 'string' && Boolean(value.trim()),
    );
    if (candidate) return localizeApiErrorMessage(candidate, safeFallback);
  }
  const status = response?.status ?? root.status;
  return typeof status === 'number'
    ? localizeApiErrorMessage(`API error (${status})`, safeFallback)
    : safeFallback;
}
