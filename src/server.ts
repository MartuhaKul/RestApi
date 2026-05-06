import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, closing server...');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server close');
      process.exit(1);
    }
    logger.info('Server closed gracefully');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception, shutting down');
  process.exit(1);
});
