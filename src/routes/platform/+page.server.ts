import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

export const load: PageServerLoad = async () => {
  try {
    const r = await nephos.GET('/platform/config/domains');
    return { apiError: false, domains: ((r.data as any)?.domains ?? []) as any[] };
  } catch {
    return { apiError: true, domains: [] as any[] };
  }
};

function failFrom(res: any, extra: Record<string, unknown>) {
  const e = (res.error as any)?.error ?? {};
  return fail(res.response?.status ?? 400, {
    error: e.code ?? 'platform_action_failed',
    message: e.message ?? 'Action failed',
    ...extra
  });
}

export const actions: Actions = {
  add: async ({ request }) => {
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    const domain = String(f.get('domain') ?? '').trim();
    const isDefault = f.get('default') === 'on';
    if (!name || !domain) {
      return fail(400, { error: 'invalid', message: 'Name and domain are required.', name, domain });
    }
    const res = await nephos.POST('/platform/config/domains', {
      body: { name, domain, default: isDefault } as any
    });
    if (res.error) return failFrom(res, { name, domain });
    return { ok: true };
  },
  setDefault: async ({ request }) => {
    const name = String((await request.formData()).get('name') ?? '');
    const res = await nephos.POST('/platform/config/domains/{name}/actions/set-default', {
      params: { path: { name } }
    });
    if (res.error) return failFrom(res, { name });
    return { ok: true };
  },
  remove: async ({ request }) => {
    const name = String((await request.formData()).get('name') ?? '');
    const res = await nephos.POST('/platform/config/domains/{name}/actions/remove', {
      params: { path: { name } }
    });
    if (res.error) return failFrom(res, { name });
    return { ok: true };
  }
};
