import crypto from 'node:crypto';
import { ADMIN_PASSWORD, SESSION_SECRET } from './env';

export const SESSION_COOKIE = 'nephos_console_session';
const SUBJECT = 'admin';

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

/** v1 single-admin gate: timing-safe compare against the configured password.
 * The auth seam is intentionally small so Zitadel OIDC can replace it later. */
export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function issueSessionValue(): string {
  return sign(SUBJECT);
}

export function readSession(signed: string | undefined): { name: string } | null {
  if (!signed) return null;
  return unsign(signed) === SUBJECT ? { name: SUBJECT } : null;
}
