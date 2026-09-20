import type { CreateUserInput, User } from "@xqvvu/api";

/**
 * Persistence boundary for users. Infrastructure implements this; application
 * use cases depend only on the interface, so they stay testable without a database.
 */
export abstract class UserRepository {
  abstract list(): Promise<User[]>;
  abstract findByEmail(email: string): Promise<User | undefined>;
  abstract insert(input: CreateUserInput & { id: string }): Promise<User>;
}
