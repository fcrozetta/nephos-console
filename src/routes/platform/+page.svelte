<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
</script>

<div class="page-head">
  <div>
    <h1>Platform</h1>
    <div class="sub">
      Domains used for App routes and Service portals. Portals are default-deny per
      domain, so an admin surface is never published just by installing a Service.
    </div>
  </div>
</div>

{#if data.apiError}<div class="banner">Cannot reach the Nephos API.</div>{/if}
{#if form?.error}<div class="banner">{form.message ?? form.error}</div>{/if}

<div class="panel" style="padding:0;margin-bottom:20px">
  {#if data.domains.length === 0}
    <div class="empty">No platform domains yet. Add one below.</div>
  {:else}
    <table>
      <thead><tr><th>Name</th><th>Domain</th><th>Default</th><th>Service portals</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>
        {#each data.domains as d}
          <tr>
            <td class="mono">{d.name}</td>
            <td class="mono">{d.domain}</td>
            <td>{#if d.default}<span class="pill healthy">default</span>{/if}</td>
            <td>
              {#if d.allowsServicePortals}
                <span class="pill healthy">allowed</span>
              {:else}
                <span class="pill">denied</span>
              {/if}
            </td>
            <td style="text-align:right">
              <div style="display:inline-flex;gap:6px;justify-content:flex-end">
                <form method="POST" action="?/setServicePortals" use:enhance style="display:inline"
                  onsubmit={(e) => {
                    if (!d.allowsServicePortals &&
                        !confirm(`Publish Service portals on ${d.domain}? Admin UIs become reachable at *.${d.domain}.`)) e.preventDefault();
                  }}>
                  <input type="hidden" name="name" value={d.name} />
                  <input type="hidden" name="allowed" value={d.allowsServicePortals ? 'false' : 'true'} />
                  <button class="btn" type="submit">{d.allowsServicePortals ? 'deny portals' : 'allow portals'}</button>
                </form>
                {#if !d.default}
                  <form method="POST" action="?/setDefault" use:enhance style="display:inline">
                    <input type="hidden" name="name" value={d.name} />
                    <button class="btn" type="submit">set default</button>
                  </form>
                  <form method="POST" action="?/remove" use:enhance style="display:inline"
                    onsubmit={(e) => { if (!confirm(`Remove domain ${d.name}?`)) e.preventDefault(); }}>
                    <input type="hidden" name="name" value={d.name} />
                    <button class="btn danger" type="submit">remove</button>
                  </form>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<form method="POST" action="?/add" use:enhance class="panel" style="max-width:480px">
  <h2 style="font-size:14px;margin:0 0 12px;color:var(--muted)">Add domain</h2>
  <div class="field">
    <label for="name">Name</label>
    <input class="input" id="name" name="name" placeholder="local" value={(form as any)?.name ?? ''} required />
  </div>
  <div class="field">
    <label for="domain">Domain suffix</label>
    <input class="input" id="domain" name="domain" placeholder="nephos.localhost" value={(form as any)?.domain ?? ''} required />
  </div>
  <label style="display:flex;gap:8px;align-items:center;margin:6px 0 6px">
    <input type="checkbox" name="default" /> <span class="sub">Make this the default</span>
  </label>
  <label style="display:flex;gap:8px;align-items:center;margin:0 0 14px">
    <input type="checkbox" name="allowsServicePortals" />
    <span class="sub">Allow Service portals (publishes admin UIs on this domain)</span>
  </label>
  <button class="btn primary" type="submit" style="justify-content:center;width:100%">Add domain</button>
</form>
