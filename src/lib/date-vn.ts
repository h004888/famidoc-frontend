/**
 * Trả về chuỗi ngày YYYY-MM-DD hiện tại theo múi giờ Việt Nam (UTC+7).
 */
export function getTodayInVietnamYmd(now: Date = new Date()): string {
  const vnTime = new Date(now.getTime() + 7 * 3600 * 1000);
  const year = vnTime.getUTCFullYear();
  const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vnTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Kiểm tra chuỗi ngày YYYY-MM-DD có hợp lệ và không lớn hơn ngày hôm nay tại Việt Nam (UTC+7).
 */
export function isValidPastOrTodayVietnamDate(
  rawDate: string,
  now: Date = new Date(),
): boolean {
  const trimmed = rawDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const [y, m, d] = trimmed.split('-').map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d
  ) {
    return false;
  }
  return trimmed <= getTodayInVietnamYmd(now);
}
