import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAIForJson } from "@/lib/ai";
import { JOB_MATCH_SYSTEM } from "@/lib/prompts";

interface MatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  recommendations: string[];
  emphasize: string[];
}

// POST { resumeId, resumeText, jobTitle?, company?, jobDescriptionText }
// Powers the whole "AI Job Description Matching" feature set: extracting
// requirements, scoring the match, and surfacing matched/missing keywords.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeId, resumeText, jobTitle, company, jobDescriptionText } = await req.json();

  if (!resumeId || !resumeText || !jobDescriptionText) {
    return NextResponse.json(
      { error: "resumeId, resumeText, and jobDescriptionText are required." },
      { status: 400 }
    );
  }

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  try {
    const result = await askAIForJson<MatchResult>({
      system: JOB_MATCH_SYSTEM,
      prompt: [
        `Job title: ${jobTitle || "Not specified"}`,
        `Company: ${company || "Not specified"}`,
        `Job description:\n${jobDescriptionText}`,
        `\nCandidate resume:\n${resumeText}`,
      ].join("\n"),
      maxTokens: 1200,
    });

    const jobDescription = await prisma.jobDescription.create({
      data: {
        ownerId: session.user.id,
        title: jobTitle || "Untitled Role",
        company: company || null,
        rawText: jobDescriptionText,
        extractedJson: JSON.stringify({
          requiredSkills: result.requiredSkills,
          preferredSkills: result.preferredSkills,
          keywords: [...result.matchedKeywords, ...result.missingKeywords],
        }),
      },
    });

    const match = await prisma.jobMatch.create({
      data: {
        resumeId,
        jobDescriptionId: jobDescription.id,
        matchScore: result.matchScore,
        matchedKeywords: JSON.stringify(result.matchedKeywords),
        missingKeywords: JSON.stringify(result.missingKeywords),
        recommendations: JSON.stringify([...result.recommendations, ...result.emphasize]),
      },
    });

    return NextResponse.json({ match, jobDescription, details: result });
  } catch (err) {
    console.error("Job match error:", err);
    return NextResponse.json({ error: "Job match analysis failed. Try again." }, { status: 502 });
  }
}
