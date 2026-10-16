"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Tab = "match" | "analysis" | "career" | "cover" | "chat";

export default function AIPanel({ resumeId, resumeText }: { resumeId: string; resumeText: string }) {
  const [tab, setTab] = useState<Tab>("match");

  return (
    <div className="bg-white border border-ink-100 rounded-lg flex flex-col h-full">
      <div className="flex border-b border-ink-100 text-xs">
        {(
          [
            ["match", "Job Match"],
            ["analysis", "Analysis"],
            ["career", "Career"],
            ["cover", "Cover Letter"],
            ["chat", "Ask AI"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 font-medium ${tab === key ? "text-signal border-b-2 border-signal" : "text-ink-500"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-3 overflow-y-auto flex-1">
        {tab === "match" && <JobMatchTab resumeId={resumeId} resumeText={resumeText} />}
        {tab === "analysis" && <AnalysisTab resumeId={resumeId} resumeText={resumeText} />}
        {tab === "career" && <CareerTab resumeText={resumeText} />}
        {tab === "cover" && <CoverLetterTab resumeId={resumeId} resumeText={resumeText} />}
        {tab === "chat" && <ChatTab resumeText={resumeText} />}
      </div>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 75 ? "bg-signal-50 text-signal-700" : score >= 50 ? "bg-gold/10 text-gold" : "bg-danger/10 text-danger";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{score}/100</span>;
}

function JobMatchTab({ resumeId, resumeText }: { resumeId: string; resumeText: string }) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobText, setJobText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!jobText.trim()) return toast.error("Paste a job description first.");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, resumeText, jobTitle, company, jobDescriptionText: jobText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.details);
    } catch (err: any) {
      toast.error(err.message || "Job match failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <input placeholder="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full border border-ink-100 rounded px-2 py-1.5 text-sm" />
      <input placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full border border-ink-100 rounded px-2 py-1.5 text-sm" />
      <textarea
        placeholder="Paste the job description here"
        rows={5}
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        className="w-full border border-ink-100 rounded px-2 py-1.5 text-sm"
      />
      <button onClick={run} disabled={loading} className="w-full bg-signal text-white rounded py-1.5 text-sm disabled:opacity-60">
        {loading ? "Analyzing…" : "Run job match"}
      </button>

      {result && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">Match score</span>
            <ScorePill score={result.matchScore} />
          </div>
          <KeywordList label="Matched keywords" items={result.matchedKeywords} tone="good" />
          <KeywordList label="Missing keywords" items={result.missingKeywords} tone="bad" />
          <RecList label="Recommendations" items={result.recommendations} />
          {result.emphasize?.length > 0 && <RecList label="Emphasize these" items={result.emphasize} />}
        </div>
      )}
    </div>
  );
}

function AnalysisTab({ resumeId, resumeText }: { resumeId: string; resumeText: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/resume-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.analysis);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <button onClick={run} disabled={loading} className="w-full bg-signal text-white rounded py-1.5 text-sm disabled:opacity-60">
        {loading ? "Analyzing…" : "Analyze & score resume"}
      </button>

      {result && (
        <div className="space-y-3">
          <div className="flex gap-4">
            <div>
              <div className="text-xs text-ink-500">Overall</div>
              <ScorePill score={result.overallScore} />
            </div>
            <div>
              <div className="text-xs text-ink-500">ATS</div>
              <ScorePill score={result.atsScore} />
            </div>
          </div>
          <RecList label="Strengths" items={result.strengths} />
          <RecList label="Weaknesses" items={result.weaknesses} />
          <RecList label="Prioritized recommendations" items={result.recommendations} />
        </div>
      )}
    </div>
  );
}

function CareerTab({ resumeText }: { resumeText: string }) {
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/career-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || "Recommendation generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <input
        placeholder="Target role (optional)"
        value={targetRole}
        onChange={(e) => setTargetRole(e.target.value)}
        className="w-full border border-ink-100 rounded px-2 py-1.5 text-sm"
      />
      <button onClick={run} disabled={loading} className="w-full bg-signal text-white rounded py-1.5 text-sm disabled:opacity-60">
        {loading ? "Thinking…" : "Get recommendations"}
      </button>
      {result && (
        <div className="space-y-3">
          <RecList label="Skill gaps" items={result.skillGaps} />
          <RecList label="Skills to learn" items={result.skillsToLearn} />
          <RecList label="Certifications to consider" items={result.certificationsToConsider} />
          <RecList label="Project ideas" items={result.projectIdeas} />
          <RecList label="Suggested roles" items={result.suggestedRoles} />
          <RecList label="Keywords for target role" items={result.keywordsForTargetRole} />
        </div>
      )}
    </div>
  );
}

function CoverLetterTab({ resumeId, resumeText }: { resumeId: string; resumeText: string }) {
  const [company, setCompany] = useState("");
  const [jobText, setJobText] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, resumeText, jobDescriptionText: jobText, company, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLetter(data.coverLetter.bodyMarkdown);
    } catch (err: any) {
      toast.error(err.message || "Cover letter generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <input placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full border border-ink-100 rounded px-2 py-1.5 text-sm" />
      <textarea placeholder="Job description (optional)" rows={3} value={jobText} onChange={(e) => setJobText(e.target.value)} className="w-full border border-ink-100 rounded px-2 py-1.5 text-sm" />
      <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full border border-ink-100 rounded px-2 py-1.5 text-sm">
        {["professional", "enthusiastic", "confident", "friendly"].map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <button onClick={run} disabled={loading} className="w-full bg-signal text-white rounded py-1.5 text-sm disabled:opacity-60">
        {loading ? "Writing…" : "Generate cover letter"}
      </button>
      {letter && (
        <textarea
          rows={12}
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          className="w-full border border-ink-100 rounded px-2 py-2 text-sm mt-2"
        />
      )}
    </div>
  );
}

function ChatTab({ resumeText }: { resumeText: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const next = [...messages, { role: "user" as const, content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      toast.error(err.message || "Assistant unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="flex-1 space-y-2 mb-2 min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-ink-500 text-xs">
            Ask anything about this resume — &ldquo;improve my summary&rdquo;, &ldquo;how&apos;s my ATS compatibility&rdquo;, &ldquo;what skills should I add for a PM role&rdquo;…
          </p>
        )}
        {messages.map((m, i) => (
  <div
    key={i}
    className={`p-2 rounded ${
      m.role === "user"
        ? "bg-ink-50 ml-6"
        : "bg-signal-50 mr-6"
    }`}
  >
    {m.role === "assistant" ? (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc ml-5 mb-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-5 mb-2">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
        }}
      >
        {m.content}
      </ReactMarkdown>
    ) : (
      m.content
    )}
  </div>
))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the assistant…"
          className="flex-1 border border-ink-100 rounded px-2 py-1.5 text-sm"
        />
        <button onClick={send} disabled={loading} className="bg-signal text-white rounded px-3 text-sm disabled:opacity-60">
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

function KeywordList({ label, items, tone }: { label: string; items: string[]; tone: "good" | "bad" }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-xs font-medium text-ink-500 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((k, i) => (
          <span
            key={i}
            className={`text-xs px-2 py-0.5 rounded ${tone === "good" ? "bg-signal-50 text-signal-700" : "bg-danger/10 text-danger"}`}
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

function RecList({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-xs font-medium text-ink-500 mb-1">{label}</div>
      <ul className="list-disc ml-4 text-sm space-y-0.5">
        {items.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
