import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/session';

export const POST = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  throw redirect(303, '/login');
};
