import { z } from 'zod';

export const profileSettingsSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự').max(70, 'Họ và tên tối đa 70 ký tự'),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không đúng chuẩn Việt Nam'),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  birthDate: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  insuranceCardNumber: z.string().optional().or(z.literal('')),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
});
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Xác nhận mật khẩu mới không khớp',
  path: ['confirmNewPassword'],
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
