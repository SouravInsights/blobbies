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
export { PALETTE, BACKDROP_COLOR, INK_COLOR, BLUSH_COLOR } from './palette.js';
export { hashString, cyrb53, mulberry32, createRng } from './hash.js';
export type {
  AvatarOptions,
  AvatarAnimate,
  FollowTarget,
  MotionOptions,
} from './types.js';
