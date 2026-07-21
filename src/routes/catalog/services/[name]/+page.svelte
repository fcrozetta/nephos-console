<script lang="ts">
  let { data, form } = $props();
  const entry = $derived(data.entry);
  const allOptions = $derived((entry.config?.options ?? []) as any[]);
  // Generated options are materialized by Nephos, not entered here.
  const options = $derived(allOptions.filter((o) => !o.generated));
  const generated = $derived(allOptions.filter((o) => o.generated));
  // Options with a default are non-blocking; tuck them under Advanced so the
  // default install screen stays confirm-only.
  const basic = $derived(options.filter((o) => o.required || o.default == null));
  const advanced = $derived(options.filter((o) => !o.required && o.default != null));
  const prev = $derived((form?.values ?? {}) as Record<string, string>);
</script>

{#snippet field(opt: any)}
  <div class="field">
    <label for={`config.${opt.name}`}>
      {opt.label ?? opt.name}{opt.required ? ' *' : ''}
    </label>
    {#if opt.type === 'boolean'}
      <input type="checkbox" id={`config.${opt.name}`} name={`config.${opt.name}`}
        checked={prev[`config.${opt.name}`] === 'on' || (prev[`config.${opt.name}`] === undefined && opt.default === true)} />
    {:else if opt.type === 'enum'}
      <select class="input" id={`config.${opt.name}`} name={`config.${opt.name}`}>
        {#each (opt.values ?? []) as v}
          <option value={v.value} selected={(prev[`config.${opt.name}`] ?? opt.default) === v.value}>{v.value}</option>
        {/each}
      </select>
    {:else}
      <input class="input" id={`config.${opt.name}`} name={`config.${opt.name}`}
        type={opt.type === 'integer' ? 'number' : 'text'}
        required={opt.required}
        placeholder={opt.default != null ? String(opt.default) : ''}
        value={prev[`config.${opt.name}`] ?? ''} />
    {/if}
    {#if opt.description}<span class="sub" style="color:var(--meta);font-size:12px">{opt.description}</span>{/if}
  </div>
{/snippet}

<div class="page-head">
  <div>
    <h1>Install {entry.name}</h1>
    <div class="sub">
      Service · {entry.displayName ?? entry.name} · <span class="pill">{entry.source}</span>
    </div>
  </div>
  <a class="btn" href="/catalog">Cancel</a>
</div>

{#if entry.description}
  <p style="color:var(--muted);margin:0 0 18px;max-width:70ch">{entry.description}</p>
{/if}

{#if form?.error}
  <div class="banner">{form.error}{form.message ? `: ${form.message}` : ''}</div>
{/if}

<form method="POST" action="?/install" class="panel" style="max-width:560px">
  <div class="field">
    <label for="instanceName">Instance name</label>
    <input class="input" id="instanceName" name="instanceName" placeholder={entry.name} value={prev.instanceName ?? ''} />
  </div>

  {#each basic as opt}{@render field(opt)}{/each}

  {#if generated.length}
    <div class="field">
      <span class="sub" style="color:var(--meta);font-size:12px">
        Nephos generates {generated.length} secret{generated.length > 1 ? 's' : ''} for you: {generated.map((o) => o.label ?? o.name).join(', ')}. No input needed.
      </span>
    </div>
  {/if}

  {#if advanced.length}
    <details style="margin:2px 0 14px">
      <summary style="cursor:pointer;color:var(--muted);font-size:13px">Advanced settings ({advanced.length})</summary>
      <div style="margin-top:12px">
        {#each advanced as opt}{@render field(opt)}{/each}
      </div>
    </details>
  {/if}

  <button class="btn primary" type="submit" style="justify-content:center;width:100%">Install</button>
</form>
