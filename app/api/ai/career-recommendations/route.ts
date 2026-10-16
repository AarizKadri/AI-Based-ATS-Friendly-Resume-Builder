import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAIForJson } from "@/lib/ai";
import { CAREER_RECOMMENDATIONS_SYSTEM } from "@/lib/prompts";

interface CareerResult {
  skillGaps: string[];
  skillsToLearn: string[];
  certificationsToConsider: string[];
  projectIdeas: string[];
  suggestedRoles: string[];
  keywordsForTargetRole: string[];
}

// POST { resumeText: string, targetRole?: string }
// Powers "AI Career & Skill Recommendations".
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeText, targetRole } = await req.json();
  if (!resumeText) {
    return NextResponse.json({ error: "resumeText is required." }, { status: 400 });
  }

  try {
    const result = await askAIForJson<CareerResult>({
      system: CAREER_RECOMMENDATIONS_SYSTEM,
      prompt: [
        `Target role: ${targetRole || "Not specified — infer from resume"}`,
        `Resume content:\n${resumeText}`,
      ].join("\n"),
      maxTokens: 900,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Career recommendations error:", err);
    return NextResponse.json({ error: "Recommendation generation failed. Try again." }, { status: 502 });
  }
}
