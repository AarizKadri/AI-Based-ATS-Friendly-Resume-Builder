import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAI } from "@/lib/ai";
import { REWRITE_SYSTEM } from "@/lib/prompts";

// POST { text: string, style?: "concise" | "professional" | "grammar" }
// Powers: rewrite weak content, more professional, more concise, grammar
// fix, and "convert to action-oriented bullets" — all share one endpoint
// since they're all "rewrite given X constraint" tasks.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, style, extraContext } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required." }, { status: 400 });
  }

  const styleInstruction: Record<string, string> = {
    concise: "Focus especially on cutting words — make it as short as possible without losing meaning.",
    professional: "Focus especially on tone — make it sound more polished and professional.",
    grammar: "Focus especially on fixing grammar and spelling; keep the original structure otherwise.",
    action: "Focus especially on turning each line into a strong action-oriented bullet with a metric.",
  };

  const prompt = [
    "Original content:",
    text,
    style && styleInstruction[style] ? `\nStyle focus: ${styleInstruction[style]}` : "",
    extraContext ? `\nAdditional context from the candidate: ${extraContext}` : "",
  ].join("\n");

  try {
    const result = await askAI({ system: REWRITE_SYSTEM, prompt, maxTokens: 600 });
    return NextResponse.json({ result: result.trim() });
  } catch (err) {
    console.error("AI rewrite error:", err);
    return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 502 });
  }
}
