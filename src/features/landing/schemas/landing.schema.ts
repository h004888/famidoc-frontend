import { z } from 'zod';

export const VIETNAM_PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;

export const consultationLeadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(70, 'Họ tên tối đa 70 ký tự'),
  phoneNumber: z
    .string()
    .trim()
    .regex(VIETNAM_PHONE_REGEX, 'Số điện thoại không hợp lệ'),
  packageInterest: z.enum(['BASIC', 'FAMILY', 'ELDERLY', 'VIP'], {
    message: 'Gói dịch vụ quan tâm không hợp lệ',
  }),
  notes: z
    .string()
    .max(255, 'Ghi chú tối đa 255 ký tự')
    .optional(),
});

export type ConsultationLeadSchemaInput = z.infer<typeof consultationLeadSchema>;

export const landingSearchSchema = z.object({
  searchQuery: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập từ khóa tìm kiếm')
    .max(100, 'Từ khóa tìm kiếm tối đa 100 ký tự'),
});

export type LandingSearchSchemaInput = z.infer<typeof landingSearchSchema>;
