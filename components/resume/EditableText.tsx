"use client";

import { useEffect, useRef, useState } from "react";

interface EditableTextProps {
  /** Current value. Also used as the starting draft when editing begins. */
  value: string;
  /** Called with the new value once the edit is committed (blur or Enter). Not called if the value didn't change. */
  onSave: (value: string) => void;
  /** Tag to render in read mode. Defaults to "span". */
  as?: "span" | "p" | "h1" | "h2" | "div";
  className?: string;
  /** Inline styles (e.g. a dynamic accent color) applied in both read and edit mode. */
  style?: React.CSSProperties;
  /** Shown (in read mode) when value is empty, so there's still something clickable. */
  placeholder?: string;
  /** Allows newlines (Shift+Enter) and renders as a textarea while editing. Plain Enter still commits. */
  multiline?: boolean;
  /** Optional custom read-mode rendering (e.g. a "•"-joined list) — falls back to `value`. */
  displayValue?: React.ReactNode;
  /** When true, renders as static text only — no click-to-edit affordance. Used for the public, unauthenticated share view. */
  readOnly?: boolean;
}

/**
 * The building block for "click text in the preview to edit it" — the new
 * inline-editing flow. Renders plain text until clicked, then swaps to a
 * focused input (or textarea, for multiline) seeded with the current value.
 * Saving happens on blur or Enter (Shift+Enter inserts a newline when
 * multiline); Escape reverts without saving.
 */
export default function EditableText({
  value,
  onSave,
  as = "span",
  className = "",
  placeholder = "Click to add",
  multiline = false,
  displayValue,
  style,
  readOnly = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Keep the draft in sync if the underlying value changes from elsewhere
  // (e.g. an AI rewrite from the left panel) while this field isn't open.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (readOnly) {
    const Static = as;
    return value || displayValue ? (
      <Static style={style} className={className}>{displayValue ?? value}</Static>
    ) : null;
  }

  if (editing) {
    const sharedProps = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !(multiline && e.shiftKey)) {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      },
      className: `${className} block w-full bg-signal-50 outline outline-2 outline-signal rounded-sm px-1 -mx-1 -my-px`,
      style,
    };

    return multiline ? (
      <textarea {...sharedProps} rows={Math.max(2, draft.split("\n").length)} />
    ) : (
      <input {...sharedProps} type="text" />
    );
  }

  const Tag = as;
  const isEmpty = !value && !displayValue;

  return (
    <Tag
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={style}
      className={`${className} cursor-text rounded-sm px-1 -mx-1 transition-colors hover:bg-signal-50 hover:outline hover:outline-1 hover:outline-signal-100 ${
        isEmpty ? "text-ink-300 italic" : ""
      }`}
    >
      {isEmpty ? placeholder : displayValue ?? value}
    </Tag>
  );
}
