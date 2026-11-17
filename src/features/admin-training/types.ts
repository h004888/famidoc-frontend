export type TrainingTargetAudience = 'DOCTOR' | 'FACILITY' | 'STAFF' | 'ALL';

export type TrainingFormat = 'ONLINE_VIDEO' | 'LIVE_WEBINAR' | 'HYBRID';

export type TrainingStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface TrainingModuleItem {
  id: string;
  title: string;
  durationMinutes: number;
}

export interface TrainingCourse {
  id: string;
  code: string;
  title: string;
  category: string;
  audience: TrainingTargetAudience;
  format: TrainingFormat;
  status: TrainingStatus;
  instructor: string;
  cmeCredits: number;
  description: string;
  resourceUrl?: string;
  isMandatory: boolean;
  enrolledCount: number;
  completionRate: number;
  modules: TrainingModuleItem[];
  updatedAt: string;
}

export const TRAINING_STORAGE_KEY = 'famidoc_admin_training_courses_v1';

export const AUDIENCE_LABELS: Record<TrainingTargetAudience, string> = {
  DOCTOR: 'Bác sĩ Gia đình (CCHN)',
  FACILITY: 'Cơ sở Y tế Đối tác',
  STAFF: 'Điều dưỡng & Điều phối viên',
  ALL: 'Toàn hệ thống FamiDoc',
};

export const FORMAT_LABELS: Record<TrainingFormat, string> = {
  ONLINE_VIDEO: 'E-learning Video',
  LIVE_WEBINAR: 'Đào tạo trực tuyến Live',
  HYBRID: 'Kết hợp (Hybrid + Thực hành)',
};

export const STATUS_LABELS: Record<TrainingStatus, string> = {
  PUBLISHED: 'Đang mở đăng ký',
  DRAFT: 'Bản nháp',
  ARCHIVED: 'Đã lưu trữ',
};

export const INITIAL_TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'TRN-001',
    code: 'CME-FAM-101',
    title: 'Chuẩn hóa Bệnh án SOAP & Kê đơn Ký số HSM',
    category: 'Lâm sàng & Hồ sơ EMR',
    audience: 'DOCTOR',
    format: 'ONLINE_VIDEO',
    status: 'PUBLISHED',
    instructor: 'PGS.TS.BS Nguyễn Minh Tuấn · Hội Y học Gia đình',
    cmeCredits: 4,
    description:
      'Hướng dẫn quy trình thăm khám hộ gia đình, ghi nhận bệnh án chuẩn SOAP, kiểm tra tương tác thuốc và ký số đơn thuốc điện tử qua HSM Viettel-CA.',
    resourceUrl: 'https://academy.famidoc.vn/courses/cme-fam-101',
    isMandatory: true,
    enrolledCount: 142,
    completionRate: 91,
    modules: [
      { id: 'm-1', title: 'Tổng quan cấu trúc bệnh án SOAP chuẩn Bộ Y Tế', durationMinutes: 25 },
      { id: 'm-2', title: 'Quy trình kê đơn điện tử & xác thực ký số HSM', durationMinutes: 35 },
      { id: 'm-3', title: 'Thực hành xử lý tình huống khám tại nhà', durationMinutes: 30 },
    ],
    updatedAt: '2026-11-10T08:30:00.000Z',
  },
  {
    id: 'TRN-002',
    code: 'B2B-OPS-202',
    title: 'Điều phối Chuyển viện Fast-Track & Đối soát Doanh thu 85%',
    category: 'Vận hành CSYT & B2B',
    audience: 'FACILITY',
    format: 'HYBRID',
    status: 'PUBLISHED',
    instructor: 'Ban Điều hành Vận hành FamiDoc',
    cmeCredits: 0,
    description:
      'Quy chuẩn tiếp nhận ca chuyển viện khẩn cấp từ bác sĩ gia đình, gán nhân sự vào hợp đồng 4 bên và đối soát doanh thu định kỳ.',
    resourceUrl: 'https://academy.famidoc.vn/courses/b2b-ops-202',
    isMandatory: true,
    enrolledCount: 38,
    completionRate: 84,
    modules: [
      { id: 'm-4', title: 'Luồng chuyển tuyến Fast-Track & đồng bộ EMR', durationMinutes: 30 },
      { id: 'm-5', title: 'Gán bác sĩ CCHN & kiểm soát Panel Cap (BR-04)', durationMinutes: 20 },
    ],
    updatedAt: '2026-11-12T10:00:00.000Z',
  },
  {
    id: 'TRN-003',
    code: 'TELE-E2E-105',
    title: 'Kỹ năng Tư vấn Telemedicine WebRTC & An toàn Bảo mật HIPAA',
    category: 'Telehealth & Bảo mật',
    audience: 'DOCTOR',
    format: 'LIVE_WEBINAR',
    status: 'DRAFT',
    instructor: 'ThS.BS Trần Thu Hà · Trung tâm Telehealth',
    cmeCredits: 2,
    description:
      'Kỹ năng giao tiếp y khoa qua video HD, xử trí từ xa các dấu hiệu cảnh báo sớm và bảo vệ quyền riêng tư dữ liệu bệnh nhân.',
    resourceUrl: 'https://academy.famidoc.vn/courses/tele-e2e-105',
    isMandatory: false,
    enrolledCount: 0,
    completionRate: 0,
    modules: [
      { id: 'm-6', title: 'Thiết lập phòng khám WebRTC & kiểm tra kết nối', durationMinutes: 15 },
      { id: 'm-7', title: 'Xử trí cấp cứu ban đầu trước khi điều phối chuyển viện', durationMinutes: 40 },
    ],
    updatedAt: '2026-11-15T14:20:00.000Z',
  },
];
