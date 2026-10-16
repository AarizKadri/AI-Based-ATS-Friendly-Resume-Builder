import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { ResumeSection } from "@/types/resume";

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

  const children: Paragraph[] = [
    new Paragraph({ text: contact?.fullName || "Your Name", heading: HeadingLevel.TITLE }),
  ];

  if (headline?.text) {
    children.push(new Paragraph({ children: [new TextRun({ text: headline.text, italics: true })] }));
  }

  children.push(
    new Paragraph({
      text: [contact?.email, contact?.phone, contact?.location].filter(Boolean).join("  |  "),
    }),
    new Paragraph({ text: "" })
  );

  for (const section of rest) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }));
    children.push(...sectionToParagraphs(section));
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${resume.title.replace(/[^a-z0-9]+/gi, "_")}.docx"`,
    },
  });
}

function sectionToParagraphs(section: ResumeSection): Paragraph[] {
  const c: any = section.content;
  const out: Paragraph[] = [];

  switch (section.type) {
    case "summary":
      out.push(new Paragraph({ text: c.text || "" }));
      break;
    case "experience":
    case "internships":
      for (const e of c.entries || []) {
        out.push(
          new Paragraph({
            children: [new TextRun({ text: `${e.role} — ${e.company} (${e.startDate} – ${e.endDate})`, bold: true })],
          })
        );
        for (const b of e.bullets || []) out.push(new Paragraph({ text: b, bullet: { level: 0 } }));
      }
      break;
    case "education":
      for (const e of c.entries || []) {
        out.push(new Paragraph({ text: `${e.degree} in ${e.fieldOfStudy} — ${e.institution} (${e.startDate} – ${e.endDate})` }));
      }
      break;
    case "projects":
      for (const e of c.entries || []) {
        out.push(new Paragraph({ text: `${e.name}${e.techStack?.length ? " — " + e.techStack.join(", ") : ""}` }));
        for (const b of e.bullets || []) out.push(new Paragraph({ text: b, bullet: { level: 0 } }));
      }
      break;
    case "technicalSkills":
    case "softSkills":
    case "interests":
      out.push(new Paragraph({ text: (c.skills || []).join(", ") }));
      break;
    case "certifications":
      for (const e of c.entries || []) out.push(new Paragraph({ text: `${e.name} — ${e.issuer} (${e.date})` }));
      break;
    case "achievements":
    case "awards":
    case "publications":
    case "research":
    case "volunteer":
    case "custom":
      for (const e of c.entries || []) {
        out.push(new Paragraph({ text: `${e.title}${e.subtitle ? " — " + e.subtitle : ""} ${e.date ? "(" + e.date + ")" : ""}` }));
        if (e.description) out.push(new Paragraph({ text: e.description }));
      }
      break;
    case "languages":
      out.push(new Paragraph({ text: (c.entries || []).map((e: any) => `${e.language} (${e.proficiency})`).join(", ") }));
      break;
    case "links":
      out.push(new Paragraph({ text: [c.linkedin, c.github, c.portfolio, c.website].filter(Boolean).join("   ") }));
      break;
  }

  return out;
}
