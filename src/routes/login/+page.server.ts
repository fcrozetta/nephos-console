import { fail, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, issueSessionValue, verifyAdminPassword } from '$lib/server/session';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const password = String(form.get('password') ?? '');
    if (!verifyAdminPassword(password)) return fail(401, { error: 'Invalid admin password.' });
    cookies.set(SESSION_COOKIE, issueSessionValue(), {
      path: '/', httpOnly: true, sameSite: 'lax',
      secure: false, // v1 local http; set true behind TLS in-cluster
      maxAge: 60 * 60 * 12
    });
    throw redirect(303, '/');
  }
};
