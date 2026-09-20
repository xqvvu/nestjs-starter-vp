# @xqvvu/api

Shared API contract for the boilerplate's oRPC v2 API.

This package is the boundary between API consumers and the server implementation.
It contains API schemas, procedure contracts, and client types. It must not
contain handlers, database access, Node HTTP types, ORM entities, or server-only
environment values.

## Structure

```text
src/
├─ schemas/       # API DTO schemas and reusable error data
├─ contract/      # oRPC procedure contracts grouped by domain
├─ client.ts      # RouterContractClient type
└─ index.ts       # Public exports and the root contract
```

Keep schemas and contracts grouped by domain. A schema used by one simple
procedure may stay in its contract module; move shared schemas to
`schemas/<domain>.ts`.

## Naming schemas and types

A schema value ends in `Schema`; each derived type is named by direction —
`Input` for what the server accepts, `Output` for what it returns.

```ts
export const UserSchema = z.object({ id: z.string(), email: z.email() });
export type User = z.infer<typeof UserSchema>; // both directions, no transform

export const CreateUserSchema = z.object({ email: z.email() });
export type CreateUserInput = z.input<typeof CreateUserSchema>;
```

Use `z.input` / `z.output` rather than `z.infer` once a transform is involved —
they diverge — and do not export a directional alias nobody consumes. See the
"Using Zod" section in [`AGENTS.md`](../../AGENTS.md) for the full rules.

## Adding an API

1. Add or reuse the input and output schemas in `src/schemas/<domain>.ts`.
2. Define the procedure with `oc` in `src/contract/<domain>.ts`, passing the
   **schema** (`CreateUserSchema`) to `.input()` / `.output()`.
3. Add the domain to `src/contract/index.ts`.
4. Implement the matching procedure in
   `apps/server/src/features/<domain>/router.ts`. The shared `implement(contract)`
   builder lives in `apps/server/src/orpc/os.ts`; server code imports the
   **types** (`CreateUserInput`), never the schemas.

Every procedure contract should declare `.output()`. Declare typed errors with
`.errors()` when callers need to distinguish expected failures. Keep the
contract router keys aligned with the public API namespace and avoid reserved
keys such as `then`, `bind`, `call`, `apply`, and `toJSON`.

Use `import * as z from "zod";` for Zod imports. Keep database models and
internal domain types in the server package rather than exporting them here.
