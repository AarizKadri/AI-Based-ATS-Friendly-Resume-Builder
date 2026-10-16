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

## What's genuinely finished vs. what's scaffolded

The source spec had 200+ line items across 21 sections. Building every one of
those to full production polish isn't realistic in one pass, and I'd rather
tell you clearly what you're getting than claim total coverage:

**Fully working:**
Auth, dashboard (search/rename/duplicate/delete), structured builder with all
19 section types + custom sections, add/reorder/toggle/delete sections,
autosave + manual save, 4 templates with live preview matching PDF/DOCX/HTML
export, resume import (PDF/DOCX → AI-mapped sections, editable before save),
AI summary/headline generation, AI rewrite (professional/concise/grammar/
action-bullets), ATS scoring, full resume analysis & scoring (persisted,
re-runnable), job-description matching with match score + keyword gaps +
recommendations, career & skill recommendations, cover letter generation
(tone/company/JD-aware, editable, persisted), resume-aware chat assistant,
version snapshots + restore, duplicate/tailor-for-a-job, public share links,
basic admin panel (stats, user roles, feedback triage).

**Scaffolded but intentionally minimal — the architecture supports these,
but the UI/logic is basic and worth extending before shipping:**
- **Templates are one layout with 4 skins**, not 4 structurally different
  designs (e.g. no true two-column "Modern" layout yet). Add a new component
  in `components/templates/` and register it in `lib/templates.ts`.
- **Admin template management** (add/edit/delete templates from the UI) —
  the `Template` table and API pattern exist; there's no admin CRUD screen
  for it yet.
- **Undo/redo** in the builder isn't implemented — sections are simple React
  state, so this is a `useState` history stack away.
- **Drag-and-drop reordering** uses up/down buttons instead of a DnD library
  — functionally equivalent, less slick.
- **ATS "problematic formatting" detection** is AI-judged from text content,
  not a rules-based parser checking for tables/images/columns in the actual
  file.

## A note on "make no mistakes"

I ran `tsc --noEmit` and a full `next build` against this codebase and fixed
every error that surfaced (type mismatches in the PDF/DOCX export routes,
implicit `any`s). The build compiles cleanly. I can't guarantee zero bugs in
code this size that's never been run against a real Postgres instance or a
live Anthropic key — treat this as a solid, working starting point to run
`npm run dev` against and iterate on, not a black box.
