"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { emptyId, ResumeSection } from "@/types/resume";
import { Field, TextInput, TextArea, IconButton } from "@/components/ui/form";

interface Props {
  section: ResumeSection;
  resumeText: string;
  onChange: (content: any) => void;
}

async function callRewrite(text: string, style: string, extraContext?: string): Promise<string | null> {
  try {
    const res = await fetch("/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, style, extraContext }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.result as string;
  } catch (err: any) {
    toast.error(err.message || "AI rewrite failed.");
    return null;
  }
}

export default function SectionEditor({ section, resumeText, onChange }: Props) {
  const c: any = section.content;
  const [aiLoading, setAiLoading] = useState(false);
  // Keep the raw text while the user edits so spaces and commas are not
  // removed by converting the value to an array on every keystroke.
  const [techStackDrafts, setTechStackDrafts] = useState<Record<string, string>>({});
  const [skillsDraft, setSkillsDraft] = useState<string | null>(null);

  async function generateSummaryOrHeadline(mode: "summary" | "headline") {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange({ ...c, text: data.result });
    } catch (err: any) {
      toast.error(err.message || "AI generation failed.");
    } finally {
      setAiLoading(false);
    }
  }

  if (section.type === "contact") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name">
          <TextInput value={c.fullName || ""} onChange={(e) => onChange({ ...c, fullName: e.target.value })} />
        </Field>
        <Field label="Email">
          <TextInput value={c.email || ""} onChange={(e) => onChange({ ...c, email: e.target.value })} />
        </Field>
        <Field label="Phone">
          <TextInput value={c.phone || ""} onChange={(e) => onChange({ ...c, phone: e.target.value })} />
        </Field>
        <Field label="Location">
          <TextInput value={c.location || ""} onChange={(e) => onChange({ ...c, location: e.target.value })} />
        </Field>
      </div>
    );
  }

  if (section.type === "headline" || section.type === "summary") {
    const mode = section.type;
    return (
      <div>
        <TextArea
          rows={mode === "headline" ? 2 : 4}
          value={c.text || ""}
          onChange={(e) => onChange({ ...c, text: e.target.value })}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => generateSummaryOrHeadline(mode)}
            disabled={aiLoading}
            className="text-xs bg-signal-50 text-signal-700 px-3 py-1.5 rounded hover:bg-signal-100 disabled:opacity-60"
          >
            {aiLoading ? "Generating…" : "✨ AI generate"}
          </button>
          {c.text && (
            <button
              onClick={async () => {
                const r = await callRewrite(c.text, "professional");
                if (r) onChange({ ...c, text: r });
              }}
              className="text-xs border border-ink-100 px-3 py-1.5 rounded hover:bg-ink-50"
            >
              Make more professional
            </button>
          )}
        </div>
      </div>
    );
  }

  if (section.type === "experience" || section.type === "internships") {
    const entries = c.entries || [];
    const update = (idx: number, patch: any) => {
      const next = [...entries];
      next[idx] = { ...next[idx], ...patch };
      onChange({ ...c, entries: next });
    };
    return (
      <div className="space-y-4">
        {entries.map((e: any, idx: number) => (
          <div key={e.id} className="border border-ink-100 rounded p-3 bg-paper/50">
            <div className="grid grid-cols-2 gap-2">
              <TextInput placeholder="Role" value={e.role || ""} onChange={(ev) => update(idx, { role: ev.target.value })} />
              <TextInput placeholder="Company" value={e.company || ""} onChange={(ev) => update(idx, { company: ev.target.value })} />
              <TextInput placeholder="Start date" value={e.startDate || ""} onChange={(ev) => update(idx, { startDate: ev.target.value })} />
              <TextInput placeholder="End date (or Present)" value={e.endDate || ""} onChange={(ev) => update(idx, { endDate: ev.target.value })} />
            </div>
            <div className="mt-2">
              <TextArea
                rows={4}
                placeholder="One bullet per line"
                value={(e.bullets || []).join("\n")}
                onChange={(ev) => update(idx, { bullets: ev.target.value.split("\n") })}
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={async () => {
                    const r = await callRewrite((e.bullets || []).join("\n"), "action");
                    if (r) update(idx, { bullets: r.split("\n").filter(Boolean) });
                  }}
                  className="text-xs bg-signal-50 text-signal-700 px-3 py-1.5 rounded hover:bg-signal-100"
                >
                  ✨ Strengthen bullets
                </button>
                <button
                  onClick={async () => {
                    const r = await callRewrite((e.bullets || []).join("\n"), "concise");
                    if (r) update(idx, { bullets: r.split("\n").filter(Boolean) });
                  }}
                  className="text-xs border border-ink-100 px-3 py-1.5 rounded hover:bg-ink-50"
                >
                  Make concise
                </button>
                <IconButton
                  onClick={() => onChange({ ...c, entries: entries.filter((_: any, i: number) => i !== idx) })}
                  title="Remove entry"
                >
                  Remove
                </IconButton>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            onChange({
              ...c,
              entries: [...entries, { id: emptyId(), company: "", role: "", startDate: "", endDate: "", bullets: [] }],
            })
          }
          className="text-xs border border-dashed border-ink-300 rounded px-3 py-2 w-full hover:bg-ink-50"
        >
          + Add entry
        </button>
      </div>
    );
  }

  if (section.type === "education") {
    const entries = c.entries || [];
    const update = (idx: number, patch: any) => {
      const next = [...entries];
      next[idx] = { ...next[idx], ...patch };
      onChange({ ...c, entries: next });
    };
    return (
      <div className="space-y-3">
        {entries.map((e: any, idx: number) => (
          <div key={e.id} className="border border-ink-100 rounded p-3 bg-paper/50 grid grid-cols-2 gap-2">
            <TextInput placeholder="Institution" value={e.institution || ""} onChange={(ev) => update(idx, { institution: ev.target.value })} />
            <TextInput placeholder="Degree" value={e.degree || ""} onChange={(ev) => update(idx, { degree: ev.target.value })} />
            <TextInput placeholder="Field of study" value={e.fieldOfStudy || ""} onChange={(ev) => update(idx, { fieldOfStudy: ev.target.value })} />
            <TextInput placeholder="GPA (optional)" value={e.gpa || ""} onChange={(ev) => update(idx, { gpa: ev.target.value })} />
            <TextInput placeholder="Start date" value={e.startDate || ""} onChange={(ev) => update(idx, { startDate: ev.target.value })} />
            <TextInput placeholder="End date" value={e.endDate || ""} onChange={(ev) => update(idx, { endDate: ev.target.value })} />
            <div className="col-span-2 text-right">
              <IconButton onClick={() => onChange({ ...c, entries: entries.filter((_: any, i: number) => i !== idx) })} title="Remove">
                Remove
              </IconButton>
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            onChange({
              ...c,
              entries: [...entries, { id: emptyId(), institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", highlights: [] }],
            })
          }
          className="text-xs border border-dashed border-ink-300 rounded px-3 py-2 w-full hover:bg-ink-50"
        >
          + Add entry
        </button>
      </div>
    );
  }

  if (section.type === "projects") {
    const entries = c.entries || [];
    const update = (idx: number, patch: any) => {
      const next = [...entries];
      next[idx] = { ...next[idx], ...patch };
      onChange({ ...c, entries: next });
    };
    return (
      <div className="space-y-4">
        {entries.map((e: any, idx: number) => (
          <div key={e.id} className="border border-ink-100 rounded p-3 bg-paper/50">
            <div className="grid grid-cols-2 gap-2">
              <TextInput placeholder="Project name" value={e.name || ""} onChange={(ev) => update(idx, { name: ev.target.value })} />
              <TextInput
                placeholder="Tech stack, comma separated"
                value={techStackDrafts[String(e.id)] ?? (e.techStack || []).join(", ")}
                onChange={(ev) => {
                  const value = ev.target.value;
                  setTechStackDrafts((prev) => ({
                    ...prev,
                    [String(e.id)]: value,
                  }));
                  // Store only non-empty items for the preview and database.
                  // The draft above preserves the exact text during typing.
                  update(idx, {
                    techStack: value
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter((s: string) => s.length > 0),
                  });
                }}
                onBlur={() => {
                  setTechStackDrafts((prev) => {
                    const next = { ...prev };
                    delete next[String(e.id)];
                    return next;
                  });
                }}
              />
            </div>
            <TextArea
              rows={3}
              className="mt-2"
              placeholder="One bullet per line"
              value={(e.bullets || []).join("\n")}
              onChange={(ev) => update(idx, { bullets: ev.target.value.split("\n") })}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={async () => {
                  const r = await callRewrite((e.bullets || []).join("\n"), "action");
                  if (r) update(idx, { bullets: r.split("\n").filter(Boolean) });
                }}
                className="text-xs bg-signal-50 text-signal-700 px-3 py-1.5 rounded hover:bg-signal-100"
              >
                ✨ Strengthen bullets
              </button>
              <IconButton onClick={() => onChange({ ...c, entries: entries.filter((_: any, i: number) => i !== idx) })} title="Remove">
                Remove
              </IconButton>
            </div>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...c, entries: [...entries, { id: emptyId(), name: "", techStack: [], bullets: [] }] })}
          className="text-xs border border-dashed border-ink-300 rounded px-3 py-2 w-full hover:bg-ink-50"
        >
          + Add project
        </button>
      </div>
    );
  }

  if (["technicalSkills", "softSkills", "interests"].includes(section.type)) {
    return (
      <div>
        <TextArea
          rows={3}
          placeholder="Comma-separated"
          value={skillsDraft ?? (c.skills || []).join(", ")}
          onChange={(e) => {
            const value = e.target.value;
            setSkillsDraft(value);
            onChange({
              ...c,
              // Keep only non-empty items for preview/save. skillsDraft retains
              // the exact text while editing, including trailing spaces/commas.
              skills: value
                .split(",")
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0),
            });
          }}
          onBlur={() => {
            setSkillsDraft(null);
          }}
        />
      </div>
    );
  }

  if (section.type === "certifications") {
    const entries = c.entries || [];
    const update = (idx: number, patch: any) => {
      const next = [...entries];
      next[idx] = { ...next[idx], ...patch };
      onChange({ ...c, entries: next });
    };
    return (
      <div className="space-y-2">
        {entries.map((e: any, idx: number) => (
          <div key={e.id} className="grid grid-cols-4 gap-2 items-center">
            <TextInput placeholder="Name" value={e.name || ""} onChange={(ev) => update(idx, { name: ev.target.value })} />
            <TextInput placeholder="Issuer" value={e.issuer || ""} onChange={(ev) => update(idx, { issuer: ev.target.value })} />
            <TextInput placeholder="Date" value={e.date || ""} onChange={(ev) => update(idx, { date: ev.target.value })} />
            <IconButton onClick={() => onChange({ ...c, entries: entries.filter((_: any, i: number) => i !== idx) })} title="Remove">
              Remove
            </IconButton>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...c, entries: [...entries, { id: emptyId(), name: "", issuer: "", date: "" }] })}
          className="text-xs border border-dashed border-ink-300 rounded px-3 py-2 w-full hover:bg-ink-50"
        >
          + Add certification
        </button>
      </div>
    );
  }

  if (["achievements", "awards", "publications", "research", "volunteer", "custom"].includes(section.type)) {
    const entries = c.entries || [];
    const update = (idx: number, patch: any) => {
      const next = [...entries];
      next[idx] = { ...next[idx], ...patch };
      onChange({ ...c, entries: next });
    };
    return (
      <div className="space-y-2">
        {entries.map((e: any, idx: number) => (
          <div key={e.id} className="border border-ink-100 rounded p-3 bg-paper/50">
            <div className="grid grid-cols-3 gap-2">
              <TextInput placeholder="Title" value={e.title || ""} onChange={(ev) => update(idx, { title: ev.target.value })} />
              <TextInput placeholder="Subtitle (optional)" value={e.subtitle || ""} onChange={(ev) => update(idx, { subtitle: ev.target.value })} />
              <TextInput placeholder="Date (optional)" value={e.date || ""} onChange={(ev) => update(idx, { date: ev.target.value })} />
            </div>
            <TextArea
              rows={2}
              className="mt-2"
              placeholder="Description (optional)"
              value={e.description || ""}
              onChange={(ev) => update(idx, { description: ev.target.value })}
            />
            <div className="text-right mt-1">
              <IconButton onClick={() => onChange({ ...c, entries: entries.filter((_: any, i: number) => i !== idx) })} title="Remove">
                Remove
              </IconButton>
            </div>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...c, entries: [...entries, { id: emptyId(), title: "", subtitle: "", date: "", description: "" }] })}
          className="text-xs border border-dashed border-ink-300 rounded px-3 py-2 w-full hover:bg-ink-50"
        >
          + Add entry
        </button>
      </div>
    );
  }

  if (section.type === "languages") {
    const entries = c.entries || [];
    const update = (idx: number, patch: any) => {
      const next = [...entries];
      next[idx] = { ...next[idx], ...patch };
      onChange({ ...c, entries: next });
    };
    return (
      <div className="space-y-2">
        {entries.map((e: any, idx: number) => (
          <div key={e.id} className="grid grid-cols-3 gap-2 items-center">
            <TextInput placeholder="Language" value={e.language || ""} onChange={(ev) => update(idx, { language: ev.target.value })} />
            <select
              value={e.proficiency || "Conversational"}
              onChange={(ev) => update(idx, { proficiency: ev.target.value })}
              className="border border-ink-100 rounded px-2 py-2 text-sm bg-white"
            >
              {["Basic", "Conversational", "Fluent", "Native"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <IconButton onClick={() => onChange({ ...c, entries: entries.filter((_: any, i: number) => i !== idx) })} title="Remove">
              Remove
            </IconButton>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...c, entries: [...entries, { id: emptyId(), language: "", proficiency: "Conversational" }] })}
          className="text-xs border border-dashed border-ink-300 rounded px-3 py-2 w-full hover:bg-ink-50"
        >
          + Add language
        </button>
      </div>
    );
  }

  if (section.type === "links") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="LinkedIn">
          <TextInput value={c.linkedin || ""} onChange={(e) => onChange({ ...c, linkedin: e.target.value })} />
        </Field>
        <Field label="GitHub">
          <TextInput value={c.github || ""} onChange={(e) => onChange({ ...c, github: e.target.value })} />
        </Field>
        <Field label="Portfolio">
          <TextInput value={c.portfolio || ""} onChange={(e) => onChange({ ...c, portfolio: e.target.value })} />
        </Field>
        <Field label="Website">
          <TextInput value={c.website || ""} onChange={(e) => onChange({ ...c, website: e.target.value })} />
        </Field>
      </div>
    );
  }

  return <p className="text-sm text-ink-500">No editor available for this section type yet.</p>;
}
