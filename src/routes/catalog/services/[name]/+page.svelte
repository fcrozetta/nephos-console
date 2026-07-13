<script lang="ts">
  let { data, form } = $props();
  const entry = $derived(data.entry);
  const options = $derived((entry.config?.options ?? []) as any[]);
  const prev = $derived((form?.values ?? {}) as Record<string, string>);
</script>

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

  {#each options as opt}
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
  {/each}

  <button class="btn primary" type="submit" style="justify-content:center;width:100%">Install</button>
</form>
