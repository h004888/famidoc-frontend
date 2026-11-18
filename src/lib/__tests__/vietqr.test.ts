import { describe, expect, it } from 'vitest';
import {
  FALLBACK_VIETQR_BANKS,
  buildVietQrQuickLinkUrl,
  formatFacilityBankName,
  isValidVietQrAccountNumber,
  resolveBankByInput,
  resolveVietQrBankId,
  sanitizeVietQrAddInfo,
} from '../vietqr';

describe('VietQR Quick Link helpers', () => {
  it('validates account numbers according to VietQR Quick Link rules (1..19 alphanumeric, not all zeros)', () => {
    expect(isValidVietQrAccountNumber('0011002233445')).toBe(true);
    expect(isValidVietQrAccountNumber('FAMIDOC01')).toBe(true);
    expect(isValidVietQrAccountNumber('')).toBe(false);
    expect(isValidVietQrAccountNumber('00000000')).toBe(false);
    expect(isValidVietQrAccountNumber('12345678901234567890')).toBe(false);
    expect(isValidVietQrAccountNumber('1234-5678')).toBe(false);
  });

  it('sanitizes addInfo by stripping accents/special chars and capping at 50 chars', () => {
    expect(sanitizeVietQrAddInfo('Đóng góp quỹ Vắc-xin #2026!')).toBe(
      'Dong gop quy Vac xin 2026',
    );
    const longText = 'A'.repeat(70);
    expect(sanitizeVietQrAddInfo(longText)).toHaveLength(50);
  });

  it('builds SVG-first Quick Link URL with amount, addInfo, and accountName', () => {
    const url = buildVietQrQuickLinkUrl({
      bankId: '970436',
      accountNumber: '0071000889922',
      amount: 850000,
      addInfo: 'DOSOAT ST 2026 10',
      accountName: 'CTCP BENH VIEN AN SINH',
      template: 'compact2',
    });

    expect(url).toBe(
      'https://img.vietqr.io/image/970436-0071000889922-compact2.svg?amount=850000&addInfo=DOSOAT+ST+2026+10&accountName=CTCP+BENH+VIEN+AN+SINH',
    );
  });

  it('rejects invalid bankId, invalid accountNumber, or negative/over-13-digit amount', () => {
    expect(
      buildVietQrQuickLinkUrl({ bankId: 'Vietcombank VN', accountNumber: '00112233' }),
    ).toBeNull();
    expect(
      buildVietQrQuickLinkUrl({ bankId: '970436', accountNumber: '000000' }),
    ).toBeNull();
    expect(
      buildVietQrQuickLinkUrl({
        bankId: '970436',
        accountNumber: '00112233',
        amount: -100,
      }),
    ).toBeNull();
    expect(
      buildVietQrQuickLinkUrl({
        bankId: '970436',
        accountNumber: '00112233',
        amount: 10000000000000,
      }),
    ).toBeNull();
  });

  it('resolves legacy bankName inputs and prefers bankBin when available', () => {
    expect(
      resolveVietQrBankId(FALLBACK_VIETQR_BANKS, {
        bankBin: '970415',
        bankName: 'Ngân hàng gì đó',
      }),
    ).toBe('970415');

    expect(
      resolveBankByInput(FALLBACK_VIETQR_BANKS, {
        bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
      })?.bin,
    ).toBe('970436');

    expect(
      resolveVietQrBankId(FALLBACK_VIETQR_BANKS, {
        bankName: 'MB Bank',
      }),
    ).toBe('970422');
  });

  it('formats facility bankName cleanly within 100 characters', () => {
    const label = formatFacilityBankName({
      code: 'VBA',
      shortName: 'Agribank',
      name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    });
    expect(label.length).toBeLessThanOrEqual(100);
    expect(label).toContain('Agribank');
  });
});
