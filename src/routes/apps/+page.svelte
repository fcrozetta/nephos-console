<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { level } from '$lib/status';

  let { data, form } = $props();

  onMount(() => {
    const id = setInterval(() => invalidateAll(), 5000);
    return () => clearInterval(id);
  });

  const actions = ['reconcile', 'start', 'stop', 'remove'] as const;
</script>

<div class="page-head">
  <div>
    <h1>Apps</h1>
    <div class="sub">Installed Apps and their routes.</div>
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
  {#if data.apps.length === 0}
    <div class="empty">No apps installed. <a href="/catalog" style="color:var(--accent)">Browse the catalog →</a></div>
  {:else}
    <table>
      <thead>
        <tr><th>App</th><th>Requested</th><th>Observed</th><th>Route</th><th style="text-align:right">Actions</th></tr>
      </thead>
      <tbody>
        {#each data.apps as a}
          <tr>
            <td class="mono"><a href={`/apps/${a.slug}`} style="color:var(--accent)">{a.slug}</a></td>
            <td>{a.lifecycle}</td>
            <td><span class="pill {level(a.status)}">{level(a.status)}</span></td>
            <td>
              {#if a.routes?.[0]?.canonicalUrl}
                <a class="mono" style="color:var(--accent)" href={a.routes[0].canonicalUrl} target="_blank" rel="noreferrer">{a.routes[0].canonicalUrl}</a>
              {:else}—{/if}
            </td>
            <td style="text-align:right">
              <div style="display:inline-flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">
                {#each actions as act}
                  <form method="POST" action="?/lifecycle" use:enhance style="display:inline">
                    <input type="hidden" name="slug" value={a.slug} />
                    <input type="hidden" name="action" value={act} />
                    <button class="btn" type="submit">{act}</button>
                  </form>
                {/each}
                <form method="POST" action="?/lifecycle" use:enhance style="display:inline"
                  onsubmit={(e) => { if (!confirm(`Destroy ${a.slug}? This deletes runtime and data.`)) e.preventDefault(); }}>
                  <input type="hidden" name="slug" value={a.slug} />
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
