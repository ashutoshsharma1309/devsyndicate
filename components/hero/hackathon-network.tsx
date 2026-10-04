/**
 * "The Hackathon Network" — the hero schematic.
 * Pure SVG + CSS animation (no client JS). Traces are orthogonal, echoing the
 * circuit lines in the Dev Syndicate crest. Two layouts: a wide one for tablet
 * and up, and a tall one for phones so labels stay readable.
 */

type NodeId = "college" | "students" | "mentors" | "teams" | "projects" | "judges" | "industry" | "innovation";

const nodeMeta: Record<NodeId, { label: string; role: string }> = {
  college: { label: "College", role: "Host" },
  students: { label: "Students", role: "Participants" },
  mentors: { label: "Mentors", role: "Guidance" },
  teams: { label: "Teams", role: "Builders" },
  projects: { label: "Projects", role: "Submissions" },
  judges: { label: "Judges", role: "Evaluation" },
  industry: { label: "Industry", role: "Partners" },
  innovation: { label: "Innovation", role: "Outcomes" },
};

const edges: { from: NodeId; to: NodeId; note?: string }[] = [
  { from: "college", to: "students", note: "outreach" },
  { from: "college", to: "mentors" },
  { from: "students", to: "teams", note: "registration" },
  { from: "mentors", to: "teams", note: "mentoring" },
  { from: "teams", to: "projects", note: "build" },
  { from: "judges", to: "projects", note: "evaluation" },
  { from: "industry", to: "judges" },
  { from: "projects", to: "innovation", note: "outcomes" },
  { from: "industry", to: "innovation" },
];

type Layout = {
  w: number;
  h: number;
  chipW: number;
  chipH: number;
  flow: "x" | "y";
  pos: Record<NodeId, [number, number]>;
  notes: boolean;
};

const wide: Layout = {
  w: 1200,
  h: 440,
  chipW: 150,
  chipH: 56,
  flow: "x",
  notes: true,
  pos: {
    college: [95, 220],
    students: [335, 110],
    mentors: [335, 330],
    teams: [585, 220],
    projects: [835, 110],
    judges: [835, 330],
    industry: [1095, 330],
    innovation: [1095, 110],
  },
};

const tall: Layout = {
  w: 360,
  h: 500,
  chipW: 132,
  chipH: 52,
  flow: "y",
  notes: false,
  pos: {
    college: [180, 40],
    students: [92, 145],
    mentors: [268, 145],
    teams: [180, 250],
    projects: [92, 355],
    judges: [268, 355],
    innovation: [92, 460],
    industry: [268, 460],
  },
};

function edgePath(l: Layout, a: NodeId, b: NodeId) {
  const [ax, ay] = l.pos[a];
  const [bx, by] = l.pos[b];
  const hw = l.chipW / 2;
  const hh = l.chipH / 2;

  if (ay === by) {
    const s = bx > ax ? 1 : -1;
    return { d: `M${ax + s * hw} ${ay} H${bx - s * hw}`, mid: [(ax + bx) / 2, ay] as const };
  }
  if (ax === bx) {
    const s = by > ay ? 1 : -1;
    return { d: `M${ax} ${ay + s * hh} V${by - s * hh}`, mid: [ax, (ay + by) / 2] as const };
  }

  const r = 12;
  if (l.flow === "x") {
    const sx = bx > ax ? 1 : -1;
    const sy = by > ay ? 1 : -1;
    const x1 = ax + sx * hw;
    const x2 = bx - sx * hw;
    const mx = (x1 + x2) / 2;
    return {
      d: `M${x1} ${ay} H${mx - sx * r} Q${mx} ${ay} ${mx} ${ay + sy * r} V${by - sy * r} Q${mx} ${by} ${mx + sx * r} ${by} H${x2}`,
      mid: [mx, (ay + by) / 2] as const,
    };
  }
  const sx = bx > ax ? 1 : -1;
  const sy = by > ay ? 1 : -1;
  const y1 = ay + sy * hh;
  const y2 = by - sy * hh;
  const my = (y1 + y2) / 2;
  return {
    d: `M${ax} ${y1} V${my - sy * r} Q${ax} ${my} ${ax + sx * r} ${my} H${bx - sx * r} Q${bx} ${my} ${bx} ${my + sy * r} V${y2}`,
    mid: [(ax + bx) / 2, my] as const,
  };
}

function Diagram({ l, className }: { l: Layout; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${l.w} ${l.h}`}
      className={className}
      role="img"
      aria-label="Diagram of a hackathon ecosystem: the college hosts the event and reaches students and mentors; students form teams that build projects with mentor guidance; judges and industry partners evaluate projects, which lead to innovation outcomes."
      fill="none"
    >
      <g>
        {edges.map((e, i) => {
          const { d, mid } = edgePath(l, e.from, e.to);
          return (
            <g key={`${e.from}-${e.to}`}>
              <path d={d} stroke="rgb(255 255 255 / 0.16)" strokeWidth="1.25" />
              <path
                d={d}
                pathLength={100}
                stroke="var(--color-signal-soft)"
                strokeWidth="2"
                strokeLinecap="round"
                className="trace-pulse"
                style={{ ["--delay" as string]: `${(i * 0.42).toFixed(2)}s`, ["--dur" as string]: "3.2s" }}
              />
              {l.notes && e.note && (
                <text
                  x={mid[0]}
                  y={mid[1] - 8}
                  textAnchor="middle"
                  className="fill-mute-dark font-mono"
                  fontSize="10.5"
                  letterSpacing="0.08em"
                >
                  {e.note}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {(Object.keys(l.pos) as NodeId[]).map((id, i) => {
        const [cx, cy] = l.pos[id];
        const x = cx - l.chipW / 2;
        const y = cy - l.chipH / 2;
        const meta = nodeMeta[id];
        const accent = id === "college" || id === "innovation";
        return (
          <g key={id}>
            <rect
              x={x}
              y={y}
              width={l.chipW}
              height={l.chipH}
              rx="6"
              fill={accent ? "#16193a" : "var(--color-carbon)"}
              stroke={accent ? "rgb(140 151 255 / 0.55)" : "rgb(255 255 255 / 0.14)"}
            />
            <circle
              cx={x + 16}
              cy={cy - 8}
              r="3"
              fill="var(--color-signal-soft)"
              className="node-blink"
              style={{ ["--delay" as string]: `${(i * 0.35).toFixed(2)}s` }}
            />
            <text x={x + 28} y={cy - 4} className="fill-white" fontSize="14" fontWeight="550" letterSpacing="-0.01em">
              {meta.label}
            </text>
            <text
              x={x + 28}
              y={cy + 14}
              className="fill-mute-dark font-mono"
              fontSize="10"
              letterSpacing="0.1em"
            >
              {meta.role.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HackathonNetwork() {
  return (
    <>
      <Diagram l={wide} className="hidden h-auto w-full md:block" />
      <Diagram l={tall} className="mx-auto block h-auto w-full max-w-[380px] md:hidden" />
    </>
  );
}
