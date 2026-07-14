import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

export const load: PageServerLoad = async ({ params }) => {
  const r = await nephos.GET('/apps/{app_instance}', {
    params: { path: { app_instance: params.slug } }
  });
  if (r.error || !r.data) throw error(r.response?.status ?? 404, 'App instance not found');
  return { app: r.data as any };
};

export const actions: Actions = {
  lifecycle: async ({ params, request }) => {
    const f = await request.formData();
    const action = String(f.get('action') ?? '') as
      | 'start' | 'stop' | 'remove' | 'destroy' | 'reconcile';
    const force = f.get('force') === '1';
    const confirm = action === 'destroy' ? `destroy ${params.slug}` : null;
    const res = await nephos.POST('/apps/{app_instance}/actions/{action}', {
      params: { path: { app_instance: params.slug, action } },
      body: { force, confirm }
    });
    if (res.error) {
      const code = (res.error as any)?.error?.code ?? 'action_failed';
      return fail(res.response?.status ?? 400, { error: code, action });
    }
    return { ok: true, action };
  }
};
