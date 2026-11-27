export function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as {
    code?: unknown;
    details?: unknown;
    body?: unknown;
  };
  for (const container of [err.details, err.body]) {
    if (container && typeof container === 'object') {
      const record = container as {
        code?: unknown;
        error?: { errorCode?: unknown; code?: unknown };
      };
      if (typeof record.error?.errorCode === 'string' && record.error.errorCode.length > 0) {
        return record.error.errorCode;
      }
      if (typeof record.error?.code === 'string' && record.error.code.length > 0) {
        return record.error.code;
      }
      if (typeof record.code === 'string' && record.code.length > 0) {
        return record.code;
      }
    }
  }
  if (typeof err.code === 'string' && err.code.length > 0) {
    return err.code;
  }
  return undefined;
}
