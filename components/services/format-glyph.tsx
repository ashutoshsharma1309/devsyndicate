/** Tiny schematic glyph per hackathon format, drawn in the same trace language as the hero. */
export function FormatGlyph({ code }: { code: string }) {
  const node = "fill-paper stroke-current";
  const hot = "fill-signal stroke-signal";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 132 48"
      className="h-12 w-auto text-ink/35 transition-colors duration-500 group-hover:text-ink/60"
      fill="none"
      strokeWidth="1.25"
    >
      {code === "CAMPUS" && (
        <>
          <rect x="44" y="6" width="44" height="36" rx="4" className="stroke-current" strokeDasharray="3 3" />
          <path d="M58 18h16M58 30h16M66 18v12" className="stroke-current" />
          <circle cx="58" cy="18" r="3" className={hot} />
          <circle cx="74" cy="18" r="3" className={node} />
          <circle cx="58" cy="30" r="3" className={node} />
          <circle cx="74" cy="30" r="3" className={node} />
        </>
      )}
      {code === "NATIONAL" && (
        <>
          <path d="M10 24h28M38 24V10h28M38 24v14h28M66 10h28v14h28M66 38h28V24" className="stroke-current" />
          {[
            [10, 24],
            [38, 24],
            [66, 10],
            [66, 38],
            [94, 24],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3" className={node} />
          ))}
          <circle cx="122" cy="24" r="3.5" className={hot} />
        </>
      )}
      {code === "INDUSTRY" && (
        <>
          <rect x="8" y="14" width="26" height="20" rx="3" className="fill-signal/10 stroke-signal" />
          <path d="M34 24h30M64 24V10h36M64 24v14h36M64 24h36" className="stroke-current" />
          <circle cx="100" cy="10" r="3" className={node} />
          <circle cx="100" cy="24" r="3" className={node} />
          <circle cx="100" cy="38" r="3" className={node} />
          <path d="M103 24h18" className="stroke-signal" />
          <circle cx="124" cy="24" r="3" className={hot} />
        </>
      )}
      {code === "INNOVATION" && (
        <>
          <path d="M10 24h40l14-14h26M64 24h26M50 24l14 14h26M90 10l14 14h18" className="stroke-current" />
          <circle cx="10" cy="24" r="3" className={node} />
          <circle cx="90" cy="10" r="3" className={node} />
          <circle cx="90" cy="24" r="3" className={node} />
          <circle cx="90" cy="38" r="3" className={node} />
          <circle cx="122" cy="24" r="3.5" className={hot} />
        </>
      )}
      {code === "CUSTOM" && (
        <>
          <rect x="8" y="8" width="116" height="32" rx="4" className="stroke-current" strokeDasharray="2 4" />
          <path d="M28 24h22M82 24h22" className="stroke-current" />
          <rect x="54" y="16" width="24" height="16" rx="3" className="fill-signal/10 stroke-signal" />
          <circle cx="28" cy="24" r="3" className={node} />
          <circle cx="104" cy="24" r="3" className={node} />
        </>
      )}
    </svg>
  );
}
