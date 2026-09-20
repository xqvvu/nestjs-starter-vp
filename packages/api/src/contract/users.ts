import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import * as z from "zod";

import { CreateUserSchema, UserSchema } from "../schemas/users";

export const users = {
  list: oc.meta(openapi({ method: "GET" })).output(z.array(UserSchema)),

  create: oc
    .meta(openapi({ method: "POST" }))
    .input(CreateUserSchema)
    .output(UserSchema)
    .errors({
      CONFLICT: {},
    }),
};
