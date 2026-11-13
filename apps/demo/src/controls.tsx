import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check as CheckIcon } from 'iconoir-react';
import * as RadixSelect from '@radix-ui/react-select';
import * as RadixSlider from '@radix-ui/react-slider';

/* ------------------------------------------------------------------ *
 * Form primitives.
 *
 * These are Radix headless primitives, not hand-rolled inputs: focus
 * management, typeahead, keyboard arrows, Home/End, RTL and the ARIA
 * wiring all come from the library. Everything visual is ours.
 * (The library packages stay dependency-free; this is the demo only.)
 * ------------------------------------------------------------------ */

export interface Option {
  value: string;
  label: string;
}

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <RadixSelect.Root value={value} onValueChange={onChange}>
        <RadixSelect.Trigger className="select-trigger" aria-label={label}>
          <RadixSelect.Value />
          <RadixSelect.Icon className="select-icon" aria-hidden="true">
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className="select-content" position="popper" sideOffset={5} align="start">
            <RadixSelect.Viewport className="select-viewport">
              {options.map((o) => (
                <RadixSelect.Item key={o.value} value={o.value} className="select-item">
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="select-indicator" aria-hidden="true">
                    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.4 5 8.9l4.5-5.3" />
                    </svg>
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}

export function Range({
  label,
  suffix,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  suffix?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="field">
      <span className="range-head">
        <span className="k">{label}</span>
        <span className="v">
          {value}
          {suffix ?? ''}
        </span>
      </span>
      <RadixSlider.Root
        className="slider"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? value)}
      >
        <RadixSlider.Track className="slider-track">
          <RadixSlider.Range className="slider-range" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="slider-thumb" aria-label={label} />
      </RadixSlider.Root>
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="check">
      <RadixCheckbox.Root
        className="checkbox"
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      >
        <RadixCheckbox.Indicator className="checkbox-indicator">
          {/* The page's own icon set, at the page's stroke weight. A
              hand-rolled tick at 2px on an 11px grid is nearly a fifth of the
              mark thick — three times the weight of every other icon here. */}
          <CheckIcon width={12} height={12} aria-hidden="true" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <span>{label}</span>
    </label>
  );
}
