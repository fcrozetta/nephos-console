import createClient from 'openapi-fetch';
import type { paths } from '$lib/api/schema';
import { NEPHOS_API_URL } from './env';

/** Server-side (BFF) client for the Nephos API. The browser never calls the
 * API directly; only this server module does. Types are generated from the
 * Nephos OpenAPI via `pnpm run gen:api`. */
export const nephos = createClient<paths>({ baseUrl: NEPHOS_API_URL });
