<script lang="ts">
  let { data } = $props();
</script>

<div class="page-head">
  <div>
    <h1>Catalog</h1>
    <div class="sub">Installable Apps and Services across all registries.</div>
  </div>
</div>

{#if data.apiError}
  <div class="banner">Cannot reach the Nephos API.</div>
{/if}

<h2 style="font-size:15px;color:var(--fg-2);margin:0 0 10px">Services</h2>
<div class="panel" style="padding:0;margin-bottom:24px">
  {#if data.services.length === 0}
    <div class="empty">No services in the catalog.</div>
  {:else}
    <table>
      <thead><tr><th>Name</th><th>Provides</th><th>Source</th><th></th></tr></thead>
      <tbody>
        {#each data.services as s}
          <tr>
            <td class="mono">{s.name}</td>
            <td>{(s.provides ?? []).map((p: any) => p.protocol ? `${p.capability}/${p.protocol}` : p.capability).join(', ')}</td>
            <td><span class="pill">{s.source}</span></td>
            <td style="text-align:right"><a class="btn" href={`/catalog/services/${s.name}?source=${s.source}`}>Install…</a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<h2 style="font-size:15px;color:var(--fg-2);margin:0 0 10px">Apps</h2>
<div class="panel" style="padding:0">
  {#if data.apps.length === 0}
    <div class="empty">No apps in the catalog.</div>
  {:else}
    <table>
      <thead><tr><th>Name</th><th>Requires</th><th>Source</th><th></th></tr></thead>
      <tbody>
        {#each data.apps as a}
          <tr>
            <td class="mono">{a.name}</td>
            <td>{(a.requires ?? []).map((r: any) => r.protocol ? `${r.capability}/${r.protocol}` : r.capability).join(', ') || '—'}</td>
            <td><span class="pill">{a.source}</span></td>
            <td style="text-align:right"><a class="btn" href={`/catalog/apps/${a.name}?source=${a.source}`}>Install…</a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
