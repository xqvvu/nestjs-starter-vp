import { Injectable } from "@nestjs/common";
import type { CreateUserInput, User } from "@xqvvu/api";

import { UserRepository } from "@/features/users/ports/user-repository";

/**
 * In-memory adapter. Swap for a real database adapter by rebinding the
 * `UserRepository` token in `UsersModule`; nothing above this file changes.
 */
@Injectable()
export class InMemoryUserRepository extends UserRepository {
  private readonly users = new Map<string, User>();

  list(): Promise<User[]> {
    return Promise.resolve([...this.users.values()]);
  }

  findByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve([...this.users.values()].find((user) => user.email === email));
  }

  insert(input: CreateUserInput & { id: string }): Promise<User> {
    const user: User = { id: input.id, email: input.email };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }
}
