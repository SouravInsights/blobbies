import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { PALETTE } from 'blobbies';
import type { AvatarOptions } from 'blobbies';
import { createPicker, staticSnapshot } from 'blobbies/picker';
import type { PickerRuntime, PickerSnapshot } from 'blobbies/picker';
import { Avatar } from './Avatar.js';
import type { AvatarProps } from './Avatar.js';
import { usePickerStyles } from './picker-styles.js';

/**
 * The Blobbies avatar picker — the Look Map.
 *
 * This file is chrome. The map, the gestures, the lens, the measurement and the
 * value all live in `createPicker` in the core, which is what Vue, Svelte and
 * `<blobbies-picker>` will use too. Nothing about the behaviour is decided here,
 * so nothing here can drift from those.
 *
 * It ships as parts, like Glyph's picker: `AvatarPickerRoot` owns the runtime,
 * the parts are composable, and `AvatarPicker` is the preset.
 */

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

interface ContextValue {
  state: AvatarPickerState;
  runtime: PickerRuntime | null;
}

const Context = createContext<ContextValue | null>(null);

function usePicker(): ContextValue {
  const context = useContext(Context);
  if (!context) {
    throw new Error('AvatarPicker parts must be used inside <AvatarPickerRoot>.');
  }
  return context;
}

export function useAvatarPicker(): AvatarPickerState {
  return usePicker().state;
}

function Chevron({ dir }: { dir: 'l' | 'r' }) {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'l' ? 'M7.5 2.5 4 6l3.5 3.5' : 'M4.5 2.5 8 6l-3.5 3.5'} />
    </svg>
  );
}

export interface AvatarPickerRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The person's name — the eyes every look shares. */
  name: string;
  /** The look to open on. Changing it after mount does not reset the picker. */
  defaultValue?: AvatarOptions;
  /** Called with the current look whenever it changes (not on mount). */
  onChange?: (value: AvatarOptions) => void;
  /** Called when the save button is pressed. */
  onSave?: (value: AvatarOptions) => void;
  /** Shows a cancel button and calls this. */
  onCancel?: () => void;
  /** The colours the map offers. Defaults to the built-in `PALETTE`. */
  palette?: readonly string[];
  /** Run the depth-of-field spotlight while hovering. Default: true. */
  spotlight?: boolean;
  /** Skip the panel styling and style the parts yourself. */
  unstyled?: boolean;
  children: ReactNode;
}

export function AvatarPickerRoot(props: AvatarPickerRootProps) {
  const {
    name,
    defaultValue,
    onChange,
    onSave,
    onCancel,
    palette = PALETTE,
    spotlight = true,
    unstyled = false,
    className,
    style,
    children,
    ...rest
  } = props;

  usePickerStyles();

  // The runtime is created once and lives outside React. Callbacks are read
  // through a ref so a parent re-render that makes a new closure does not
  // rebuild the runtime and throw the map back to the centre.
  const handlers = useRef({ onChange, onSave, onCancel });
  handlers.current = { onChange, onSave, onCancel };

  const runtime = useMemo(
    () =>
      createPicker({
        name,
        defaultValue,
        palette,
        spotlight,
        onChange: (value) => handlers.current.onChange?.(value),
        onSave: (value) => handlers.current.onSave?.(value),
        onCancel: () => handlers.current.onCancel?.(),
      }),
    // Created once, deliberately: these are the options the picker opens with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [, bump] = useState(0);
  useEffect(() => runtime?.subscribe(() => bump((n) => n + 1)), [runtime]);

  // Recomputed on every render — a dozen fields — and a render only happens
  // when the runtime says something actually changed.
  const state: AvatarPickerState = {
    ...(runtime?.getSnapshot() ?? staticSnapshot({ name, defaultValue, palette, spotlight })),
    nextExpression: () => runtime?.nextExpression(),
    previousExpression: () => runtime?.previousExpression(),
    toggleBlush: () => runtime?.toggleBlush(),
    toggleSpotlight: () => runtime?.toggleSpotlight(),
    reset: () => runtime?.reset(),
    save: () => runtime?.save(),
    cancel: () => runtime?.cancel(),
    // Creating the runtime is what fixes whether there is anything to cancel.
    hasCancel: !!onCancel,
  };

  const classes = [unstyled ? '' : 'bb-picker', className].filter(Boolean).join(' ');

  return (
    <Context.Provider value={{ state, runtime }}>
      <div {...rest} className={classes || undefined} data-part="root" style={style}>
        {children}
      </div>
    </Context.Provider>
  );
}

export type AvatarPickerSurfaceProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/**
 * Where the map goes. The element itself is built by the runtime — 35 cells
 * rewritten every frame during a pan, which is not something a reconciler
 * should be asked to do — so this mounts it and hands over the class name.
 */
export function AvatarPickerSurface(props: AvatarPickerSurfaceProps) {
  const { className, ...rest } = props;
  const { runtime } = usePicker();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = container.current;
    if (!host || !runtime) return undefined;
    host.append(runtime.surface);
    runtime.measure();
    return () => {
      runtime.surface.remove();
    };
  }, [runtime]);

  useEffect(() => {
    if (!runtime || !className) return;
    runtime.surface.className = `bb-picker-surface ${className}`;
  }, [runtime, className]);

  return <div {...rest} ref={container} data-part="surface-host" />;
}

/**
 * The chosen face, for a layout that wants to show it outside the map. It reads
 * the picker's current value, so it stays in step with the surface.
 */
export type AvatarPickerPreviewProps = Omit<AvatarProps, 'name'>;

export function AvatarPickerPreview(props: AvatarPickerPreviewProps) {
  const { name, value } = useAvatarPicker();
  return <Avatar name={name} {...value} {...props} data-part="preview" />;
}

export type AvatarPickerMoodProps = HTMLAttributes<HTMLDivElement>;

export function AvatarPickerMood(props: AvatarPickerMoodProps) {
  const { className, ...rest } = props;
  const { expressionName, previousExpression, nextExpression } = useAvatarPicker();
  return (
    <div {...rest} className={['bb-picker-mood', className].filter(Boolean).join(' ')} data-part="mood">
      <button type="button" className="bb-picker-step" onClick={previousExpression} aria-label="Previous expression">
        <Chevron dir="l" />
      </button>
      <span key={expressionName} className="bb-picker-mood-name" aria-live="polite">
        {expressionName}
      </span>
      <button type="button" className="bb-picker-step" onClick={nextExpression} aria-label="Next expression">
        <Chevron dir="r" />
      </button>
    </div>
  );
}

export type AvatarPickerButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AvatarPickerBlush(props: AvatarPickerButtonProps) {
  const { className, children, onClick, ...rest } = props;
  const { blush, toggleBlush } = useAvatarPicker();
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-blush', className].filter(Boolean).join(' ')}
      data-part="blush"
      data-on={blush ? '1' : undefined}
      aria-pressed={blush}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleBlush();
      }}
    >
      {children ?? 'Blush'}
    </button>
  );
}

export function AvatarPickerSpotlight(props: AvatarPickerButtonProps) {
  const { className, children, onClick, ...rest } = props;
  const { spotlight, toggleSpotlight } = useAvatarPicker();
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-spotlight', className].filter(Boolean).join(' ')}
      data-part="spotlight"
      data-on={spotlight ? '1' : undefined}
      aria-pressed={spotlight}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleSpotlight();
      }}
    >
      {children ?? 'Spotlight'}
    </button>
  );
}

export function AvatarPickerReset(props: AvatarPickerButtonProps) {
  const { className, children, onClick, disabled, ...rest } = props;
  const { changed, reset } = useAvatarPicker();
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-reset', className].filter(Boolean).join(' ')}
      data-part="reset"
      disabled={disabled || !changed}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) reset();
      }}
    >
      {children ?? 'Reset'}
    </button>
  );
}

export function AvatarPickerSave(props: AvatarPickerButtonProps) {
  const { className, children, onClick, ...rest } = props;
  const { save } = useAvatarPicker();
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-btn', 'bb-picker-primary', className].filter(Boolean).join(' ')}
      data-part="save"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) save();
      }}
    >
      {children ?? 'Save'}
    </button>
  );
}

export function AvatarPickerCancel(props: AvatarPickerButtonProps) {
  const { className, children, onClick, ...rest } = props;
  const { cancel, hasCancel } = useAvatarPicker();
  if (!hasCancel) return null;
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-btn', className].filter(Boolean).join(' ')}
      data-part="cancel"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) cancel();
      }}
    >
      {children ?? 'Cancel'}
    </button>
  );
}

export interface AvatarPickerProps extends Omit<AvatarPickerRootProps, 'children'> {
  title?: string;
  description?: string;
  saveLabel?: string;
}

export function AvatarPicker(props: AvatarPickerProps) {
  const {
    title = 'Choose an avatar',
    description = 'Drag across for colour, down for mood, then keep one.',
    saveLabel = 'Save',
    onCancel,
    ...root
  } = props;

  return (
    <AvatarPickerRoot {...root} onCancel={onCancel}>
      {(title || description) && (
        <div className="bb-picker-head" data-part="header">
          {title && <h3 data-part="title">{title}</h3>}
          {description && <p data-part="description">{description}</p>}
        </div>
      )}
      <AvatarPickerSurface />
      <AvatarPickerMood />
      <div className="bb-picker-foot" data-part="footer">
        <AvatarPickerBlush />
        <AvatarPickerSpotlight />
        <AvatarPickerReset />
        <span className="bb-picker-grow" />
        <AvatarPickerCancel />
        <AvatarPickerSave>{saveLabel}</AvatarPickerSave>
      </div>
    </AvatarPickerRoot>
  );
}
