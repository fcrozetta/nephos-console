<script lang="ts">
  let { form } = $props();
</script>

<div class="auth-wrap">
  <div class="panel auth-card">
    <div class="brand" style="padding-left:0"><span class="dot"></span> Nephos Console</div>
    <p class="sub" style="color:var(--muted);margin:0 0 18px">Sign in to manage the control plane.</p>
    {#if form?.error}
      <div class="error-text">{form.error}</div>
    {/if}
    <form method="POST">
      <div class="field">
        <label for="username">Username</label>
        <input class="input" id="username" name="username" type="text" autocomplete="username"
          value={form?.username ?? ''} required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input class="input" id="password" name="password" type="password" autocomplete="current-password" required />
      </div>
      <button class="btn primary" type="submit" style="width:100%;justify-content:center">Sign in</button>
    </form>
  </div>
</div>
