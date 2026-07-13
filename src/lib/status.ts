/** Observed status level from a resource snapshot's status field. */
export function level(status: unknown): string {
  if (status && typeof status === 'object' && 'level' in status) {
    return String((status as { level?: unknown }).level ?? 'observing');
  }
  return 'observing';
}

/** Human label for a lifecycle/level pairing used in tables. */
export type Snapshot = {
  slug: string;
  lifecycle: string;
  status?: unknown;
  catalogRef?: { name?: string; source?: string };
};
