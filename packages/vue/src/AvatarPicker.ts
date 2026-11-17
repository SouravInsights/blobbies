import { defineComponent, getCurrentInstance, h, type PropType } from 'vue';
import { useAvatarPicker } from './useAvatarPicker.js';
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

    // The preset is a layout over `useAvatarPicker`, not a second
    // implementation of it — which is what keeps the preset and a custom layout
    // honest about being the same picker.
    const { host, state, runtime } = useAvatarPicker({
      name: props.name,
      defaultValue: props.defaultValue,
      palette: props.palette,
      spotlight: props.spotlight,
      onChange: (value) => emit('change', value),
      onSave: (value) => emit('save', value),
      onCancel: wantsCancel ? () => emit('cancel') : undefined,
    });

    const a11y = (label: string) => ({ 'aria-label': label, type: 'button' as const });

    return () => {
      const current = state.value;
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
          h('button', { ...a11y('Previous expression'), class: 'bb-picker-step', onClick: () => current.previousExpression() }, [
            h('svg', { viewBox: '0 0 12 12', width: 10, height: 10, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, [
              h('path', { d: 'M7.5 2.5 4 6l3.5 3.5' }),
            ]),
          ]),
          h('span', { class: 'bb-picker-mood-name', 'aria-live': 'polite' }, current.expressionName ?? ''),
          h('button', { ...a11y('Next expression'), class: 'bb-picker-step', onClick: () => current.nextExpression() }, [
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
              'data-on': current.blush ? '1' : undefined,
              'aria-pressed': current.blush ?? false,
              onClick: () => current.toggleBlush(),
            },
            'Blush',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'bb-picker-spotlight',
              'data-part': 'spotlight',
              'data-on': current.spotlight ? '1' : undefined,
              'aria-pressed': current.spotlight ?? false,
              onClick: () => current.toggleSpotlight(),
            },
            'Spotlight',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'bb-picker-reset',
              'data-part': 'reset',
              disabled: !current.changed,
              onClick: () => current.reset(),
            },
            'Reset',
          ),
          h('span', { class: 'bb-picker-grow' }),
          current.hasCancel
            ? h(
                'button',
                { type: 'button', class: 'bb-picker-btn', 'data-part': 'cancel', onClick: () => current.cancel() },
                'Cancel',
              )
            : null,
          h(
            'button',
            {
              type: 'button',
              class: ['bb-picker-btn', 'bb-picker-primary'],
              'data-part': 'save',
              onClick: () => current.save(),
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
