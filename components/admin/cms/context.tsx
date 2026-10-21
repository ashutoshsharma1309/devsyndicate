"use client";

import { createContext, useContext, useEffect } from "react";
import type { SectionKey } from "@/lib/cms/schema";
import type { Path } from "./paths";

/** What every field reads and writes. Provided by SectionEditor. */
export type EditorContextValue = {
  section: SectionKey;
  get: (path: Path) => unknown;
  set: (path: Path, value: unknown) => void;
  /** The current error message for `path` (server or client validation). */
  error: (path: Path) => string | undefined;
  /** Whether `path` or anything inside it has an error (lists open items that do). */
  hasErrorWithin: (path: Path) => boolean;
  /** Fields register a readable label so the publish summary and error list can name them. */
  registerLabel: (path: Path, label: string) => void;
  disabled: boolean;
};

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("Content fields must be rendered inside <SectionEditor>.");
  return ctx;
}

/** Labels of the enclosing groups and list items, e.g. ["FAQ", "Question 3"]. */
export const LabelPrefix = createContext<string[]>([]);

/** The field's full label ("FAQ › Question 3 › Answer"), registered for summaries. */
export function useFieldLabel(path: Path, label: string): string {
  const prefix = useContext(LabelPrefix);
  const { registerLabel } = useEditor();
  const full = [...prefix, label].join(" › ");
  useEffect(() => {
    registerLabel(path, full);
  }, [registerLabel, path, full]);
  return full;
}
