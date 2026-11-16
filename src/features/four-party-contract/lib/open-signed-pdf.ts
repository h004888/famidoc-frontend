import { contractsApi } from '@/lib/api';
import { ApiError } from '@/lib/http/errors';

/** Thời gian giữ object URL trước khi thu hồi (ms) để trình duyệt kịp mở tab PDF. */
const OBJECT_URL_TTL_MS = 60_000;

/**
 * Chuyển lỗi tải PDF đã ký thành thông báo tiếng Việt hiển thị được trực tiếp trên UI.
 * Backend trả `409` khi hợp đồng chưa đủ 4/4 chữ ký.
 */
export function describeSignedPdfError(error: unknown): string {
  const status =
    error instanceof ApiError
      ? error.status
      : (error as { status?: number } | null)?.status;

  if (status === 409) {
    return 'Hợp đồng chưa hoàn tất đủ 4/4 chữ ký nên chưa thể xuất bản PDF đã ký. Vui lòng thử lại sau khi cả bốn bên ký xong.';
  }
  if (status === 403) {
    return 'Bạn không có quyền tải bản PDF đã ký của hợp đồng này.';
  }
  if (status === 404) {
    return 'Không tìm thấy hợp đồng để tải bản PDF đã ký.';
  }
  return 'Không thể tải tệp PDF đã ký từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
}

/**
 * Tải bản PDF hợp đồng đã ký từ endpoint proxy (`/api/v1/contracts/medical/:id/signed-pdf`),
 * mở trong tab mới và thu hồi object URL sau một khoảng trễ an toàn.
 *
 * Dùng chung cho khung ký Documenso và các trang theo dõi hợp đồng. Hàm ném `Error`
 * với thông báo tiếng Việt để nơi gọi hiển thị inline (kèm thao tác thử lại).
 */
export async function openSignedPdf(contractId: string): Promise<void> {
  let blob: Blob;
  try {
    blob = await contractsApi.downloadSignedPdf(contractId);
  } catch (error) {
    throw new Error(describeSignedPdfError(error));
  }

  if (
    typeof window === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    throw new Error(
      'Trình duyệt hiện tại không hỗ trợ mở tệp PDF đã ký. Vui lòng thử trên trình duyệt khác.'
    );
  }

  const objectUrl = URL.createObjectURL(blob);
  // `noopener,noreferrer` khiến trình duyệt trả `null` dù tab đã mở, nên không
  // dùng giá trị trả về để kết luận popup bị chặn.
  window.open(objectUrl, '_blank', 'noopener,noreferrer');

  setTimeout(() => URL.revokeObjectURL(objectUrl), OBJECT_URL_TTL_MS);
}
