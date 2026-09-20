/** Raised when a user cannot be created because the email is already registered. */
export class EmailAlreadyTakenError extends Error {
  constructor(readonly email: string) {
    super(`email already registered: ${email}`);
    this.name = "EmailAlreadyTakenError";
  }
}
