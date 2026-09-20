<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

<!--PROJECT-->

## Using Zod

WHEN import `z`, MUST use `import * as z from "zod";`

### Naming

A schema and the types derived from it occupy separate names. The schema keeps `Schema`; each derived type is named by *direction of travel*, matching the word a reader of the procedure needs.

| Construct | Suffix | Example |
| --- | --- | --- |
| The schema value | `Schema` | `const CreateUserSchema = z.object({ … })` |
| `.parse()` result / `.output()` argument | `Output` | `type HealthCheckOutput = z.output<typeof HealthCheckSchema>` |
| `.input()` argument | `Input` | `type CreateUserInput = z.input<typeof CreateUserSchema>` |
| Used in both directions, with no transform | plain name | `type User = z.infer<typeof UserSchema>` |

```ts
// packages/api/src/schemas/users.ts
export const UserSchema = z.object({ id: z.string(), email: z.email() });
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({ email: z.email() });
export type CreateUserInput = z.input<typeof CreateUserSchema>;
```

Rules:

- NEVER name the schema without the `Schema` suffix. `const User = z.object(…)` next to `type User` forces every consumer to disambiguate value from type at each import.
- Name by direction, not by mirroring the schema. A schema named `CreateUserInput` invites a type also named `CreateUserInput`, which describes the schema rather than the data.
- Use `z.input` / `z.output` (not `z.infer`) where a transform exists; they diverge. `.infer` is equivalent to `.output` and is the shorthand only when no transform is involved.
- Use `.output()` for values the server returns and `.input()` for values the server accepts, so the direction is readable at the call site rather than inferred from context.
- Do NOT export a directional alias that no one consumes. `CreateUserOutput` on a transform-free schema duplicates `CreateUserInput` while reading like the procedure's response — export it only when a transform makes it differ.
- Server code imports the **type** (`CreateUserInput`); only `packages/api` contracts pass the **schema** (`CreateUserSchema`) to `.input()` / `.output()`.

## Request scope: Nest vs oRPC

`apps/server` runs NestJS with `@orpc/nest`. Every request-scoped concern belongs to exactly one layer. Decide in this order:

1. MUST it apply to requests that match no procedure (404, CORS preflight, static files)? → **Nest**.
2. Does it need the contract's validated `input`, its typed `errors`, or the oRPC context? → **oRPC**.
3. Otherwise (transport headers, logging, body limits)? → **Nest**.

| Concern | Layer | Mechanism |
| --- | --- | --- |
| CORS, security headers, compression, access log | Nest | `app.use()`, `app.enableCors()` |
| Request id | Nest | `app.use(requestIdHandler)` + `AsyncLocalStorage` |
| Authentication (credentials → principal) | Nest | `CanActivate` guard |
| Authorization, transactions, audit, per-procedure cache | oRPC | `implement(contract).use(middleware)` |
| Procedure-scoped response headers | oRPC | `ResponseHeadersHandlerPlugin` + `context.resHeaders` |

Nest middleware runs on every request. `ORPCModule.forRoot` plugins and interceptors run only for procedures that matched a route, because `@Implement` registers the route and Nest answers 404 before oRPC is reached. NEVER use a handler plugin to cover a transport concern.

Controllers MUST stay prefix-free (`@Controller()`, no path argument). The `/api` namespace comes from `setGlobalPrefix` in `src/app.ts`; per-controller prefixes duplicate it and break the single source of truth for the public API surface.

### Bridging Nest state into the oRPC context

`requestIdHandler` enters an `AsyncLocalStorage` scope, so anything downstream reads the id with `getRequestId()` instead of threading a context object. Verified to propagate from `app.use()` through the `@orpc/nest` interceptor into handlers.

Prefer this over reaching into the request object. The layers see *different* objects, which makes request-object bridging fragile:

- Nest middleware (via `app.use()` or `NestModule.configure()`) receives the raw `IncomingMessage` — the same object as `fastifyRequest.raw`, carrying no `.raw` of its own.
- Guards and interceptors receive the Fastify wrapper `{ id, params, raw, query, log, body }`.
- `ORPCModule.forRoot({ context })` receives that wrapper from `ctx.switchToHttp().getRequest()`.

A property written by middleware is readable only as `req.raw.<key>` there, while one written by a guard or interceptor is readable only as `req.<key>`. Reading the wrong object yields `undefined` silently, with no error raised — which is why `AsyncLocalStorage` is the default and the request object is a last resort.

```ts
// packages/middlewares: enters the scope and echoes the header
const requestId = req.requestId ?? resolveRequestId(req.headers);
res.setHeader("x-request-id", requestId);
storage.run({ requestId }, () => next());

// src/orpc/context.ts: reads it without touching the request object
export function createInitialContext(): InitialContext {
  return { requestId: getRequestId() ?? "unknown" };
}
```

`getRequestId()` returns `undefined` outside a request scope (startup, cron, tests) rather than throwing, so callers decide the fallback.

### One store for every request-scoped value

NEVER create a second `AsyncLocalStorage` for a new concern. `RequestStore` in `packages/middlewares` is the single store; extend it by module augmentation from the module that produces the value:

```ts
import { getRequestContextValue, runWithRequestContext } from "@xqvvu/middlewares";

declare module "@xqvvu/middlewares" {
  interface RequestStore {
    tenantId: string;
  }
}

// producer
runWithRequestContext({ tenantId: resolveTenant(req) }, () => next());

// any consumer, typed — no cast, no import of the producer
const tenantId = getRequestContextValue("tenantId"); // string | undefined
```

Verified: augmentation works through the package barrel from a consuming workspace package, an undeclared key is a compile error, and assigning the wrong value type is a compile error. `runWithRequestContext` merges into any surrounding scope, so registrants compose instead of replacing each other, and outer values stay stable when an inner scope omits them.

### Why not `Scope.REQUEST`, `REQUEST`, or durable providers

Nest's DI-scoped alternatives were measured and rejected for this concern:

- **`Scope.REQUEST` bubbles up the injection chain.** One request-scoped provider turned the repository, the use case, and the *controller* into per-request instances (counters went 1→2→3 on three sequential calls) — i.e. a controller is then re-instantiated per request even though `@Implement` already rebuilds the router. Nest's own docs warn this "will have an impact on application performance".
- **`@Inject(REQUEST)`** forces the same REQUEST scope while coupling every consumer to the HTTP request object.
- **`ContextIdFactory` / durable providers** (`ContextIdFactory.apply(strategy)`) solves per-tenant DI sub-trees, not per-request values: docs state no payload is registered unless you explicitly return one, and a request id cannot be a durable grouping key because it differs per request.
- **`@nestjs/observe`** provides exactly this store, but requires app credentials and an external dashboard. Adopt it if telemetry is wanted; the sanitization rule below still applies, since its default `traceIdGenerator` reads the same untrusted header.

A benchmark of 3000 requests per route at concurrency 50 showed the HTTP stack dominating, with no measurable difference attributable to the scope choices — so this is an architectural decision, not a micro-optimization.

### Inbound request ids are untrusted input

A client-supplied `x-request-id` flows into response headers, logs, and downstream services, so it MUST be validated before reuse. Accept it only when it matches `^[A-Za-z0-9._:+-]{1,128}$` — a UUID, a W3C 32-hex trace id, or a `traceparent` value; otherwise generate a fresh UUID. Regenerate rather than throw, so a malformed header never fails a request.

Without this, verified against the previous implementation:

- An 8 KB header was echoed back as an 8 KB response header (log/header amplification).
- `"><script>alert(1)</script>` was echoed verbatim.
- `a,b` and duplicated headers were passed through unnormalized, corrupting downstream parsers that split on the delimiter.

Node's HTTP parser already rejects CRLF inside a header value with a `400` before application code runs, so CR/LF need no manual handling — but length, charset, and duplicate-header cases do. This matches OWASP's logging guidance to sanitize against delimiter characters, not only CR/LF.

The validator lives in `resolveRequestId` in `packages/middlewares`, and `packages/middlewares/src/request-id.test.ts` pins the accepted and rejected shapes.

### A global prefix scopes `configure()` middleware

`app.setGlobalPrefix("api")` rewrites the paths of `NestModule.configure()` middleware to `<prefix><path>`, so `forRoutes("*")` stops covering URLs outside the prefix — an unmatched `/no-such-route` receives no request id, while `/api/no-such-route` does. It does not cover the `exclude` list either.

Register cross-cutting transport middleware with `app.use(handler)` instead: it is bound on the adapter, independent of the prefix, and covers matched, unmatched, and excluded routes alike. `packages/middlewares` exports plain handlers for exactly this reason.

### Every request-scoped concern is wired in `src/app.ts`

`createApp()` owns the global prefix, middleware, CORS, and shutdown hooks; `main.ts` only listens. Tests call the same factory, so wiring cannot drift between production and tests. Add new cross-cutting concerns there, never in `main.ts`.

### oRPC middleware placement

`@Implement` reads routing metadata from its argument, but the procedure that actually runs is the method's return value. Middleware attached to the decorator argument is silently skipped — the request succeeds as if the guard did not exist.

```ts
// WRONG: the middleware never runs, the request still returns 200
@Implement(os.use(guard).health.check)
check() {
  return os.health.check.handler(() => ({ status: "ok" }));
}

// RIGHT
@Implement(contract.health.check)
check() {
  return os.use(guard).health.check.handler(() => ({ status: "ok" }));
}
```

The same holds for a router contract — `@Implement(os.use(guard).health)` skips the guard. Attach middleware on the returned builder instead.

When the same middleware is applied more than once on the path to a handler — repeated on one builder chain, or at both router and procedure level — it runs once per application. Make it idempotent, or record completion on the context and skip on re-entry.

### How `@Implement` mounts a router contract

`@Implement(<routerContract>)` is a route generator, not an HTTP-method decorator. At class definition time it walks the contract and, for each leaf procedure, synthesizes a method on the controller prototype named `<method>_<path>` — for `@Implement(contract.health)` with method `health`, the procedure `check` becomes `health_check`, carrying `path: "/health/check"` and the contract's HTTP method (Nest logs `Mapped {/api/health/check, GET}`). Route metadata is attached with `defineMetadata` on the *function object*, deferred by two microtask ticks.

Each synthesized method calls your original method to obtain the returned router, then narrows it to that procedure's child via `getRouter(router, ["check"])`. This is why the original method returns the whole router (`os.health.router({ check })`) rather than one procedure: one controller method fills every route under that namespace, and the return value is re-invoked per route.

### `@Implement` return-value contract

The method's return value MUST match the shape of the `@Implement` argument:

- `@Implement(<procedureContract>)` → return the implemented procedure.
- `@Implement(<routerContract>)` → return an object of implemented children.

Mismatching the two throws `The return value of the @Implement controller handler must be a corresponding implemented router or procedure.` at request time, surfacing as `500`.

### Throwing errors

Throw `ORPCError` only inside oRPC scopes (middleware, handlers): it becomes the oRPC envelope — `{"defined":false,"code":"UNAUTHORIZED",...}` with the status implied by its code. In Nest guards, filters, and middleware throw Nest `HttpException` subclasses instead; an `ORPCError` thrown there is not a Nest exception and surfaces as an opaque `500 {"statusCode":500,"message":"Internal server error"}`.

### Constructor injection

Every injected class MUST be imported with a value import. `import type` erases the class, so `emitDecoratorMetadata` records `Object` and Nest aborts at startup with `UnknownDependenciesException`. This is why the root `vite.config.ts` keeps `typescript/consistent-type-imports` disabled for `apps/server/**`; do not re-enable it there.

## Feature layering

`router + handler` does not replace Nest DI — the controller method is a normal method on a DI-managed class, and the handlers it returns close over `this`. Verified: a `Scope.DEFAULT` dependency keeps one instance across requests (a counter incremented 1→7), and `Scope.REQUEST` yields a new instance per request.

What changes is where business logic lives. Four positions, each with one job:

| Position | Owner | Responsibility | Must NOT hold |
| --- | --- | --- | --- |
| Controller method | Nest | `@Implement`, assemble the router, hand DI'd use cases to procedures | business rules, persistence |
| Procedure | oRPC | adapt `input`/`context`, call a use case, translate domain errors into contract errors | orchestration |
| Application use case | Nest `@Injectable` | orchestration, invariants, transaction boundary | oRPC/Nest HTTP types |
| Domain + ports | plain TS | invariants, external I/O interfaces | framework imports |

### Layout

```text
src/features/users/
├─ controller.ts            # @Implement(contract.users) → usersRouter({ ... })
├─ router.ts                # composition: maps procedures onto use cases
├─ procedures/
│  ├─ list-users.ts         # adapts input/context, calls the use case
│  └─ create-user.ts        # translates domain errors → errors.CONFLICT()
├─ application/
│  ├─ list-users.ts         # @Injectable use case
│  └─ create-user.ts
├─ domain/
│  └─ email-already-taken.error.ts
├─ ports/
│  └─ user-repository.ts    # abstract class = DI token
├─ infrastructure/
│  └─ in-memory-user-repository.ts
└─ users.module.ts          # binds ports to adapters
```

A feature that is genuinely one line (`health`) stays a single `controller.ts` + `router.ts`. Add layers when a concrete need appears — never pre-create empty ones.

### Rules

- A use case class MUST hold real orchestration or an invariant. NEVER create a service that only re-wraps `implement(...).handler(...)` — that is a `catch-all service.ts`, and it is what makes the DI seam look useless.
- Procedures receive use cases as function arguments (`usersRouter({ createUser })`); they MUST NOT reach for module-level state. This keeps the router a pure function of its dependencies and lets the controller pass in DI'd instances.
- The controller method reads `this` once (`const { createUser } = this;`) and passes those references inward.
- Depend on ports (`abstract class`) from use cases; bind adapters to tokens in the feature module so infrastructure stays swappable.
- Handler return values are the contract's output shape, validated at runtime — an invalid shape fails with `INTERNAL_SERVER_ERROR: Output validation failed`. Map domain entities to DTOs at the use-case boundary; never return an ORM entity.
- Transports MUST translate domain errors to contract errors. Declare codes on the contract with `.errors({...})` and throw `errors.CONFLICT()`; an untranslated error becomes a `500`. A declared code answers with `{"defined":true,"code":"CONFLICT",...}` and the matching status (`409`).
- Do not hoist a router to module scope to "avoid rebuilding it". `@Implement` re-invokes the method per request; rebuilding measured 0.07 µs/call versus 0.01 µs hoisted — irrelevant next to a request, and hoisting severs the `this` closure that DI depends on.

<!--PROJECT-->
