import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, readSession } from '$lib/server/session';

const PUBLIC_PATHS = new Set(['/login']);

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = readSession(event.cookies.get(SESSION_COOKIE));
  const path = event.url.pathname;
  if (!event.locals.user && !PUBLIC_PATHS.has(path)) throw redirect(303, '/login');
  if (event.locals.user && path === '/login') throw redirect(303, '/');
  return resolve(event);
};
