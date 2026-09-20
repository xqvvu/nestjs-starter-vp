# Boilerplate

This repository is a Vite+ monorepo with a Node HTTP server and shared workspace packages.

## Getting started

```bash
vp install
vp run dev
```

Run the complete local verification suite with:

```bash
vp run ready
```

To work on the server directly:

```bash
vp -C apps/server run dev
```

The development task rebuilds with `vp pack --watch` and restarts the server with
`node --watch`; the production flow is:

```bash
vp -C apps/server run build
vp -C apps/server run start
```

See [the server package README](apps/server/README.md) for API details and
server architecture guidelines.
