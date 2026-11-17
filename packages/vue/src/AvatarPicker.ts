import {
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  type PropType,
} from 'vue';
import { createPicker, injectPickerStyles, staticSnapshot } from 'blobbies/picker';
import type { PickerRuntime } from 'blobbies/picker';
import type { AvatarAnimate, AvatarExpression, AvatarOptions } from 'blobbies';
import { EXPRESSIONS } from 'blobbies';

export type { AvatarOptions };

const str = { type: String as PropType<string | undefined>, default: undefined };

/**
 * `AvatarPicker` — the Look Map, for Vue.
 *
 * The map, the gestures, the lens and the value are `createPicker` in the core:
 * the same runtime React uses, and the same one a `<blobbies-picker>` element
 * would use. So this file is chrome, and nothing about the behaviour is decided
 * here — which is the only way the picker can feel the same in every framework.
 *
 * The map element is built by the runtime and appended on mount, because 35
 * cells are rewritten every frame during a pan and that is not a job for a
 * renderer.
 */
export const AvatarPicker = defineComponent({
  name: 'AvatarPicker',

  props: {
    /** The person's name — the eyes every look shares. */
    name: { type: String, required: true },
    /** The look to open on. Changing it after mount does not reset the picker. */
    defaultValue: { type: Object as PropType<AvatarOptions>, default: undefined },
    /** The colours the map offers. Defaults to the built-in palette. */
    palette: { type: Array as unknown as PropType<readonly string[]>, default: undefined },
    /** Run the depth-of-field spotlight while hovering. */
    spotlight: { type: Boolean, default: true },
    /** Skip the panel styling and style the parts yourself. */
    unstyled: { type: Boolean, default: false },
    title: { ...str, default: 'Choose an avatar' },
    description: { ...str, default: 'Drag across for colour, down for mood, then keep one.' },
    saveLabel: { ...str, default: 'Save' },
  },

  emits: ['change', 'save', 'cancel'],

  setup(props, { emit }) {
    // Whether the parent is listening for `cancel` decides whether the runtime
    // reports that it has anything to cancel, and so whether the button exists.
    // Wiring it unconditionally is how you end up with a Cancel that does
    // nothing, which is worse than no Cancel.
    const wantsCancel =
      typeof getCurrentInstance()?.vnode.props?.onCancel === 'function';

    const runtime = shallowRef<PickerRuntime | null>(null);
    const host = ref<HTMLElement | null>(null);
    /**
     * The snapshot the chrome renders from. A plain ref rather than reactive
     * magic, because the runtime hands back a new object on every real change
     * and that is exactly the granularity we want to re-render at.
     */
    const snap = ref(
      staticSnapshot({ name: props.name, defaultValue: props.defaultValue, palette: props.palette, spotlight: props.spotlight }),
    );
    let stop: (() => void) | undefined;

    onMounted(() => {
      injectPickerStyles();
      const created = createPicker({
        name: props.name,
        defaultValue: props.defaultValue,
        palette: props.palette,
        spotlight: props.spotlight,
        onChange: (value) => emit('change', value),
        onSave: (value) => emit('save', value),
        onCancel: wantsCancel ? () => emit('cancel') : undefined,
      });
      if (!created) return;
      runtime.value = created;
      snap.value = created.getSnapshot();
      stop = created.subscribe(() => {
        snap.value = created.getSnapshot();
      });
      host.value?.append(created.surface);
      created.measure();
    });

    onBeforeUnmount(() => {
      stop?.();
      runtime.value?.destroy();
    });

    const a11y = (label: string) => ({ 'aria-label': label, type: 'button' as const });

    return () => {
      const state = snap.value;
      const title = props.title;
      const description = props.description;
      const children: ReturnType<typeof h>[] = [];

      if (title || description) {
        children.push(
          h('div', { class: 'bb-picker-head', 'data-part': 'header' }, [
            title ? h('h3', { 'data-part': 'title' }, title) : null,
            description ? h('p', { 'data-part': 'description' }, description) : null,
          ]),
        );
      }

      // Vue owns the element; the runtime fills it.
      children.push(h('div', { ref: host, 'data-part': 'surface-host' }));

      children.push(
        h('div', { class: 'bb-picker-mood', 'data-part': 'mood' }, [
          h('button', { ...a11y('Previous expression'), class: 'bb-picker-step', onClick: () => runtime.value?.previousExpression() }, [
            h('svg', { viewBox: '0 0 12 12', width: 10, height: 10, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, [
              h('path', { d: 'M7.5 2.5 4 6l3.5 3.5' }),
            ]),
          ]),
          h('span', { class: 'bb-picker-mood-name', 'aria-live': 'polite' }, state?.expressionName ?? ''),
          h('button', { ...a11y('Next expression'), class: 'bb-picker-step', onClick: () => runtime.value?.nextExpression() }, [
            h('svg', { viewBox: '0 0 12 12', width: 10, height: 10, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, [
              h('path', { d: 'M4.5 2.5 8 6l-3.5 3.5' }),
            ]),
          ]),
        ]),
      );

      children.push(
        h('div', { class: 'bb-picker-foot', 'data-part': 'footer' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'bb-picker-blush',
              'data-part': 'blush',
              'data-on': state?.blush ? '1' : undefined,
              'aria-pressed': state?.blush ?? false,
              onClick: () => runtime.value?.toggleBlush(),
            },
            'Blush',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'bb-picker-spotlight',
              'data-part': 'spotlight',
              'data-on': state?.spotlight ? '1' : undefined,
              'aria-pressed': state?.spotlight ?? false,
              onClick: () => runtime.value?.toggleSpotlight(),
            },
            'Spotlight',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'bb-picker-reset',
              'data-part': 'reset',
              disabled: !state?.changed,
              onClick: () => runtime.value?.reset(),
            },
            'Reset',
          ),
          h('span', { class: 'bb-picker-grow' }),
          runtime.value?.hasCancel
            ? h(
                'button',
                { type: 'button', class: 'bb-picker-btn', 'data-part': 'cancel', onClick: () => runtime.value?.cancel() },
                'Cancel',
              )
            : null,
          h(
            'button',
            {
              type: 'button',
              class: ['bb-picker-btn', 'bb-picker-primary'],
              'data-part': 'save',
              onClick: () => runtime.value?.save(),
            },
            props.saveLabel,
          ),
        ]),
      );

      return h(
        'div',
        { class: props.unstyled ? undefined : 'bb-picker', 'data-part': 'root' },
        children,
      );
    };
  },
});

export default AvatarPicker;

export type { AvatarAnimate, AvatarExpression, AvatarOptions as AvatarPickerValue };
