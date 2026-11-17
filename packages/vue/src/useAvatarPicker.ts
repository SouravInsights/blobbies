import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  type ComputedRef,
  type Ref,
  type ShallowRef,
} from 'vue';
import { createPicker, injectPickerStyles, staticSnapshot } from 'blobbies/picker';
import type { PickerRuntime, PickerSnapshot } from 'blobbies/picker';
import type { AvatarOptions } from 'blobbies';

export interface UseAvatarPickerOptions {
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

export interface UseAvatarPicker {
  /** Bind this to the element the map should live in. */
  host: Ref<HTMLElement | null>;
  /** Everything a layout renders from. */
  state: ComputedRef<AvatarPickerState>;
  runtime: ShallowRef<PickerRuntime | null>;
}

/**
 * Build your own picker layout, with the picker's behaviour.
 *
 * `<AvatarPicker>` is the preset. This is what it is made of, and what you use
 * when the panel it draws is not the panel you want: a Vue-idiomatic composable
 * rather than a set of part components, because in Vue a composable is how a
 * component and its state get shared.
 *
 * ```vue
 * <script setup>
 * const { host, state } = useAvatarPicker({ name: 'Ira', onSave: save })
 * </script>
 *
 * <template>
 *   <div class="mine">
 *     <Avatar :name="'Ira'" v-bind="state.value" size="64" />
 *     <div ref="host"></div>
 *     <button @click="state.reset()">Reset</button>
 *   </div>
 * </template>
 * ```
 *
 * The behaviour is `createPicker` in the core — the same runtime React, Svelte
 * and `<blobbies-avatar>` use — so a custom layout is not a reimplementation,
 * it is the picker with different chrome.
 */
export function useAvatarPicker(options: UseAvatarPickerOptions): UseAvatarPicker {
  const {
    name,
    defaultValue,
    palette,
    spotlight = true,
    onChange,
    onSave,
    onCancel,
  } = options;

  injectPickerStyles();

  const host = ref<HTMLElement | null>(null);
  const runtime = shallowRef<PickerRuntime | null>(null);
  const snapshot = shallowRef<PickerSnapshot>(
    staticSnapshot({ name, defaultValue, palette, spotlight }),
  );

  let stop: (() => void) | undefined;

  onMounted(() => {
    const created = createPicker({
      name,
      defaultValue,
      palette,
      spotlight,
      onChange,
      onSave,
      onCancel,
    });
    if (!created) return;
    runtime.value = created;
    snapshot.value = created.getSnapshot();
    stop = created.subscribe(() => {
      snapshot.value = created.getSnapshot();
    });
    host.value?.append(created.surface);
    created.measure();
  });

  onBeforeUnmount(() => {
    stop?.();
    runtime.value?.destroy();
  });

  const state = computed<AvatarPickerState>(() => ({
    ...snapshot.value,
    nextExpression: () => runtime.value?.nextExpression(),
    previousExpression: () => runtime.value?.previousExpression(),
    toggleBlush: () => runtime.value?.toggleBlush(),
    toggleSpotlight: () => runtime.value?.toggleSpotlight(),
    reset: () => runtime.value?.reset(),
    save: () => runtime.value?.save(),
    cancel: () => runtime.value?.cancel(),
    hasCancel: !!onCancel,
  }));

  return { host, state, runtime };
}
