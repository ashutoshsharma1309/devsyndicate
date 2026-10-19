export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** "City, State" from whichever parts were provided; "—" if neither. */
export function formatLocation(l: { city: string; state: string }) {
  return [l.city, l.state].filter(Boolean).join(", ") || "—";
}

export function formatDate(iso: string, withTime = false) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(d);
}
