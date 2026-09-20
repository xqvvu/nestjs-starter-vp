import { Injectable } from "@nestjs/common";
import type { CreateUserInput, User } from "@xqvvu/api";

import { EmailAlreadyTakenError } from "@/features/users/domain/email-already-taken.error";
import { UserRepository } from "@/features/users/ports/user-repository";

/**
 * Use case: register a user.
 *
 * Holds the invariant (email uniqueness) and depends only on the repository
 * port, so it is unit-testable without Nest or HTTP. It knows nothing about
 * oRPC — translating `EmailAlreadyTakenError` into a typed contract error is
 * the procedure's job.
 */
@Injectable()
export class CreateUser {
  constructor(private readonly users: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyTakenError(input.email);
    }

    return this.users.insert({ id: crypto.randomUUID(), email: input.email });
  }
}
