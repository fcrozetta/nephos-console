import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { nephos } from '$lib/server/nephos';

export const load: PageServerLoad = async () => {
  try {
    const r = await nephos.GET('/bindings');
    return { apiError: false, bindings: ((r.data as any)?.bindings ?? []) as any[] };
  } catch {
    return { apiError: true, bindings: [] as any[] };
  }
};

export const actions: Actions = {
  reconcile: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const res = await nephos.POST('/bindings/{binding_id}/actions/reconcile', {
      params: { path: { binding_id: id } }
    });
    if (res.error) {
      const code = (res.error as any)?.error?.code ?? 'action_failed';
      return fail(res.response?.status ?? 400, { error: code, id });
    }
    return { ok: true, id };
  }
};
