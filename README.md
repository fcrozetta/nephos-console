# nephos-console

Web console for the [Nephos](https://github.com/fcrozetta/nephos) control plane:
browse the catalog, install Apps and Services, and drive their lifecycle against
the Nephos API.

## Architecture

See [docs/adr/0001-console-architecture.md](docs/adr/0001-console-architecture.md).
In short: SvelteKit as a **BFF** (the browser never talks to the Nephos API
directly), a TypeScript client **generated from the Nephos OpenAPI**, a **polling**
model that renders requested-vs-observed state, **single-admin** session auth with
an OIDC-ready seam, `adapter-node`, and the **Daedalus** visual language.

## Develop

```bash
pnpm install
# point at a running Nephos API (default http://127.0.0.1:8099)
cp .env.example .env
pnpm run gen:api    # regenerate the typed client from the API's /openapi.json
pnpm run dev
```

## Environment

| Variable | Purpose |
| --- | --- |
| `NEPHOS_API_URL` | Nephos API base URL the BFF calls. Default `http://127.0.0.1:8099`. |
| `NEPHOS_CONSOLE_ADMIN_PASSWORD` | Single admin password (v1 auth). |
| `NEPHOS_CONSOLE_SESSION_SECRET` | Secret used to sign the session cookie. |

The console is Phase 1 local-dev-first. The in-cluster App (Zitadel OIDC +
Traefik routing) is future work per the core-registry `nephos-console` manifest.
