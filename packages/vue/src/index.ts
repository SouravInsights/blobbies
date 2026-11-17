/**
 * `@blobbies/vue` — Blobbies as a Vue component.
 *
 * The same SVG the library draws, with the same motion, written as a plain
 * render function rather than an SFC. Two reasons: it builds with the repo's
 * existing tsup setup (no Vue compiler in the pipeline), and a render function
 * has no single-file-component runtime, so it server-renders as-is.
 *
 *   <Avatar :name="user.name" :size="40" animate="all" />
 *
 * SSR: the server emits the real `<svg>`, markup and all — not an empty
 * placeholder — so an avatar is in the first paint. Cursor-follow is attached
 * on mount, because it needs a live element to listen to.
 */
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from 'vue';
import { renderAvatarBody, wantsFollow } from 'blobbies';
import type {
  AvatarAnimate,
  AvatarExpression,
  AvatarOptions,
  AvatarShape,
} from 'blobbies';
import { attachAvatarMotion } from 'blobbies/motion';

/**
 * Every option the core understands. Listed once so the props, the options
 * object handed to the core, and the type used to build it cannot drift.
 */
const OPTION_KEYS = [
  'size',
  'rounded',
  'title',
  'palette',
  'variant',
  'color',
  'shape',
  'expression',
  'blush',
  'tilt',
  'animate',
  'blink',
  'blinkInterval',
  'follow',
  'followRange',
  'followTarget',
  'smoothing',
  'idleTimeout',
  'paused',
  'respectReducedMotion',
  'wink',
  'glance',
  'surprise',
] as const satisfies readonly (keyof AvatarOptions)[];

export const Avatar = defineComponent({
  name: 'BlobbiesAvatar',

  props: {
    /** The name to derive the avatar from. */
    name: { type: String, required: true },
    size: { type: [Number, String] as PropType<number | string>, default: undefined },
    shape: { type: String as PropType<AvatarShape>, default: undefined },
    expression: { type: String as PropType<AvatarExpression>, default: undefined },
    color: { type: String, default: undefined },
    palette: { type: Array as unknown as PropType<string[]>, default: undefined },
    variant: { type: Number, default: undefined },
    tilt: { type: Number, default: undefined },
    title: { type: String, default: undefined },
    animate: { type: [Boolean, String] as PropType<AvatarAnimate>, default: undefined },
    // Booleans default to `undefined`, not `false`, so an absent prop means
    // "let the core decide" rather than "explicitly off". Vue only keeps
    // `undefined` when an explicit default is present, hence `default:
    // undefined` on each of them.
    rounded: { type: Boolean, default: undefined },
    blush: { type: Boolean, default: undefined },
    blink: { type: Boolean, default: undefined },
    blinkInterval: { type: Number, default: undefined },
    follow: { type: Boolean, default: undefined },
    followRange: { type: Number, default: undefined },
    followTarget: { type: Object as PropType<EventTarget>, default: undefined },
    smoothing: { type: Number, default: undefined },
    idleTimeout: { type: Number, default: undefined },
    paused: { type: Boolean, default: undefined },
    respectReducedMotion: { type: Boolean, default: undefined },
    wink: { type: Boolean, default: undefined },
    glance: { type: Boolean, default: undefined },
    surprise: { type: Boolean, default: undefined },
  },

  setup(props) {
    const element = ref<SVGSVGElement | null>(null);

    const options = computed<AvatarOptions>(() => {
      const out: Record<string, unknown> = {};
      const source = props as unknown as Record<string, unknown>;
      for (const key of OPTION_KEYS) {
        const value = source[key];
        if (value !== undefined) out[key] = value;
      }
      return out as AvatarOptions;
    });

    // `renderAvatarBody`, not `renderAvatarSvg`: this component owns the outer
    // <svg>, the same way the React one does, so the two render identical
    // markup and neither re-implements the other.
    const resolved = computed(() => renderAvatarBody(props.name, options.value));

    let cleanup: (() => void) | undefined;

    const attach = (): void => {
      cleanup?.();
      cleanup = undefined;
      const node = element.value;
      if (!node) return;
      const current = options.value;
      // Blink is pure CSS inside the markup, so only reach for the JavaScript
      // runtime when the user asked for something that needs one.
      if (
        wantsFollow(current) ||
        current.wink ||
        current.glance ||
        current.surprise
      ) {
        cleanup = attachAvatarMotion(node, current);
      }
    };

    onMounted(attach);
    // Re-attach after an update, so switching `animate` on takes effect.
    watch(resolved, attach, { flush: 'post' });
    onBeforeUnmount(() => {
      cleanup?.();
      cleanup = undefined;
    });

    // A single root, so Vue merges any consumer `class` and `style` onto it for
    // free — no manual attr spreading.
    return () => {
      const avatar = resolved.value;
      return h('svg', {
        ref: element,
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 100 100',
        role: 'img',
        'aria-label': props.name,
        width: props.size ?? 48,
        height: props.size ?? 48,
        class: ['bb', avatar.prefix],
        style: props.rounded ? { borderRadius: '50%' } : undefined,
        'data-blobbies': avatar.letters,
        innerHTML: avatar.body,
      });
    };
  },
});

export { AvatarPicker } from './AvatarPicker.js';
export { useAvatarPicker } from './useAvatarPicker.js';
export type { AvatarPickerState, UseAvatarPicker, UseAvatarPickerOptions } from './useAvatarPicker.js';

/** The same component under its explicit name, for templates that prefer it. */
export const BlobbiesAvatar = Avatar;

export type {
  AvatarAnimate,
  AvatarExpression,
  AvatarOptions,
  AvatarShape,
} from 'blobbies';
