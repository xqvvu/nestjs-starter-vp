import { Controller } from "@nestjs/common";
import { Implement } from "@orpc/nest";
import { contract } from "@xqvvu/api";

import { CreateUser } from "@/features/users/application/create-user";
import { ListUsers } from "@/features/users/application/list-users";
import { usersRouter } from "@/features/users/router";

@Controller()
export class UsersController {
  constructor(
    private readonly createUser: CreateUser,
    private readonly listUsers: ListUsers,
  ) {}

  @Implement(contract.users)
  users() {
    const { createUser, listUsers } = this;
    return usersRouter({ createUser, listUsers });
  }
}
