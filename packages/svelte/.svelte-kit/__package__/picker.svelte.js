import { createPicker, injectPickerStyles, staticSnapshot } from 'blobbies/picker';
/**
 * Build your own picker layout, with the picker's behaviour.
 *
 * `<AvatarPicker>` is the preset. This is what it is made of, and what you use
 * when the panel it draws is not the panel you want. A rune module rather than
 * a set of part components, because in Svelte 5 that is how a component and its
 * state get shared.
 *
 * ```svelte
 * <script>
 *   import { createAvatarPicker } from '@blobbies/svelte';
 *
 *   const picker = createAvatarPicker({ name: 'Ira', onSave: save });
 * </script>
 *
 * <div class="mine">
 *   <Avatar name="Ira" {...picker.state.value} size={64} />
 *   <div bind:this={picker.host}></div>
 *   <button onclick={() => picker.state.reset()}>Reset</button>
 * </div>
 * ```
 *
 * The behaviour is `createPicker` in the core — the same runtime React, Vue and
 * `<blobbies-avatar>` use — so a custom layout is not a reimplementation, it is
 * the picker with different chrome.
 */
export function createAvatarPicker(options) {
    const { name, defaultValue, palette, spotlight = true, onChange, onSave, onCancel, } = options;
    let host = $state(undefined);
    let runtime = $state(null);
    // `$state.raw`, not `$state`: the runtime hands back a new object on every
    // real change, and that is the granularity we want to re-render at.
    let snapshot = $state.raw(staticSnapshot({ name, defaultValue, palette, spotlight }));
    // Runs when `host` is bound, which is once the element exists — the map cannot
    // be measured before then. Its cleanup runs on destroy.
    $effect(() => {
        if (!host)
            return undefined;
        injectPickerStyles();
        const created = createPicker({
            name,
            defaultValue,
            palette,
            spotlight,
            onChange,
            onSave,
            onCancel,
        });
        if (!created)
            return undefined;
        runtime = created;
        snapshot = created.getSnapshot();
        const stop = created.subscribe(() => {
            snapshot = created.getSnapshot();
        });
        host.append(created.surface);
        created.measure();
        return () => {
            stop();
            created.destroy();
        };
    });
    return {
        // A getter and a setter rather than a plain field, so `bind:this` can write
        // it and the effect above can read it as the reactive value it is.
        get host() {
            return host;
        },
        set host(element) {
            host = element;
        },
        get state() {
            // Reading `snapshot` here is what makes a layout re-render when the
            // picker changes; there is no second subscription to keep in step.
            return {
                ...snapshot,
                nextExpression: () => runtime?.nextExpression(),
                previousExpression: () => runtime?.previousExpression(),
                toggleBlush: () => runtime?.toggleBlush(),
                toggleSpotlight: () => runtime?.toggleSpotlight(),
                reset: () => runtime?.reset(),
                save: () => runtime?.save(),
                cancel: () => runtime?.cancel(),
                hasCancel: !!onCancel,
            };
        },
        get runtime() {
            return runtime;
        },
    };
}
