import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/http/errors';
import { getApiErrorCode } from '../api-error-code';

describe('getApiErrorCode', () => {
  it('đọc code từ details của ApiError', () => {
    const err = new ApiError('Chưa đến giờ khám', 409, {
      code: 'VISIT_NOT_STARTED',
      message: 'Chưa đến giờ khám',
    });
    expect(getApiErrorCode(err)).toBe('VISIT_NOT_STARTED');
  });

  it('đọc code từ body nếu có', () => {
    const err = Object.assign(new Error('Locked'), {
      body: { code: 'VISIT_LOCKED' },
    });
    expect(getApiErrorCode(err)).toBe('VISIT_LOCKED');
  });

  it('trả về undefined với Error thường hoặc null', () => {
    expect(getApiErrorCode(new Error('x'))).toBeUndefined();
    expect(getApiErrorCode(null)).toBeUndefined();
    expect(getApiErrorCode(undefined)).toBeUndefined();
  });
});
