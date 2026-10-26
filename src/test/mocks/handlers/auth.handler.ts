import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const authHandlers = [
  http.post(`${API_URL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { phone?: string; password?: string; role?: string };
    if (!body.phone || !body.password) {
      return HttpResponse.json({ message: 'Thiếu số điện thoại hoặc mật khẩu' }, { status: 400 });
    }
    if (body.password === 'WrongPassword') {
      return HttpResponse.json({ message: 'Số điện thoại hoặc mật khẩu không chính xác' }, { status: 401 });
    }
    return HttpResponse.json({
      token: 'jwt-mock-token-family-123456',
      user: {
        id: 'usr-1001',
        fullName: 'Nguyễn Văn An',
        phone: body.phone,
        role: body.role || 'FAMILY',
      },
    }, { status: 200 });
  }),

  http.post(`${API_URL}/api/v1/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { phone?: string; fullName?: string; identityCard?: string };
    if (!body.phone || !body.fullName || !body.identityCard) {
      return HttpResponse.json({ message: 'Vui lòng điền đủ thông tin bắt buộc' }, { status: 400 });
    }
    return HttpResponse.json({
      id: 'usr-new-002',
      message: 'Đăng ký tài khoản đại diện thành công',
      status: 'ACTIVE',
    }, { status: 201 });
  }),

  http.post(`${API_URL}/api/v1/auth/forgot-password`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; phone?: string };
    if (!body.email && !body.phone) {
      return HttpResponse.json({ message: 'Vui lòng cung cấp email hoặc số điện thoại' }, { status: 400 });
    }
    return HttpResponse.json({
      message: 'Mã xác thực OTP đã được gửi đến phương thức liên hệ của bạn',
      expiresInSeconds: 300,
    }, { status: 200 });
  }),
];
