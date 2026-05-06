import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { userController } from './user.controller';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './user.schema';

export const usersRouter = Router();

usersRouter.get(
  '/',
  validate(listUsersQuerySchema, 'query'),
  userController.list,
);

usersRouter.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  userController.getOne,
);

usersRouter.post(
  '/',
  validate(createUserSchema, 'body'),
  userController.create,
);

usersRouter.put(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema, 'body'),
  userController.update,
);

usersRouter.delete(
  '/:id',
  validate(userIdParamSchema, 'params'),
  userController.remove,
);
