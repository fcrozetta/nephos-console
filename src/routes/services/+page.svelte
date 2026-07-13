<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { level } from '$lib/status';

  let { data, form } = $props();

  // Poll for convergence: desired state is async (202), so re-load periodically.
  onMount(() => {
    const id = setInterval(() => invalidateAll(), 5000);
    return () => clearInterval(id);
  });

  const actions = ['reconcile', 'start', 'stop', 'remove'] as const;
</script>

<div class="page-head">
  <div>
    <h1>Services</h1>
    <div class="sub">Installed platform Services. Requested vs observed state.</div>
  </div>
  <a class="btn primary" href="/catalog">Install…</a>
</div>

{#if data.apiError}
  <div class="banner">Cannot reach the Nephos API.</div>
{/if}
{#if form?.error}
  <div class="banner">{form.error}{form.slug ? ` (${form.slug})` : ''}</div>
{/if}

<div class="panel" style="padding:0">
  {#if data.services.length === 0}
    <div class="empty">No services installed. <a href="/catalog" style="color:var(--accent)">Browse the catalog →</a></div>
  {:else}
    <table>
      <thead>
        <tr><th>Service</th><th>Requested</th><th>Observed</th><th style="text-align:right">Actions</th></tr>
      </thead>
      <tbody>
        {#each data.services as s}
          <tr>
            <td class="mono">{s.slug}</td>
            <td>{s.lifecycle}</td>
            <td><span class="pill {level(s.status)}">{level(s.status)}</span></td>
            <td style="text-align:right">
              <div style="display:inline-flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">
                {#each actions as a}
                  <form method="POST" action="?/lifecycle" use:enhance style="display:inline">
                    <input type="hidden" name="slug" value={s.slug} />
                    <input type="hidden" name="action" value={a} />
                    <button class="btn" type="submit">{a}</button>
                  </form>
                {/each}
                <form method="POST" action="?/lifecycle" use:enhance style="display:inline"
                  onsubmit={(e) => { if (!confirm(`Destroy ${s.slug}? This deletes runtime and data.`)) e.preventDefault(); }}>
                  <input type="hidden" name="slug" value={s.slug} />
                  <input type="hidden" name="action" value="destroy" />
                  <button class="btn danger" type="submit">destroy</button>
                </form>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
