"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";

interface ResumeSummary {
  id: string;
  title: string;
  templateId: string;
  isTailored: boolean;
  updatedAt: string;
  sectionCount: number;
}

export default function DashboardClient({
  userName,
  initialResumes,
}: {
  userName: string;
  initialResumes: ResumeSummary[];
}) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () => resumes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase())),
    [resumes, query]
  );

  async function createResume() {
    setCreating(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Resume" }),
    });
    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      toast.error(data.error || "Could not create resume.");
      return;
    }
    router.push(`/builder/${data.resume.id}`);
  }

  async function duplicateResume(id: string) {
    const res = await fetch(`/api/resumes/${id}/duplicate`, { method: "POST", body: JSON.stringify({}) });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Could not duplicate.");
    toast.success("Duplicated.");
    router.refresh();
    setResumes((prev) => [
      { id: data.resume.id, title: data.resume.title, templateId: data.resume.templateId, isTailored: false, updatedAt: data.resume.updatedAt, sectionCount: 0 },
      ...prev,
    ]);
  }

  async function renameResume(id: string, currentTitle: string) {
    const title = window.prompt("Rename resume", currentTitle);
    if (!title || title === currentTitle) return;
    const res = await fetch(`/api/resumes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return toast.error("Rename failed.");
    setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, title } : r)));
  }

  async function deleteResume(id: string) {
    if (!window.confirm("Delete this resume? This cannot be undone.")) return;
    const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Delete failed.");
    setResumes((prev) => prev.filter((r) => r.id !== id));
    toast.success("Deleted.");
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-ink-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-lg font-semibold">Resume Builder</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-500">Hi, {userName}</span>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-ink-500 hover:text-ink-900">
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold">Your resumes</h1>
            <p className="text-sm text-ink-500 mt-1">{resumes.length} saved</p>
          </div>
          <div className="flex gap-3">
            <input
              placeholder="Search resumes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border border-ink-100 rounded px-3 py-2 text-sm w-56 bg-white"
            />
            <button
              onClick={createResume}
              disabled={creating}
              className="bg-signal text-white px-4 py-2 rounded text-sm font-medium hover:bg-signal-700 disabled:opacity-60"
            >
              {creating ? "Creating…" : "+ New resume"}
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-ink-500">
            <p>No resumes yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white border border-ink-100 rounded-lg p-4 flex flex-col">
                <button
                  onClick={() => router.push(`/builder/${r.id}`)}
                  className="text-left flex-1"
                >
                  <div className="h-32 bg-paper border border-ink-50 rounded mb-3 flex items-center justify-center text-ink-300 text-xs">
                    {r.templateId} template
                  </div>
                  <h3 className="font-medium truncate">{r.title}</h3>
                  {r.isTailored && (
                    <span className="inline-block mt-1 text-xs bg-signal-50 text-signal-700 px-2 py-0.5 rounded">
                      Tailored
                    </span>
                  )}
                  <p className="text-xs text-ink-500 mt-1">
                    Updated {new Date(r.updatedAt).toLocaleDateString()}
                  </p>
                </button>
                <div className="flex gap-2 mt-3 text-xs">
                  <button onClick={() => renameResume(r.id, r.title)} className="text-ink-500 hover:text-ink-900">Rename</button>
                  <button onClick={() => duplicateResume(r.id)} className="text-ink-500 hover:text-ink-900">Duplicate</button>
                  <button onClick={() => deleteResume(r.id)} className="text-danger hover:opacity-80 ml-auto">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
