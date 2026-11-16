import React from 'react';
import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';

export const metadata: Metadata = {
  title: 'Đổi mật khẩu khởi tạo | FamiDoc Portal',
  description: 'Đổi mật khẩu khởi tạo an toàn để kích hoạt phiên làm việc bảo mật.',
};

export default function ChangePasswordPage() {
  return <ChangePasswordForm />;
}
