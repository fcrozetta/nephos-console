import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, readSession } from '$lib/server/session';
import { nephos } from '$lib/server/nephos';

/** Ask the Nephos API whether any admin exists. Returns null when the API is
 * unreachable so the gate can fall back to the session check rather than
 * wrongly exposing /setup (the API itself enforces the zero-admin guard). */
async function adminExists(): Promise<boolean | null> {
  try {
    const { data } = await nephos.GET('/auth/state');
    return data ? data.adminExists : null;
  } catch {
    return null;
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const user = readSession(event.cookies.get(SESSION_COOKIE));
  event.locals.user = user;
  const path = event.url.pathname;

  // First run: no admin yet — force setup for everything except the setup page.
  if ((await adminExists()) === false) {
    if (path !== '/setup') throw redirect(303, '/setup');
    return resolve(event);
  }

  // An admin exists (or the API is unreachable → safe default): normal gate.
  if (path === '/setup') throw redirect(303, user ? '/' : '/login');
  if (!user && path !== '/login') throw redirect(303, '/login');
  if (user && path === '/login') throw redirect(303, '/');
  return resolve(event);
};
