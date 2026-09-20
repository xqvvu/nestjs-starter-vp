import type { CreateUser } from "@/features/users/application/create-user";
import { os } from "@/orpc/os";

import { EmailAlreadyTakenError } from "../domain/email-already-taken.error";

/**
 * Procedure adapter: adapts contract input/context to the use case and
 * translates domain errors into typed contract errors.
 */
export function createUserProcedure(createUser: CreateUser) {
  return os.users.create.handler(async ({ input, errors }) => {
    try {
      return await createUser.execute(input);
    } catch (error) {
      if (error instanceof EmailAlreadyTakenError) {
        throw errors.CONFLICT({ message: "email already registered" });
      }
      throw error;
    }
  });
}
