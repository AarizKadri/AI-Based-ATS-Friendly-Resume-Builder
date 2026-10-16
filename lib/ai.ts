// Every AI feature in the app calls through askAI / askAIForJson, so the
// actual model provider is a one-env-var decision (AI_PROVIDER) rather than
// something baked into every route. Supported out of the box:
//
//   - "gemini"    (default) — Google Gemini via Google AI Studio.
//                  Genuinely free, no credit card: https://aistudio.google.com/apikey
//   - "groq"      — Groq's OpenAI-compatible API running open models
//                  (Llama, etc). Also has a free tier: https://console.groq.com/keys
//   - "anthropic" — Claude, if you have a paid Anthropic API key.
//
// Groq/OpenAI-compatible and Anthropic both speak fairly standard chat APIs;
// Gemini's request/response shape is different, which is why it gets its own
// branch below.

type Provider = "gemini" | "anthropic" | "groq";

function getProvider(): Provider {
  const p = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (p === "anthropic" || p === "groq" || p === "gemini") return p;
  return "gemini";
}

interface AskParams {
  system: string;
  prompt: string;
  maxTokens?: number;
}

async function askGemini({ system, prompt, maxTokens = 1500 }: AskParams): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey");

  const ai = new GoogleGenAI({ apiKey });
  // gemini-2.5-flash is on Google AI Studio's free tier as of writing.
  // Check https://ai.google.dev/gemini-api/docs/models for the current
  // free-tier lineup if this ever needs bumping.
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: system,
      maxOutputTokens: maxTokens,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned no text content.");
  return text;
}

async function askGroq({ system, prompt, maxTokens = 1500 }: AskParams): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys");

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned no text content.");
  return text;
}

async function askAnthropic({ system, prompt, maxTokens = 1500 }: AskParams): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude returned no text content.");
  return textBlock.text;
}

/**
 * Sends a prompt to whichever provider AI_PROVIDER selects, and returns raw
 * text. Every AI feature in the app (summary generation, rewriting, ATS
 * scoring, job matching, cover letters, career recs, chat) goes through this
 * one function so retry/error handling and provider choice live in a single
 * place.
 */
export async function askAI(params: AskParams): Promise<string> {
  const provider = getProvider();
  if (provider === "gemini") return askGemini(params);
  if (provider === "groq") return askGroq(params);
  return askAnthropic(params);
}

/**
 * Same as askAI but expects (and parses) a strict JSON response. Strips
 * markdown code fences defensively in case the model adds them despite
 * instructions — Gemini and Llama models do this more often than Claude.
 */
export async function askAIForJson<T = unknown>(params: AskParams): Promise<T> {
  const raw = await askAI(params);
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(`AI response was not valid JSON. Raw output: ${cleaned.slice(0, 300)}`);
  }
}

// Backwards-compatible aliases (older code in this project imported these
// names when the app only supported Claude).
export const askClaude = askAI;
export const askClaudeForJson = askAIForJson;
