"use client";

import { useMemo } from "react";
import { ResumeSection } from "@/types/resume";
import EditableText from "@/components/resume/EditableText";

interface Props {
  sections: ResumeSection[];
  accentColor: string;
  fontFamily: string;
  fontSizePt: number;
  /**
   * Applies an edit to one section's content by id. Called by every
   * click-to-edit field below; `mutate` receives a deep clone of that
   * section's current content, so it's safe to mutate directly and return it.
   */
  onUpdateSection?: (sectionId: string, mutate: (content: any) => any) => void;
  /** Renames a section's heading (e.g. "Work Experience" -> "Experience"). */
  onUpdateTitle?: (sectionId: string, title: string) => void;
  /** True for the public, unauthenticated share view — renders static text, no click-to-edit. */
  readOnly?: boolean;
}

/**
 * Screen preview for the "Classic" (ATS-friendly, single column) template.
 * This mirrors what ClassicPdf.tsx produces for export, so what the user
 * sees while editing matches the exported file.
 *
 * Every piece of text here is click-to-edit: click it, type, and the change
 * is saved on blur or Enter straight into the shared `sections` state that
 * also backs the left panel — so the left panel reflects it immediately too.
 */
export default function ClassicPreview({
  sections,
  accentColor,
  fontFamily,
  fontSizePt,
  onUpdateSection = () => {},
  onUpdateTitle = () => {},
  readOnly = false,
}: Props) {
  const visible = [...sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const contactSection = visible.find((s) => s.type === "contact");
  const headlineSection = visible.find((s) => s.type === "headline");
  const contact = contactSection?.content as any;
  const headline = headlineSection?.content as any;
  const rest = visible.filter((s) => s.type !== "contact" && s.type !== "headline");

  // Local wrapper so every field below doesn't have to repeat `readOnly={readOnly}`.
  // Memoized on `readOnly` so its identity is stable across re-renders — otherwise
  // React would treat it as a brand-new component type on every render and
  // remount every field (harmless here since edit state is transient, but
  // wasteful and worth avoiding).
  const Field = useMemo(() => {
    function Field(props: React.ComponentProps<typeof EditableText>) {
      return <EditableText {...props} readOnly={readOnly} />;
    }
    return Field;
  }, [readOnly]);

  return (
    <div
      className="bg-white shadow-sm mx-auto w-full max-w-[8.5in] min-h-[11in] p-10 text-ink-900"
      style={{ fontFamily, fontSize: `${fontSizePt}pt` }}
    >
      <header className="border-b-2 pb-4 mb-5" style={{ borderColor: accentColor }}>
        {contactSection ? (
          <Field
            as="h1"
            className="text-3xl font-semibold tracking-tight"
            value={contact?.fullName || ""}
            placeholder="Your Name"
            onSave={(v) =>
              onUpdateSection(contactSection.id, (c) => {
                c.fullName = v;
                return c;
              })
            }
          />
        ) : (
          <h1 className="text-3xl font-semibold tracking-tight text-ink-300 italic">Your Name</h1>
        )}

        {headlineSection && (
          <Field
            as="p"
            className="text-base mt-1"
            style={{ color: accentColor }}
            value={headline?.text || ""}
            placeholder="Click to add a headline"
            onSave={(v) =>
              onUpdateSection(headlineSection.id, (c) => {
                c.text = v;
                return c;
              })
            }
          />
        )}

        {contactSection && (
          <p className="text-sm text-ink-500 mt-2 flex flex-wrap items-center gap-1">
            <Field
              value={contact?.email || ""}
              placeholder="email"
              className="text-sm text-ink-500"
              onSave={(v) => onUpdateSection(contactSection.id, (c) => { c.email = v; return c; })}
            />
            <span className="text-ink-300">•</span>
            <Field
              value={contact?.phone || ""}
              placeholder="phone"
              className="text-sm text-ink-500"
              onSave={(v) => onUpdateSection(contactSection.id, (c) => { c.phone = v; return c; })}
            />
            <span className="text-ink-300">•</span>
            <Field
              value={contact?.location || ""}
              placeholder="location"
              className="text-sm text-ink-500"
              onSave={(v) => onUpdateSection(contactSection.id, (c) => { c.location = v; return c; })}
            />
          </p>
        )}
      </header>

      <div className="space-y-5">
        {rest.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            accentColor={accentColor}
            onUpdateSection={onUpdateSection}
            onUpdateTitle={onUpdateTitle}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  accentColor,
  onUpdateSection,
  onUpdateTitle,
  readOnly,
}: {
  section: ResumeSection;
  accentColor: string;
  onUpdateSection: (sectionId: string, mutate: (content: any) => any) => void;
  onUpdateTitle: (sectionId: string, title: string) => void;
  readOnly: boolean;
}) {
  const c: any = section.content;

  // See ClassicPreview's Field for why this is memoized.
  const Field = useMemo(() => {
    function Field(props: React.ComponentProps<typeof EditableText>) {
      return <EditableText {...props} readOnly={readOnly} />;
    }
    return Field;
  }, [readOnly]);

  /** Shorthand for the common "set one field on this section's content" case. */
  const setField = (field: string, value: any) =>
    onUpdateSection(section.id, (content) => {
      content[field] = value;
      return content;
    });

  /** Shorthand for "set one field on entries[idx]". */
  const setEntryField = (idx: number, field: string, value: any) =>
    onUpdateSection(section.id, (content) => {
      content.entries[idx][field] = value;
      return content;
    });

  const setBullet = (idx: number, bulletIdx: number, value: string) =>
    onUpdateSection(section.id, (content) => {
      content.entries[idx].bullets[bulletIdx] = value;
      return content;
    });

  return (
    <section>
      <Field
        as="h2"
        className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b block"
        style={{ color: accentColor, borderColor: "#E5E2DA" }}
        value={section.title}
        onSave={(v) => onUpdateTitle(section.id, v)}
      />

      {section.type === "summary" && (
        <Field
          as="p"
          multiline
          className="text-sm leading-relaxed"
          placeholder="Click to write a professional summary"
          value={c.text || ""}
          onSave={(v) => setField("text", v)}
        />
      )}

      {(section.type === "experience" || section.type === "internships") && (
        <div className="space-y-3">
          {(c.entries || []).map((e: any, idx: number) => (
            <div key={e.id}>
              <div className="flex justify-between items-start gap-3 text-sm font-medium">
                <span className="flex flex-wrap items-center gap-1">
                  <Field value={e.role || ""} placeholder="Role" onSave={(v) => setEntryField(idx, "role", v)} />
                  <span className="text-ink-300 font-normal">—</span>
                  <Field value={e.company || ""} placeholder="Company" onSave={(v) => setEntryField(idx, "company", v)} />
                </span>
                <span className="text-ink-500 font-normal flex items-center gap-1 shrink-0">
                  <Field className="text-ink-500 font-normal" value={e.startDate || ""} placeholder="Start" onSave={(v) => setEntryField(idx, "startDate", v)} />
                  <span>–</span>
                  <Field className="text-ink-500 font-normal" value={e.endDate || ""} placeholder="End" onSave={(v) => setEntryField(idx, "endDate", v)} />
                </span>
              </div>
              <ul className="list-disc ml-5 text-sm mt-1 space-y-0.5">
                {(e.bullets || []).map((b: string, bIdx: number) => (
                  <li key={bIdx}>
                    <Field
                      multiline
                      value={b}
                      placeholder="Click to write a bullet"
                      onSave={(v) => setBullet(idx, bIdx, v)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {section.type === "education" && (
        <div className="space-y-2">
          {(c.entries || []).map((e: any, idx: number) => (
            <div key={e.id} className="flex justify-between items-start gap-3 text-sm">
              <span className="flex flex-wrap items-center gap-1">
                <Field value={e.degree || ""} placeholder="Degree" onSave={(v) => setEntryField(idx, "degree", v)} />
                <span className="text-ink-300">in</span>
                <Field value={e.fieldOfStudy || ""} placeholder="Field of study" onSave={(v) => setEntryField(idx, "fieldOfStudy", v)} />
                <span className="text-ink-300">—</span>
                <Field value={e.institution || ""} placeholder="Institution" onSave={(v) => setEntryField(idx, "institution", v)} />
              </span>
              <span className="text-ink-500 flex items-center gap-1 shrink-0">
                <Field className="text-ink-500" value={e.startDate || ""} placeholder="Start" onSave={(v) => setEntryField(idx, "startDate", v)} />
                <span>–</span>
                <Field className="text-ink-500" value={e.endDate || ""} placeholder="End" onSave={(v) => setEntryField(idx, "endDate", v)} />
              </span>
            </div>
          ))}
        </div>
      )}

      {section.type === "projects" && (
        <div className="space-y-3">
          {(c.entries || []).map((e: any, idx: number) => (
            <div key={e.id}>
              <div className="text-sm font-medium flex flex-wrap items-center gap-1">
                <Field value={e.name || ""} placeholder="Project name" onSave={(v) => setEntryField(idx, "name", v)} />
                <Field
                  className="text-ink-500 font-normal"
                  value={(e.techStack || []).join(", ")}
                  displayValue={e.techStack?.length ? <>— {e.techStack.join(", ")}</> : undefined}
                  placeholder="— add tech stack (comma separated)"
                  onSave={(v) =>
                    setEntryField(
                      idx,
                      "techStack",
                      v.split(",").map((s: string) => s.trim()).filter(Boolean)
                    )
                  }
                />
              </div>
              <ul className="list-disc ml-5 text-sm mt-1 space-y-0.5">
                {(e.bullets || []).map((b: string, bIdx: number) => (
                  <li key={bIdx}>
                    <Field
                      multiline
                      value={b}
                      placeholder="Click to write a bullet"
                      onSave={(v) => setBullet(idx, bIdx, v)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {(section.type === "technicalSkills" || section.type === "softSkills" || section.type === "interests") && (
        <Field
          as="p"
          className="text-sm"
          value={(c.skills || []).join(", ")}
          displayValue={c.skills?.length ? c.skills.join("  •  ") : undefined}
          placeholder="Click to add skills (comma separated)"
          onSave={(v) => setField("skills", v.split(",").map((s: string) => s.trim()).filter(Boolean))}
        />
      )}

      {section.type === "certifications" && (
        <div className="space-y-1 text-sm">
          {(c.entries || []).map((e: any, idx: number) => (
            <div key={e.id} className="flex flex-wrap items-center gap-1">
              <Field value={e.name || ""} placeholder="Certification" onSave={(v) => setEntryField(idx, "name", v)} />
              <span className="text-ink-300">—</span>
              <Field value={e.issuer || ""} placeholder="Issuer" onSave={(v) => setEntryField(idx, "issuer", v)} />
              <span className="text-ink-300">(</span>
              <Field value={e.date || ""} placeholder="Date" onSave={(v) => setEntryField(idx, "date", v)} />
              <span className="text-ink-300">)</span>
            </div>
          ))}
        </div>
      )}

      {["achievements", "awards", "publications", "research", "volunteer", "custom"].includes(section.type) && (
        <div className="space-y-1 text-sm">
          {(c.entries || []).map((e: any, idx: number) => (
            <div key={e.id}>
              <span className="flex flex-wrap items-center gap-1">
                <Field className="font-medium" value={e.title || ""} placeholder="Title" onSave={(v) => setEntryField(idx, "title", v)} />
                <Field
                  value={e.subtitle || ""}
                  displayValue={e.subtitle ? <>— {e.subtitle}</> : undefined}
                  placeholder="— subtitle"
                  onSave={(v) => setEntryField(idx, "subtitle", v)}
                />
                <Field
                  value={e.date || ""}
                  displayValue={e.date ? <>({e.date})</> : undefined}
                  placeholder="(date)"
                  onSave={(v) => setEntryField(idx, "date", v)}
                />
              </span>
              <Field
                as="div"
                multiline
                className="text-ink-500"
                value={e.description || ""}
                placeholder="Click to add a description"
                onSave={(v) => setEntryField(idx, "description", v)}
              />
            </div>
          ))}
        </div>
      )}

      {section.type === "languages" && (
        <div className="text-sm flex flex-wrap gap-x-1">
          {(c.entries || []).map((e: any, idx: number) => (
            <span key={e.id} className="flex items-center gap-1">
              <Field value={e.language || ""} placeholder="Language" onSave={(v) => setEntryField(idx, "language", v)} />
              <span className="text-ink-500">({e.proficiency})</span>
              {idx < (c.entries || []).length - 1 && <span className="text-ink-300 mr-1">•</span>}
            </span>
          ))}
        </div>
      )}

      {section.type === "links" && (
        <p className="text-sm text-signal-700 flex flex-wrap gap-3">
          <Field value={c.linkedin || ""} placeholder="+ LinkedIn" onSave={(v) => setField("linkedin", v)} />
          <Field value={c.github || ""} placeholder="+ GitHub" onSave={(v) => setField("github", v)} />
          <Field value={c.portfolio || ""} placeholder="+ Portfolio" onSave={(v) => setField("portfolio", v)} />
          <Field value={c.website || ""} placeholder="+ Website" onSave={(v) => setField("website", v)} />
        </p>
      )}
    </section>
  );
}
