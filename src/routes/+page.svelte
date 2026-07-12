<script lang="ts">
  let { data } = $props();
</script>

<div class="page-head">
  <div>
    <h1>Overview</h1>
    <div class="sub">Control-plane health and inventory.</div>
  </div>
  {#if data.version}
    <div class="pill">nephos-api {data.version.version}</div>
  {/if}
</div>

{#if data.apiError}
  <div class="banner">Cannot reach the Nephos API. Check that it is running and NEPHOS_API_URL is correct.</div>
{/if}

<div class="grid cols-3" style="margin-bottom:16px">
  <div class="panel stat"><span class="label">Services</span><span class="value">{data.counts.services}</span></div>
  <div class="panel stat"><span class="label">Apps</span><span class="value">{data.counts.apps}</span></div>
  <div class="panel stat"><span class="label">Healthy</span><span class="value">{data.counts.healthy}</span></div>
</div>

<div class="panel" style="padding:0">
  <div style="padding:14px 18px;border-bottom:1px solid var(--border-soft);font-weight:600">Needs attention</div>
  {#if data.attention.length === 0}
    <div class="empty">Everything is healthy.</div>
  {:else}
    <table>
      <thead>
        <tr><th>Resource</th><th>Kind</th><th>Requested</th><th>Observed</th></tr>
      </thead>
      <tbody>
        {#each data.attention as row}
          <tr>
            <td class="mono">{row.slug}</td>
            <td>{row.kind}</td>
            <td>{row.lifecycle}</td>
            <td><span class="pill {row.level}">{row.level}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
