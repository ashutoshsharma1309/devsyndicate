/**
 * "The Hackathon Network" — the hero schematic.
 *
 * Reads as one process: a five-step spine (College → Students → Teams →
 * Projects → Innovation) with the people Dev Syndicate brings in (mentors,
 * judges, industry) feeding the step they support. Pure SVG + CSS: a signal
 * travels the spine step by step, each chip lights as it arrives, and the
 * supporting roles feed in just in time. Two layouts — wide from `xl`, a
 * vertical one below it — so labels stay legible at every width. Loops pause
 * only while the figure is off screen (see [data-ambient]).
 */

type NodeId = "college" | "students" | "teams" | "projects" | "innovation" | "mentors" | "judges" | "industry";

const spine = ["college", "students", "teams", "projects", "innovation"] as const;

const nodeMeta: Record<NodeId, { label: string; role: string }> = {
  college: { label: "College", role: "Host institution" },
  students: { label: "Students", role: "Participants" },
  teams: { label: "Teams", role: "Builders" },
  projects: { label: "Projects", role: "Submissions" },
  innovation: { label: "Innovation", role: "Winning ideas" },
  mentors: { label: "Mentors", role: "Guidance" },
  judges: { label: "Judges", role: "Evaluation" },
  industry: { label: "Industry", role: "Partners" },
};

/** The five steps, one per spine chip. */
const steps = ["Plan", "Register", "Build", "Judge", "Results"];

/** Supporting roles and the spine step each one feeds. */
const support: { from: NodeId; to: NodeId }[] = [
  { from: "mentors", to: "teams" },
  { from: "judges", to: "projects" },
  { from: "industry", to: "innovation" },
];

/** Seconds for the signal to cross one connector; the whole loop is CYCLE. */
const HOP = 0.8;
const CYCLE = 4.8;
/** When the signal reaches each chip (seconds into the loop). */
const arrival: Record<NodeId, number> = {
  college: 0,
  students: HOP,
  teams: HOP * 2,
  projects: HOP * 3,
  innovation: HOP * 4,
  // Supporting roles send their signal one hop before the spine reaches their step.
  mentors: HOP,
  judges: HOP * 2,
  industry: HOP * 3,
};

type Layout = {
  w: number;
  h: number;
  /** Chip sizes for spine and supporting chips. */
  chip: { w: number; h: number };
  supportChip: { w: number; h: number };
  pos: Record<NodeId, [number, number]>;
  type: { label: number; role: number; note: number };
  /** Wide only: step headers above each column. */
  headers: boolean;
  /** Where the "brought in by Dev Syndicate" label sits, and its alignment. */
  networkLabel: { x: number; y: number; anchor: "start" | "end" };
};

const wide: Layout = {
  w: 1200,
  h: 306,
  chip: { w: 176, h: 60 },
  supportChip: { w: 176, h: 60 },
  pos: {
    college: [120, 110],
    students: [360, 110],
    teams: [600, 110],
    projects: [840, 110],
    innovation: [1080, 110],
    mentors: [600, 258],
    judges: [840, 258],
    industry: [1080, 258],
  },
  type: { label: 17, role: 12, note: 12 },
  headers: true,
  networkLabel: { x: 486, y: 254, anchor: "end" },
};

const tall: Layout = {
  w: 360,
  h: 466,
  chip: { w: 164, h: 56 },
  supportChip: { w: 134, h: 56 },
  pos: {
    college: [98, 36],
    students: [98, 132],
    teams: [98, 228],
    projects: [98, 324],
    innovation: [98, 420],
    mentors: [277, 228],
    judges: [277, 324],
    industry: [277, 420],
  },
  type: { label: 15, role: 10.5, note: 10.5 },
  headers: false,
  networkLabel: { x: 210, y: 174, anchor: "start" },
};

const PLATE = 5; // depth of the offset plate under each chip

const isSpine = (id: NodeId) => (spine as readonly NodeId[]).includes(id);
const sizeOf = (l: Layout, id: NodeId) => (isSpine(id) ? l.chip : l.supportChip);

/** Connector between two chips: straight, edge to edge, with its end point and direction. */
function connector(l: Layout, a: NodeId, b: NodeId) {
  const [ax, ay] = l.pos[a];
  const [bx, by] = l.pos[b];
  const sa = sizeOf(l, a);
  const sb = sizeOf(l, b);
  if (ay === by) {
    // horizontal (left → right on the spine, or right → left from a supporting chip)
    const dir = bx > ax ? 1 : -1;
    const x1 = ax + (dir * sa.w) / 2;
    const x2 = bx - (dir * sb.w) / 2 - dir * 3;
    return { d: `M${x1} ${ay} H${x2}`, end: [x2, by] as const, dir: dir > 0 ? "right" : "left" };
  }
  // vertical (down the spine, or up from a supporting chip)
  const dir = by > ay ? 1 : -1;
  const y1 = dir > 0 ? ay + sa.h / 2 + PLATE : ay - sa.h / 2;
  const y2 = dir > 0 ? by - sb.h / 2 - 3 : by + sb.h / 2 + PLATE + 3;
  return { d: `M${ax} ${y1} V${y2}`, end: [bx, y2] as const, dir: dir > 0 ? "down" : "up" };
}

function arrowHead([x, y]: readonly [number, number], dir: string) {
  const s = 5;
  const pts =
    dir === "right"
      ? `M${x - s} ${y - s} L${x} ${y} L${x - s} ${y + s}`
      : dir === "left"
        ? `M${x + s} ${y - s} L${x} ${y} L${x + s} ${y + s}`
        : dir === "down"
          ? `M${x - s} ${y - s} L${x} ${y} L${x + s} ${y - s}`
          : `M${x - s} ${y + s} L${x} ${y} L${x + s} ${y + s}`;
  return <path d={pts} stroke="rgb(255 255 255 / 0.4)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />;
}

const delay = (s: number) => ({ ["--delay" as string]: `${s.toFixed(2)}s`, ["--cycle" as string]: `${CYCLE}s` });

function Diagram({ l, className }: { l: Layout; className?: string }) {
  const spineEdges = spine.slice(0, -1).map((id, i) => ({ from: id, to: spine[i + 1] }));

  return (
    <svg
      viewBox={`0 0 ${l.w} ${l.h}`}
      className={className}
      role="img"
      aria-label="How a hackathon comes together, in five steps: the college hosts the event; students register; they form teams that build projects; projects are judged; and the best work becomes the winning ideas. Dev Syndicate brings in mentors to guide the teams, judges to evaluate the projects, and industry partners who connect the winning ideas to real opportunities."
      fill="none"
    >
      {/* Step headers (wide) */}
      {l.headers && (
        <g>
          {spine.map((id, i) => (
            <text key={id} x={l.pos[id][0]} y={22} textAnchor="middle" className="font-mono" fontSize="12.5" letterSpacing="0.14em">
              <tspan className="fill-signal-soft">{String(i + 1).padStart(2, "0")}</tspan>
              <tspan className="fill-mute-dark" dx="8">
                {steps[i].toUpperCase()}
              </tspan>
            </text>
          ))}
          <path d={`M${l.pos.college[0] - l.chip.w / 2} 40 H${l.pos.innovation[0] + l.chip.w / 2}`} stroke="rgb(255 255 255 / 0.08)" />
        </g>
      )}

      {/* "Brought in by Dev Syndicate" — names the supporting row */}
      <text
        x={l.networkLabel.x}
        y={l.networkLabel.y}
        textAnchor={l.networkLabel.anchor}
        className="font-mono"
        fontSize={l.type.note}
        letterSpacing="0.12em"
      >
        <tspan className="fill-mute-dark">BROUGHT IN BY</tspan>
        <tspan x={l.networkLabel.x} dy="1.5em" className="fill-signal-soft">
          DEV SYNDICATE {l.networkLabel.anchor === "end" ? "→" : "↓"}
        </tspan>
      </text>

      {/* Spine: the hackathon flow */}
      {spineEdges.map((e, i) => {
        const c = connector(l, e.from, e.to);
        return (
          <g key={`${e.from}-${e.to}`}>
            <path d={c.d} stroke="rgb(255 255 255 / 0.22)" strokeWidth="1.25" />
            {arrowHead(c.end, c.dir)}
            <path
              d={c.d}
              pathLength={100}
              stroke="var(--color-signal-soft)"
              strokeWidth="2"
              strokeLinecap="round"
              className="flow-pulse"
              style={delay(i * HOP)}
            />
          </g>
        );
      })}

      {/* Supporting roles feeding the step they support */}
      {support.map((s) => {
        const c = connector(l, s.from, s.to);
        return (
          <g key={`${s.from}-${s.to}`}>
            <path d={c.d} stroke="rgb(255 255 255 / 0.22)" strokeWidth="1.25" strokeDasharray="3 4" />
            {arrowHead(c.end, c.dir)}
            <path
              d={c.d}
              pathLength={100}
              stroke="var(--color-signal-soft)"
              strokeWidth="2"
              strokeLinecap="round"
              className="flow-pulse"
              style={delay(arrival[s.from])}
            />
          </g>
        );
      })}

      {/* Chips */}
      {(Object.keys(l.pos) as NodeId[]).map((id) => {
        const [cx, cy] = l.pos[id];
        const { w, h } = sizeOf(l, id);
        const x = cx - w / 2;
        const y = cy - h / 2;
        const meta = nodeMeta[id];
        const onSpine = isSpine(id);
        const accent = id === "college" || id === "innovation";
        const stepIndex = (spine as readonly NodeId[]).indexOf(id);
        return (
          <g key={id}>
            {/* offset plate — reads as the chip's thickness */}
            <rect
              x={x}
              y={y + PLATE}
              width={w}
              height={h}
              rx="6"
              fill={accent ? "rgb(58 76 255 / 0.5)" : "#050607"}
              stroke={accent ? "none" : "rgb(255 255 255 / 0.07)"}
            />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="6"
              fill={accent ? "#171a3d" : onSpine ? "#16191e" : "#101216"}
              stroke={accent ? "rgb(140 151 255 / 0.6)" : onSpine ? "rgb(255 255 255 / 0.18)" : "rgb(255 255 255 / 0.14)"}
            />
            {/* status light: pings when the signal arrives */}
            <circle cx={x + 16} cy={cy - 7} r="7" fill="var(--color-signal-soft)" className="flow-ring" style={delay(arrival[id])} />
            <circle cx={x + 16} cy={cy - 7} r="3" fill="var(--color-signal-soft)" className="flow-node" style={delay(arrival[id])} />
            <text x={x + 28} y={cy - 2} className="fill-white" fontSize={l.type.label} fontWeight="550" letterSpacing="-0.01em">
              {meta.label}
            </text>
            <text x={x + 28} y={cy + l.type.role + 6} className="fill-mute-dark font-mono" fontSize={l.type.role} letterSpacing="0.1em">
              {meta.role.toUpperCase()}
            </text>
            {/* step number on the vertical layout, where there are no column headers */}
            {!l.headers && onSpine && (
              <text x={x + w - 12} y={cy - 2} textAnchor="end" className="fill-signal-soft font-mono" fontSize={l.type.role} letterSpacing="0.1em">
                {String(stepIndex + 1).padStart(2, "0")}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function HackathonNetwork() {
  return (
    <>
      <Diagram l={wide} className="hidden h-auto w-full xl:block" />
      <Diagram l={tall} className="mx-auto block h-auto w-full max-w-[420px] xl:hidden" />
    </>
  );
}
