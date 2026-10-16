import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI } from "@/lib/ai";
import { COVER_LETTER_SYSTEM } from "@/lib/prompts";

// POST { resumeText, jobDescriptionText?, company?, tone?, length?, existingLetter?, resumeId? }
// Powers: generate from resume, generate from JD, personalize for company,
// rewrite/improve existing, and change tone/length — all one endpoint since
// the shape of the task ("produce/adjust a cover letter given context") is
// the same; the prompt just changes based on what's provided.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    resumeText,
    jobDescriptionText,
    company,
    tone = "professional",
    length = "medium",
    existingLetter,
    resumeId,
    title,
  } = await req.json();

  if (!resumeText) {
    return NextResponse.json({ error: "resumeText is required." }, { status: 400 });
  }

  const lengthInstruction: Record<string, string> = {
    short: "Keep it to 2 short paragraphs.",
    medium: "Keep it to 3-4 paragraphs.",
    long: "Write 4-5 paragraphs with more detail.",
  };

  const prompt = [
    existingLetter
      ? `Existing cover letter to rewrite and improve:\n${existingLetter}`
      : "Write a new cover letter.",
    `Requested tone: ${tone}. ${lengthInstruction[length] || lengthInstruction.medium}`,
    company ? `Target company: ${company}` : "",
    jobDescriptionText ? `Job description:\n${jobDescriptionText}` : "",
    `Candidate resume:\n${resumeText}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const bodyMarkdown = await askAI({ system: COVER_LETTER_SYSTEM, prompt, maxTokens: 900 });

    const coverLetter = await prisma.coverLetter.create({
      data: {
        ownerId: session.user.id,
        resumeId: resumeId || null,
        title: title || `Cover Letter${company ? " — " + company : ""}`,
        company: company || null,
        tone,
        bodyMarkdown: bodyMarkdown.trim(),
      },
    });

    return NextResponse.json({ coverLetter });
  } catch (err) {
    console.error("Cover letter error:", err);
    return NextResponse.json({ error: "Cover letter generation failed. Try again." }, { status: 502 });
  }
}
