export function formatVndCurrency(amount: number): string {
  if (isNaN(amount) || amount < 0) {
    return 'Liên hệ';
  }
  const formatted = new Intl.NumberFormat('vi-VN').format(amount);
  return `${formatted}đ / tháng`;
}

export function formatDoctorRating(rating: number, consultations: string): string {
  return `${rating.toFixed(1)} (${consultations})`;
}

export function formatEmergencyHotline(hotline: string): string {
  if (hotline.length === 8) {
    return `${hotline.slice(0, 4)} ${hotline.slice(4)}`;
  }
  return hotline;
}
