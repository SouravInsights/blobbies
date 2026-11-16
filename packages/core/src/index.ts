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
export { serializeScene, serializeNode } from './scene.js';
export type { SceneNode, TransformOp, ClipDef } from './scene.js';
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
