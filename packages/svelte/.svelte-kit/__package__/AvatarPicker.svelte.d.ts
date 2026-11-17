import type { AvatarOptions } from 'blobbies';
interface Props {
    /** The person's name — the eyes every look shares. */
    name: string;
    /** The look to open on. Changing it after mount does not reset the picker. */
    defaultValue?: AvatarOptions;
    /** The colours the map offers. Defaults to the built-in palette. */
    palette?: readonly string[];
    /** Run the depth-of-field spotlight while hovering. */
    spotlight?: boolean;
    /** Skip the panel styling and style the parts yourself. */
    unstyled?: boolean;
    title?: string;
    description?: string;
    saveLabel?: string;
    onchange?: (value: AvatarOptions) => void;
    onsave?: (value: AvatarOptions) => void;
    oncancel?: () => void;
    [key: string]: unknown;
}
declare const AvatarPicker: import("svelte").Component<Props, {}, "">;
type AvatarPicker = ReturnType<typeof AvatarPicker>;
export default AvatarPicker;
