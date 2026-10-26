export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Phiên đăng nhập đã hết hạn') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Dữ liệu không hợp lệ', details?: unknown) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}
