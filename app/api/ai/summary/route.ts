import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAI } from "@/lib/ai";
import { SUMMARY_SYSTEM, HEADLINE_SYSTEM } from "@/lib/prompts";

// POST { mode: "summary" | "headline", resumeText: string, extraContext?: string }
// Powers "AI-generated professional summary" and "AI-generated resume headlines".
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mode, resumeText, extraContext } = await req.json();

  if (!resumeText || typeof resumeText !== "string") {
    return NextResponse.json({ error: "resumeText is required." }, { status: 400 });
  }

  const system = mode === "headline" ? HEADLINE_SYSTEM : SUMMARY_SYSTEM;
  const prompt = [
    "Candidate resume content:",
    resumeText,
    extraContext ? `\nAdditional context from the candidate: ${extraContext}` : "",
  ].join("\n");

  try {
    const text = await askAI({ system, prompt, maxTokens: 300 });
    return NextResponse.json({ result: text.trim() });
  } catch (err) {
    console.error("AI summary error:", err);
    return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 502 });
  }
}
