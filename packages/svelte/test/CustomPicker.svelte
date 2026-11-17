<script lang="ts">
  /**
   * A hand-built layout, using the thing the preset is made of.
   *
   * It exists to be mounted in a test: if `createAvatarPicker` only worked
   * inside the preset, it would not be a public API, and "build your own
   * layout" would be a claim with nothing behind it.
   */
  import Avatar from '../src/Avatar.svelte';
  import { createAvatarPicker } from '../src/picker.svelte.js';
  import type { AvatarOptions } from 'blobbies';

  let { onchange }: { onchange?: (value: AvatarOptions) => void } = $props();

  const picker = createAvatarPicker({
    name: 'Sourav Nanda',
    onChange: (value) => onchange?.(value),
  });
</script>

<div class="mine">
  <Avatar name="Sourav Nanda" {...picker.state.value} size={64} animate="all" />
  <span data-part="mood">{picker.state.expressionName}</span>
  <div bind:this={picker.host} data-part="map"></div>
  <button data-part="blush" onclick={() => picker.state.toggleBlush()}>Blush</button>
  <button data-part="reset" onclick={() => picker.state.reset()}>Reset</button>
</div>
