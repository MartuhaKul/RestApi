import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { HttpError } from '../utils/http-error';

type Source = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        HttpError.unprocessable('Validation failed', result.error.flatten().fieldErrors),
      );
    }
    // Replace with parsed (and coerced) values
    Object.defineProperty(req, source, { value: result.data, writable: true });
    next();
  };
