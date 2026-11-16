export { getInitials } from './initials.js';
export {
  renderAvatarSvg,
  renderAvatarBody,
  avatarDataUri,
  resolveAvatar,
  buildBlinkStyle,
  wantsBlink,
  wantsFollow,
} from './render.js';
export type { ResolvedAvatar } from './render.js';
export { serializeScene, serializeNode, serializeTransform } from './scene.js';
export type { SceneNode, TransformOp, ClipDef } from './scene.js';
export {
  COLS,
  ROWS,
  CENTER_I,
  CENTER_J,
  MIN_GAP,
  MAX_GAP,
  MIN_CELL,
  MAX_CELL,
  LENS,
  MAX_BLUR,
  PUSH,
  PAD,
  mod,
  clamp,
  lookCells,
  centeredCell,
  lensEffect,
} from './look-map.js';
export type { CellIndex, LookCell, LensInput, LensResult } from './look-map.js';
export { dragSlop, exceedsSlop, cellAtPoint } from './picker-gesture.js';
export type { GesturePoint, CellHitTest } from './picker-gesture.js';
export { COLORS, PALETTE, BACKDROP_COLOR, INK_COLOR, BLUSH_COLOR } from './palette.js';
export type { AvatarColor } from './palette.js';
export { EXPRESSIONS, SHAPES, EXPRESSION_NAMES, EXPRESSION_COUNT, SHAPE_COUNT } from './parts.js';
export { CONTRACT_VERSION } from './contract.js';
export type { BlobTraits, DecideInput } from './parts.js';
export { LETTER_PATHS, LETTER_BOX, STROKE_WIDTH, INK_WIDTH, hasLetterPath } from './letters.js';
export { hashString, cyrb53, mulberry32, createRng } from './hash.js';
export type {
  AvatarOptions,
  AvatarAnimate,
  AvatarShape,
  AvatarExpression,
  FollowTarget,
  MotionOptions,
} from './types.js';
