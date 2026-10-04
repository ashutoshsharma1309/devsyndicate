/** Re-mounts on every navigation, giving each page a short fade-in. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
