import type { ComplaintOutcome, ComplaintStatus } from './api/admin.api';

export type ComplaintCategory =
  | 'DOCTOR_ABSENT'
  | 'MISSED_VISIT'
  | 'UNAUTHORIZED_FEE'
  | 'FAMILY_UNCOOPERATIVE'
  | 'OTHER';

export const COMPLAINT_CATEGORY_LABELS: Record<string, string> = {
  // Danh mục chuẩn khớp 100% với SubmitIncidentComplaintDto ở backend
  DOCTOR_ABSENT: 'Bác sĩ vắng mặt / Không đến khám',
  MISSED_VISIT: 'Bỏ ca / Trễ hẹn khám',
  UNAUTHORIZED_FEE: 'Thu thêm phụ phí ngoài hợp đồng',
  FAMILY_UNCOOPERATIVE: 'Gia đình chưa phối hợp theo lịch hẹn',
  OTHER: 'Sự cố / Phản ánh dịch vụ khác',
  // Dự phòng hiển thị tiếng Việt cho dữ liệu cũ nếu có trong lịch sử
  CLINICAL_QUALITY: 'Chất lượng chuyên môn y tế',
  ATTITUDE: 'Thái độ & Quy tắc ứng xử',
  BILLING: 'Thanh toán & Gói dịch vụ',
  COMMUNICATION: 'Liên lạc & Phối hợp',
};

export const FAMILY_COMPLAINT_CATEGORIES: Array<{
  value: ComplaintCategory;
  label: string;
}> = [
  { value: 'DOCTOR_ABSENT', label: COMPLAINT_CATEGORY_LABELS.DOCTOR_ABSENT },
  { value: 'MISSED_VISIT', label: COMPLAINT_CATEGORY_LABELS.MISSED_VISIT },
  {
    value: 'UNAUTHORIZED_FEE',
    label: COMPLAINT_CATEGORY_LABELS.UNAUTHORIZED_FEE,
  },
  { value: 'OTHER', label: COMPLAINT_CATEGORY_LABELS.OTHER },
];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Chờ thụ lý',
  INVESTIGATING: 'Đang xác minh',
  RESOLVED: 'Đã kết luận',
  CLOSED: 'Đã đóng',
};

export const COMPLAINT_OUTCOME_DESCRIPTIONS: Record<
  ComplaintOutcome,
  { label: string; desc: string }
> = {
  NO_VIOLATION: {
    label: 'Không có vi phạm',
    desc: 'Sự việc do yếu tố khách quan hoặc hiểu lầm thông tin, không phát hiện vi phạm y tế.',
  },
  WARNING: {
    label: 'Nhắc nhở / Khiển trách',
    desc: 'Nhắc nhở bác sĩ hoặc cá nhân liên quan tuân thủ nghiêm túc quy tắc ứng xử và tác phong.',
  },
  SERVICE_CORRECTION: {
    label: 'Điều chỉnh dịch vụ',
    desc: 'Đổi bác sĩ gia đình phụ trách mới, bù buổi khám hoặc điều chỉnh quyền lợi gói dịch vụ.',
  },
  REFERRED_TO_FACILITY: {
    label: 'Chuyển CSYT xử lý chuyên môn',
    desc: 'Chuyển hồ sơ sang Hội đồng chuyên môn của Cơ sở Y tế để xem xét trách nhiệm chuyên khoa.',
  },
};

export function getComplaintCategoryLabel(category?: string | null): string {
  if (!category) return 'Khiếu nại sự cố';
  return COMPLAINT_CATEGORY_LABELS[category] ?? category;
}
