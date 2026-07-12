# nephos-console architecture

- Status: accepted
- Date: 2026-07-12
- Tags: console, sveltekit, bff, auth, daedalus, phase-1

## Context

nephos-console is the web surface for the Nephos control plane. Nephos records
desired state and returns `202 Accepted`; a reconciler converges runtime state,
observable via status snapshots. The API is currently unauthenticated and exposes
catalog, apps, services, bindings, and platform-domain endpoints. The console must
make Nephos genuinely usable (browse, install, operate) rather than a clean-but-
hollow shell.

## Decisions

### A. BFF topology

SvelteKit runs as a Backend-for-Frontend. The browser talks only to SvelteKit
server routes; those call the Nephos API server-side. No CORS, the API is never
exposed to the browser, and the auth session lives server-side. This matches the
in-cluster model (console pod to API) and lets the local dev server proxy to the
API on `:8099`.

### B. Generated API client

The TypeScript types and client are generated from the Nephos OpenAPI
(`/openapi.json`) via `openapi-typescript` + `openapi-fetch`. Schemas are never
hand-copied; regenerate on API change (`pnpm run gen:api`).

### C. Requested-vs-observed polling

The UI renders desired lifecycle (requested) and status level (observed)
distinctly. After a `202`, it polls the parent resource until settled, where
settled = `intent.lifecycle == status.lifecycle && status.level ok && no pending
reconciliation`. A resource that does not settle within a bound is shown as
`stalled` (surfaces a dead reconciler instead of a permanent spinner). No
SSE/websockets (the API does not support them).

### D. Auth: single-admin now, OIDC seam

v1 gates console access with a single admin credential (hashed, env-configured)
and an httpOnly signed session cookie, enforced by a server hook. The API stays
unauthenticated behind the BFF. Auth is a single seam so Zitadel OIDC (per the
core-registry `nephos-console` manifest, `requires: oidc/identity`) slots in later
for the in-cluster App without a rewrite.

### E. Deploy: adapter-node

`@sveltejs/adapter-node` produces a containerized Node BFF, consistent with the
in-cluster App and the BFF choice.

### F. Design: Daedalus

Daedalus / Iris Labyrinth visual language: sidebar-first developer-tool chrome,
8px outlined panels, deep blue-black canvas with sparse teal signal, Lucide icons.

### G. Companion API change

The catalog endpoints now expose `config.options` (nephos-api ADR
`20260712-catalog-config-schema-exposure`), which the typed install form depends on.

## Consequences

- The console is self-contained in local dev (single-admin, no Zitadel dependency)
  and grows into the OIDC + routing in-cluster App via the seams above.
- Mutable, evolving assumptions live in rctx claims (`.agents/claims/`); durable
  decisions live here in `docs/adr/`.

## Non-goals (v1)

- Zitadel OIDC, multi-user, and per-app access groups (seam only).
- Standalone Bindings screen and a platform-domain failure surface (v1.1).
- Any Kubernetes credentials in the browser.
