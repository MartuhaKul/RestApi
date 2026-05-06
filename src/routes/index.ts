import { Router } from 'express';
import { usersRouter } from '../modules/users/user.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

apiRouter.use('/users', usersRouter);
