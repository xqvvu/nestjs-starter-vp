# @xqvvu/server

Server-side implementation of the boilerplate API.

## Development

```bash
vp -C apps/server run dev
```

The task rebuilds with `vp pack --watch` and restarts the server with `node --watch`.
The production flow is:

```bash
vp -C apps/server run build
vp -C apps/server run start
```

## API

The API uses oRPC v2 with a contract in `packages/api` and feature implementations
in `src/features`. NestJS serves the HTTP surface through `@orpc/nest`.

The RPC endpoint is exposed under the `/api` prefix. The OpenAPI document is
generated from the shared contract and served at `/specs.json`, with a Scalar
reference UI at `/specs`.

Configuration comes from the environment and is validated in `src/env.ts`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime mode. |
| `HOST` | `0.0.0.0` | Bind address. |
| `PORT` | `8888` | Bind port. |
| `CORS_ORIGIN` | `*` | Value for `Access-Control-Allow-Origin`. |

The shared contract is maintained in
[`@xqvvu/api`](../../packages/api/README.md).

## Request scope

Every request-scoped concern belongs to exactly one layer: Nest covers requests
that match no procedure (404, CORS preflight, static files), oRPC covers anything
that needs the contract's validated `input`, typed `errors`, or context.
`RequestIdMiddleware` runs at the Nest layer so unmatched routes still get an id,
and `src/orpc/context.ts` bridges it into the oRPC initial context.

See the "Request scope: Nest vs oRPC" section in [`AGENTS.md`](../../AGENTS.md)
for the decision rules and the pitfalls verified against this setup.

## Server architecture

The server is a feature-first modular monolith. `src/orpc` owns oRPC assembly and
the initial context; `src/features/<name>` owns one business capability.

Cross-cutting request concerns live in `src/app.ts`: `createApp()` applies the
global prefix, middleware, CORS, and shutdown hooks, and tests boot through the
same factory. `src/main.ts` only listens.

A feature mounts its contract namespace from a prefix-free controller:

```text
src/features/users/
├─ controller.ts            # @Controller() + @Implement(contract.users)
├─ router.ts                # composition over use cases
├─ procedures/              # one adapter per procedure
├─ application/             # @Injectable use cases (orchestration, invariants)
├─ domain/                  # domain errors and pure rules
├─ ports/                   # abstract classes used as DI tokens
├─ infrastructure/          # adapters implementing the ports
└─ users.module.ts          # binds ports to adapters
```

The API prefix (`/api`) is applied once in `createApp()`; controllers stay
prefix-free. Register cross-cutting middleware with `app.use()`, not
`NestModule.configure()` — a global prefix scopes `configure()` middleware away
from unprefixed URLs such as unmatched routes and `/specs`.

Keep the structure small: a one-line feature is just `controller.ts` + `router.ts`.
Add `application/`, `domain/`, and `ports/` when a concrete need appears — never
pre-create empty layers, and never add a service that only re-wraps a handler.

An oRPC procedure should adapt input and context, call a use case, and translate
domain errors into typed contract errors. Do not put business logic in controllers
or split files merely by HTTP method.

See the "Request scope: Nest vs oRPC" and "Feature layering" sections in
[`AGENTS.md`](../../AGENTS.md) for the full rules and the pitfalls verified
against this setup.
