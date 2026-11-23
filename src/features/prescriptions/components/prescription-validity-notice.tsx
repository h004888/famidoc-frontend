import type { FamilyPrescription } from '@/lib/api/prescriptions.api';

export function PrescriptionValidityNotice({
  status,
  validUntil,
  className = '',
}: {
  status: FamilyPrescription['status'];
  validUntil?: string | null;
  className?: string;
}) {
  let text: string;
  if (status === 'CANCELLED') {
    text =
      'Đơn cũ đã được thu hồi / thay thế — không còn hiệu lực mua, lĩnh thuốc.';
  } else if (status === 'EXPIRED') {
    text = 'Đơn thuốc đã hết hạn lĩnh thuốc (quá 05 ngày kể từ ngày kê đơn).';
  } else {
    const expiry = validUntil ? new Date(validUntil) : null;
    text =
      expiry && Number.isFinite(expiry.getTime())
        ? `Đơn thuốc có giá trị mua, lĩnh thuốc trong thời hạn tối đa 05 ngày (đến ${new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC' }).format(expiry)}).`
        : 'Bản lưu chưa có hạn lĩnh thuốc. Vui lòng kiểm tra lại thông tin.';
  }
  return <p className={className}>{text}</p>;
}
