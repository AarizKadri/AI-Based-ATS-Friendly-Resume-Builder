import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResumeSection } from "@/types/resume";

function esc(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSection(section: ResumeSection): string {
  const c: any = section.content;
  const parts: string[] = [];

  switch (section.type) {
    case "summary":
      parts.push(`<p>${esc(c.text || "")}</p>`);
      break;
    case "experience":
    case "internships":
      for (const e of c.entries || []) {
        parts.push(
          `<div class="entry"><div class="row"><span class="bold">${esc(e.role)} — ${esc(e.company)}</span><span class="muted">${esc(e.startDate)} – ${esc(e.endDate)}</span></div>
          <ul>${(e.bullets || []).map((b: string) => `<li>${esc(b)}</li>`).join("")}</ul></div>`
        );
      }
      break;
    case "education":
      for (const e of c.entries || []) {
        parts.push(
          `<div class="row"><span>${esc(e.degree)} in ${esc(e.fieldOfStudy)} — ${esc(e.institution)}</span><span class="muted">${esc(e.startDate)} – ${esc(e.endDate)}</span></div>`
        );
      }
      break;
    case "projects":
      for (const e of c.entries || []) {
        parts.push(
          `<div class="entry"><div class="bold">${esc(e.name)}${e.techStack?.length ? " — " + esc(e.techStack.join(", ")) : ""}</div>
          <ul>${(e.bullets || []).map((b: string) => `<li>${esc(b)}</li>`).join("")}</ul></div>`
        );
      }
      break;
    case "technicalSkills":
    case "softSkills":
    case "interests":
      parts.push(`<p>${esc((c.skills || []).join("   •   "))}</p>`);
      break;
    case "certifications":
      for (const e of c.entries || []) parts.push(`<p>${esc(e.name)} — ${esc(e.issuer)} (${esc(e.date)})</p>`);
      break;
    case "achievements":
    case "awards":
    case "publications":
    case "research":
    case "volunteer":
    case "custom":
      for (const e of c.entries || []) {
        parts.push(
          `<p><span class="bold">${esc(e.title)}</span>${e.subtitle ? " — " + esc(e.subtitle) : ""} ${e.date ? "(" + esc(e.date) + ")" : ""}${e.description ? `<br/><span class="muted">${esc(e.description)}</span>` : ""}</p>`
        );
      }
      break;
    case "languages":
      parts.push(`<p>${esc((c.entries || []).map((e: any) => `${e.language} (${e.proficiency})`).join("   •   "))}</p>`);
      break;
    case "links":
      parts.push(`<p class="links">${[c.linkedin, c.github, c.portfolio, c.website].filter(Boolean).map(esc).join("   ")}</p>`);
      break;
  }

  return parts.join("\n");
}

// GET /api/resumes/:id/export/html
// Produces a single self-contained, printable HTML file — useful for
// emailing, hosting on a personal site, or "Print to PDF" from a browser
// when a user wants full control over print layout.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await prisma.resume.findUnique({ where: { id: params.id } });
  if (!resume || resume.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const sections: ResumeSection[] = JSON.parse(resume.sectionsJson);
  const visible = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const contact = visible.find((s) => s.type === "contact")?.content as any;
  const headline = visible.find((s) => s.type === "headline")?.content as any;
  const rest = visible.filter((s) => s.type !== "contact" && s.type !== "headline");
  const accent = resume.accentColor || "#0E7C7B";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${esc(resume.title)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: ${resume.fontFamily || "Inter"}, Arial, sans-serif; color: #16213E; font-size: ${resume.fontSizePt || 11}pt; max-width: 8.5in; margin: 0 auto; padding: 40px; }
  h1 { font-size: 24pt; margin: 0; }
  .headline { color: ${accent}; margin: 4px 0 0; }
  .contact { color: #3F4E63; font-size: 9.5pt; margin: 8px 0 16px; }
  header { border-bottom: 2px solid ${accent}; padding-bottom: 14px; margin-bottom: 20px; }
  h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 1px; color: ${accent}; border-bottom: 1px solid #E5E2DA; padding-bottom: 4px; }
  section { margin-bottom: 18px; }
  .row { display: flex; justify-content: space-between; font-weight: 500; }
  .bold { font-weight: 600; }
  .muted { color: #3F4E63; font-weight: 400; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  li { margin-bottom: 2px; }
  .links { color: ${accent}; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <header>
    <h1>${esc(contact?.fullName || "Your Name")}</h1>
    ${headline?.text ? `<p class="headline">${esc(headline.text)}</p>` : ""}
    <p class="contact">${[contact?.email, contact?.phone, contact?.location].filter(Boolean).map(esc).join("  •  ")}</p>
  </header>
  ${rest.map((s) => `<section><h2>${esc(s.title)}</h2>${renderSection(s)}</section>`).join("\n")}
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resume.title.replace(/[^a-z0-9]+/gi, "_")}.html"`,
    },
  });
}
