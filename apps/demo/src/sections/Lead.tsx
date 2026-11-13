/** Two-line section intro: the claim, then the quiet next line. */
export function Lead({ title, note }: { title: string; note: string }) {
  return (
    <div className="lead col">
      <h2>{title}</h2>
      <p>{note}</p>
    </div>
  );
}
