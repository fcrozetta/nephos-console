---
volatility: "volatile"
watches:
  - "src/lib/api"
  - ".env.example"
reverify: "re-run pnpm run gen:api and diff the generated client; re-check the notes below against the live Nephos OpenAPI"
---

Assumptions the console makes about the Nephos API it consumes. Volatile because
the API is a separate repo (fcrozetta/nephos) that evolves independently; the
generated client under `src/lib/api` is the concrete coupling.

- The API is currently UNAUTHENTICATED. The console adds its own single-admin
  gate in the BFF; the API is never exposed to the browser. If the API adds auth,
  the BFF must forward credentials and this claim must be revisited.
- All mutations return `202 Accepted` with `{resource, reconciliation:{id,state}}`;
  desired state is recorded, not applied synchronously. The UI polls the parent
  resource until settled.
- Catalog list and get-by-name endpoints expose `config.options`
  (name/type/label/default/required/values) as of nephos-api ADR
  20260712-catalog-config-schema-exposure. The typed install form depends on this.
- Lifecycle actions: `POST /{apps,services}/{slug}/actions/{start|stop|remove|destroy|reconcile}`
  with body `{force, confirm}`. `destroy` requires `confirm == "destroy <slug>"`;
  stop/remove/destroy with dependents need `force`.
- Service/binding config is redacted in responses; App config is not. Secrets are
  passed as `op://` / `bao://` references, never plaintext.
- Base URL is server-side only via `NEPHOS_API_URL` (default http://127.0.0.1:8099).
