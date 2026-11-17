import { useInsertionEffect } from 'react';
import { injectPickerStyles } from 'blobbies/picker';

/**
 * Put the picker's stylesheet in the document.
 *
 * The sheet itself is the core's, so Vue, Svelte and `<blobbies-picker>` get
 * the same one rather than three copies. This is only the React half: an
 * insertion effect, so the styles are in before paint and a component that is
 * rendered and thrown away never injects anything.
 */
export function usePickerStyles(): void {
  useInsertionEffect(() => {
    injectPickerStyles();
  }, []);
}
