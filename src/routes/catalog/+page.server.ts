import type { PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

export const load: PageServerLoad = async () => {
  try {
    const [apps, services] = await Promise.all([
      nephos.GET('/catalog/apps'),
      nephos.GET('/catalog/services')
    ]);
    return {
      apiError: false,
      apps: (apps.data?.apps ?? []) as any[],
      services: (services.data?.services ?? []) as any[]
    };
  } catch {
    return { apiError: true, apps: [] as any[], services: [] as any[] };
  }
};
