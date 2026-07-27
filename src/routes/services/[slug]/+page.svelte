<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { level } from '$lib/status';
  import { SvelteSet } from 'svelte/reactivity';

  let { data, form } = $props();
  const s = $derived(data.service);
  const status = $derived((s.status ?? {}) as any);
  const config = $derived((s.config ?? {}) as Record<string, unknown>);
  const dependents = $derived((s.dependents ?? []) as any[]);
  const provides = $derived((s.provides ?? []) as any[]);
  const portals = $derived((s.portals ?? []) as any[]);
  const options = $derived((data.options ?? []) as any[]);
  const credentials = $derived((s.credentials ?? null) as any);

  /** Config rows to render, merging the stored payload with the option specs.
   *
   * A generated secret is absent from `config` entirely, not redacted, so it must
   * come from the option spec or it would be invisible in the UI even though it
   * is exactly the value the operator cannot otherwise obtain. */
  const configRows = $derived.by(() => {
    const specByName = new Map(options.map((o) => [o.name, o]));
    const names = new Set<string>([...Object.keys(config), ...specByName.keys()]);
    return [...names]
      .filter((name) => name in config || specByName.get(name)?.generated)
      .sort()
      .map((name) => {
        const spec = specByName.get(name);
        const stored = config[name];
        return {
          name,
          display: stored === undefined ? '' : String(stored),
          generated: Boolean(spec?.generated),
          secret: Boolean(spec?.generated) || String(stored) === '[REDACTED]'
        };
      });
  });

  /** Revealed values, keyed by option name.
   *
   * Copied out of `form` into local state on purpose: `form` is navigation state,
   * and the 5s `invalidateAll()` poll below clears it, which made a revealed value
   * flash and vanish. Holding it here also means "hide" is instant rather than a
   * server round-trip. */
  let revealed = $state<Record<string, { value: string; source: string }>>({});
  // The slug these values belong to. Part of the state rather than something an
  // effect clears: SvelteKit reuses this component across /services/A ->
  // /services/B, and effects run *after* the DOM update, so a reset effect cannot
  // stop A's credential reaching B's markup first. Every read is gated on this
  // instead, which is synchronous and cannot be outrun by render order.
  let revealedSlug = $state<string | null>(null);
  // Explicit, because the `form` fallback below would otherwise resurrect a value
  // the operator just hid: form still holds the last reveal for the whole visit.
  let hidden = $state(new SvelteSet<string>());

  // Tracks which reveal response has already been applied. Without it the effect
  // read `hidden`, so hiding a value retriggered it, `form.revealed` was still
  // populated, and the credential reappeared immediately. Keyed on the response
  // rather than on `hidden` so only a genuinely new reveal clears the marker.
  let appliedReveal: unknown = null;

  $effect(() => {
    const result = form?.revealed;
    if (!result || result === appliedReveal) return;
    appliedReveal = result;
    // A reveal belongs only to the Service that asked for it.
    if (form?.slug !== s.slug) return;
    if (revealedSlug !== s.slug) {
      revealedSlug = s.slug;
      revealed = {};
      hidden.clear();
    }
    revealed[result.option] = result;
    hidden.delete(result.option);
  });

  /** Falls back to `form` so the value also renders without JavaScript: effects
   * do not run during SSR, so local state is empty on the server response. After
   * hydration the effect has copied it and local state takes over. */
  const revealedFor = (name: string) => {
    if (hidden.has(name)) return null;
    // Identity checked on the read path, not left to an effect. During B's render
    // `revealedSlug` still says A, so A's value is withheld in the same tick the
    // markup is produced -- there is no frame in which it exists in B's DOM.
    if (revealedSlug === s.slug && revealed[name]) return revealed[name];
    // `form` survives a client-side navigation, so the fallback is gated on the
    // reveal belonging to the service on screen.
    const pending = form?.revealed;
    return pending?.option === name && form?.slug === s.slug ? pending : null;
  };

  const hide = (name: string) => {
    delete revealed[name];
    hidden.add(name);
  };

  /** Whether a credential is actually on screen, which is the only reason to pause
   * polling: the 5s `invalidateAll()` clears `form` and would make a revealed
   * value flicker.
   *
   * Scoped to the current slug. Keying it on `revealed` alone meant that after
   * A -> B, A's leftover value -- correctly withheld from B's markup by the gate
   * above, but still present in the object -- kept B's polling suppressed, so B's
   * lifecycle and reconciliation status quietly stopped refreshing. */
  const showingRevealed = $derived(
    revealedSlug === s.slug && Object.keys(revealed).some((name) => !hidden.has(name))
  );

  $effect(() => {
    // Reactive, unlike the onMount check this replaces: that ran once at mount
    // when nothing was revealed yet, so the poll never actually paused.
    if (showingRevealed) return;
    const id = setInterval(() => invalidateAll(), 5000);
    return () => clearInterval(id);
  });

  const actions = ['reconcile', 'start', 'stop', 'remove'] as const;
</script>

<div class="page-head">
  <div>
    <h1>{s.slug}</h1>
    <div class="sub">
      Service · {s.catalogRef?.name}{s.catalogRef?.source ? ` · ` : ''}
      {#if s.catalogRef?.source}<span class="pill">{s.catalogRef.source}</span>{/if}
    </div>
  </div>
  <a class="btn" href="/services">← Services</a>
</div>

{#if form?.error}<div class="banner">{form.error}{form.action ? ` (${form.action})` : ''}</div>{/if}

<div class="panel" style="margin-bottom:16px">
  <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">
    <div><span class="sub" style="color:var(--meta)">Requested</span><br />{s.lifecycle}</div>
    <div><span class="sub" style="color:var(--meta)">Observed</span><br /><span class="pill {level(status)}">{level(status)}</span></div>
    {#if status.reconciliation}<div><span class="sub" style="color:var(--meta)">Reconcile</span><br />{status.reconciliation}</div>{/if}
    {#if s.deleteRequestedAt}<div><span class="pill">destroy requested</span></div>{/if}
  </div>
  {#if status.message || status.reason}
    <p style="margin:12px 0 0;color:var(--muted)">{status.message ?? status.reason}</p>
  {/if}
</div>

<div class="panel" style="margin-bottom:16px">
  <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Actions</h2>
  <div style="display:inline-flex;gap:6px;flex-wrap:wrap">
    {#each actions as a}
      <form method="POST" action="?/lifecycle" use:enhance style="display:inline">
        <input type="hidden" name="action" value={a} />
        <button class="btn" type="submit">{a}</button>
      </form>
    {/each}
    <form method="POST" action="?/lifecycle" use:enhance style="display:inline"
      onsubmit={(e) => { if (!confirm(`Destroy ${s.slug}? This deletes runtime and data.`)) e.preventDefault(); }}>
      <input type="hidden" name="action" value="destroy" />
      <button class="btn danger" type="submit">destroy</button>
    </form>
  </div>
</div>

{#if portals.length}
  <div class="panel" style="margin-bottom:16px">
    <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Portals</h2>
    {#each portals as p}
      <div style="margin-bottom:10px">
        {#if p.published}
          <a class="mono" href={p.canonicalUrl} target="_blank" rel="noreferrer" style="color:var(--accent)">{p.canonicalUrl}</a>
          <span class="pill {level(p.status)}" style="margin-left:8px">{level(p.status)}</span>
          {#if p.displayName}<span class="sub" style="color:var(--meta);margin-left:8px">{p.displayName}</span>{/if}
          {#each (p.aliases ?? []) as al}
            <a class="mono" href={al} target="_blank" rel="noreferrer" style="display:block;color:var(--meta);font-size:12px">{al}</a>
          {/each}
        {:else}
          <span class="mono">{p.displayName ?? p.name}</span>
          <span class="pill" style="margin-left:8px">unpublished</span>
          <!-- Portal exposure is default-deny per root domain, so unpublished is
               the normal state on a fresh install. Say what to do about it. -->
          <div class="sub" style="color:var(--meta);font-size:12px;margin-top:4px">
            {#if p.unpublishedReason === 'no_portal_eligible_domain'}
              No root domain allows Service portals.
              <a href="/platform" style="color:var(--accent)">Allow one on the Platform page →</a>
            {:else}
              {p.unpublishedReason ?? 'Not published.'}
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

{#if credentials}
  <div class="panel" style="margin-bottom:16px">
    <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Login</h2>
    <table>
      <tbody>
        <tr>
          <td class="mono">username</td>
          <td class="mono">{credentials.username ?? '—'}</td>
          <td style="width:1%"></td>
        </tr>
        <tr>
          <td class="mono">password</td>
          <td class="mono">
            {#if revealedFor(credentials.passwordOption)}
              {revealedFor(credentials.passwordOption)?.value}
            {:else}
              ••••••••
            {/if}
          </td>
          <td style="text-align:right;width:1%">
            {#if revealedFor(credentials.passwordOption)}
              <button class="btn" type="button" onclick={() => hide(credentials.passwordOption)}>
                hide
              </button>
            {:else}
              <form method="POST" action="?/reveal" use:enhance style="display:inline">
                <input type="hidden" name="option" value={credentials.passwordOption} />
                <button class="btn" type="submit">reveal</button>
              </form>
            {/if}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
{/if}

{#if provides.length}
  <div class="panel" style="margin-bottom:16px">
    <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Provides</h2>
    {#each provides as p}
      <span class="pill" style="margin-right:6px">{p.protocol ? `${p.capability}/${p.protocol}` : p.capability}</span>
    {/each}
  </div>
{/if}

{#if dependents.length}
  <div class="panel" style="margin-bottom:16px">
    <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Used by</h2>
    <table>
      <thead><tr><th>App</th><th>Alias</th><th>Capability</th><th>Observed</th></tr></thead>
      <tbody>
        {#each dependents as d}
          <tr>
            <td class="mono"><a href={`/apps/${d.appInstance}`} style="color:var(--accent)">{d.appInstance}</a></td>
            <td>{d.bindingAlias}</td>
            <td class="mono">{d.protocol ? `${d.capability}/${d.protocol}` : d.capability}</td>
            <td><span class="pill {level(d.status)}">{level(d.status)}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<div class="panel">
  <h2 style="font-size:14px;margin:0 0 10px;color:var(--muted)">Config</h2>
  {#if form?.revealError}
    <div class="banner">{form.revealMessage} ({form.revealError})</div>
  {/if}
  {#if data.optionsError}
    <div class="banner">
      Could not read this Service's catalog entry ({data.optionsError}), so
      generated secrets are not listed below.
    </div>
  {/if}
  {#if configRows.length === 0}
    <div class="sub" style="color:var(--meta)">No config values.</div>
  {:else}
    <table>
      <tbody>
        {#each configRows as row}
          <tr>
            <td class="mono">{row.name}</td>
            <td class="mono">
              {#if revealedFor(row.name)}
                {revealedFor(row.name)?.value}
              {:else if row.generated}
                <span style="color:var(--meta)">generated by Nephos</span>
              {:else}
                {row.display}
              {/if}
            </td>
            <td style="text-align:right;width:1%">
              {#if row.secret}
                {#if revealedFor(row.name)}
                  <button class="btn" type="button" onclick={() => hide(row.name)}>hide</button>
                {:else}
                  <form method="POST" action="?/reveal" use:enhance style="display:inline">
                    <input type="hidden" name="option" value={row.name} />
                    <button class="btn" type="submit">reveal</button>
                  </form>
                {/if}
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
