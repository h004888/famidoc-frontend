// Đổi mã lỗi của backend thành câu dễ đọc trên giao diện.
export const BLOCKING_REASON_LABELS: Record<string, string> = {
  FAMILY_SIGNATURE_REQUIRED:
    'Đại diện hộ gia đình chưa hoàn tất chữ ký số trên hợp đồng 4 bên.',
  ADMIN_SIGNATURE_REQUIRED:
    'Ban quản trị FamiDoc chưa hoàn tất chữ ký số trên hợp đồng 4 bên.',
  FACILITY_SIGNATURE_REQUIRED:
    'Cơ sở y tế chưa hoàn tất chữ ký số trên hợp đồng 4 bên.',
  DOCTOR_SIGNATURE_REQUIRED:
    'Bác sĩ phụ trách chưa hoàn tất chữ ký số trên hợp đồng 4 bên.',
  FACILITY_ASSIGNMENT_REQUIRED:
    'Hợp đồng chưa được gán cơ sở y tế phụ trách.',
  DOCTOR_ASSIGNMENT_REQUIRED:
    'Hợp đồng chưa có bác sĩ gia đình phụ trách.',
  DOCTOR_VERIFICATION_REQUIRED:
    'Cơ sở y tế hoặc bác sĩ phụ trách chưa hoàn tất điều kiện kích hoạt: cơ sở cần có hợp đồng cung ứng nhân lực B2B còn hiệu lực và hồ sơ bác sĩ phải được xác minh.',
  PANEL_CAPACITY_UNAVAILABLE:
    'Bác sĩ phụ trách đã đạt giới hạn số hộ gia đình nhận chăm sóc. Vui lòng chọn bác sĩ khác.',
  CONTRACT_TERM_NOT_CURRENT:
    'Thời hạn hợp đồng chưa bắt đầu hoặc đã hết hiệu lực tại thời điểm thanh toán.',
  ADDITIONAL_FAMILY_MEMBERS_PAYMENT_REQUIRED:
    'Số thành viên đang hoạt động của hộ gia đình vượt quá số suất trên hợp đồng. Vui lòng thanh toán bổ sung cho các thành viên tăng thêm.',
  CONTRACT_CANCELLED:
    'Hợp đồng đã bị hủy nên không thể tiếp tục thanh toán.',
  VERIFIED_PAYMENT_REQUIRED:
    'Chưa ghi nhận giao dịch chuyển khoản được xác minh cho hợp đồng này.',
  FAMILY_ALREADY_HAS_ACTIVE_CONTRACT:
    'Hộ gia đình đang có một hợp đồng khác còn hiệu lực.',
};

export const ADDENDUM_TYPE_LABELS: Record<string, string> = {
  QUOTA_EXPANSION: 'Mở rộng lượt khám',
  TERM_EXTENSION: 'Gia hạn thời hạn',
  MEMBER_EXTENSION: 'Bổ sung thành viên',
};

// Dùng cùng mẫu nhận diện với backend. Mã FD sẽ được hệ thống tự thêm.
const EMBEDDED_FD_PAYMENT_CODE_PATTERN =
  /(?:^|[^A-Z0-9])(FD(?:[A-F0-9]{32}|[A-F0-9]{24}|(?=[A-Z0-9]*[0-9])[A-Z0-9]{8}|[0-9]{6}))(?=$|[^A-Z0-9])/;

export function hasEmbeddedPaymentCode(content: string): boolean {
  return EMBEDDED_FD_PAYMENT_CODE_PATTERN.test(content.toUpperCase());
}

export function readBlockingReasonsFromError(error: unknown): string[] {
  const err = error as {
    details?: { error?: { blockingReasons?: unknown }; blockingReasons?: unknown };
    response?: { data?: { error?: { blockingReasons?: unknown }; blockingReasons?: unknown } };
  } | null;
  const raw =
    err?.details?.error?.blockingReasons ??
    err?.details?.blockingReasons ??
    err?.response?.data?.error?.blockingReasons ??
    err?.response?.data?.blockingReasons;
  if (!Array.isArray(raw)) return [];
  return raw.filter((reason): reason is string => typeof reason === 'string');
}

export function describeBlockingReasons(codes: string[]): string[] {
  const seen = new Set<string>();
  const messages: string[] = [];
  for (const code of codes) {
    const label =
      BLOCKING_REASON_LABELS[code] ?? `Lý do chưa xác định (${code}).`;
    // Một lỗi chỉ hiện một lần, dù backend gửi mã đó nhiều lần.
    if (seen.has(label)) continue;
    seen.add(label);
    messages.push(label);
  }
  return messages;
}
