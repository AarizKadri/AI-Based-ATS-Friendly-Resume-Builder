"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Stats {
  userCount: number;
  resumeCount: number;
  coverLetterCount: number;
  jobMatchCount: number;
  openFeedback: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { resumes: number };
}

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string } | null;
}

export default function AdminClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users || []));
    fetch("/api/feedback").then((r) => r.json()).then((d) => setFeedback(d.items || []));
  }, []);

  async function toggleRole(u: AdminUser) {
    const role = u.role === "ADMIN" ? "USER" : "ADMIN";
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id, role }),
    });
    if (!res.ok) return toast.error("Could not update role.");
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
  }

  async function updateFeedbackStatus(id: string, status: string) {
    const res = await fetch(`/api/feedback/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return toast.error("Could not update.");
    setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-ink-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-lg font-semibold">Admin</span>
          <Link href="/dashboard" className="text-sm text-ink-500 hover:text-ink-900">Back to app</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Platform usage</h2>
          {stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                ["Users", stats.userCount],
                ["Resumes", stats.resumeCount],
                ["Cover letters", stats.coverLetterCount],
                ["Job matches run", stats.jobMatchCount],
                ["Open reports", stats.openFeedback],
              ].map(([label, val]) => (
                <div key={label as string} className="bg-white border border-ink-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold">{val as number}</div>
                  <div className="text-xs text-ink-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">Loading…</p>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Users</h2>
          <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/50 text-left text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Resumes</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Joined</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-ink-50">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2 text-ink-500">{u.email}</td>
                    <td className="px-4 py-2">{u._count.resumes}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${u.role === "ADMIN" ? "bg-gold/10 text-gold" : "bg-ink-50 text-ink-500"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-ink-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => toggleRole(u)} className="text-xs text-signal hover:underline">
                        {u.role === "ADMIN" ? "Revoke admin" : "Make admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Reported issues & feedback</h2>
          <div className="space-y-2">
            {feedback.length === 0 && <p className="text-sm text-ink-500">Nothing reported yet.</p>}
            {feedback.map((f) => (
              <div key={f.id} className="bg-white border border-ink-100 rounded-lg p-4 flex justify-between gap-4">
                <div>
                  <div className="text-xs text-ink-500 mb-1">
                    {f.type} · {f.user?.email || "anonymous"} · {new Date(f.createdAt).toLocaleDateString()}
                  </div>
                  <p className="text-sm">{f.message}</p>
                </div>
                <select
                  value={f.status}
                  onChange={(e) => updateFeedbackStatus(f.id, e.target.value)}
                  className="text-xs border border-ink-100 rounded px-2 py-1 h-fit"
                >
                  {["open", "reviewed", "resolved"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
