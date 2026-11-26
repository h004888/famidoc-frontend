export function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as {
    code?: unknown;
    details?: unknown;
    body?: unknown;
  };
  if (err.details && typeof err.details === 'object') {
    const code = (err.details as { code?: unknown }).code;
    if (typeof code === 'string' && code.length > 0) return code;
  }
  if (err.body && typeof err.body === 'object') {
    const code = (err.body as { code?: unknown }).code;
    if (typeof code === 'string' && code.length > 0) return code;
  }
  if (typeof err.code === 'string' && err.code.length > 0) {
    return err.code;
  }
  return undefined;
}
