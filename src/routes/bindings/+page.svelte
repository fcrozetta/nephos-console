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

  const cap = (b: any) => (b.protocol ? `${b.capability}/${b.protocol}` : b.capability);
</script>

<div class="page-head">
  <div>
    <h1>Bindings</h1>
    <div class="sub">How installed Apps are wired to the Services that satisfy their capabilities.</div>
  </div>
</div>

{#if data.apiError}<div class="banner">Cannot reach the Nephos API.</div>{/if}
{#if form?.error}<div class="banner">{form.error}</div>{/if}

<div class="panel" style="padding:0">
  {#if data.bindings.length === 0}
    <div class="empty">No bindings yet. They are created when you install an App with requirements.</div>
  {:else}
    <table>
      <thead>
        <tr><th>App</th><th>Alias</th><th>Capability</th><th>Service</th><th>Observed</th><th style="text-align:right"></th></tr>
      </thead>
      <tbody>
        {#each data.bindings as b}
          <tr>
            <td class="mono">{b.appInstance?.slug}</td>
            <td>{b.alias}</td>
            <td class="mono">{cap(b)}</td>
            <td class="mono">{b.serviceInstance?.slug}</td>
            <td><span class="pill {level(b.status)}">{level(b.status)}</span></td>
            <td style="text-align:right">
              <form method="POST" action="?/reconcile" use:enhance style="display:inline">
                <input type="hidden" name="id" value={b.id} />
                <button class="btn" type="submit">reconcile</button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
