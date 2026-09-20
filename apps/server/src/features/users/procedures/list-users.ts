import type { ListUsers } from "@/features/users/application/list-users";
import { os } from "@/orpc/os";

/** Procedure adapter: adapts context to the use case. */
export function listUsersProcedure(listUsers: ListUsers) {
  return os.users.list.handler(() => listUsers.execute());
}
