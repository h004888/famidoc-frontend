export const VN_MOBILE_PHONE_REGEX = /^(0[35789][0-9]{8})$/;

export function normalizeVietnameseMobilePhone(raw: string): string {
  const cleaned = raw.replace(/[\s.\-()]/g, '').trim();
  if (!cleaned) return '';

  if (/^\+84[35789][0-9]{8}$/.test(cleaned)) {
    return `0${cleaned.slice(3)}`;
  }
  if (/^84[35789][0-9]{8}$/.test(cleaned)) {
    return `0${cleaned.slice(2)}`;
  }
  if (/^[35789][0-9]{8}$/.test(cleaned)) {
    return `0${cleaned}`;
  }
  return cleaned;
}

export function isValidVietnameseMobilePhone(raw: string): boolean {
  return VN_MOBILE_PHONE_REGEX.test(normalizeVietnameseMobilePhone(raw));
}
