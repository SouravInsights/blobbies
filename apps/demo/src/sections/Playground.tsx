import { Avatar } from '@blobbies/react';
import type { AvatarAnimate } from '@blobbies/react';
import { buildNames } from '../data';
import { Lead } from './Lead';

export type Flag = 'auto' | 'on' | 'off';

export interface Controls {
  animate: AvatarAnimate;
  blink: Flag;
  follow: Flag;
  blinkMin: number;
  blinkMax: number;
  followRange: number;
  smoothing: number;
  idleTimeout: number;
  size: number;
  rounded: boolean;
  paused: boolean;
  respectReducedMotion: boolean;
  wink: boolean;
  glance: boolean;
  surprise: boolean;
}

export const DEFAULTS: Controls = {
  animate: 'all',
  blink: 'auto',
  follow: 'auto',
  blinkMin: 2500,
  blinkMax: 6000,
  followRange: 6,
  smoothing: 0.15,
  idleTimeout: 2500,
  size: 128,
  rounded: false,
  paused: false,
  respectReducedMotion: true,
  wink: true,
  glance: true,
  surprise: true,
};

const GALLERY = buildNames(60);

const flagValue = (f: Flag): boolean | undefined => (f === 'auto' ? undefined : f === 'on');

export function avatarPropsFrom(c: Controls) {
  return {
    animate: c.animate,
    blink: flagValue(c.blink),
    follow: flagValue(c.follow),
    blinkInterval: [Math.min(c.blinkMin, c.blinkMax), Math.max(c.blinkMin, c.blinkMax)] as [
      number,
      number,
    ],
    followRange: c.followRange,
    smoothing: c.smoothing,
    idleTimeout: c.idleTimeout,
    rounded: c.rounded,
    paused: c.paused,
    respectReducedMotion: c.respectReducedMotion,
    wink: c.wink,
    glance: c.glance,
    surprise: c.surprise,
  };
}

const ANIMATE_OPTIONS: Array<{ value: AvatarAnimate; label: string }> = [
  { value: false, label: 'Off — static' },
  { value: 'blink', label: 'Blink only' },
  { value: 'follow', label: 'Follow only' },
  { value: 'all', label: 'Blink + follow' },
];

/** Every dial, wired straight through to the specimens beside it. */
export function Playground({
  value,
  onChange,
  onAdopt,
}: {
  value: Controls;
  onChange: (next: Controls) => void;
  onAdopt: (name: string) => void;
}) {
  const set = <K extends keyof Controls>(key: K, v: Controls[K]): void =>
    onChange({ ...value, [key]: v });

  return (
    <section className="section" id="playground">
      <Lead title="Turn every dial." note="All of it runs on the same shared loop." />
      <div className="play">
        <div className="controls">
          <div className="control-group">
            <label className="field">
              <span>Animate</span>
              <select
                value={String(value.animate)}
                onChange={(e) =>
                  set('animate', (e.target.value === 'false' ? false : e.target.value) as AvatarAnimate)
                }
              >
                {ANIMATE_OPTIONS.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-pair">
              <label className="field">
                <span>Blink</span>
                <select value={value.blink} onChange={(e) => set('blink', e.target.value as Flag)}>
                  <option value="auto">auto</option>
                  <option value="on">on</option>
                  <option value="off">off</option>
                </select>
              </label>
              <label className="field">
                <span>Follow</span>
                <select value={value.follow} onChange={(e) => set('follow', e.target.value as Flag)}>
                  <option value="auto">auto</option>
                  <option value="on">on</option>
                  <option value="off">off</option>
                </select>
              </label>
            </div>
          </div>

          <div className="control-group">
            <Range label="Blink min" suffix="ms" min={500} max={8000} step={100} value={value.blinkMin} onChange={(v) => set('blinkMin', v)} />
            <Range label="Blink max" suffix="ms" min={500} max={12000} step={100} value={value.blinkMax} onChange={(v) => set('blinkMax', v)} />
            <Range label="Follow range" min={0} max={14} step={0.5} value={value.followRange} onChange={(v) => set('followRange', v)} />
            <Range label="Smoothing" min={0.02} max={1} step={0.01} value={value.smoothing} onChange={(v) => set('smoothing', v)} />
            <Range label="Idle timeout" suffix="ms" min={0} max={8000} step={100} value={value.idleTimeout} onChange={(v) => set('idleTimeout', v)} />
            <Range label="Size" suffix="px" min={32} max={200} step={4} value={value.size} onChange={(v) => set('size', v)} />
          </div>

          <div className="control-group checks">
            <Check label="Rounded" checked={value.rounded} onChange={(v) => set('rounded', v)} />
            <Check label="Paused" checked={value.paused} onChange={(v) => set('paused', v)} />
            <Check label="Respect reduced motion" checked={value.respectReducedMotion} onChange={(v) => set('respectReducedMotion', v)} />
            <Check label="Wink on click" checked={value.wink} onChange={(v) => set('wink', v)} />
            <Check label="Glance when idle" checked={value.glance} onChange={(v) => set('glance', v)} />
            <Check label="Surprise up close" checked={value.surprise} onChange={(v) => set('surprise', v)} />
          </div>
        </div>

        <div className="play-stage">
          <div className="play-hero">
            <Avatar
              name="Sourav Nanda"
              size={value.size}
              {...avatarPropsFrom(value)}
              style={{ width: `min(${value.size}px, 40vw)`, height: 'auto' }}
            />
            <code>
              {value.animate === false ? 'static' : value.animate} · {value.size}px
            </code>
          </div>
          <div className="gallery">
            {GALLERY.map((n) => (
              <button key={n} type="button" title={`Use ${n}`} onClick={() => onAdopt(n)}>
                <Avatar name={n} size={52} {...avatarPropsFrom(value)} />
                <span>{n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Range(props: {
  label: string;
  suffix?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span className="range-head">
        <span className="k">{props.label}</span>
        <span className="v">
          {props.value}
          {props.suffix ?? ''}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Check(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <i aria-hidden="true" />
      <span>{props.label}</span>
    </label>
  );
}
