<script lang="ts">
  let { data, form } = $props();
  const entry = $derived(data.entry);
  const allOptions = $derived((entry.config?.options ?? []) as any[]);
  const options = $derived(allOptions.filter((o) => !o.generated));
  const generated = $derived(allOptions.filter((o) => o.generated));
  // Options with a default are non-blocking; tuck them under Advanced so the
  // default install screen stays confirm-only.
  const basic = $derived(options.filter((o) => o.required || o.default == null));
  const advanced = $derived(options.filter((o) => !o.required && o.default != null));
  const requires = $derived((data.requires ?? []) as any[]);
  const eligibleByAlias = $derived((data.eligibleByAlias ?? {}) as Record<string, string[]>);
  const prev = $derived((form?.values ?? {}) as Record<string, string>);
  const reqLabel = (r: any) => (r.protocol ? `${r.capability}/${r.protocol}` : r.capability);
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
      App · {entry.displayName ?? entry.name} · <span class="pill">{entry.source}</span>
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

  {#if requires.length}
    <h2 style="font-size:14px;margin:18px 0 8px;color:var(--muted)">Bindings</h2>
    {#each requires as req}
      {@const eligible = eligibleByAlias[req.alias] ?? []}
      <div class="field">
        <label for={`binding.${req.alias}`}>{req.alias} <span class="sub" style="color:var(--meta)">({reqLabel(req)})</span></label>
        {#if eligible.length === 0}
          <div class="banner" style="margin:0">No running service provides <span class="mono">{reqLabel(req)}</span>. Install one first.</div>
          <input type="hidden" name={`binding.${req.alias}`} value="" />
        {:else}
          <select class="input" id={`binding.${req.alias}`} name={`binding.${req.alias}`} required>
            {#if eligible.length > 1}<option value="" selected={!prev[`binding.${req.alias}`]}>Select a provider…</option>{/if}
            {#each eligible as slug}
              <option value={slug} selected={(prev[`binding.${req.alias}`] ?? (eligible.length === 1 ? slug : '')) === slug}>{slug}</option>
            {/each}
          </select>
          {#if form?.alias === req.alias}<span class="sub" style="color:var(--danger,#c00);font-size:12px">{form?.message}</span>{/if}
        {/if}
      </div>
    {/each}
  {/if}

  {#if basic.length}
    <h2 style="font-size:14px;margin:18px 0 8px;color:var(--muted)">Configuration</h2>
  {/if}
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
