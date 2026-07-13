import { env } from '$env/dynamic/private';

export const NEPHOS_API_URL = env.NEPHOS_API_URL ?? 'http://127.0.0.1:8099';
export const SESSION_SECRET = env.NEPHOS_CONSOLE_SESSION_SECRET ?? 'dev-only-insecure-secret';
