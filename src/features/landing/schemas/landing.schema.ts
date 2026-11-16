import { z } from 'zod';

export const VIETNAM_PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;

export const consultationLeadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự'),
  phone: z
    .string()
    .trim()
    .regex(VIETNAM_PHONE_REGEX, 'Số điện thoại không hợp lệ'),
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Định dạng email không hợp lệ'),
  healthNeeds: z
    .string()
    .trim()
    .min(10, 'Vui lòng mô tả nhu cầu tối thiểu 10 ký tự')
    .max(1000, 'Nội dung nhu cầu tối đa 1000 ký tự'),
  preferredPackageId: z
    .string()
    .uuid('ID gói chăm sóc phải là UUID hợp lệ')
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
