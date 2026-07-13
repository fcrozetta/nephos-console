import { fail, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, SESSION_COOKIE_OPTS, issueSessionValue } from '$lib/server/session';
import { nephos } from '$lib/server/nephos';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    if (!username || !password) {
      return fail(400, { error: 'Username and password are required.', username });
    }

    let data;
    try {
      ({ data } = await nephos.POST('/auth/login', { body: { username, password } }));
    } catch {
      return fail(502, { error: 'Could not reach the Nephos API.', username });
    }
    if (!data || data.authenticated !== true) {
      return fail(401, { error: 'Invalid username or password.', username });
    }

    cookies.set(SESSION_COOKIE, issueSessionValue(String(data.subject)), SESSION_COOKIE_OPTS);
    throw redirect(303, '/');
  }
};
