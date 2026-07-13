import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

export const load: PageServerLoad = async () => {
  try {
    const r = await nephos.GET('/apps');
    return { apiError: false, apps: (r.data?.apps ?? []) as any[] };
  } catch {
    return { apiError: true, apps: [] as any[] };
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
    const res = await nephos.POST('/apps/{app_instance}/actions/{action}', {
      params: { path: { app_instance: slug, action } },
      body: { force, confirm }
    });
    if (res.error) {
      const code = (res.error as any)?.error?.code ?? 'action_failed';
      return fail(res.response?.status ?? 400, { error: code, slug, action });
    }
    return { ok: true, slug, action };
  }
};
