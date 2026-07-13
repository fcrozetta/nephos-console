import crypto from 'node:crypto';
import { SESSION_SECRET } from './env';

export const SESSION_COOKIE = 'nephos_console_session';

export const SESSION_COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: false, // v1 local http; set true behind TLS in-cluster
  maxAge: 60 * 60 * 12
} as const;

function sign(value: string): string {
  const mac = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
  return `${value}.${mac}`;
}

function unsign(signed: string): string | null {
  const i = signed.lastIndexOf('.');
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const mac = signed.slice(i + 1);
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return value;
  return null;
}

/** Mint a session for an admin subject already authenticated by the Nephos
 * API (POST /auth/login). The auth seam is intentionally small so Zitadel OIDC
 * can replace it later. */
export function issueSessionValue(subject: string): string {
  return sign(subject);
}

export function readSession(signed: string | undefined): { name: string } | null {
  if (!signed) return null;
  const subject = unsign(signed);
  return subject ? { name: subject } : null;
}
