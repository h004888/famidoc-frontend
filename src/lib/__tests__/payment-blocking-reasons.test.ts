import { describe, expect, it } from 'vitest';
import {
  describeBlockingReasons,
  hasEmbeddedPaymentCode,
  readBlockingReasonsFromError,
} from '../payment-blocking-reasons';
import { ApiError } from '../http/errors';

describe('Payment codes and blocking reasons', () => {
  it.each([
    'THU PHI FD123456',
    'fd8k4p9w2m',
    `FD${'A'.repeat(24)}`,
    `FD${'B'.repeat(32)}`,
    'THU FD123456 VA FD8K4P9W2M',
  ])('detects a supported embedded code: %s', (content) => {
    expect(hasEmbeddedPaymentCode(content)).toBe(true);
  });
  it.each([
    'THANH TOAN HOP DONG',
    'FDABCDEFGH',
    'PREFIXFD123456',
    'FD123456SUFFIX',
    'FD12345',
  ])('does not block a normal description: %s', (content) => {
    expect(hasEmbeddedPaymentCode(content)).toBe(false);
  });
  it('reads preserved codes from ApiError and removes duplicate descriptions', () => {
    const error = new ApiError('Chưa đủ điều kiện.', 409, {
      error: {
        blockingReasons: [
          'ADMIN_SIGNATURE_REQUIRED',
          'ADMIN_SIGNATURE_REQUIRED',
          42,
          'DOCTOR_ASSIGNMENT_REQUIRED',
        ],
      },
    });
    const messages = describeBlockingReasons(
      readBlockingReasonsFromError(error),
    );
    expect(messages).toHaveLength(2);
    expect(messages.join(' ')).toContain('chữ ký số');
    expect(messages.join(' ')).toContain('bác sĩ gia đình');
  });
  it('handles the response wrapper and an unknown code', () => {
    const codes = readBlockingReasonsFromError({
      response: { data: { blockingReasons: ['NEW_REASON'] } },
    });
    expect(describeBlockingReasons(codes)).toEqual([
      'Lý do chưa xác định (NEW_REASON).',
    ]);
    expect(readBlockingReasonsFromError(null)).toEqual([]);
  });
});
