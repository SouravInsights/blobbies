import { useState, type CSSProperties } from "react";
import { Avatar } from "@blobbies/react";
import type { AvatarAnimate } from "@blobbies/react";
import { buildNames } from "../data";
import { Check, Range, Select } from "../controls";
import { Lead } from "./Lead";

export type Flag = "auto" | "on" | "off";

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
  animate: "all",
  blink: "auto",
  follow: "auto",
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

const flagValue = (f: Flag): boolean | undefined =>
  f === "auto" ? undefined : f === "on";

export function avatarPropsFrom(c: Controls) {
  return {
    animate: c.animate,
    blink: flagValue(c.blink),
    follow: flagValue(c.follow),
    blinkInterval: [
      Math.min(c.blinkMin, c.blinkMax),
      Math.max(c.blinkMin, c.blinkMax),
    ] as [number, number],
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
  { value: false, label: "Off — static" },
  { value: "blink", label: "Blink only" },
  { value: "follow", label: "Follow only" },
  { value: "all", label: "Blink + follow" },
];

/** The groups the segment offers on a phone. */
const GROUPS = ["look", "motion", "extras"] as const;
type Group = (typeof GROUPS)[number];

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
  const [tab, setTab] = useState<Group>("look");

  const set = <K extends keyof Controls>(key: K, v: Controls[K]): void =>
    onChange({ ...value, [key]: v });

  // What the current switch actually amounts to, so the panel can show the
  // dials that apply and only those.
  const blinking =
    value.animate !== false &&
    (value.blink === "on" ||
      (value.blink === "auto" &&
        (value.animate === "blink" || value.animate === "all")));
  const following =
    value.animate !== false &&
    (value.follow === "on" ||
      (value.follow === "auto" &&
        (value.animate === "follow" || value.animate === "all")));

  return (
    <section className="section" id="playground">
      <Lead
        title="Every option, one at a time."
        note="Change one and see what you get."
      />
      <div className="play">
        {/* The specimen and the panel share a box, and the pin lives inside it.
            Stuck to the whole playground instead, the specimen would hang
            about while the gallery scrolled by, long after the last dial had
            gone — a preview with nothing left to preview. */}
        <div className="play-adjust">
          {/* The specimen and the segment pin as one block: pinned separately
              they would drift apart the moment the page moved. */}
          <div className="play-sticky">
            <div className="play-hero">
              <Avatar
                name="Sourav Nanda"
                size={value.size}
                {...avatarPropsFrom(value)}
                style={{ "--size": `${value.size}px` } as CSSProperties}
              />
              <div className="play-hero-note">
                <code>
                  {value.animate === false ? "static" : value.animate} ·{" "}
                  {value.size}px
                </code>
                {/* Half of these dials set behaviour rather than appearance,
                    and behaviour needs a finger to be seen. Nothing on the
                    screen said so, which is why moving one looked like it did
                    nothing. */}
                <span className="play-hero-hint">
                  Drag the face — it follows your finger.
                </span>
              </div>
            </div>

            <div
              className="play-tabs"
              role="tablist"
              aria-label="Control groups"
            >
              {GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="tab"
                  aria-selected={tab === g}
                  onClick={() => setTab(g)}
                >
                  {g[0]?.toUpperCase()}
                  {g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="controls">
            {/* Three groups, because twelve controls in one column is a list and
              not a panel. On a phone the segment above shows one at a time,
              which is what makes the whole thing fit on a screen. */}
            <div
              className="control-group"
              data-group="look"
              data-on={tab === "look" ? "1" : "0"}
            >
              <span className="group-label">Look</span>
              <Range
                label="Size"
                suffix="px"
                min={32}
                max={200}
                step={4}
                value={value.size}
                onChange={(v) => set("size", v)}
              />
              <Check
                label="Rounded"
                checked={value.rounded}
                onChange={(v) => set("rounded", v)}
              />
            </div>

            <div
              className="control-group"
              data-group="motion"
              data-on={tab === "motion" ? "1" : "0"}
            >
              <span className="group-label">Motion</span>
              <Select
                label="Animate"
                value={String(value.animate)}
                options={ANIMATE_OPTIONS.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                }))}
                onChange={(v) =>
                  set("animate", (v === "false" ? false : v) as AvatarAnimate)
                }
              />
              <div className="field-pair">
                <Select
                  label="Blink"
                  value={value.blink}
                  options={[
                    { value: "auto", label: "auto" },
                    { value: "on", label: "on" },
                    { value: "off", label: "off" },
                  ]}
                  onChange={(v) => set("blink", v as Flag)}
                />
                <Select
                  label="Follow"
                  value={value.follow}
                  options={[
                    { value: "auto", label: "auto" },
                    { value: "on", label: "on" },
                    { value: "off", label: "off" },
                  ]}
                  onChange={(v) => set("follow", v as Flag)}
                />
              </div>

              {/* Only what applies. A blink interval under a static avatar is a
                dial that does nothing, and a panel full of those is why moving
                one looked like it changed nothing. */}
              {/* The numbers are a block of their own. Run together with the
                switches above them, eight rows of one weight is a wall. */}
              {(blinking || following) && (
                <div className="control-sub">
                  {blinking && (
                    <>
                      <Range
                        label="Blink min"
                        suffix="ms"
                        min={500}
                        max={8000}
                        step={100}
                        value={value.blinkMin}
                        onChange={(v) => set("blinkMin", v)}
                      />
                      <Range
                        label="Blink max"
                        suffix="ms"
                        min={500}
                        max={12000}
                        step={100}
                        value={value.blinkMax}
                        onChange={(v) => set("blinkMax", v)}
                      />
                    </>
                  )}
                  {following && (
                    <>
                      <Range
                        label="Follow range"
                        min={0}
                        max={14}
                        step={0.5}
                        value={value.followRange}
                        onChange={(v) => set("followRange", v)}
                      />
                      <Range
                        label="Smoothing"
                        min={0.02}
                        max={1}
                        step={0.01}
                        value={value.smoothing}
                        onChange={(v) => set("smoothing", v)}
                      />
                      <Range
                        label="Idle timeout"
                        suffix="ms"
                        min={0}
                        max={8000}
                        step={100}
                        value={value.idleTimeout}
                        onChange={(v) => set("idleTimeout", v)}
                      />
                    </>
                  )}
                </div>
              )}

              <div className="checks">
                <Check
                  label="Paused"
                  checked={value.paused}
                  onChange={(v) => set("paused", v)}
                />
                <Check
                  label="Reduced motion"
                  checked={value.respectReducedMotion}
                  onChange={(v) => set("respectReducedMotion", v)}
                />
              </div>
            </div>

            <div
              className="control-group"
              data-group="extras"
              data-on={tab === "extras" ? "1" : "0"}
            >
              <span className="group-label">Extras</span>
              <div className="checks">
                <Check
                  label="Wink on click"
                  checked={value.wink}
                  onChange={(v) => set("wink", v)}
                />
                <Check
                  label="Glance when idle"
                  checked={value.glance}
                  onChange={(v) => set("glance", v)}
                />
                <Check
                  label="Surprise up close"
                  checked={value.surprise}
                  onChange={(v) => set("surprise", v)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="gallery">
          {GALLERY.map((n) => (
            <button
              key={n}
              type="button"
              title={`Use ${n}`}
              onClick={() => onAdopt(n)}
            >
              <Avatar name={n} size={52} {...avatarPropsFrom(value)} />
              <span>{n}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
