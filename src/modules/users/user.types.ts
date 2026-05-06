export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateUserInput = Pick<User, 'name' | 'email' | 'age'>;
export type UpdateUserInput = Partial<CreateUserInput>;
