import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error';
import { logger } from '../config/logger';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'UNPROCESSABLE_ENTITY',
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Malformed JSON in request body' },
    });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
  });
};
