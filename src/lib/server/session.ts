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

export type Session = { name: string; token?: string };

/** Mint a session for an admin subject already authenticated by the Nephos
 * API (POST /auth/login). The auth seam is intentionally small so Zitadel OIDC
 * can replace it later.
 *
 * Carries the API bearer token (ADR 20260726) so a reveal can be authorized
 * server-side without re-prompting: the console keeps no password, so it has no
 * other way to re-authenticate mid-session. The cookie is httpOnly and signed,
 * but `secure` is false for local HTTP, so on a plain-HTTP deployment the token
 * is sniffable on the local network, exactly as the session already was. */
export function issueSessionValue(subject: string, token?: string): string {
  const payload = Buffer.from(JSON.stringify({ n: subject, t: token }), 'utf8').toString(
    'base64url'
  );
  return sign(payload);
}

export function readSession(signed: string | undefined): Session | null {
  if (!signed) return null;
  const value = unsign(signed);
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (parsed && typeof parsed.n === 'string') {
      return { name: parsed.n, token: typeof parsed.t === 'string' ? parsed.t : undefined };
    }
  } catch {
    // Pre-token cookie: the signed value was the bare subject. Still a valid
    // session, just without a token, so reveal prompts a re-login rather than
    // logging everyone out on deploy.
  }
  return { name: value };
}
