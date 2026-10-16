"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ResumeSection } from "@/types/resume";
import { resumeToPlainText } from "@/lib/resumeText";
import { updateSectionContent, updateSectionTitle } from "@/lib/resumeSections";
import { TEMPLATES } from "@/lib/templates";
import SectionList from "@/components/resume/SectionList";
import ClassicPreview from "@/components/templates/ClassicPreview";
import AIPanel from "@/components/ai/AIPanel";

interface Props {
  resumeId: string;
  initialTitle: string;
  initialTemplateId: string;
  initialAccentColor: string;
  initialFontFamily: string;
  initialFontSizePt: number;
  initialSections: ResumeSection[];
  initialIsPublic: boolean;
}

export default function BuilderClient({
  resumeId,
  initialTitle,
  initialTemplateId,
  initialAccentColor,
  initialFontFamily,
  initialFontSizePt,
  initialSections,
  initialIsPublic,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [fontSizePt, setFontSizePt] = useState(initialFontSizePt);
  const [sections, setSections] = useState<ResumeSection[]>(initialSections);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">("saved");
  const [showAIPanel, setShowAIPanel] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resumeText = resumeToPlainText(sections);

  // --- Inline preview editing: click a piece of text in the preview, edit
  // it in place, save on blur/Enter. Both handlers write into the same
  // `sections` state the left panel (SectionList) reads from, so the left
  // panel picks up the change automatically on the next render — no separate
  // sync needed.
  const updatePreviewSection = useCallback((sectionId: string, mutate: (content: any) => any) => {
    setSections((prev) => updateSectionContent(prev, sectionId, mutate));
  }, []);

  const updatePreviewTitle = useCallback((sectionId: string, title: string) => {
    setSections((prev) => updateSectionTitle(prev, sectionId, title));
  }, []);

  // --- Autosave: debounce writes to /api/resumes/:id whenever anything
  // meaningful changes. This is what backs "auto-save changes".
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await fetch(`/api/resumes/${resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, templateId, accentColor, fontFamily, fontSizePt, sections }),
        });
        setSaveState("saved");
      } catch {
        toast.error("Autosave failed — check your connection.");
      }
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, templateId, accentColor, fontFamily, fontSizePt, sections]);

  const manualSave = useCallback(async () => {
    setSaveState("saving");
    await fetch(`/api/resumes/${resumeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, templateId, accentColor, fontFamily, fontSizePt, sections }),
    });
    setSaveState("saved");
    toast.success("Saved.");
  }, [resumeId, title, templateId, accentColor, fontFamily, fontSizePt, sections]);

  async function snapshotVersion() {
    const label = window.prompt("Name this version", `Version ${new Date().toLocaleDateString()}`);
    if (!label) return;
    await manualSave();
    const res = await fetch(`/api/resumes/${resumeId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    if (res.ok) toast.success("Version saved.");
  }

  async function toggleShare() {
    const next = !isPublic;
    const res = await fetch(`/api/resumes/${resumeId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error("Could not update sharing.");
    setIsPublic(data.isPublic);
    if (data.isPublic && data.shareUrl) {
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(fullUrl).catch(() => {});
      toast.success("Public link copied to clipboard.");
    } else {
      toast.success("Resume is now private.");
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    toast.loading("Reading your resume…", { id: "import" });
    try {
      const res = await fetch("/api/import/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSections(data.sections);
      toast.success("Imported — review the fields before saving.", { id: "import" });
    } catch (err: any) {
      toast.error(err.message || "Import failed.", { id: "import" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-100 bg-white sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-sm text-ink-500 hover:text-ink-900">
            ← Dashboard
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-display text-lg font-medium bg-transparent border-b border-transparent hover:border-ink-100 focus:border-signal px-1"
          />
          <span className="text-xs text-ink-300">
            {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : "Unsaved changes"}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={templateId}
              onChange={(e) => {
                const t = TEMPLATES.find((t) => t.id === e.target.value);
                setTemplateId(e.target.value);
                if (t) setAccentColor(t.defaultAccent);
              }}
              className="text-sm border border-ink-100 rounded px-2 py-1.5"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              title="Accent color"
              className="w-8 h-8 border border-ink-100 rounded cursor-pointer"
            />
            <input type="file" ref={fileInputRef} accept=".pdf,.docx" className="hidden" onChange={handleImportFile} />
            <button onClick={() => fileInputRef.current?.click()} className="text-sm border border-ink-100 rounded px-3 py-1.5 hover:bg-ink-50">
              Import
            </button>
            <button onClick={toggleShare} className="text-sm border border-ink-100 rounded px-3 py-1.5 hover:bg-ink-50">
              {isPublic ? "Sharing: On" : "Share"}
            </button>
            <ExportMenu resumeId={resumeId} />
            <button onClick={manualSave} className="text-sm bg-ink-900 text-paper rounded px-3 py-1.5 hover:bg-ink-700">
              Save
            </button>
            <button
              onClick={() => setShowAIPanel((v) => !v)}
              className="text-sm bg-signal text-white rounded px-3 py-1.5 hover:bg-signal-700"
            >
              {showAIPanel ? "Hide AI" : "AI Tools"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 grid" style={{ gridTemplateColumns: showAIPanel ? "420px 1fr 340px" : "420px 1fr" }}>
        <div className="border-r border-ink-100 bg-paper p-4 overflow-y-auto max-h-[calc(100vh-57px)]">
          <SectionList sections={sections} resumeText={resumeText} onSectionsChange={setSections} />
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-57px)] py-8 px-6 bg-ink-50/30">
          <ClassicPreview
            sections={sections}
            accentColor={accentColor}
            fontFamily={fontFamily}
            fontSizePt={fontSizePt}
            onUpdateSection={updatePreviewSection}
            onUpdateTitle={updatePreviewTitle}
          />
        </div>

        {showAIPanel && (
          <div className="border-l border-ink-100 p-3 max-h-[calc(100vh-57px)] overflow-hidden">
            <AIPanel resumeId={resumeId} resumeText={resumeText} />
          </div>
        )}
      </div>
    </div>
  );
}

function ExportMenu({ resumeId }: { resumeId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="text-sm border border-ink-100 rounded px-3 py-1.5 hover:bg-ink-50">
        Export ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-ink-100 rounded-lg shadow-lg text-sm z-30 w-32">
          {[
            ["PDF", "pdf"],
            ["DOCX", "docx"],
            ["HTML", "html"],
          ].map(([label, ext]) => (
            <a
              key={ext}
              href={`/api/resumes/${resumeId}/export/${ext}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 hover:bg-ink-50"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
