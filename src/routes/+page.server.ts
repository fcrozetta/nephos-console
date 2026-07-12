import type { PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

type Row = { slug: string; kind: string; lifecycle: string; level: string };

function level(status: unknown): string {
  if (status && typeof status === 'object' && 'level' in status) {
    return String((status as { level?: unknown }).level ?? 'observing');
  }
  return 'observing';
}

export const load: PageServerLoad = async () => {
  try {
    const [version, services, apps] = await Promise.all([
      nephos.GET('/version'),
      nephos.GET('/services'),
      nephos.GET('/apps')
    ]);
    const svc = (services.data?.services ?? []) as any[];
    const app = (apps.data?.apps ?? []) as any[];
    const rows: Row[] = [
      ...svc.map((s) => ({ slug: s.slug, kind: 'Service', lifecycle: s.lifecycle, level: level(s.status) })),
      ...app.map((a) => ({ slug: a.slug, kind: 'App', lifecycle: a.lifecycle, level: level(a.status) }))
    ];
    const attention = rows.filter((r) => !['healthy'].includes(r.level));
    return {
      apiError: false,
      version: version.data ?? null,
      counts: { services: svc.length, apps: app.length, healthy: rows.filter((r) => r.level === 'healthy').length },
      attention
    };
  } catch (e) {
    return { apiError: true, version: null, counts: { services: 0, apps: 0, healthy: 0 }, attention: [] as Row[] };
  }
};
