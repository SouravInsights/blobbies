<script lang="ts">
  /**
   * `AvatarPicker` — the Look Map, for Svelte.
   *
   * The map, the gestures, the lens and the value are `createPicker` in the
   * core: the same runtime React and Vue use. So this file is chrome, and
   * nothing about the behaviour is decided here — which is the only way the
   * picker can feel the same in every framework rather than merely similar.
   *
   * The map element is built by the runtime and appended on mount, because 35
   * cells are rewritten every frame during a pan and that is not a job for a
   * renderer. Everything else here is `createAvatarPicker`, which is also
   * exported, so a custom layout is the same picker with different chrome.
   */
  import { untrack } from 'svelte';
  import { createAvatarPicker } from './picker.svelte.js';
  import type { AvatarOptions } from 'blobbies';

  interface Props {
    /** The person's name — the eyes every look shares. */
    name: string;
    /** The look to open on. Changing it after mount does not reset the picker. */
    defaultValue?: AvatarOptions;
    /** The colours the map offers. Defaults to the built-in palette. */
    palette?: readonly string[];
    /** Run the depth-of-field spotlight while hovering. */
    spotlight?: boolean;
    /** Skip the panel styling and style the parts yourself. */
    unstyled?: boolean;
    title?: string;
    description?: string;
    saveLabel?: string;
    onchange?: (value: AvatarOptions) => void;
    onsave?: (value: AvatarOptions) => void;
    oncancel?: () => void;
    [key: string]: unknown;
  }

  let {
    name,
    defaultValue,
    palette,
    spotlight = true,
    unstyled = false,
    title = 'Choose an avatar',
    description = 'Drag across for colour, down for mood, then keep one.',
    saveLabel = 'Save',
    onchange,
    onsave,
    oncancel,
    ...rest
  }: Props = $props();

  // The preset is a layout over `createAvatarPicker`, not a second
  // implementation of it — which is what keeps the preset and a custom layout
  // honest about being the same picker.
  // `untrack`: these are the options the picker *opens* with, so reading them
  // once is the intent, not an oversight. The callbacks are read through
  // closures so a later prop change still reaches them.
  const picker = untrack(() =>
    createAvatarPicker({
      name,
      defaultValue,
      palette,
      spotlight,
      onChange: (value) => onchange?.(value),
      onSave: (value) => onsave?.(value),
      // Only wire this up when the parent is listening: the runtime uses it to
      // decide whether it has anything to cancel, so wiring it unconditionally
      // puts a Cancel button on screen that does nothing.
      onCancel: oncancel ? () => oncancel?.() : undefined,
    }),
  );
</script>

<div class={unstyled ? undefined : 'bb-picker'} data-part="root" {...rest}>
  {#if title || description}
    <div class="bb-picker-head" data-part="header">
      {#if title}<h3 data-part="title">{title}</h3>{/if}
      {#if description}<p data-part="description">{description}</p>{/if}
    </div>
  {/if}

  <div bind:this={picker.host} data-part="surface-host"></div>

  <div class="bb-picker-mood" data-part="mood">
    <button
      type="button"
      class="bb-picker-step"
      aria-label="Previous expression"
      onclick={() => picker.state.previousExpression()}
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7.5 2.5 4 6l3.5 3.5" />
      </svg>
    </button>
    <span class="bb-picker-mood-name" aria-live="polite">{picker.state.expressionName}</span>
    <button
      type="button"
      class="bb-picker-step"
      aria-label="Next expression"
      onclick={() => picker.state.nextExpression()}
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4.5 2.5 8 6l-3.5 3.5" />
      </svg>
    </button>
  </div>

  <div class="bb-picker-foot" data-part="footer">
    <button
      type="button"
      class="bb-picker-blush"
      data-part="blush"
      data-on={picker.state.blush ? '1' : undefined}
      aria-pressed={picker.state.blush}
      onclick={() => picker.state.toggleBlush()}
    >
      Blush
    </button>
    <button
      type="button"
      class="bb-picker-spotlight"
      data-part="spotlight"
      data-on={picker.state.spotlight ? '1' : undefined}
      aria-pressed={picker.state.spotlight}
      onclick={() => picker.state.toggleSpotlight()}
    >
      Spotlight
    </button>
    <button
      type="button"
      class="bb-picker-reset"
      data-part="reset"
      disabled={!picker.state.changed}
      onclick={() => picker.state.reset()}
    >
      Reset
    </button>
    <span class="bb-picker-grow"></span>
    {#if oncancel}
      <button
        type="button"
        class="bb-picker-btn"
        data-part="cancel"
        onclick={() => picker.state.cancel()}
      >
        Cancel
      </button>
    {/if}
    <button
      type="button"
      class="bb-picker-btn bb-picker-primary"
      data-part="save"
      onclick={() => picker.state.save()}
    >
      {saveLabel}
    </button>
  </div>
</div>
