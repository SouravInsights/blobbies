import { Words, useInView } from '../ui';

/**
 * Two-line section intro: the claim, then the quiet next line.
 *
 * The words sharpen in when the intro first comes into view, once. A section
 * heading that replayed every time you scrolled past it would be a tic, not a
 * welcome.
 */
export function Lead({ title, note }: { title: string; note: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.55);
  return (
    <div className="lead says" ref={ref} data-s={seen ? 'said' : 'wait'}>
      <h2>
        <Words text={title} />
      </h2>
      <p>
        <Words text={note} />
      </p>
    </div>
  );
}
