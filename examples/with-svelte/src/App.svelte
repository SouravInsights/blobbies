<script lang="ts">
  /**
   * Blobbies in a Svelte app.
   *
   * Two things worth reading, because they are the two things a Svelte app
   * actually does with the library: render an avatar anywhere, and let someone
   * choose their own.
   */
  import { Avatar, AvatarPicker } from '@blobbies/svelte';
  import type { AvatarOptions } from '@blobbies/svelte';

  let name = $state('Sourav Nanda');
  let saved = $state<AvatarOptions | null>(null);
  let live = $state<AvatarOptions | null>(null);
  let open = $state(true);
</script>

<div class="page">
  <header class="head">
    <div class="me">
      <Avatar
        {name}
        {...(live ?? saved ?? {})}
        size={44}
        animate="all"
      />
      <div>
        <b>{name}</b>
        <span>{live ? 'choosing…' : saved ? 'saved' : ''}</span>
      </div>
    </div>
    <button class="btn" onclick={() => (open = !open)}>
      {open ? 'Close' : 'Choose an avatar'}
    </button>
  </header>

  <div class="field">
    <label for="name">Name</label>
    <input
      id="name"
      bind:value={name}
      oninput={() => {
        saved = null;
        live = null;
      }}
    />
  </div>

  {#if open}
    <AvatarPicker
      {name}
      defaultValue={saved ?? undefined}
      onchange={(value) => (live = value)}
      onsave={(value) => {
        saved = value;
        live = null;
        open = false;
      }}
      oncancel={() => {
        live = null;
        open = false;
      }}
    />
  {/if}
</div>

<style>
  :global(:root) {
    color-scheme: light dark;
  }
  :global(body) {
    margin: 0;
    padding: 48px 24px;
    font: 14px/1.6 ui-sans-serif, system-ui, sans-serif;
    background: #fafafa;
    color: #18181b;
  }
  @media (prefers-color-scheme: dark) {
    :global(body) {
      background: #0b0b0d;
      color: #f4f4f5;
    }
  }
  /* Block flow with an auto margin, not a centred grid: a grid whose items are
     centred sizes its implicit column to max-content, and every child asking
     for a percentage width then resolves against an indefinite one. */
  .page {
    width: min(480px, 100%);
    margin-inline: auto;
    display: grid;
    gap: 24px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .me {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .me b {
    display: block;
  }
  .me span {
    color: #71717a;
    font-size: 12.5px;
  }
  .field {
    display: grid;
    gap: 6px;
  }
  .field label {
    font-size: 12.5px;
    color: #71717a;
  }
  .field input {
    padding: 9px 12px;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    font: inherit;
    background: transparent;
    color: inherit;
  }
  .btn {
    height: 38px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: #18181b;
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  @media (prefers-color-scheme: dark) {
    .btn {
      background: #f4f4f5;
      color: #18181b;
    }
  }
</style>
