/** "On this page" links to an editor's groups. Server-safe (plain anchors, same page). */
export function JumpLinks({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="Parts of this editor" className="rounded-md border border-line bg-white px-4 py-3">
      <p className="t-label mb-2 text-mute">On this page</p>
      <ul className="flex flex-wrap gap-x-1 gap-y-1 text-sm">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className="inline-flex min-h-8 items-center rounded-sm px-2 hover:bg-ink/5 hover:text-signal">
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
