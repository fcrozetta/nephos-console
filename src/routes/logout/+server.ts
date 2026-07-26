import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, readSession } from '$lib/server/session';
import { nephos } from '$lib/server/nephos';

export const POST = async ({ cookies }) => {
  // Revoke the API token, not just the cookie (ADR 20260726). Without this a
  // token that can read every Service credential stays valid for its full
  // lifetime after the operator has logged out.
  const session = readSession(cookies.get(SESSION_COOKIE));
  if (session?.token) {
    try {
      await nephos.POST('/auth/logout', {
        headers: { Authorization: `Bearer ${session.token}` }
      });
    } catch {
      // Logging out locally must still work when the API is unreachable; the
      // token then lapses on its own.
    }
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
  throw redirect(303, '/login');
};
