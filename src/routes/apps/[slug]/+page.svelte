<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { level } from '$lib/status';

  let { data, form } = $props();
  const a = $derived(data.app);
  const status = $derived((a.status ?? {}) as any);
  const config = $derived((a.config ?? {}) as Record<string, unknown>);
  const bindings = $derived((a.bindings ?? []) as any[]);
  const routes = $derived((a.routes ?? []) as any[]);

  onMount(() => {
    const id = setInterval(() => invalidateAll(), 5000);
    return () => clearInterval(id);
  });

  const actions = ['reconcile', 'start', 'stop', 'remove'] as const;
</script>

<div class="page-head">
  <div>
    <h1>{a.slug}</h1>
    <div class="sub">
      App · {a.catalogRef?.name}{a.catalogRef?.source ? ` · ` : ''}
      {#if a.catalogRef?.source}<span class="pill">{a.catalogRef.source}</span>{/if}
    </div>
  </div>
  <a class="btn" href="/apps">← Apps</a>
</div>

{#if form?.error}<div class="banner">{form.error}{form.action ? ` (${form.action})` : ''}</div>{/if}

<div class="panel" style="margin-bottom:16px">
  <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">
    <div><span class="sub" style="color:var(--meta)">Requested</span><br />{a.lifecycle}</div>
    <div><span class="sub" style="color:var(--meta)">Observed</span><br /><span class="pill {level(status)}">{level(status)}</span></div>
    {#if status.reconciliation}<div><span class="sub" style="color:var(--meta)">Reconcile</span><br />{status.reconciliation}</div>{/if}
    {#if a.deleteRequestedAt}<div><span class="pill">destroy requested</span></div>{/if}
  </div>
  {#if status.message || status.reason}
    <p style="margin:12px 0 0;color:var(--muted)">{status.message ?? status.reason}</p>
  {/if}
</div>

<div class="panel" style="margin-bottom:16px">
  <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Actions</h2>
  <div style="display:inline-flex;gap:6px;flex-wrap:wrap">
    {#each actions as act}
      <form method="POST" action="?/lifecycle" use:enhance style="display:inline">
        <input type="hidden" name="action" value={act} />
        <button class="btn" type="submit">{act}</button>
      </form>
    {/each}
    <form method="POST" action="?/lifecycle" use:enhance style="display:inline"
      onsubmit={(e) => { if (!confirm(`Destroy ${a.slug}? This deletes runtime and data.`)) e.preventDefault(); }}>
      <input type="hidden" name="action" value="destroy" />
      <button class="btn danger" type="submit">destroy</button>
    </form>
  </div>
</div>

{#if routes.length}
  <div class="panel" style="margin-bottom:16px">
    <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Routes</h2>
    {#each routes as r}
      <div class="mono">{r.url ?? r.host ?? JSON.stringify(r)}</div>
    {/each}
  </div>
{/if}

{#if bindings.length}
  <div class="panel" style="margin-bottom:16px">
    <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Bindings</h2>
    <table>
      <thead><tr><th>Alias</th><th>Capability</th><th>Service</th><th>Observed</th></tr></thead>
      <tbody>
        {#each bindings as b}
          <tr>
            <td>{b.alias}</td>
            <td class="mono">{b.protocol ? `${b.capability}/${b.protocol}` : b.capability}</td>
            <td class="mono"><a href={`/services/${b.serviceInstance?.slug}`} style="color:var(--accent)">{b.serviceInstance?.slug}</a></td>
            <td><span class="pill {level(b.status)}">{level(b.status)}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<div class="panel">
  <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Config</h2>
  {#if Object.keys(config).length === 0}
    <div class="sub" style="color:var(--meta)">No config values.</div>
  {:else}
    <table>
      <tbody>
        {#each Object.entries(config) as [k, v]}
          <tr><td class="mono">{k}</td><td class="mono">{String(v)}</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
