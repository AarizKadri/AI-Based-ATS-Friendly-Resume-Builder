import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAIForJson } from "@/lib/ai";
import { RESUME_IMPORT_SYSTEM } from "@/lib/prompts";
import { emptyId, ResumeSection } from "@/types/resume";

interface ExtractedResume {
  contact: { fullName: string; email: string; phone: string; location: string };
  headline: string;
  summary: string;
  experience: { company: string; role: string; startDate: string; endDate: string; bullets: string[] }[];
  education: { institution: string; degree: string; fieldOfStudy: string; startDate: string; endDate: string }[];
  projects: { name: string; techStack: string[]; bullets: string[] }[];
  technicalSkills: string[];
  certifications: { name: string; issuer: string; date: string }[];
  languages: { language: string; proficiency: string }[];
  links: { linkedin: string; github: string; portfolio: string; website: string };
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Fall back to treating it as plain text.
  return buffer.toString("utf-8");
}

function mapToSections(x: ExtractedResume): ResumeSection[] {
  let order = 0;
  const sections: ResumeSection[] = [
    { id: emptyId(), type: "contact", title: "Contact", enabled: true, order: order++, content: x.contact },
    { id: emptyId(), type: "headline", title: "Professional Headline", enabled: !!x.headline, order: order++, content: { text: x.headline } },
    { id: emptyId(), type: "summary", title: "Professional Summary", enabled: !!x.summary, order: order++, content: { text: x.summary } },
    {
      id: emptyId(),
      type: "experience",
      title: "Work Experience",
      enabled: x.experience?.length > 0,
      order: order++,
      content: { entries: (x.experience || []).map((e) => ({ id: emptyId(), ...e })) },
    },
    {
      id: emptyId(),
      type: "education",
      title: "Education",
      enabled: x.education?.length > 0,
      order: order++,
      content: { entries: (x.education || []).map((e) => ({ id: emptyId(), ...e, highlights: [] })) },
    },
    {
      id: emptyId(),
      type: "projects",
      title: "Projects",
      enabled: x.projects?.length > 0,
      order: order++,
      content: { entries: (x.projects || []).map((e) => ({ id: emptyId(), ...e })) },
    },
    {
      id: emptyId(),
      type: "technicalSkills",
      title: "Technical Skills",
      enabled: (x.technicalSkills || []).length > 0,
      order: order++,
      content: { skills: x.technicalSkills || [] },
    },
    {
      id: emptyId(),
      type: "certifications",
      title: "Certifications",
      enabled: (x.certifications || []).length > 0,
      order: order++,
      content: { entries: (x.certifications || []).map((e) => ({ id: emptyId(), ...e })) },
    },
    {
      id: emptyId(),
      type: "languages",
      title: "Languages",
      enabled: (x.languages || []).length > 0,
      order: order++,
      content: { entries: (x.languages || []).map((e: any) => ({ id: emptyId(), ...e })) },
    },
    { id: emptyId(), type: "links", title: "Links", enabled: true, order: order++, content: x.links || {} },
  ];
  return sections;
}

// POST multipart/form-data { file }
// Returns proposed ResumeSection[] for the user to review/correct BEFORE
// anything is saved — the client shows these pre-filled in the builder and
// the user hits "Save" to persist, matching "review extracted info" and
// "correct extraction errors before saving" from the spec.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

  try {
    const rawText = await extractText(file);
    if (!rawText.trim()) {
      return NextResponse.json({ error: "Could not read any text from that file." }, { status: 422 });
    }

    const extracted = await askAIForJson<ExtractedResume>({
      system: RESUME_IMPORT_SYSTEM,
      prompt: `Raw resume text:\n${rawText.slice(0, 12000)}`,
      maxTokens: 2000,
    });

    const sections = mapToSections(extracted);
    return NextResponse.json({ sections, rawTextPreview: rawText.slice(0, 500) });
  } catch (err) {
    console.error("Resume import error:", err);
    return NextResponse.json({ error: "Could not process that file. Try a different PDF/DOCX." }, { status: 500 });
  }
}
