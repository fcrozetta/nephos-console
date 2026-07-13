import { fail, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, SESSION_COOKIE_OPTS, issueSessionValue } from '$lib/server/session';
import { nephos } from '$lib/server/nephos';
import type { Actions } from './$types';

type NephosError = { error?: { code?: string; message?: string } };

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirm') ?? '');
    if (!username || !password) {
      return fail(400, { error: 'Username and password are required.', username });
    }
    if (password !== confirm) {
      return fail(400, { error: 'Passwords do not match.', username });
    }

    let envelope: NephosError | undefined;
    try {
      const { error } = await nephos.POST('/admin/accounts', { body: { username, password } });
      envelope = error as unknown as NephosError | undefined;
    } catch {
      return fail(502, { error: 'Could not reach the Nephos API.', username });
    }
    if (envelope) {
      // Another admin was created in the meantime — send them to sign in.
      if (envelope.error?.code === 'admin_already_exists') throw redirect(303, '/login');
      return fail(400, {
        error: envelope.error?.message ?? 'Could not create the admin account.',
        username
      });
    }

    // Sign the new admin straight in.
    cookies.set(SESSION_COOKIE, issueSessionValue(username), SESSION_COOKIE_OPTS);
    throw redirect(303, '/');
  }
};
