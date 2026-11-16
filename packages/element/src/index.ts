/**
 * `<blobbies-avatar>` — Blobbies as a web component.
 *
 * A web component works in every framework and in plain HTML, so this one file
 * is the whole "make Blobbies work on the web" story: React, Vue, Svelte,
 * Solid, Angular, Astro, or a hand-written `.html` file can all use the same
 * tag. It is a thin shell over the core: the markup comes from
 * `renderAvatarSvg` and the motion from `attachAvatarMotion`.
 *
 *   <blobbies-avatar name="Sourav Nanda" motion="all" size="48"></blobbies-avatar>
 *
 * The motion attribute is called `motion`, not `animate`, because
 * `Element.animate` is a real DOM method and clobbering it would break the
 * Web Animations API for anyone using the element.
 */
import { renderAvatarSvg, wantsFollow } from 'blobbies';
import type {
  AvatarAnimate,
  AvatarExpression,
  AvatarOptions,
  AvatarShape,
} from 'blobbies';
import { attachAvatarMotion } from 'blobbies/motion';

export const TAG_NAME = 'blobbies-avatar';

const OBSERVED = [
  'name',
  'size',
  'color',
  'shape',
  'expression',
  'variant',
  'tilt',
  'blush',
  'palette',
  'motion',
  'rounded',
  'wink',
  'glance',
  'surprise',
] as const;

const STYLE_ID = 'blobbies-element-styles';

function injectStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent =
    `${TAG_NAME}{display:inline-block;line-height:0}` +
    `${TAG_NAME}>svg{display:block;vertical-align:middle}`;
  document.head.appendChild(style);
}

function numberOrUndefined(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Read every attribute into `AvatarOptions`. Attributes are the one API. */
function readOptions(element: HTMLElement): AvatarOptions {
  const options: AvatarOptions = {};
  const attr = (name: string): string | null => element.getAttribute(name);

  const size = numberOrUndefined(attr('size'));
  if (size !== undefined) options.size = size;
  const color = attr('color');
  if (color) options.color = color;
  const shape = attr('shape');
  if (shape) options.shape = shape as AvatarShape;
  const expression = attr('expression');
  if (expression) options.expression = expression as AvatarExpression;
  const variant = numberOrUndefined(attr('variant'));
  if (variant !== undefined) options.variant = variant;
  const tilt = numberOrUndefined(attr('tilt'));
  if (tilt !== undefined) options.tilt = tilt;

  const palette = attr('palette');
  if (palette) {
    options.palette = palette
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  const motion = attr('motion');
  if (motion) options.animate = (motion === 'false' ? false : motion) as AvatarAnimate;

  const blush = attr('blush');
  if (blush !== null) options.blush = blush !== 'false';

  if (element.hasAttribute('rounded')) options.rounded = true;
  if (element.hasAttribute('wink')) options.wink = true;
  if (element.hasAttribute('glance')) options.glance = true;
  if (element.hasAttribute('surprise')) options.surprise = true;

  return options;
}

/**
 * The reflected properties. They are installed on the prototype at runtime (see
 * below); this interface only teaches TypeScript about them, so `el.size = 32`
 * is typed without hand-writing an accessor for every option.
 */
export interface BlobbiesAvatar {
  name?: string;
  color?: string;
  shape?: AvatarShape;
  expression?: AvatarExpression;
  palette?: string;
  motion?: string;
  size?: number;
  variant?: number;
  tilt?: number;
  rounded: boolean;
  wink: boolean;
  glance: boolean;
  surprise: boolean;
  blush?: boolean;
}

export class BlobbiesAvatar extends HTMLElement {
  static get observedAttributes(): readonly string[] {
    return OBSERVED;
  }

  #cleanup: (() => void) | undefined;
  #key = '';

  connectedCallback(): void {
    injectStyles();
    this.#render();
  }

  disconnectedCallback(): void {
    this.#detach();
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue && this.isConnected) this.#render();
  }

  #detach(): void {
    this.#cleanup?.();
    this.#cleanup = undefined;
  }

  #render(): void {
    const name = this.getAttribute('name') ?? '';
    const options = readOptions(this);
    const key = `${name}\u0000${JSON.stringify(options)}`;
    if (key === this.#key) return;
    this.#key = key;

    this.#detach();
    this.innerHTML = renderAvatarSvg(name, options);

    const svg = this.querySelector('svg');
    if (!svg) return;
    // Blink is pure CSS inside the markup, so only reach for the JavaScript
    // runtime when the user actually asked for following, winking or glances.
    if (wantsFollow(options) || options.wink || options.glance || options.surprise) {
      this.#cleanup = attachAvatarMotion(svg, options);
    }
  }
}

const STRING_PROPS = ['name', 'color', 'shape', 'expression', 'palette'] as const;
const NUMBER_PROPS = ['size', 'variant', 'tilt'] as const;
const FLAG_PROPS = ['rounded', 'wink', 'glance', 'surprise'] as const;

// Properties are sugar over the attributes, so a framework can set either one
// and the element still re-renders. `motion` keeps its name because it maps to
// the `animate` option without clobbering `Element.animate`.
for (const prop of STRING_PROPS) {
  Object.defineProperty(BlobbiesAvatar.prototype, prop, {
    get(this: BlobbiesAvatar): string | undefined {
      return this.getAttribute(prop) ?? undefined;
    },
    set(this: BlobbiesAvatar, value: unknown): void {
      if (value === undefined || value === null || value === false) this.removeAttribute(prop);
      else this.setAttribute(prop, String(value));
    },
    configurable: true,
  });
}

for (const prop of NUMBER_PROPS) {
  Object.defineProperty(BlobbiesAvatar.prototype, prop, {
    get(this: BlobbiesAvatar): number | undefined {
      return numberOrUndefined(this.getAttribute(prop));
    },
    set(this: BlobbiesAvatar, value: unknown): void {
      if (value === undefined || value === null) this.removeAttribute(prop);
      else this.setAttribute(prop, String(value));
    },
    configurable: true,
  });
}

for (const prop of FLAG_PROPS) {
  Object.defineProperty(BlobbiesAvatar.prototype, prop, {
    get(this: BlobbiesAvatar): boolean {
      return this.hasAttribute(prop);
    },
    set(this: BlobbiesAvatar, value: unknown): void {
      if (value) this.setAttribute(prop, '');
      else this.removeAttribute(prop);
    },
    configurable: true,
  });
}

Object.defineProperty(BlobbiesAvatar.prototype, 'motion', {
  get(this: BlobbiesAvatar): string | undefined {
    return this.getAttribute('motion') ?? undefined;
  },
  set(this: BlobbiesAvatar, value: unknown): void {
    if (value === undefined || value === null || value === false) this.removeAttribute('motion');
    else this.setAttribute('motion', String(value));
  },
  configurable: true,
});

Object.defineProperty(BlobbiesAvatar.prototype, 'blush', {
  get(this: BlobbiesAvatar): boolean | undefined {
    const value = this.getAttribute('blush');
    return value === null ? undefined : value !== 'false';
  },
  set(this: BlobbiesAvatar, value: unknown): void {
    if (value === undefined || value === null) this.removeAttribute('blush');
    else this.setAttribute('blush', String(Boolean(value)));
  },
  configurable: true,
});

/** Register the element. Safe to call more than once, and SSR-safe. */
export function defineBlobbies(
  registry: CustomElementRegistry | undefined = typeof customElements !== 'undefined'
    ? customElements
    : undefined,
): void {
  if (!registry) return;
  if (!registry.get(TAG_NAME)) registry.define(TAG_NAME, BlobbiesAvatar);
}

/** Convenience for imperative code: build a ready element. */
export function createAvatarElement(
  name: string,
  options: AvatarOptions = {},
): BlobbiesAvatar {
  defineBlobbies();
  const element = new BlobbiesAvatar();
  element.setAttribute('name', name);
  if (options.size !== undefined) element.setAttribute('size', String(options.size));
  if (options.color !== undefined) element.setAttribute('color', options.color);
  if (options.shape !== undefined) element.setAttribute('shape', options.shape);
  if (options.expression !== undefined) element.setAttribute('expression', options.expression);
  if (options.variant !== undefined) element.setAttribute('variant', String(options.variant));
  if (options.tilt !== undefined) element.setAttribute('tilt', String(options.tilt));
  if (options.palette !== undefined) element.setAttribute('palette', options.palette.join(','));
  if (options.animate !== undefined && options.animate !== false) {
    element.setAttribute('motion', String(options.animate));
  }
  if (options.blush === false) element.setAttribute('blush', 'false');
  if (options.rounded) element.setAttribute('rounded', '');
  if (options.wink) element.setAttribute('wink', '');
  if (options.glance) element.setAttribute('glance', '');
  if (options.surprise) element.setAttribute('surprise', '');
  return element;
}

// Registering on import is what makes this a drop-in web component: a plain
// HTML page only has to include the script.
if (typeof customElements !== 'undefined') defineBlobbies();
