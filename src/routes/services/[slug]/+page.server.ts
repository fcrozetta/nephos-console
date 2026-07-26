import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';
import { SESSION_COOKIE, readSession } from '$lib/server/session';

export const load: PageServerLoad = async ({ params }) => {
  const r = await nephos.GET('/services/{service_instance}', {
    params: { path: { service_instance: params.slug } }
  });
  if (r.error || !r.data) throw error(r.response?.status ?? 404, 'Service instance not found');
  const entry = await nephos.GET('/catalog/services/{name}', {
    params: {
      path: { name: String((r.data as any).catalogRef?.name) },
      query: { source: String((r.data as any).catalogRef?.source) }
    }
  });
  // Option specs tell the page which config keys are secrets, including the
  // generated ones that never appear in the config payload at all.
  return {
    service: r.data as any,
    options: ((entry.data as any)?.config?.options ?? []) as any[]
  };
};

export const actions: Actions = {
  lifecycle: async ({ params, request }) => {
    const f = await request.formData();
    const action = String(f.get('action') ?? '') as
      | 'start' | 'stop' | 'remove' | 'destroy' | 'reconcile';
    const force = f.get('force') === '1';
    const confirm = action === 'destroy' ? `destroy ${params.slug}` : null;
    const res = await nephos.POST('/services/{service_instance}/actions/{action}', {
      params: { path: { service_instance: params.slug, action } },
      body: { force, confirm }
    });
    if (res.error) {
      const code = (res.error as any)?.error?.code ?? 'action_failed';
      return fail(res.response?.status ?? 400, { error: code, action });
    }
    return { ok: true, action };
  },
  reveal: async ({ params, request, cookies }) => {
    const option = String((await request.formData()).get('option') ?? '');
    const session = readSession(cookies.get(SESSION_COOKIE));
    if (!session?.token) {
      // Pre-token session, or one minted before the API issued tokens. Re-login
      // is the only way to obtain one, since the console keeps no password.
      throw redirect(303, '/login');
    }
    const res = await nephos.POST(
      '/services/{service_instance}/config/{option}/actions/reveal',
      {
        params: { path: { service_instance: params.slug, option } },
        headers: { Authorization: `Bearer ${session.token}` }
      }
    );
    if (res.response?.status === 401) {
      // Expired or revoked: drop the dead session rather than showing a
      // confusing error on an otherwise working page.
      cookies.delete(SESSION_COOKIE, { path: '/' });
      throw redirect(303, '/login');
    }
    if (res.error) {
      const e = (res.error as any)?.error ?? {};
      return fail(res.response?.status ?? 400, {
        revealError: e.code ?? 'reveal_failed',
        revealMessage: e.message ?? 'Could not reveal this value.',
        option
      });
    }
    return { revealed: { option, ...(res.data as any) } };
  }
};
