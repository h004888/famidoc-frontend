import { z } from 'zod';

export const loginRoleSchema = z.enum(['PATIENT', 'DOCTOR', 'FACILITY', 'FAMILY', 'ADMIN']);
export type LoginRole = z.infer<typeof loginRoleSchema>;

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .max(11, 'Số điện thoại không quá 11 số')
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không đúng định dạng Việt Nam'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(32, 'Mật khẩu tối đa 32 ký tự'),
  role: loginRoleSchema.default('FAMILY'),
  rememberMe: z.boolean().optional().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerFamilySchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(70, 'Họ và tên tối đa 70 ký tự'),
  phone: z
    .string()
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không đúng định dạng Việt Nam'),
  email: z
    .string()
    .email('Email không đúng định dạng')
    .optional()
    .or(z.literal('')),
  identityCard: z
    .string()
    .length(12, 'Số CCCD phải có đúng 12 chữ số')
    .regex(/^[0-9]{12}$/, 'Số CCCD chỉ chứa chữ số'),
  relationship: z
    .string()
    .min(1, 'Vui lòng chọn vai trò quan hệ trong gia đình'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});
export type RegisterFamilyInput = z.infer<typeof registerFamilySchema>;

export const forgotPasswordSchema = z.object({
  contact: z
    .string()
    .min(1, 'Vui lòng nhập Email hoặc Số điện thoại')
    .refine(
      (val) =>
        /^(0[3|5|7|8|9])+([0-9]{8})$/.test(val) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      {
        message: 'Vui lòng nhập đúng định dạng Email hoặc Số điện thoại Việt Nam',
      }
    ),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
