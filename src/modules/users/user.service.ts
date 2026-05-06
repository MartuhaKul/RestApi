import { HttpError } from '../../utils/http-error';
import { UserRepository, userRepository } from './user.repository';
import { CreateUserInput, UpdateUserInput, User } from './user.types';

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  list(query: { page: number; limit: number; search?: string }) {
    const { items, total } = this.repo.findAll(query);
    return {
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  getById(id: string): User {
    const user = this.repo.findById(id);
    if (!user) throw HttpError.notFound(`User ${id} not found`);
    return user;
  }

  create(input: CreateUserInput): User {
    if (this.repo.findByEmail(input.email)) {
      throw HttpError.conflict(`User with email ${input.email} already exists`);
    }
    return this.repo.create(input);
  }

  update(id: string, input: UpdateUserInput): User {
    if (input.email) {
      const conflict = this.repo.findByEmail(input.email);
      if (conflict && conflict.id !== id) {
        throw HttpError.conflict(`Email ${input.email} is already taken`);
      }
    }
    const updated = this.repo.update(id, input);
    if (!updated) throw HttpError.notFound(`User ${id} not found`);
    return updated;
  }

  remove(id: string): void {
    if (!this.repo.delete(id)) {
      throw HttpError.notFound(`User ${id} not found`);
    }
  }
}

export const userService = new UserService(userRepository);
