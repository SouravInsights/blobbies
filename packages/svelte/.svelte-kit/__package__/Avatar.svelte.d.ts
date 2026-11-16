import type { AvatarOptions } from 'blobbies';
interface Props extends AvatarOptions {
    /** The name to derive the avatar from. */
    name: string;
    /**
     * Anything that is not a Blobbies option — `class`, `style`, `aria-*`,
     * `data-*` — is passed through to the `<svg>`.
     */
    [attribute: string]: unknown;
}
declare const Avatar: import("svelte").Component<Props, {}, "">;
type Avatar = ReturnType<typeof Avatar>;
export default Avatar;
