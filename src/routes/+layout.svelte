<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';

  let { data, children } = $props();

  const nav = [
    { href: '/', label: 'Overview' },
    { href: '/catalog', label: 'Catalog' },
    { href: '/apps', label: 'Apps' },
    { href: '/services', label: 'Services' },
    { href: '/bindings', label: 'Bindings' },
    { href: '/platform', label: 'Platform' }
  ];

  const isCurrent = (href: string) =>
    $page.url.pathname === href || (href !== '/' && $page.url.pathname.startsWith(href));
</script>

{#if data.user}
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="dot"></span> Nephos Console</div>
      {#each nav as item}
        <a class="nav-link" href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
          {item.label}
        </a>
      {/each}
      <div class="spacer"></div>
      <div class="footer">
        <span>{data.user.name}</span>
        <form method="POST" action="/logout">
          <button class="btn" type="submit">Log out</button>
        </form>
      </div>
    </aside>
    <main class="main">
      {@render children()}
    </main>
  </div>
{:else}
  {@render children()}
{/if}
