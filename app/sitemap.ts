import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const pages: { path: string; priority: number; changeFrequency: "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "yearly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((p) => ({
    url: `${site.url}${p.path === "/" ? "" : p.path}`,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
