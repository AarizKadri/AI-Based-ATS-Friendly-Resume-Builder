import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAIForJson } from "@/lib/ai";
import { ATS_SCORE_SYSTEM } from "@/lib/prompts";

interface AtsResult {
  atsScore: number;
  issues: string[];
  recommendations: string[];
}

// POST { resumeText: string }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeText } = await req.json();
  if (!resumeText || typeof resumeText !== "string") {
    return NextResponse.json({ error: "resumeText is required." }, { status: 400 });
  }

  try {
    const result = await askAIForJson<AtsResult>({
      system: ATS_SCORE_SYSTEM,
      prompt: `Resume content:\n${resumeText}`,
      maxTokens: 800,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("ATS score error:", err);
    return NextResponse.json({ error: "ATS analysis failed. Try again." }, { status: 502 });
  }
}
