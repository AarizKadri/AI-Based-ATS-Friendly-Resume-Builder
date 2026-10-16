# AI Resume Builder

A full-stack resume builder: structured resume editor, multiple templates,
AI-assisted writing (summaries, bullet rewriting, job matching, ATS scoring,
career recommendations, cover letters, a resume-aware chat assistant),
PDF/DOCX/HTML export, versioning, sharing, and a basic admin panel.

## Stack

- **Next.js 14** (App Router) + TypeScript — one codebase, frontend + API routes
- **Prisma + SQLite** for local dev (swap to Postgres for production — one line in `schema.prisma`)
- **NextAuth** (credentials/email+password) for auth
- **Pluggable AI provider** — Google Gemini (free), Groq (free), or Anthropic Claude — one env var picks which. See `lib/ai.ts`.
- **Tailwind CSS** for styling
- **@react-pdf/renderer** for PDF export, **docx** for Word export

## Why this architecture

- **One JSON blob per resume, not one table per section.** `Resume.sectionsJson`
  holds an ordered array of typed sections (see `types/resume.ts`). This is what
  lets "custom sections," reordering, and toggling sections on/off work without
  ever touching the database schema. Structured entities that need their own
  history/relations (job descriptions, job matches, analyses, cover letters,
  versions) get real tables.
- **One AI gateway, three interchangeable providers.** Every AI feature calls
  through `lib/ai.ts` (`askAI` / `askAIForJson`), which routes to Gemini,
  Groq, or Anthropic based on the `AI_PROVIDER` env var. Model config,
  retries, and JSON parsing live in one place instead of being copy-pasted
  into ten API routes — and you're never locked into a paid key.
- **Prompts are centralized** in `lib/prompts.ts` so tone and output-format
  rules for each AI feature are easy to find and tune.
- **Template engine vs. template skin.** All four templates render through the
  same layout engine (`ClassicPreview` / `ClassicPdf`) with different accent
  color/font. This keeps one well-tested rendering path instead of four
  half-tested ones — see "What's genuinely finished" below for how to extend
  this into visually distinct multi-column layouts.

## Getting started

```bash
npm install
cp .env.example .env      # see "Choosing an AI provider" below, plus a NEXTAUTH_SECRET
npx prisma migrate dev --name init
npm run db:seed           # creates the 4 templates + a demo admin (admin@example.com / changeme123)
npm run dev
```

Open http://localhost:3000. Register an account, or log in as the seeded
admin at `/admin` (change that password immediately — it's a placeholder for
local dev only).

## Choosing an AI provider

Every AI feature routes through `lib/ai.ts`. Set `AI_PROVIDER` in `.env` to
one of:

- **`gemini`** (default) — **genuinely free, no credit card.** Get a key at
  https://aistudio.google.com/apikey, put it in `GEMINI_API_KEY`. Free-tier
  rate limits are modest (roughly 10-15 requests/minute on Flash models as of
  this writing) — fine for building/demoing, worth knowing if you hit 429s.
  Google's free-tier terms let them use your inputs/outputs to improve their
  models, worth knowing if you're testing with real resume data.
- **`groq`** — also free-tier, runs open models (Llama, etc.) very fast. Get
  a key at https://console.groq.com/keys, put it in `GROQ_API_KEY`.
- **`anthropic`** — Claude, if you have a paid Anthropic API key. Put it in
  `ANTHROPIC_API_KEY`.

Rate limits and free-tier terms change — check the provider's docs
(`https://ai.google.dev/gemini-api/docs` for Gemini, `https://console.groq.com/docs`
for Groq) if something that used to work starts 429ing.

Whichever provider you pick, every AI feature (summary generation, rewriting,
ATS scoring, job matching, career recs, cover letters, chat, resume import)
will fail with a clear error message until its API key is set — nothing
silently falls back to canned text.

## Project layout

```
app/
  (auth)/login, (auth)/register     — auth pages
  dashboard/                        — resume list, search, create/duplicate/delete
  builder/[id]/                     — the resume editor (this is the core UI)
  preview/[id]/                     — public read-only view for shared resumes
  admin/                            — usage stats, user management, reported issues
  api/
    auth/                           — NextAuth + registration
    resumes/                        — CRUD, duplicate, versions, share, export (pdf/docx/html)
    ai/                             — summary, rewrite, ats-score, resume-analysis,
                                       job-match, career-recommendations, cover-letter, chat
    import/resume                   — PDF/DOCX upload → AI-extracted sections
    admin/, feedback/               — admin + feedback endpoints
components/
  resume/    — SectionList (add/reorder/toggle/delete), SectionEditor (per-type forms)
  templates/ — ClassicPreview (screen), ClassicPdf (export)
  ai/        — AIPanel (job match / analysis / career / cover letter / chat tabs)
lib/         — prisma client, auth config, lib/ai.ts (Gemini/Groq/Anthropic gateway), prompts, templates registry
prisma/      — schema.prisma, seed.ts
types/       — resume.ts (section types), next-auth.d.ts
```


