import { createPicker, injectPickerStyles, staticSnapshot } from 'blobbies/picker';
import type { PickerRuntime, PickerSnapshot } from 'blobbies/picker';
import type { AvatarOptions } from 'blobbies';

export interface CreateAvatarPickerOptions {
  /** The person's name — the eyes every look shares. */
  name: string;
  /** The look to open on. Changing it after mount does not reset the picker. */
  defaultValue?: AvatarOptions;
  /** The colours the map offers. Defaults to the built-in palette. */
  palette?: readonly string[];
  /** Run the depth-of-field spotlight while hovering. */
  spotlight?: boolean;
  /** Called with the current look whenever it changes — never on mount. */
  onChange?: (value: AvatarOptions) => void;
  onSave?: (value: AvatarOptions) => void;
  onCancel?: () => void;
}

/** The runtime's state, plus the actions a layout needs to offer. */
export interface AvatarPickerState extends PickerSnapshot {
  nextExpression: () => void;
  previousExpression: () => void;
  toggleBlush: () => void;
  toggleSpotlight: () => void;
  reset: () => void;
  save: () => void;
  cancel: () => void;
  hasCancel: boolean;
}

export interface AvatarPickerHandle {
  /** Bind this to the element the map should live in. */
  host: HTMLElement | undefined;
  /** Everything a layout renders from. */
  readonly state: AvatarPickerState;
  readonly runtime: PickerRuntime | null;
}

/**
 * Build your own picker layout, with the picker's behaviour.
 *
 * `<AvatarPicker>` is the preset. This is what it is made of, and what you use
 * when the panel it draws is not the panel you want. A rune module rather than
 * a set of part components, because in Svelte 5 that is how a component and its
 * state get shared.
 *
 * ```svelte
 * <script>
 *   import { createAvatarPicker } from '@blobbies/svelte';
 *
 *   const picker = createAvatarPicker({ name: 'Ira', onSave: save });
 * </script>
 *
 * <div class="mine">
 *   <Avatar name="Ira" {...picker.state.value} size={64} />
 *   <div bind:this={picker.host}></div>
 *   <button onclick={() => picker.state.reset()}>Reset</button>
 * </div>
 * ```
 *
 * The behaviour is `createPicker` in the core — the same runtime React, Vue and
 * `<blobbies-avatar>` use — so a custom layout is not a reimplementation, it is
 * the picker with different chrome.
 */
export function createAvatarPicker(options: CreateAvatarPickerOptions): AvatarPickerHandle {
  const {
    name,
    defaultValue,
    palette,
    spotlight = true,
    onChange,
    onSave,
    onCancel,
  } = options;

  let host = $state<HTMLElement | undefined>(undefined);
  let runtime = $state<PickerRuntime | null>(null);
  // `$state.raw`, not `$state`: the runtime hands back a new object on every
  // real change, and that is the granularity we want to re-render at.
  let snapshot = $state.raw(staticSnapshot({ name, defaultValue, palette, spotlight }));

  // Runs when `host` is bound, which is once the element exists — the map cannot
  // be measured before then. Its cleanup runs on destroy.
  $effect(() => {
    if (!host) return undefined;
    injectPickerStyles();
    const created = createPicker({
      name,
      defaultValue,
      palette,
      spotlight,
      onChange,
      onSave,
      onCancel,
    });
    if (!created) return undefined;

    runtime = created;
    snapshot = created.getSnapshot();
    const stop = created.subscribe(() => {
      snapshot = created.getSnapshot();
    });
    host.append(created.surface);
    created.measure();

    return () => {
      stop();
      created.destroy();
    };
  });

  return {
    // A getter and a setter rather than a plain field, so `bind:this` can write
    // it and the effect above can read it as the reactive value it is.
    get host() {
      return host;
    },
    set host(element: HTMLElement | undefined) {
      host = element;
    },
    get state(): AvatarPickerState {
      // Reading `snapshot` here is what makes a layout re-render when the
      // picker changes; there is no second subscription to keep in step.
      return {
        ...snapshot,
        nextExpression: () => runtime?.nextExpression(),
        previousExpression: () => runtime?.previousExpression(),
        toggleBlush: () => runtime?.toggleBlush(),
        toggleSpotlight: () => runtime?.toggleSpotlight(),
        reset: () => runtime?.reset(),
        save: () => runtime?.save(),
        cancel: () => runtime?.cancel(),
        hasCancel: !!onCancel,
      };
    },
    get runtime() {
      return runtime;
    },
  };
}
