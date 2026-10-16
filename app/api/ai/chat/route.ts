import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAI } from "@/lib/ai";
import { CHAT_ASSISTANT_SYSTEM } from "@/lib/prompts";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// POST { messages: ChatMessage[], resumeText?: string, selectedSectionText?: string }
// Powers "AI Chat Assistant" — conversational, context-aware on the resume
// currently open in the builder and (optionally) the section the user has
// selected, so answers can be "directly applicable to the selected section".
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, resumeText, selectedSectionText } = (await req.json()) as {
    messages: ChatMessage[];
    resumeText?: string;
    selectedSectionText?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array is required." }, { status: 400 });
  }

  const contextBlock = [
    resumeText ? `Current resume content:\n${resumeText}` : "",
    selectedSectionText ? `\nUser currently has this section selected:\n${selectedSectionText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Fold prior turns + context into one prompt (askAI is single-turn);
  // for a longer chat history you'd pass `messages` straight through to the
  // Anthropic SDK's multi-turn `messages` array instead.
  const conversation = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const prompt = [contextBlock, "\nConversation so far:", conversation].filter(Boolean).join("\n");

  try {
    const reply = await askAI({ system: CHAT_ASSISTANT_SYSTEM, prompt, maxTokens: 700 });
    return NextResponse.json({ reply: reply.trim() });
  } catch (err) {
    console.error("Chat assistant error:", err);
    return NextResponse.json({ error: "The assistant is unavailable right now. Try again." }, { status: 502 });
  }
}
