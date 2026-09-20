import * as z from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
});

/** A registered user, as returned by the API. */
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.email(),
});

/** Payload accepted by the create-user procedure. */
export type CreateUserInput = z.input<typeof CreateUserSchema>;
