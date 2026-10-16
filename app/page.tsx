import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

const FEATURES: { title: string; description: string }[] = [
  {
    title: "AI-written bullets & summaries",
    description:
      "Turn a rough sentence into an action-oriented, metric-driven bullet. Generate a professional summary or headline from the rest of your resume in one click.",
  },
  {
    title: "ATS compatibility score",
    description:
      "See exactly how applicant-tracking systems will read your resume, with specific issues and ranked fixes — before a recruiter ever opens it.",
  },
  {
    title: "Job-description matching",
    description:
      "Paste a job posting and get a match score, the keywords you're missing, and which of your existing bullets to foreground for that role.",
  },
  {
    title: "Cover letters, tailored",
    description:
      "Generate a cover letter from your resume and the job description, in the tone and length you choose, and refine it right alongside your resume.",
  },
  {
    title: "Import an existing resume",
    description:
      "Upload a PDF or Word doc and we'll extract your experience, education, and skills into editable sections — review and correct before saving.",
  },
  {
    title: "Versions & one-click tailoring",
    description:
      "Snapshot a version before a big edit and restore it anytime. Duplicate any resume as a tailored copy for a specific job without touching the original.",
  },
];

const STEPS: { step: string; title: string; description: string }[] = [
  {
    step: "01",
    title: "Build or import",
    description:
      "Start from a blank structured builder, or upload an existing resume and let AI map it into sections for you to review.",
  },
  {
    step: "02",
    title: "Refine with AI",
    description:
      "Rewrite weak bullets, generate a summary, check your ATS score, and match against a real job description — all from the same editor.",
  },
  {
    step: "03",
    title: "Export & share",
    description:
      "Download as PDF, Word, or a print-ready HTML file, or share a public read-only link — your formatting stays identical everywhere.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <span className="font-display text-xl font-semibold text-ink-900">Resume Builder</span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-ink-700 hover:text-ink-900">
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm bg-ink-900 text-paper rounded hover:bg-ink-700 transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-8">
        <div className="max-w-3xl mx-auto py-16 sm:py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl leading-tight font-semibold text-ink-900">
            Write a resume that gets read — not filtered out.
          </h1>
          <p className="mt-5 text-lg text-ink-500 max-w-xl mx-auto">
            Structured resume building, AI-written bullets, and a job-match score that
            tells you exactly what to fix before you hit send.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 bg-signal text-white rounded font-medium hover:bg-signal-700 transition-colors"
            >
              Build my resume
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-ink-300 rounded font-medium hover:bg-ink-50 transition-colors"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-300">Free to start. No credit card required.</p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-8 py-16 bg-white/60 border-y border-ink-100">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-12">
            <h2 className="font-display text-3xl font-semibold text-ink-900">
              Everything you need, in one editor.
            </h2>
            <p className="mt-3 text-ink-500">
              No more juggling a Word doc, a separate ATS checker, and a blank cover-letter
              template. It's all in the builder.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-lg border border-ink-100 bg-paper">
                <h3 className="font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-ink-900 text-center">
            How it works
          </h2>

          <div className="mt-12 grid sm:grid-cols-3 gap-10">
            {STEPS.map((s) => (
              <div key={s.step}>
                <span className="font-display text-3xl text-signal">{s.step}</span>
                <h3 className="mt-3 font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-500 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Export formats strip */}
      <section className="px-8 py-14 bg-ink-900 text-paper">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-semibold">Export however you need it.</h2>
            <p className="mt-2 text-ink-100 text-sm max-w-md">
              PDF for applications, Word for recruiters who want to edit, or a self-contained
              HTML file you can host or print yourself.
            </p>
          </div>
          <div className="flex gap-3 text-sm font-medium">
            <span className="px-4 py-2 rounded border border-ink-500 bg-ink-700">PDF</span>
            <span className="px-4 py-2 rounded border border-ink-500 bg-ink-700">DOCX</span>
            <span className="px-4 py-2 rounded border border-ink-500 bg-ink-700">HTML</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-8 py-20 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink-900">
          Your next role starts with a better resume.
        </h2>
        <div className="mt-8">
          <Link
            href="/register"
            className="px-6 py-3 bg-signal text-white rounded font-medium hover:bg-signal-700 transition-colors"
          >
            Build my resume — it's free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-ink-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-300">
          <span>© {new Date().getFullYear()} Resume Builder.</span>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-ink-700">Log in</Link>
            <Link href="/register" className="hover:text-ink-700">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
