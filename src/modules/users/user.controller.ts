import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { userService } from './user.service';
import {
  CreateUserBody,
  ListUsersQuery,
  UpdateUserBody,
} from './user.schema';

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const result = userService.list(query);
    res.status(200).json(result);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const user = userService.getById(req.params.id);
    res.status(200).json({ data: user });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateUserBody;
    const user = userService.create(body);
    res
      .status(201)
      .location(`/api/v1/users/${user.id}`)
      .json({ data: user });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateUserBody;
    const user = userService.update(req.params.id, body);
    res.status(200).json({ data: user });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    userService.remove(req.params.id);
    res.status(204).send();
  }),
};
