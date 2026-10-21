"use client";

import { SEO_PATHS, type SeoPath, type SeoPage } from "@/lib/cms/schema";
import { ABSOLUTE_TITLE_PATHS, PAGE_LABELS } from "@/lib/cms/sections";
import { site } from "@/lib/site";
import { useEditor } from "../context";
import { SectionEditor } from "../editor";
import { EditorGroup, TextField } from "../fields";
import { JumpLinks } from "../jump-links";
import type { EditorData } from "../types";

const SUFFIX = " | Dev Syndicate";

const groupId = (p: SeoPath) => `seo-${p === "/" ? "home" : p.slice(1)}`;

/** How the page could look in a search result (text only; search engines may rewrite it). */
function SnippetPreview({ path }: { path: SeoPath }) {
  const ctx = useEditor();
  const page = (ctx.get(`pages.${path}`) as SeoPage | undefined) ?? { title: "", description: "", ogTitle: "", ogDescription: "" };
  const title = page.title.trim() + (ABSOLUTE_TITLE_PATHS.includes(path) ? "" : SUFFIX);
  return (
    <figure className="rounded-sm border border-line bg-paper/50 px-4 py-3">
      <figcaption className="t-label mb-2 text-mute">Search result preview</figcaption>
      <p className="truncate text-xs text-mute">{`${site.url}${path === "/" ? "" : path}`}</p>
      <p className="mt-0.5 line-clamp-2 break-words text-[1.0625rem] leading-snug text-signal-deep">{title}</p>
      <p className="mt-1 line-clamp-3 break-words text-[0.8125rem] leading-snug text-ink/80">{page.description.trim()}</p>
    </figure>
  );
}

export function SeoEditor(props: EditorData<"seo">) {
  return (
    <SectionEditor {...props}>
      <JumpLinks items={SEO_PATHS.map((p) => ({ id: groupId(p), label: PAGE_LABELS[p] }))} />
      <p className="text-[0.8125rem] leading-snug text-mute">
        Titles and descriptions for search results and link previews. Canonical URLs and indexing rules aren&apos;t
        editable here.
      </p>
      {SEO_PATHS.map((path) => {
        const absolute = ABSOLUTE_TITLE_PATHS.includes(path);
        const base = `pages.${path}`;
        return (
          <EditorGroup key={path} id={groupId(path)} title={`${PAGE_LABELS[path]} (${path})`}>
            <TextField
              path={`${base}.title`}
              label="Title"
              max={90}
              hint={absolute ? "Used exactly as written." : `“${SUFFIX.trim()}” is added after it.`}
              guidance={{ min: 50, max: 60, offset: absolute ? 0 : SUFFIX.length, what: absolute ? undefined : "including the suffix" }}
            />
            <TextField
              path={`${base}.description`}
              label="Description"
              max={300}
              long
              rows={3}
              guidance={{ min: 120, max: 160 }}
            />
            <TextField
              path={`${base}.ogTitle`}
              label="Link preview title"
              max={90}
              optional
              hint="For social and chat link previews. Leave empty to use the page title."
            />
            <TextField
              path={`${base}.ogDescription`}
              label="Link preview description"
              max={300}
              optional
              long
              rows={2}
              hint="Leave empty to use the description."
            />
            <SnippetPreview path={path} />
          </EditorGroup>
        );
      })}
    </SectionEditor>
  );
}
