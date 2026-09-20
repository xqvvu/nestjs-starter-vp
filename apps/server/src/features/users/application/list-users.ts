import { Injectable } from "@nestjs/common";
import type { User } from "@xqvvu/api";

import { UserRepository } from "@/features/users/ports/user-repository";

/** Use case: list registered users. */
@Injectable()
export class ListUsers {
  constructor(private readonly users: UserRepository) {}

  execute(): Promise<User[]> {
    return this.users.list();
  }
}
