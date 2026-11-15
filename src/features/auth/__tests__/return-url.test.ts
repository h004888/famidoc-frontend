import { describe, it, expect } from 'vitest';
import { resolveReturnUrl } from '../return-url';

describe('resolveReturnUrl', () => {
  it('giữ nguyên đường dẫn nội bộ kèm query string', () => {
    expect(resolveReturnUrl('/family/x?contractId=abc')).toBe(
      '/family/x?contractId=abc'
    );
    expect(
      resolveReturnUrl('/doctor/contracts/abc/review')
    ).toBe('/doctor/contracts/abc/review');
  });

  it('trả null với giá trị rỗng hoặc không phải chuỗi', () => {
    expect(resolveReturnUrl(null)).toBeNull();
    expect(resolveReturnUrl(undefined)).toBeNull();
    expect(resolveReturnUrl('')).toBeNull();
    expect(resolveReturnUrl('   ')).toBeNull();
  });

  it('chặn URL tuyệt đối ra ngoài ứng dụng', () => {
    expect(resolveReturnUrl('https://example.com')).toBeNull();
    expect(resolveReturnUrl('http://example.com/path')).toBeNull();
  });

  it('chặn đường dẫn mạng tuyệt đối', () => {
    expect(resolveReturnUrl('//example.com')).toBeNull();
    expect(resolveReturnUrl('/\\example.com')).toBeNull();
  });

  it('chặn giao thức không an toàn', () => {
    expect(resolveReturnUrl('javascript:alert(1)')).toBeNull();
    expect(resolveReturnUrl('data:text/html,x')).toBeNull();
  });

  it('không chặn dấu hai chấm nằm sau dấu gạch chéo đầu tiên', () => {
    expect(resolveReturnUrl('/family/x?at=10:30')).toBe('/family/x?at=10:30');
  });

  it('chặn ký tự điều khiển', () => {
    expect(resolveReturnUrl('/family/x\nSet-Cookie: a=b')).toBeNull();
  });
});
