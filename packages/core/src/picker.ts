/**
 * `blobbies/picker` — the Look Map foundation.
 *
 * The picker's geometry and gesture maths, and the runtime that owns its
 * behaviour, framework-free, so any web binding can reuse them. React is the
 * reference consumer; Vue, Svelte and a `<blobbies-picker>` element run the
 * same runtime, so the picker behaves identically everywhere rather than
 * identically-by-convention.
 *
 * There is no native picker: React Native and SwiftUI ship the `Avatar` only,
 * as DiceBear does. The picker is a web surface.
 */
export * from './look-map.js';
export * from './picker-gesture.js';
export * from './picker-runtime.js';
export * from './picker-styles.js';
