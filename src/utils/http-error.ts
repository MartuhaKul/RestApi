export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  static badRequest(message = 'Bad Request', details?: unknown): HttpError {
    return new HttpError(400, message, 'BAD_REQUEST', details);
  }

  static notFound(message = 'Resource not found'): HttpError {
    return new HttpError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Conflict'): HttpError {
    return new HttpError(409, message, 'CONFLICT');
  }

  static unprocessable(message = 'Unprocessable Entity', details?: unknown): HttpError {
    return new HttpError(422, message, 'UNPROCESSABLE_ENTITY', details);
  }
}
