// Template registry. Each entry maps a templateId (stored on Resume) to
// metadata used in the template picker. All templates currently render
// through the same single-column engine (ClassicPreview / ClassicPdf) with
// different default accent color / font / spacing — which is enough to
// meaningfully change appearance while keeping one well-tested layout
// engine. Swap `render` to a distinct component per template as you build
// more layouts (e.g. a true two-column "Modern" template).
export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  audience: "ats" | "student" | "experienced" | "general";
  defaultAccent: string;
  defaultFont: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Single-column, ATS-friendly. Safe default for most roles.",
    audience: "ats",
    defaultAccent: "#0E7C7B",
    defaultFont: "Inter",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet, understated styling with extra whitespace.",
    audience: "general",
    defaultAccent: "#16213E",
    defaultFont: "Inter",
  },
  {
    id: "student",
    name: "Fresher / Student",
    description: "Leads with education and projects — for early-career candidates.",
    audience: "student",
    defaultAccent: "#0E7C7B",
    defaultFont: "Inter",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Bolder headings for senior/experienced-professional resumes.",
    audience: "experienced",
    defaultAccent: "#C9A227",
    defaultFont: "Source Serif 4",
  },
];

export function getTemplate(id: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
