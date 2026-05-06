import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './middleware/request-logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRouter } from './routes';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(requestLogger);

  app.get('/', (_req, res) => {
    res.json({
      name: 'rest-api',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        users: '/api/v1/users',
      },
    });
  });

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
