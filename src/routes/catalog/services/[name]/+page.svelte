<script lang="ts">
  import { portalCanonicalDomain, previewUrls } from '$lib/hosts';

  let { data, form } = $props();
  const entry = $derived(data.entry);
  const portals = $derived((entry.portals ?? []) as any[]);
  const portalDomain = $derived(portalCanonicalDomain((data.domains ?? []) as any[]));
  // Live preview: the host comes from the instance name, so it must track typing.
  // `typed` is an override, not the value: the displayed name falls back to what
  // the failed install resubmitted, so an error keeps the operator's instance name
  // instead of clearing it while every other field survives. Deriving rather than
  // seeding $state also keeps this correct if the form ever gains use:enhance,
  // which updates `form` without remounting.
  let typed = $state<string | null>(null);
  const instanceName = $derived(
    typed ?? String((form?.values as any)?.instanceName ?? '')
  );
  const previewSlug = $derived(instanceName.trim() || entry.name);
  const preview = $derived(previewUrls(previewSlug, portals, portalDomain));
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
    <input class="input" id="instanceName" name="instanceName" placeholder={entry.name}
      value={instanceName} oninput={(e) => (typed = e.currentTarget.value)} />
    {#if portals.length}
      <span class="sub" style="color:var(--meta);font-size:12px">
        Names the portal host, so prefer a role over the implementation
        (e.g. <span class="mono">auth</span> rather than <span class="mono">{entry.name}</span>).
        Fixed at install.
      </span>
    {/if}
  </div>

  {#if portals.length}
    <div class="field">
      <span class="sub" style="color:var(--meta)">Portal URL</span>
      {#if portalDomain}
        {#each preview as p}
          <div class="mono" style="font-size:12px">{p.url}
            {#if preview.length > 1}<span style="color:var(--meta)"> · {p.name}</span>{/if}
          </div>
        {/each}
      {:else}
        <span class="sub" style="color:var(--meta);font-size:12px">
          No root domain allows Service portals, so this will install unpublished.
          <a href="/platform" style="color:var(--accent)">Allow one →</a>
        </span>
      {/if}
    </div>
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
