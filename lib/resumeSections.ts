import { ResumeSection } from "@/types/resume";

/**
 * Immutably updates one section's `content` by id. `mutate` receives a deep
 * clone of that section's current content and can mutate it directly (or
 * return a new object) — the clone means callers never risk mutating React
 * state in place. Used by inline click-to-edit fields in the preview, so a
 * single-field edit only touches the one section it belongs to.
 */
export function updateSectionContent(
  sections: ResumeSection[],
  sectionId: string,
  mutate: (content: any) => any
): ResumeSection[] {
  return sections.map((s) => {
    if (s.id !== sectionId) return s;
    const clone =
      typeof structuredClone === "function"
        ? structuredClone(s.content)
        : JSON.parse(JSON.stringify(s.content ?? null));
    return { ...s, content: mutate(clone) };
  });
}

/** Immutably renames a section (the heading shown above it, e.g. "Work Experience"). */
export function updateSectionTitle(sections: ResumeSection[], sectionId: string, title: string): ResumeSection[] {
  return sections.map((s) => (s.id === sectionId ? { ...s, title } : s));
}
