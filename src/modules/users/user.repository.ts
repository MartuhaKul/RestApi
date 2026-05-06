import { randomUUID } from 'node:crypto';
import { CreateUserInput, UpdateUserInput, User } from './user.types';

export interface UserRepository {
  findAll(opts: { page: number; limit: number; search?: string }): { items: User[]; total: number };
  findById(id: string): User | undefined;
  findByEmail(email: string): User | undefined;
  create(input: CreateUserInput): User;
  update(id: string, input: UpdateUserInput): User | undefined;
  delete(id: string): boolean;
  reset(): void;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  findAll({ page, limit, search }: { page: number; limit: number; search?: string }) {
    const all = Array.from(this.users.values());
    const filtered = search
      ? all.filter(
          (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()),
        )
      : all;

    const sorted = filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const start = (page - 1) * limit;
    return { items: sorted.slice(start, start + limit), total: filtered.length };
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    const normalized = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email === normalized) return user;
    }
    return undefined;
  }

  create(input: CreateUserInput): User {
    const now = new Date().toISOString();
    const user: User = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.users.set(user.id, user);
    return user;
  }

  update(id: string, input: UpdateUserInput): User | undefined {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated: User = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.users.delete(id);
  }

  reset(): void {
    this.users.clear();
  }
}

export const userRepository: UserRepository = new InMemoryUserRepository();
