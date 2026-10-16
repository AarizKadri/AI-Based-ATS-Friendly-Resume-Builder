"use client";

import { useState } from "react";
import { ResumeSection, ResumeSectionType, SECTION_LABELS, emptyId } from "@/types/resume";
import SectionEditor from "./SectionEditor";
import { IconButton } from "@/components/ui/form";

interface Props {
  sections: ResumeSection[];
  resumeText: string;
  onSectionsChange: (sections: ResumeSection[]) => void;
}

const ADDABLE_TYPES: ResumeSectionType[] = [
  "internships",
  "softSkills",
  "certifications",
  "achievements",
  "awards",
  "publications",
  "research",
  "volunteer",
  "languages",
  "interests",
  "custom",
];

function defaultContentFor(type: ResumeSectionType) {
  if (["technicalSkills", "softSkills", "interests"].includes(type)) return { skills: [] };
  if (type === "languages") return { entries: [] };
  if (type === "links") return {};
  return { entries: [] };
}

export default function SectionList({ sections, resumeText, onSectionsChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const ordered = [...sections].sort((a, b) => a.order - b.order);

  function updateSection(id: string, patch: Partial<ResumeSection>) {
    onSectionsChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function moveSection(id: string, direction: -1 | 1) {
    const idx = ordered.findIndex((s) => s.id === id);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= ordered.length) return;
    const a = ordered[idx];
    const b = ordered[swapWith];
    onSectionsChange(
      sections.map((s) => {
        if (s.id === a.id) return { ...s, order: b.order };
        if (s.id === b.id) return { ...s, order: a.order };
        return s;
      })
    );
  }

  function addSection(type: ResumeSectionType) {
    const newSection: ResumeSection = {
      id: emptyId(),
      type,
      title: SECTION_LABELS[type],
      enabled: true,
      order: sections.length,
      content: defaultContentFor(type),
    };
    onSectionsChange([...sections, newSection]);
    setOpenId(newSection.id);
    setShowAddMenu(false);
  }

  function removeSection(id: string) {
    if (!window.confirm("Remove this section? Its content will be lost.")) return;
    onSectionsChange(sections.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-2">
      {ordered.map((section, idx) => (
        <div key={section.id} className="border border-ink-100 rounded-lg bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-ink-50/50">
            <button
              onClick={() => setOpenId(openId === section.id ? null : section.id)}
              className="flex-1 text-left text-sm font-medium"
            >
              {section.title}
              {!section.enabled && <span className="ml-2 text-xs text-ink-300">(hidden)</span>}
            </button>
            <IconButton onClick={() => moveSection(section.id, -1)} title="Move up">↑</IconButton>
            <IconButton onClick={() => moveSection(section.id, 1)} title="Move down">↓</IconButton>
            <label className="flex items-center gap-1 text-xs text-ink-500">
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={(e) => updateSection(section.id, { enabled: e.target.checked })}
              />
              Show
            </label>
            {section.type !== "contact" && (
              <IconButton onClick={() => removeSection(section.id)} title="Delete section">✕</IconButton>
            )}
          </div>

          {openId === section.id && (
            <div className="p-3">
              <SectionEditor
                section={section}
                resumeText={resumeText}
                onChange={(content) => updateSection(section.id, { content })}
              />
            </div>
          )}
        </div>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowAddMenu((v) => !v)}
          className="w-full text-sm border border-dashed border-ink-300 rounded-lg py-2.5 hover:bg-ink-50"
        >
          + Add section
        </button>
        {showAddMenu && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-ink-100 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {ADDABLE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => addSection(t)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-ink-50"
              >
                {SECTION_LABELS[t]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
