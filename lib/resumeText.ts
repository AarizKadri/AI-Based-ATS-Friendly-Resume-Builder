import { ResumeSection } from "@/types/resume";

/**
 * Flattens a resume's structured sections into plain readable text.
 * Used as context for every AI feature (summary gen, ATS scoring, job
 * matching, chat, etc.) instead of sending raw JSON, which wastes tokens
 * and reads worse to the model.
 */
export function resumeToPlainText(sections: ResumeSection[]): string {
  const enabled = [...sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const lines: string[] = [];

  for (const section of enabled) {
    lines.push(`## ${section.title}`);
    const c: any = section.content;

    switch (section.type) {
      case "contact":
        lines.push(`${c.fullName || ""} | ${c.email || ""} | ${c.phone || ""} | ${c.location || ""}`);
        break;
      case "headline":
      case "summary":
        lines.push(c.text || "");
        break;
      case "experience":
      case "internships":
        for (const e of c.entries || []) {
          lines.push(`${e.role} at ${e.company} (${e.startDate} - ${e.endDate})`);
          for (const b of e.bullets || []) lines.push(`- ${b}`);
        }
        break;
      case "education":
        for (const e of c.entries || []) {
          lines.push(`${e.degree} in ${e.fieldOfStudy}, ${e.institution} (${e.startDate} - ${e.endDate})`);
        }
        break;
      case "projects":
        for (const e of c.entries || []) {
          lines.push(`${e.name} [${(e.techStack || []).join(", ")}]`);
          for (const b of e.bullets || []) lines.push(`- ${b}`);
        }
        break;
      case "technicalSkills":
      case "softSkills":
        lines.push((c.skills || []).join(", "));
        break;
      case "certifications":
        for (const e of c.entries || []) lines.push(`${e.name} — ${e.issuer} (${e.date})`);
        break;
      case "achievements":
      case "awards":
      case "publications":
      case "research":
      case "volunteer":
      case "custom":
        for (const e of c.entries || []) {
          lines.push(`${e.title}${e.subtitle ? " — " + e.subtitle : ""}${e.date ? " (" + e.date + ")" : ""}`);
          if (e.description) lines.push(e.description);
        }
        break;
      case "languages":
        for (const e of c.entries || []) lines.push(`${e.language} (${e.proficiency})`);
        break;
      case "interests":
        lines.push((c.skills || []).join(", "));
        break;
      case "links":
        [c.linkedin, c.github, c.portfolio, c.website].filter(Boolean).forEach((l: string) => lines.push(l));
        break;
      default:
        lines.push(JSON.stringify(c));
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
