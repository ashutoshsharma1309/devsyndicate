import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Dev Syndicate — Bring a national-level hackathon to your campus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const crest = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/crest.png"), "base64")}`;
  const grid = "rgba(255,255,255,0.05)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0a0b0d",
          backgroundImage: `linear-gradient(to right, ${grid} 1px, transparent 1px), linear-gradient(to bottom, ${grid} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={crest} width={40} height={54} alt="" />
            <span style={{ fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase" }}>Dev Syndicate</span>
          </div>
          <span style={{ fontSize: 18, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8c97ff" }}>
            Hackathon partner for colleges
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 1, letterSpacing: "-0.045em", maxWidth: 960 }}>
            Bring a national-level hackathon to your campus.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 }}>
            <div style={{ width: 64, height: 2, background: "#3a4cff" }} />
            <span style={{ fontSize: 26, color: "rgba(255,255,255,0.7)" }}>
              Strategy · Outreach · Mentors & judges · Execution · Reporting
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
