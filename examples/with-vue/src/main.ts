import { createApp, h, ref } from 'vue';
import { Avatar, AvatarPicker } from '@blobbies/vue';
import type { AvatarOptions } from '@blobbies/vue';

/**
 * Blobbies in a Vue app.
 *
 * Two things worth reading here, because they are the two things a Vue app
 * actually does with the library: render an avatar anywhere, and let someone
 * choose their own.
 */
const App = {
  setup() {
    const name = ref('Sourav Nanda');
    const saved = ref<AvatarOptions | null>(null);
    const live = ref<AvatarOptions | null>(null);
    const open = ref(true);

    return () =>
      h('div', { class: 'page' }, [
        h('header', { class: 'head' }, [
          h('div', { class: 'me' }, [
            // `as never`: Vue's `h` overloads cannot resolve a props object that
            // arrives through a spread. The packages' own tests do the same.
            h(Avatar, {
              name: name.value,
              ...(live.value ?? saved.value ?? {}),
              size: 44,
              animate: 'all',
            } as never),
            h('div', [
              h('b', null, name.value),
              h('span', null, live.value ? 'choosing…' : saved.value ? 'saved' : ''),
            ]),
          ]),
          h(
            'button',
            { class: 'btn', onClick: () => (open.value = !open.value) },
            open.value ? 'Close' : 'Choose an avatar',
          ),
        ]),

        h('div', { class: 'field' }, [
          h('label', null, 'Name'),
          h('input', {
            value: name.value,
            onInput: (event: Event) => {
              name.value = (event.target as HTMLInputElement).value;
              saved.value = null;
              live.value = null;
            },
          }),
        ]),

        open.value
          ? h(AvatarPicker, {
              name: name.value,
              defaultValue: saved.value ?? undefined,
              onSave: (value: AvatarOptions) => {
                saved.value = value;
                live.value = null;
                open.value = false;
              },
              onCancel: () => {
                live.value = null;
                open.value = false;
              },
              onChange: (value: AvatarOptions) => {
                live.value = value;
              },
            })
          : null,
      ]);
  },
};

const style = document.createElement('style');
style.textContent = `
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 48px 24px; font: 14px/1.6 ui-sans-serif, system-ui, sans-serif;
         background: #fafafa; color: #18181b; }
  @media (prefers-color-scheme: dark) { body { background: #0b0b0d; color: #f4f4f5; } }
  /* Block flow with an auto margin, not a centred grid: a grid whose items are
     centred sizes its implicit column to max-content, and every child asking
     for a percentage width then resolves against an indefinite one. */
  .page { width: min(480px, 100%); margin-inline: auto; display: grid; gap: 24px; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .me { display: flex; align-items: center; gap: 12px; }
  .me b { display: block; }
  .me span { color: #71717a; font-size: 12.5px; }
  .field { display: grid; gap: 6px; }
  .field label { font-size: 12.5px; color: #71717a; }
  .field input { padding: 9px 12px; border: 1px solid #e4e4e7; border-radius: 8px; font: inherit;
                 background: transparent; color: inherit; }
  .btn { height: 38px; padding: 0 14px; border: 0; border-radius: 8px; background: #18181b;
         color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
  @media (prefers-color-scheme: dark) { .btn { background: #f4f4f5; color: #18181b; } }
`;
document.head.append(style);

createApp(App).mount('#app');
