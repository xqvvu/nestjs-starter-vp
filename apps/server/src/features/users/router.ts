import type { CreateUser } from "@/features/users/application/create-user";
import type { ListUsers } from "@/features/users/application/list-users";
import { os } from "@/orpc/os";

import { createUserProcedure } from "./procedures/create-user";
import { listUsersProcedure } from "./procedures/list-users";

/**
 * Composition entrypoint for the users namespace. Injectable use cases arrive as
 * arguments so the router stays a pure function of its dependencies instead of
 * reaching for module state.
 */
export function usersRouter(deps: { createUser: CreateUser; listUsers: ListUsers }) {
  return os.users.router({
    list: listUsersProcedure(deps.listUsers),
    create: createUserProcedure(deps.createUser),
  });
}
