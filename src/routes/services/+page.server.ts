import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

export const load: PageServerLoad = async () => {
  try {
    const r = await nephos.GET('/services');
    return { apiError: false, services: (r.data?.services ?? []) as any[] };
  } catch {
    return { apiError: true, services: [] as any[] };
  }
};

export const actions: Actions = {
  lifecycle: async ({ request }) => {
    const f = await request.formData();
    const slug = String(f.get('slug') ?? '');
    const action = String(f.get('action') ?? '') as
      | 'start' | 'stop' | 'remove' | 'destroy' | 'reconcile';
    const force = f.get('force') === '1';
    const confirm = action === 'destroy' ? `destroy ${slug}` : null;
    const res = await nephos.POST('/services/{service_instance}/actions/{action}', {
      params: { path: { service_instance: slug, action } },
      body: { force, confirm }
    });
    if (res.error) {
      const code = (res.error as any)?.error?.code ?? 'action_failed';
      return fail(res.response?.status ?? 400, { error: code, slug, action });
    }
    return { ok: true, slug, action };
  }
};
