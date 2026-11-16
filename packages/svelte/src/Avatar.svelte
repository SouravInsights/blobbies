<script lang="ts">
  /**
   * `@blobbies/svelte` — Blobbies as a Svelte component.
   *
   * The server emits the real `<svg>`, markup and all, so the avatar is in the
   * first paint rather than appearing after hydration — `{@html}` renders the
   * core's markup as-is on both sides.
   *
   *   <Avatar name={user.name} size={40} animate="all" />
   */
  import { renderAvatarBody, wantsFollow } from 'blobbies';
  import type { AvatarOptions } from 'blobbies';
  import { attachAvatarMotion } from 'blobbies/motion';

  /**
   * Every option the core understands, listed once so the props and the object
   * handed to the core cannot drift apart.
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
  ] as const;

  interface Props extends AvatarOptions {
    /** The name to derive the avatar from. */
    name: string;
    /**
     * Anything that is not a Blobbies option — `class`, `style`, `aria-*`,
     * `data-*` — is passed through to the `<svg>`.
     */
    [attribute: string]: unknown;
  }

  let { name, size = 48, rounded = false, ...rest }: Props = $props();

  /** The core's options. */
  const options = $derived.by((): AvatarOptions => {
    const out: Record<string, unknown> = { size, rounded };
    const source = rest as unknown as Record<string, unknown>;
    for (const key of OPTION_KEYS) {
      if (source[key] !== undefined) out[key] = source[key];
    }
    return out as AvatarOptions;
  });

  /** Everything else — `class`, `style`, `aria-*` — belongs on the `<svg>`. */
  const attrs = $derived.by((): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    const source = rest as unknown as Record<string, unknown>;
    for (const key of Object.keys(source)) {
      if (!(OPTION_KEYS as readonly string[]).includes(key)) out[key] = source[key];
    }
    return out;
  });

  const resolved = $derived(renderAvatarBody(name, options));

  // Only the *decision* is reactive, so toggling an unrelated prop never tears
  // down and re-registers the pointer listener.
  const wantsMotion = $derived(
    wantsFollow(options) || !!options.wink || !!options.glance || !!options.surprise,
  );

  let element: SVGSVGElement | undefined = $state();

  // One stable object the runtime reads live, mutated on every change.
  const motionOptions: AvatarOptions = {};
  $effect(() => {
    Object.assign(motionOptions, options);
  });

  $effect(() => {
    if (!wantsMotion || !element) return;
    return attachAvatarMotion(element, motionOptions);
  });
</script>

<svg
  bind:this={element}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100"
  role="img"
  aria-label={name}
  width={size}
  height={size}
  class="bb {resolved.prefix}"
  style:border-radius={rounded ? '50%' : undefined}
  data-blobbies={resolved.letters}
  {...attrs}
>
  {@html resolved.body}
</svg>
