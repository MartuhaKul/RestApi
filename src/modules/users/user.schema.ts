import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  age: z.number().int().min(0).max(150),
});

export const updateUserSchema = createUserSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export type CreateUserBody = z.infer<typeof createUserSchema>;
export type UpdateUserBody = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
