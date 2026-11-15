export const isApiEnvelope = (
  payload: unknown
): payload is { success: true; data: unknown } =>
  Boolean(
    payload &&
      typeof payload === 'object' &&
      (payload as { success?: unknown }).success === true &&
      'data' in (payload as Record<string, unknown>)
  );

/** Bóc dữ liệu từ envelope `{ success: true, data }` của Backend, giữ nguyên nếu đã là raw payload. */
export const unwrapApiEnvelope = <T>(payload: unknown): T =>
  isApiEnvelope(payload) ? (payload.data as T) : (payload as T);
