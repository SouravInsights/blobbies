/**
 * `blobbies/picker` — the Look Map foundation.
 *
 * The picker's geometry and gesture maths, framework-free, so a web binding can
 * reuse them. The React picker is the reference consumer, and a
 * `<blobbies-picker>` web component will share the same numbers.
 *
 * There is no native picker: React Native and SwiftUI ship the `Avatar` only,
 * as DiceBear does. The picker is a web surface.
 */
export * from './look-map.js';
export * from './picker-gesture.js';
