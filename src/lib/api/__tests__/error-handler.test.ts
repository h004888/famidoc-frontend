import { describe, expect, it } from 'vitest';
import { extractErrorMessage, localizeApiErrorMessage } from '../error-handler';

describe('Vietnamese API errors', () => {
  it.each([
    'Service Unavailable',
    'service unavailable',
    'Gateway Timeout',
    'Bad Gateway',
    'Request Timeout',
    'Failed to fetch',
    'Network Error',
  ])('localizes %s', (message) => {
    const result = localizeApiErrorMessage(message);
    expect(result).not.toBe(message);
    expect(result).toMatch(/dịch vụ|Dịch vụ|Máy chủ|máy chủ|Yêu cầu|kết nối/);
  });

  it('uses a Vietnamese fallback for unknown English errors, even with an English fallback', () => {
    expect(
      localizeApiErrorMessage(
        'Unexpected upstream connection failure',
        'Không tải được dữ liệu.',
      ),
    ).toBe('Không tải được dữ liệu.');
    expect(
      localizeApiErrorMessage(
        'Unexpected upstream connection failure',
        'API error (503)',
      ),
    ).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    expect(extractErrorMessage({}, 'API error (503)')).toMatch(
      /Hệ thống|Dịch vụ/,
    );
  });

  it.each([
    (payload: unknown) => payload,
    (payload: unknown) => ({ data: payload }),
    (payload: unknown) => ({ details: payload, message: 'API error (400)' }),
    (payload: unknown) => ({ response: { data: payload } }),
  ])(
    'prefers invalidParams over generic messages in each wrapper %#',
    (wrap) => {
      const reason = 'Lý do chuyển khoản chưa hợp lệ.';
      expect(
        extractErrorMessage(
          wrap({
            message: 'Bad Request',
            error: { invalidParams: [{ reason }] },
          }),
        ),
      ).toBe(reason);
      expect(
        extractErrorMessage(
          wrap({ message: 'Bad Request', invalidParams: [{ reason }] }),
        ),
      ).toBe(reason);
    },
  );

  it('preserves business errors and joins Vietnamese validation messages', () => {
    expect(
      extractErrorMessage({
        data: {
          message: 'Số tiền không khớp.',
          error: { detail: 'Bad Request' },
        },
      }),
    ).toBe('Số tiền không khớp.');
    expect(
      extractErrorMessage({
        data: { message: ['Thiếu mã giao dịch.', 'Thiếu chứng từ.'] },
      }),
    ).toBe('Thiếu mã giao dịch.; Thiếu chứng từ.');
    expect(extractErrorMessage(new Error('Lý do không hợp lệ.'))).toBe(
      'Lý do không hợp lệ.',
    );
  });

  it('handles missing payloads, network errors and a numeric HTTP status', () => {
    expect(extractErrorMessage(new TypeError('Failed to fetch'))).toContain(
      'Không thể kết nối',
    );
    expect(extractErrorMessage({ status: 401 })).toContain('Phiên đăng nhập');
    expect(extractErrorMessage(null, 'Không tải được dữ liệu.')).toBe(
      'Không tải được dữ liệu.',
    );
  });

  it('đọc đúng invalidParams[].message và conditions[].message theo chuẩn Unified Error (không có root message)', () => {
    expect(
      extractErrorMessage({
        details: {
          success: false,
          code: 422,
          data: null,
          meta: null,
          error: {
            title: 'Unprocessable Content',
            errorCode: 'VALIDATION_FAILED',
            detail: 'Tên gói phải có ít nhất 10 ký tự.',
            invalidParams: [
              {
                field: 'name',
                issue: 'MIN_LENGTH',
                message: 'Tên gói phải có ít nhất 10 ký tự.',
              },
            ],
          },
        },
      }),
    ).toBe('Tên gói phải có ít nhất 10 ký tự.');

    expect(
      extractErrorMessage({
        details: {
          success: false,
          code: 409,
          data: null,
          meta: null,
          error: {
            title: 'Conflict',
            errorCode: 'CARE_PACKAGE_RISK_ACK_REQUIRED',
            detail: 'Cần xác nhận cảnh báo P2.',
            conditions: [
              {
                code: 'P2',
                condition: 'acknowledgedWarnings phải chứa P2',
                message: 'Đơn giá 1.500.000đ lệch 58% so với giá tham chiếu 950.000đ.',
              },
            ],
          },
        },
      }),
    ).toBe('Đơn giá 1.500.000đ lệch 58% so với giá tham chiếu 950.000đ.');
  });

  it('localizes legacy English payment eligibility errors to Vietnamese', () => {
    expect(localizeApiErrorMessage('Contract is not pending')).toContain(
      'Hợp đồng không ở trạng thái chờ thanh toán',
    );
    expect(localizeApiErrorMessage('Contract is not ready for payment')).toBe(
      'Hợp đồng chưa đủ điều kiện thanh toán.',
    );
    expect(
      localizeApiErrorMessage('Family already has an active contract'),
    ).toBe('Hộ gia đình đã có một hợp đồng khác đang hiệu lực.');
  });
});
