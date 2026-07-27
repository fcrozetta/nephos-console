import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

async function fetchEntry(name: string, source?: string) {
  return nephos.GET('/catalog/services/{name}', {
    params: { path: { name }, query: source ? { source } : {} }
  });
}

export const load: PageServerLoad = async ({ params, url }) => {
  const source = url.searchParams.get('source') ?? undefined;
  // Root domains drive the generated portal host, so the form can preview it.
  const [res, domainsRes] = await Promise.all([
    fetchEntry(params.name, source),
    nephos.GET('/platform/config/domains')
  ]);
  if (res.error || !res.data) throw error(res.response?.status ?? 404, 'Catalog entry not found');
  return {
    entry: res.data as any,
    source,
    domains: ((domainsRes.data as any)?.domains ?? []) as any[]
  };
};

function coerce(type: string, raw: FormDataEntryValue | null): unknown {
  const v = raw == null ? '' : String(raw);
  if (type === 'boolean') return v === 'on' || v === 'true' || v === '1';
  if (type === 'integer') return v === '' ? undefined : Number(v);
  return v === '' ? undefined : v;
}

export const actions: Actions = {
  install: async ({ params, request, url }) => {
    const source = url.searchParams.get('source') ?? undefined;
    const entry = await fetchEntry(params.name, source);
    const options = ((entry.data as any)?.config?.options ?? []) as any[];
    const f = await request.formData();
    const instanceName = String(f.get('instanceName') ?? '').trim() || undefined;
    const config: Record<string, unknown> = {};
    for (const opt of options) {
      const val = coerce(opt.type, f.get(`config.${opt.name}`));
      if (val !== undefined) config[opt.name] = val;
    }
    const res = await nephos.POST('/services', {
      body: {
        catalogRef: { kind: 'Service', name: params.name, ...(source ? { source } : {}) },
        ...(instanceName ? { instanceName } : {}),
        config
      } as any
    });
    if (res.error) {
      const e = (res.error as any)?.error ?? {};
      return fail(res.response?.status ?? 400, {
        error: e.code ?? 'install_failed',
        message: e.message ?? 'Install failed',
        values: Object.fromEntries(f)
      });
    }
    throw redirect(303, '/services');
  }
};
