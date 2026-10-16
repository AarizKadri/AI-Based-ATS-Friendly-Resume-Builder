import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAIForJson } from "@/lib/ai";
import { RESUME_ANALYSIS_SYSTEM } from "@/lib/prompts";

interface AnalysisResult {
  overallScore: number;
  sectionScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// POST { resumeId: string, resumeText: string }
// Powers "Resume Analysis & Scoring" — persists each run so the user can see
// score history and "re-analyze after changes".
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeId, resumeText } = await req.json();
  if (!resumeId || !resumeText) {
    return NextResponse.json({ error: "resumeId and resumeText are required." }, { status: 400 });
  }

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  try {
    const result = await askAIForJson<AnalysisResult>({
      system: RESUME_ANALYSIS_SYSTEM,
      prompt: `Resume content:\n${resumeText}`,
      maxTokens: 1200,
    });

    // Also get the ATS sub-score so the analysis card can show both side by side.
    const atsSystem = await import("@/lib/prompts").then((m) => m.ATS_SCORE_SYSTEM);
    const atsResult = await askAIForJson<{ atsScore: number }>({
      system: atsSystem,
      prompt: `Resume content:\n${resumeText}`,
      maxTokens: 500,
    });

    const analysis = await prisma.resumeAnalysis.create({
      data: {
        resumeId,
        overallScore: result.overallScore,
        atsScore: atsResult.atsScore,
        sectionScores: JSON.stringify(result.sectionScores),
        strengths: JSON.stringify(result.strengths),
        weaknesses: JSON.stringify(result.weaknesses),
        recommendations: JSON.stringify(result.recommendations),
      },
    });

    return NextResponse.json({
      analysis: {
        ...analysis,
        sectionScores: result.sectionScores,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendations: result.recommendations,
      },
    });
  } catch (err) {
    console.error("Resume analysis error:", err);
    return NextResponse.json({ error: "Analysis failed. Try again." }, { status: 502 });
  }
}
