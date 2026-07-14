import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

function fetchEntry(name: string, source?: string) {
  return nephos.GET('/catalog/apps/{name}', {
    params: { path: { name }, query: source ? { source } : {} }
  });
}

const protoEq = (a: unknown, b: unknown) => (a ?? null) === (b ?? null);

export const load: PageServerLoad = async ({ params, url }) => {
  const source = url.searchParams.get('source') ?? undefined;
  const [entryRes, servicesRes] = await Promise.all([
    fetchEntry(params.name, source),
    nephos.GET('/services')
  ]);
  if (entryRes.error || !entryRes.data) {
    throw error(entryRes.response?.status ?? 404, 'Catalog entry not found');
  }
  const entry = entryRes.data as any;
  const services = ((servicesRes.data as any)?.services ?? []) as any[];
  const requires = (entry.requires ?? []) as any[];

  // Eligible providers per requirement: installed services that are running,
  // not being torn down, and expose the required capability/protocol.
  const eligibleByAlias: Record<string, string[]> = {};
  for (const req of requires) {
    eligibleByAlias[req.alias] = services
      .filter(
        (s) =>
          s.lifecycle === 'running' &&
          !s.deleteRequestedAt &&
          (s.provides ?? []).some(
            (p: any) => p.capability === req.capability && protoEq(p.protocol, req.protocol)
          )
      )
      .map((s) => s.slug as string);
  }
  return { entry, source, requires, eligibleByAlias };
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
    const entryRes = await fetchEntry(params.name, source);
    const entry = (entryRes.data as any) ?? {};
    const options = ((entry.config?.options ?? []) as any[]).filter((o) => !o.generated);
    const requires = (entry.requires ?? []) as any[];
    const f = await request.formData();
    const instanceName = String(f.get('instanceName') ?? '').trim() || undefined;

    const config: Record<string, unknown> = {};
    for (const opt of options) {
      const val = coerce(opt.type, f.get(`config.${opt.name}`));
      if (val !== undefined) config[opt.name] = val;
    }
    const bindings: Record<string, { serviceInstance: string }> = {};
    for (const req of requires) {
      const sel = String(f.get(`binding.${req.alias}`) ?? '').trim();
      if (sel) bindings[req.alias] = { serviceInstance: sel };
    }

    const res = await nephos.POST('/apps', {
      body: {
        catalogRef: { kind: 'App', name: params.name, ...(source ? { source } : {}) },
        ...(instanceName ? { instanceName } : {}),
        config,
        bindings
      } as any
    });
    if (res.error) {
      const e = (res.error as any)?.error ?? {};
      return fail(res.response?.status ?? 400, {
        error: e.code ?? 'install_failed',
        message: e.message ?? 'Install failed',
        alias: e.details?.alias ?? null,
        eligibleProviders: e.details?.eligibleProviders ?? null,
        values: Object.fromEntries(f)
      });
    }
    throw redirect(303, '/apps');
  }
};
