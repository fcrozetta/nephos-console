<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { level } from '$lib/status';

  let { data, form } = $props();
  const s = $derived(data.service);
  const status = $derived((s.status ?? {}) as any);
  const config = $derived((s.config ?? {}) as Record<string, unknown>);
  const dependents = $derived((s.dependents ?? []) as any[]);
  const provides = $derived((s.provides ?? []) as any[]);

  onMount(() => {
    const id = setInterval(() => invalidateAll(), 5000);
    return () => clearInterval(id);
  });

  const actions = ['reconcile', 'start', 'stop', 'remove'] as const;
</script>

<div class="page-head">
  <div>
    <h1>{s.slug}</h1>
    <div class="sub">
      Service · {s.catalogRef?.name}{s.catalogRef?.source ? ` · ` : ''}
      {#if s.catalogRef?.source}<span class="pill">{s.catalogRef.source}</span>{/if}
    </div>
  </div>
  <a class="btn" href="/services">← Services</a>
</div>

{#if form?.error}<div class="banner">{form.error}{form.action ? ` (${form.action})` : ''}</div>{/if}

<div class="panel" style="margin-bottom:16px">
  <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">
    <div><span class="sub" style="color:var(--meta)">Requested</span><br />{s.lifecycle}</div>
    <div><span class="sub" style="color:var(--meta)">Observed</span><br /><span class="pill {level(status)}">{level(status)}</span></div>
    {#if status.reconciliation}<div><span class="sub" style="color:var(--meta)">Reconcile</span><br />{status.reconciliation}</div>{/if}
    {#if s.deleteRequestedAt}<div><span class="pill">destroy requested</span></div>{/if}
  </div>
  {#if status.message || status.reason}
    <p style="margin:12px 0 0;color:var(--muted)">{status.message ?? status.reason}</p>
  {/if}
</div>

<div class="panel" style="margin-bottom:16px">
  <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Actions</h2>
  <div style="display:inline-flex;gap:6px;flex-wrap:wrap">
    {#each actions as a}
      <form method="POST" action="?/lifecycle" use:enhance style="display:inline">
        <input type="hidden" name="action" value={a} />
        <button class="btn" type="submit">{a}</button>
      </form>
    {/each}
    <form method="POST" action="?/lifecycle" use:enhance style="display:inline"
      onsubmit={(e) => { if (!confirm(`Destroy ${s.slug}? This deletes runtime and data.`)) e.preventDefault(); }}>
      <input type="hidden" name="action" value="destroy" />
      <button class="btn danger" type="submit">destroy</button>
    </form>
  </div>
</div>

{#if provides.length}
  <div class="panel" style="margin-bottom:16px">
    <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Provides</h2>
    {#each provides as p}
      <span class="pill" style="margin-right:6px">{p.protocol ? `${p.capability}/${p.protocol}` : p.capability}</span>
    {/each}
  </div>
{/if}

{#if dependents.length}
  <div class="panel" style="margin-bottom:16px">
    <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Used by</h2>
    <table>
      <thead><tr><th>App</th><th>Alias</th><th>Capability</th><th>Observed</th></tr></thead>
      <tbody>
        {#each dependents as d}
          <tr>
            <td class="mono"><a href={`/apps/${d.appInstance}`} style="color:var(--accent)">{d.appInstance}</a></td>
            <td>{d.bindingAlias}</td>
            <td class="mono">{d.protocol ? `${d.capability}/${d.protocol}` : d.capability}</td>
            <td><span class="pill {level(d.status)}">{level(d.status)}</span></td>
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
